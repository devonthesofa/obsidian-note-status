import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, TFile, Menu, Modal, View, WorkspaceLeaf, addIcon } from 'obsidian';

addIcon('status-pane', `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path fill="currentColor" d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h10v2H7v-2z"/>
  </svg>
`);


interface NoteStatusSettings {
  mySetting: string;
  statusColors: Record<string, string>;
  showStatusDropdown: boolean;
  showStatusBar: boolean;
  dropdownPosition: 'top' | 'bottom';
  statusBarPosition: 'left' | 'right';
  autoHideStatusBar: boolean;
  customStatuses: { name: string; icon: string }[];
  showStatusIconsInExplorer: boolean;
  collapsedStatuses: Record<string, boolean>;
}

const DEFAULT_SETTINGS: NoteStatusSettings = {
  mySetting: 'default',
  statusColors: {
    active: 'var(--text-success)',
    onHold: 'var(--text-warning)',
    completed: 'var(--text-accent)',
    dropped: 'var(--text-error)',
    unknown: 'var(--text-muted)'
  },
  showStatusDropdown: true,
  showStatusBar: true,
  dropdownPosition: 'top',
  statusBarPosition: 'right',
  autoHideStatusBar: false,
  customStatuses: [
    { name: 'active', icon: '▶️' },
    { name: 'onHold', icon: '⏸️' },
    { name: 'completed', icon: '✅' },
    { name: 'dropped', icon: '❌' },
    { name: 'unknown', icon: '❓' }
  ],
  showStatusIconsInExplorer: true,
  collapsedStatuses: {}
}

class StatusPaneView extends View {
  plugin: NoteStatus;
  searchInput: HTMLInputElement | null = null;
  buttonToggleStatusPanel: HTMLButtonElement | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: NoteStatus) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() {
    return 'status-pane';
  }

  getDisplayText() {
    return 'Status Pane';
  }

  getIcon() {
    return 'status-pane';
  }

  async onOpen() {
    await this.setupPane();
    await this.renderGroups('');
  }

  // Setup the static parts of the pane (search bar)
  async setupPane() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass('note-status-pane', 'nav-files-container');

    const searchContainer = containerEl.createDiv({ cls: 'note-status-search search-input-container' });
    this.searchInput = searchContainer.createEl('input', {
      type: 'text',
      placeholder: 'Search notes...',
      cls: 'note-status-search-input search-input'
    });
    this.searchInput.addEventListener('input', () => {
      this.renderGroups(this.searchInput!.value.toLowerCase());
    });

    const actionsContainer = containerEl.createDiv({ cls: 'status-pane-actions-container' });
    const refreshButton = actionsContainer.createEl('button', {
      type: 'button',
      title: 'Refresh Statuses',
      text: 'Refresh',
      cls: 'note-status-actions-refresh clickable-icon mod-cta'
    });
    refreshButton.addEventListener('click', async () => {
      await this.renderGroups(this.searchInput?.value.toLowerCase() || '');
      new Notice('Status pane refreshed');
    });
  }

  // Render only the dynamic groups
  async renderGroups(searchQuery = '') {
    const { containerEl } = this;
    const existingGroups = containerEl.querySelectorAll('.status-group');
    existingGroups.forEach(group => group.remove());

    const statusGroups: Record<string, TFile[]> = {};
    this.plugin.settings.customStatuses.forEach(status => {
      statusGroups[status.name] = [];
    });

    const files = this.app.vault.getMarkdownFiles();
    for (const file of files) {
      const cachedMetadata = this.app.metadataCache.getFileCache(file);
      let status = 'unknown';
      if (cachedMetadata?.frontmatter?.status) {
        const frontmatterStatus = cachedMetadata.frontmatter.status.toLowerCase();
        const matchingStatus = this.plugin.settings.customStatuses.find(s => s.name.toLowerCase() === frontmatterStatus);
        if (matchingStatus) {
          status = matchingStatus.name;
        }
      }
      statusGroups[status].push(file);
    }

    Object.entries(statusGroups).forEach(([status, files]) => {
      const filteredFiles = files.filter(file => 
        file.basename.toLowerCase().includes(searchQuery)
      );
      if (filteredFiles.length > 0) {
        const groupEl = containerEl.createDiv({ cls: 'status-group nav-folder' });
        const titleEl = groupEl.createDiv({ cls: 'nav-folder-title' });
        const titleSpan = titleEl.createSpan({
          text: `${status} ${this.plugin.getStatusIcon(status)} (${filteredFiles.length})`,
          cls: `status-${status}`
        });
        titleSpan.style.color = this.plugin.settings.statusColors[status]; // Keep color override
        titleEl.style.cursor = 'pointer';
        const isCollapsed = this.plugin.settings.collapsedStatuses[status] ?? false;
        if (isCollapsed) {
          groupEl.addClass('is-collapsed');
        }

        titleEl.addEventListener('click', (e) => {
          e.preventDefault();
          groupEl.classList.toggle('is-collapsed');
          this.plugin.settings.collapsedStatuses[status] = !this.plugin.settings.collapsedStatuses[status];
          this.plugin.saveSettings();
        });

        const childrenEl = groupEl.createDiv({ cls: 'nav-folder-children' });
        filteredFiles.sort((a, b) => a.basename.localeCompare(b.basename)).forEach(file => {
          const fileEl = childrenEl.createDiv({ cls: 'nav-file' });
          const fileTitleEl = fileEl.createDiv({ cls: 'nav-file-title' });
          fileTitleEl.createSpan({
            text: file.basename,
            cls: 'nav-file-title-content'
          });
          fileEl.addEventListener('click', (e) => {
            e.preventDefault();
            this.app.workspace.openLinkText(file.path, file.path, true);
          });
        });
      }
    });
  }

  onClose() {
    this.containerEl.empty();
    return Promise.resolve();
  }
}

export default class NoteStatus extends Plugin {
  settings: NoteStatusSettings;
  statusBarItem: HTMLElement;
  currentStatus = 'unknown';
  statusDropdownContainer?: HTMLElement;
  private statusPaneLeaf: WorkspaceLeaf | null = null;

  async onload() {
    await this.loadSettings();

    this.registerView('status-pane', (leaf) => {
      this.statusPaneLeaf = leaf;
      return new StatusPaneView(leaf, this);
    });

    this.addRibbonIcon('status-pane', 'Open Status Pane', () => {
      this.openStatusPane();
    });

    this.statusBarItem = this.addStatusBarItem();
    this.statusBarItem.addClass('note-status-bar');
    this.statusBarItem.addEventListener('click', () => {
      this.settings.showStatusDropdown = !this.settings.showStatusDropdown;
      this.updateStatusDropdown();
      this.saveSettings();
      new Notice(`Status dropdown ${this.settings.showStatusDropdown ? 'shown' : 'hidden'}`);
    });
    this.updateStatusBar();

    this.addCommand({
      id: 'batch-update-status',
      name: 'Batch Update Status',
      callback: () => this.showBatchStatusModal()
    });

    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file, source) => {
        console.log('file-menu triggered:', { source, file: file.path });
        if (source === 'file-explorer-context-menu' && file instanceof TFile && file.extension === 'md') {
          menu.addItem((item) =>
            item
              .setTitle('Change Status of Selected Files')
              .setIcon('tag')
              .onClick(() => {
                const selectedFiles = this.getSelectedFiles();
                if (selectedFiles.length > 1) {
                  this.showBatchStatusContextMenu(selectedFiles);
                } else {
                  this.showBatchStatusContextMenu([file]); // Single file fallback
                }
              })
          );
        }
      })
    );

    // Register context menu for multiple files (files-menu)
    this.registerEvent(
      this.app.workspace.on('files-menu', (menu, files) => {
        console.log('files-menu triggered:', { files: files.map(f => f.path) });
        const mdFiles = files.filter(file => file instanceof TFile && file.extension === 'md');
        if (mdFiles.length > 0) {
          menu.addItem((item) =>
            item
              .setTitle('Change Status of Selected Files')
              .setIcon('tag')
              .onClick(() => {
                this.showBatchStatusContextMenu(mdFiles as TFile[]); // WARNING: Fix the type
              })
          );
        } else {
          console.log('No .md files in selection');
        }
      })
    );

    this.addCommand({
      id: 'refresh-note-status',
      name: 'Refresh Note Status',
      callback: () => {
        this.checkNoteStatus();
        new Notice('Note status refreshed!');
      }
    });

    this.addCommand({
      id: 'insert-status-metadata',
      name: 'Insert Status Metadata',
      editorCallback: (editor: Editor, view: MarkdownView) => {
        // Get the current note's content
        const content = editor.getValue();
        
        // Define the metadata to insert
        const statusMetadata = 'status: unknown';
    
        // Check if there's already a front matter
        const frontMatterMatch = content.match(/^---\n([\s\S]+?)\n---/);
    
        if (frontMatterMatch) {
          // If front matter exists, update the status field if it exists, or add it
          const frontMatter = frontMatterMatch[1];
          let updatedFrontMatter = frontMatter;
    
          // Check if 'status' already exists in front matter
          if (/^status:/.test(frontMatter)) {
            // Update the existing status
            updatedFrontMatter = frontMatter.replace(/^status: .*/m, statusMetadata);
          } else {
            // Add the 'status' field to the front matter
            updatedFrontMatter = `${frontMatter}\n${statusMetadata}`;
          }
    
          // Replace the old front matter with the updated one
          const updatedContent = content.replace(/^---\n([\s\S]+?)\n---/, `---\n${updatedFrontMatter}\n---`);
          
          // Set the updated content back into the editor
          editor.setValue(updatedContent);
        } else {
          // If no front matter exists, create a new one with the status
          const newFrontMatter = `---\n${statusMetadata}\n---\n${content}`;
          
          // Set the new content with front matter
          editor.setValue(newFrontMatter);
        }
      }
    });
    

    this.addCommand({
      id: 'open-status-pane',
      name: 'Open Status Pane',
      callback: () => this.openStatusPane()
    });

    this.registerEvent(
      this.app.workspace.on('editor-menu', (menu, editor, view) => {
        if (view instanceof MarkdownView) {
          menu.addItem((item) =>
            item
              .setTitle('Change Note Status')
              .setIcon('tag')
              .onClick(() => this.showStatusDropdown(editor, view))
          );
        }
      })
    );

    this.registerEvent(
      this.app.workspace.on('file-open', () => {
        this.checkNoteStatus();
        this.updateStatusDropdown();
      })
    );
    this.registerEvent(
      this.app.workspace.on('editor-change', () => this.checkNoteStatus())
    );
    this.registerEvent(
      this.app.workspace.on('active-leaf-change', () => {
        this.updateStatusDropdown();
        this.updateStatusPane();
      })
    );

    this.registerEvent(
      this.app.vault.on('modify', (file) => {
        if (file instanceof TFile) {
          this.updateFileExplorerIcons(file);
          this.updateStatusPane();
        }
      })
    );
    this.registerEvent(
      this.app.vault.on('create', () => {
        this.updateAllFileExplorerIcons();
        this.updateStatusPane();
      })
    );
    this.registerEvent(
      this.app.vault.on('delete', () => {
        this.updateAllFileExplorerIcons();
        this.updateStatusPane();
      })
    );
    this.registerEvent(
      this.app.vault.on('rename', () => {
        this.updateAllFileExplorerIcons();
        this.updateStatusPane();
      })
    );
    this.registerEvent(
      this.app.metadataCache.on('changed', (file) => {
        this.checkNoteStatus();
        this.updateFileExplorerIcons(file);
        this.updateStatusPane();
      })
    );

    // Defer initial icon update until vault and workspace are ready
    this.registerEvent(
      this.app.vault.on('modify', (file) => {
        if (file instanceof TFile && file.extension === 'md') {
          this.updateFileExplorerIcons(file);
          this.updateStatusPane();
        }
      })
    );
    this.registerEvent(
      this.app.metadataCache.on('resolved', () => {
        // Called when metadata cache is fully populated
        this.updateAllFileExplorerIcons();
      })
    );
    // Initial check and update (with slight delay to ensure readiness)
    this.app.workspace.onLayoutReady(async () => {
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for stability
      this.checkNoteStatus();
      this.updateStatusDropdown();
      this.updateAllFileExplorerIcons();
    });

    this.addSettingTab(new NoteStatusSettingTab(this.app, this));

    this.checkNoteStatus();
    this.updateStatusDropdown();
    this.updateAllFileExplorerIcons();
  }

  async openStatusPane() {
    const existing = this.app.workspace.getLeavesOfType('status-pane')[0];
    if (existing) {
      this.app.workspace.setActiveLeaf(existing);
      await this.updateStatusPane();
    } else {
      const leaf = this.app.workspace.getLeftLeaf(false);
      if (leaf) {
        await leaf.setViewState({ type: 'status-pane', active: true });
      }
    }
  }

  private getSelectedFiles(): TFile[] {
    const fileExplorer = this.app.workspace.getLeavesOfType('file-explorer')[0];
    if (!fileExplorer || !fileExplorer.view || !(fileExplorer.view as any).fileItems) {
      console.log('File explorer not found or no file items');
      return [];
    }

    const fileItems = (fileExplorer.view as any).fileItems;
    const selectedFiles: TFile[] = [];
    
    Object.entries(fileItems).forEach(([path, item]: [string, any]) => {
      if (item.el?.classList.contains('is-selected') && item.file instanceof TFile && item.file.extension === 'md') {
        selectedFiles.push(item.file);
      }
    });

    console.log('Selected files:', selectedFiles.map(f => f.path));
    return selectedFiles;
  }

  // Show context menu for batch status update
  private showBatchStatusContextMenu(files: TFile[]) {
    const menu = new Menu();
    
    this.settings.customStatuses
      .filter(status => status.name !== 'unknown')
      .forEach(status => {
        menu.addItem((item) =>
          item
            .setTitle(`${status.name} ${status.icon}`)
            .setIcon('tag')
            .onClick(async () => {
              for (const file of files) {
                await this.updateNoteStatus(status.name, file);
              }
              new Notice(`Updated status of ${files.length} file${files.length === 1 ? '' : 's'} to ${status.name}`);
            })
        );
      });

    menu.showAtMouseEvent(new MouseEvent('contextmenu'));
    console.log('Showing batch status context menu for files:', files.map(f => f.path));
  }

  // Modified updateNoteStatus to accept optional file parameter
  async updateNoteStatus(newStatus: string, file?: TFile) {
    const targetFile = file || this.app.workspace.getActiveFile();
    if (!targetFile || targetFile.extension !== 'md') {
      return; // Only process .md files
    }

    const content = await this.app.vault.read(targetFile);
    let newContent = content;

    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n?/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      if (frontmatter.includes('status:')) {
        // Replace only the status line, preserving other frontmatter
        newContent = content.replace(
          /^---\n([\s\S]*?)status:\s*\w+([\s\S]*?)\n---\n?/,
          `---\n$1status: ${newStatus}$2\n---\n`
        );
      } else {
        // Add status to existing frontmatter
        newContent = content.replace(
          /^---\n([\s\S]*?)\n---\n?/,
          `---\n$1\nstatus: ${newStatus}\n---\n`
        );
      }
    } else {
      // Create new frontmatter if none exists
      newContent = `---\nstatus: ${newStatus}\n---\n${content.trim()}`;
    }

    // Ensure consistent line endings and remove extra newlines
    newContent = newContent.replace(/\n{3,}/g, '\n\n');
    await this.app.vault.modify(targetFile, newContent);

    if (targetFile === this.app.workspace.getActiveFile()) {
      this.currentStatus = newStatus;
      this.updateStatusBar();
      this.updateStatusDropdown();
    }
    this.updateFileExplorerIcons(targetFile);
    this.updateStatusPane();
  }

  async checkNoteStatus() {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile || activeFile.extension !== 'md') { // Only process .md files
      this.currentStatus = 'unknown';
      this.updateStatusBar();
      this.updateStatusDropdown();
      return;
    }

    const cachedMetadata = this.app.metadataCache.getFileCache(activeFile);
    this.currentStatus = 'unknown';

    if (cachedMetadata?.frontmatter?.status) {
      const status = cachedMetadata.frontmatter.status.toLowerCase();
      // Explicitly check against customStatuses
      const matchingStatus = this.settings.customStatuses.find(s => s.name.toLowerCase() === status);
      if (matchingStatus) {
        this.currentStatus = matchingStatus.name;
      }
    }

    this.updateStatusBar();
    this.updateStatusDropdown();
    this.updateFileExplorerIcons(activeFile);
  }

  // New method for batch status update
  async showBatchStatusModal() {
    const modal = new Modal(this.app);
    modal.contentEl.createEl('h2', { text: 'Batch Update Note Status' });

    const fileSelect = modal.contentEl.createEl('select', {
      cls: 'batch-file-select',
      attr: { multiple: 'true' }
    });
    fileSelect.style.cssText = `
      width: 100%;
      height: 200px;
      margin-bottom: 10px;
    `;

    const mdFiles = this.app.vault.getMarkdownFiles();
    mdFiles.forEach(file => {
      fileSelect.createEl('option', {
        text: file.path,
        value: file.path
      });
    });

    const statusSelect = modal.contentEl.createEl('select', {
      cls: 'batch-status-select'
    });
    this.settings.customStatuses.forEach(status => {
      statusSelect.createEl('option', {
        text: `${status.name} ${status.icon}`,
        value: status.name
      });
    });

    const applyButton = modal.contentEl.createEl('button', {
      text: 'Apply Status',
      cls: 'mod-cta'
    });
    applyButton.addEventListener('click', async () => {
      const selectedFiles = Array.from(fileSelect.selectedOptions).map(opt => 
        mdFiles.find(f => f.path === opt.value)
      ).filter(Boolean) as TFile[];
      const newStatus = statusSelect.value;

      for (const file of selectedFiles) {
        await this.updateNoteStatus(newStatus, file);
      }
      new Notice(`Updated status of ${selectedFiles.length} notes to ${newStatus}`);
      modal.close();
    });

    modal.open();
  }

  updateStatusBar() {
    this.statusBarItem.empty();
    this.statusBarItem.removeClass('left', 'hidden', 'auto-hide', 'visible');
    this.statusBarItem.addClass('note-status-bar');

    if (!this.settings.showStatusBar) {
      this.statusBarItem.addClass('hidden');
      return;
    }

    if (this.settings.statusBarPosition === 'left') {
      this.statusBarItem.addClass('left');
    }

    const statusEl = this.statusBarItem.createEl('span', {
      text: `Status: ${this.currentStatus}`,
      cls: `note-status-${this.currentStatus}`
    });
    statusEl.style.color = this.settings.statusColors[this.currentStatus];
    this.statusBarItem.createEl('span', {
      text: this.getStatusIcon(this.currentStatus),
      cls: 'note-status-icon'
    });

    if (this.settings.autoHideStatusBar && this.currentStatus === 'unknown') {
      this.statusBarItem.addClass('auto-hide');
      setTimeout(() => {
        if (this.currentStatus === 'unknown' && this.settings.showStatusBar) {
          this.statusBarItem.addClass('hidden');
        }
      }, 500);
    } else {
      this.statusBarItem.addClass('visible');
    }
  }

  getStatusIcon(status: string): string {
    const customStatus = this.settings.customStatuses.find(s => s.name.toLowerCase() === status.toLowerCase());
    return customStatus ? customStatus.icon : '❓';
  }

  toggleStatusModal() {
    const modal = new Modal(this.app);
    modal.contentEl.createEl('h2', { text: 'Change Note Status' });
    this.settings.customStatuses
      .filter(status => status.name !== 'unknown')
      .forEach(status => {
        const button = modal.contentEl.createEl('button', {
          text: `${status.name} ${status.icon}`,
          cls: `status-button status-${status.name}`
        });
        button.style.backgroundColor = this.settings.statusColors[status.name] || '#808080';
        button.addEventListener('click', async () => {
          await this.updateNoteStatus(status.name);
          modal.close();
        });
      });
    modal.open();
  }


  async updateStatusPane() {
    if (this.statusPaneLeaf && this.statusPaneLeaf.view instanceof StatusPaneView) {
      const searchQuery = (this.statusPaneLeaf.view as StatusPaneView).searchInput?.value.toLowerCase() || '';
      await (this.statusPaneLeaf.view as StatusPaneView).renderGroups(searchQuery);
    }
  }

  showStatusDropdown(editor: Editor, view: MarkdownView) {
    const menu = new Menu();
    this.settings.customStatuses
      .filter(status => status.name !== 'unknown')
      .forEach(status => {
        menu.addItem((item) =>
          item
            .setTitle(`${status.name} ${status.icon}`)
            .setIcon('tag')
            .onClick(async () => {
              await this.updateNoteStatus(status.name);
            })
        );
      });

    const cursor = editor.getCursor('to');
    editor.posToOffset(cursor);
    const editorEl = view.contentEl.querySelector('.cm-content');
    const rect = editorEl?.getBoundingClientRect();
    if (rect) {
        menu.showAtPosition({ x: rect.left, y: rect.bottom });
    } else {
        menu.showAtPosition({ x: 0, y: 0 }); // Fallback position
    }
  }

  updateStatusDropdown() {
    if (!this.settings.showStatusDropdown) {
      if (this.statusDropdownContainer) {
        this.statusDropdownContainer.remove();
        this.statusDropdownContainer = undefined;
      }
      return;
    }

    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) {
      if (this.statusDropdownContainer) {
        this.statusDropdownContainer.remove();
        this.statusDropdownContainer = undefined;
      }
      return;
    }

    const contentEl = view.contentEl;
    if (!this.statusDropdownContainer) {
      this.statusDropdownContainer = this.settings.dropdownPosition === 'top'
        ? contentEl.insertBefore(document.createElement('div'), contentEl.firstChild)
        : contentEl.appendChild(document.createElement('div'));
      this.statusDropdownContainer.addClass('note-status-dropdown', this.settings.dropdownPosition);
    }

    this.statusDropdownContainer.empty();
    this.statusDropdownContainer.createEl('span', {
      text: 'Status:',
      cls: 'note-status-label'
    });
    const select = this.statusDropdownContainer.createEl('select', {
      cls: 'note-status-select dropdown'
    });

    this.settings.customStatuses.forEach(status => {
      const option = select.createEl('option', {
        text: `${status.name} ${status.icon}`,
        value: status.name
      });
      option.style.color = this.settings.statusColors[status.name];
      if (status.name === this.currentStatus) {
        option.selected = true;
      }
    });

    select.addEventListener('change', async (e) => {
      const newStatus = (e.target as HTMLSelectElement).value;
      if (newStatus !== 'unknown') {
        await this.updateNoteStatus(newStatus);
      }
    });

    const hideButton = this.statusDropdownContainer.createEl('button', {
      text: 'Hide Bar',
      cls: 'note-status-hide-button clickable-icon mod-cta'
    });
    hideButton.addEventListener('click', () => {
      this.settings.showStatusDropdown = false;
      this.updateStatusDropdown();
      this.saveSettings();
      new Notice('Status dropdown hidden');
    });
  }

  async updateFileExplorerIcons(file: TFile) {
    if (!this.settings.showStatusIconsInExplorer || file.extension !== 'md') return;

    const cachedMetadata = this.app.metadataCache.getFileCache(file);
    let status = 'unknown';
    if (cachedMetadata?.frontmatter?.status) {
      const frontmatterStatus = cachedMetadata.frontmatter.status.toLowerCase();
      const matchingStatus = this.settings.customStatuses.find(s => s.name.toLowerCase() === frontmatterStatus);
      if (matchingStatus) {
        status = matchingStatus.name;
      }
    }

    const fileExplorer = this.app.workspace.getLeavesOfType('file-explorer')[0];
    if (fileExplorer && fileExplorer.view && (fileExplorer.view as any).fileItems) {
      const fileItem = (fileExplorer.view as any).fileItems[file.path];
      if (fileItem) {
        const titleEl = fileItem.titleEl || fileItem.selfEl;
        if (titleEl) {
          const existingIcon = titleEl.querySelector('.note-status-icon');
          if (existingIcon) existingIcon.remove();

          const iconEl = titleEl.createEl('span', {
            cls: 'note-status-icon nav-file-tag',
            text: this.getStatusIcon(status)
          });
          iconEl.style.color = this.settings.statusColors[status];
        }
      }
    }
  }

  updateAllFileExplorerIcons() {
    if (!this.settings.showStatusIconsInExplorer) {
      const fileExplorer = this.app.workspace.getLeavesOfType('file-explorer')[0];
      if (fileExplorer && fileExplorer.view && (fileExplorer.view as any).fileItems) {
        Object.values((fileExplorer.view as any).fileItems).forEach((fileItem: any) => {
          const titleEl = fileItem.titleEl || fileItem.selfEl;
          if (titleEl) {
            const existingIcon = titleEl.querySelector('.note-status-icon');
            if (existingIcon) existingIcon.remove();
          }
        });
      }
      return;
    }

    const files = this.app.vault.getMarkdownFiles();
    files.forEach(file => {
      this.updateFileExplorerIcons(file);
    });
  }

  onunload() {
    this.statusBarItem.remove();
    if (this.statusDropdownContainer) {
      this.statusDropdownContainer.remove();
    }
    const fileExplorer = this.app.workspace.getLeavesOfType('file-explorer')[0];
    if (fileExplorer && fileExplorer.view && (fileExplorer.view as any).fileItems) {
      Object.values((fileExplorer.view as any).fileItems).forEach((fileItem: any) => {
        const titleEl = fileItem.titleEl || fileItem.selfEl;
        if (titleEl) {
          const existingIcon = titleEl.querySelector('.note-status-icon');
          if (existingIcon) existingIcon.remove();
        }
      });
    }
    const statusPane = this.app.workspace.getLeavesOfType('status-pane')[0];
    if (statusPane) {
      statusPane.detach();
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.updateStatusPane();
  }
}

class NoteStatusSettingTab extends PluginSettingTab {
  plugin: NoteStatus;

  constructor(app: App, plugin: NoteStatus) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'Note Status Settings' });

    new Setting(containerEl)
      .setName('Show status dropdown')
      .setDesc('Display status dropdown in notes (can also toggle by clicking status bar)')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showStatusDropdown)
        .onChange(async (value) => {
          this.plugin.settings.showStatusDropdown = value;
          await this.plugin.saveSettings();
          this.plugin.updateStatusDropdown();
        }));

    new Setting(containerEl)
      .setName('Dropdown position')
      .setDesc('Where to place the status dropdown in the note')
      .addDropdown(dropdown => dropdown
        .addOption('top', 'Top')
        .addOption('bottom', 'Bottom')
        .setValue(this.plugin.settings.dropdownPosition)
        .onChange(async (value: 'top' | 'bottom') => {
          this.plugin.settings.dropdownPosition = value;
          await this.plugin.saveSettings();
          this.plugin.updateStatusDropdown();
        }));

    new Setting(containerEl)
      .setName('Show status bar')
      .setDesc('Display the status bar at the bottom of the app')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showStatusBar)
        .onChange(async (value) => {
          this.plugin.settings.showStatusBar = value;
          await this.plugin.saveSettings();
          this.plugin.updateStatusBar();
        }));

    new Setting(containerEl)
      .setName('Status bar position')
      .setDesc('Align the status bar text')
      .addDropdown(dropdown => dropdown
        .addOption('left', 'Left')
        .addOption('right', 'Right')
        .setValue(this.plugin.settings.statusBarPosition)
        .onChange(async (value: 'left' | 'right') => {
          this.plugin.settings.statusBarPosition = value;
          await this.plugin.saveSettings();
          this.plugin.updateStatusBar();
        }));

    new Setting(containerEl)
      .setName('Auto-hide status bar')
      .setDesc('Hide the status bar when status is unknown')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.autoHideStatusBar)
        .onChange(async (value) => {
          this.plugin.settings.autoHideStatusBar = value;
          await this.plugin.saveSettings();
          this.plugin.updateStatusBar();
        }));

    new Setting(containerEl)
      .setName('Show status icons in file explorer')
      .setDesc('Display status icons next to note names in the file explorer')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showStatusIconsInExplorer)
        .onChange(async (value) => {
          this.plugin.settings.showStatusIconsInExplorer = value;
          await this.plugin.saveSettings();
          this.plugin.updateAllFileExplorerIcons();
        }));

    containerEl.createEl('h3', { text: 'Custom Statuses' });

    const statusList = containerEl.createDiv({ cls: 'custom-status-list' });
    const renderStatuses = () => {
      statusList.empty();
      this.plugin.settings.customStatuses.forEach((status, index) => {
        new Setting(statusList)
          .setName(status.name)
          .addText(text => text
            .setPlaceholder('Status Name')
            .setValue(status.name)
            .onChange(async (value) => {
              if (value && !this.plugin.settings.customStatuses.some(s => s.name === value && s !== status)) {
                const oldName = status.name;
                status.name = value;
                if (this.plugin.settings.statusColors[oldName]) {
                  this.plugin.settings.statusColors[value] = this.plugin.settings.statusColors[oldName];
                  delete this.plugin.settings.statusColors[oldName];
                }
                await this.plugin.saveSettings();
                this.plugin.updateStatusDropdown();
                this.plugin.updateStatusBar();
                this.plugin.updateAllFileExplorerIcons();
              }
            }))
          .addText(text => text
            .setPlaceholder('Icon')
            .setValue(status.icon)
            .onChange(async (value) => {
              status.icon = value || '❓';
              await this.plugin.saveSettings();
              this.plugin.updateStatusDropdown();
              this.plugin.updateStatusBar();
              this.plugin.updateAllFileExplorerIcons();
            }))
          .addColorPicker(colorPicker => colorPicker
            .setValue(this.plugin.settings.statusColors[status.name])
            .onChange(async (value) => {
              this.plugin.settings.statusColors[status.name] = value;
              await this.plugin.saveSettings();
              this.plugin.updateStatusBar();
              this.plugin.updateStatusDropdown();
              this.plugin.updateAllFileExplorerIcons();
            }))
          .addButton(button => button
            .setButtonText('Remove')
            .setWarning()
            .onClick(async () => {
              this.plugin.settings.customStatuses.splice(index, 1);
              delete this.plugin.settings.statusColors[status.name];
              await this.plugin.saveSettings();
              renderStatuses();
              this.plugin.updateStatusDropdown();
              this.plugin.updateStatusBar();
              this.plugin.updateAllFileExplorerIcons();
            }));
      });
    };
    renderStatuses();

    new Setting(containerEl)
      .setName('Add new status')
      .setDesc('Add a custom status with a name, icon, and color')
      .addButton(button => button
        .setButtonText('Add Status')
        .setCta()
        .onClick(async () => {
          const newStatus = { name: `status${this.plugin.settings.customStatuses.length + 1}`, icon: '⭐' };
          this.plugin.settings.customStatuses.push(newStatus);
          this.plugin.settings.statusColors[newStatus.name] = '#ffffff';
          await this.plugin.saveSettings();
          renderStatuses();
          this.plugin.updateStatusDropdown();
          this.plugin.updateAllFileExplorerIcons();
        }));
  }
}