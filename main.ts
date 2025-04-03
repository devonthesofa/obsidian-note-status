import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, TFile, Menu, Vault, View, WorkspaceLeaf, addIcon } from 'obsidian';

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
    active: '#00ff00',
    onHold: '#ffa500',
    completed: '#0000ff',
    dropped: '#ff0000',
    unknown: '#808080'
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
    containerEl.addClass('status-pane');
    containerEl.style.cssText = `
      padding: 10px;
      background: var(--background-secondary);
      color: var(--text-normal);
      font-family: var(--font-interface);
      overflow-y: auto;
      height: 100%;
    `;

    const searchContainer = containerEl.createDiv({ cls: 'status-pane-search' });
    this.searchInput = searchContainer.createEl('input', {
      type: 'text',
      placeholder: 'Search notes...',
      cls: 'status-pane-search-input'
    });
    this.searchInput.style.cssText = `
      width: 100%;
      padding: 8px 12px;
      margin-bottom: 10px;
      border: 1px solid var(--background-modifier-border);
      border-radius: 4px;
      background: var(--background-primary);
      color: var(--text-normal);
      outline: none;
      transition: border-color 0.2s ease;
    `;
    this.searchInput.addEventListener('focus', () => {
      this.searchInput!.style.borderColor = 'var(--interactive-accent)';
    });
    this.searchInput.addEventListener('blur', () => {
      this.searchInput!.style.borderColor = 'var(--background-modifier-border)';
    });
    this.searchInput.addEventListener('input', () => {
      this.renderGroups(this.searchInput!.value.toLowerCase());
    });

    const actionsContainer = containerEl.createDiv({ cls: 'status-pane-actions-container' });

    // Add refresh button for manual updates
    const refreshButton = actionsContainer.createEl('button', {
      type: 'button',
      title: 'Refresh Statuses',
      text: 'Refresh',
      cls: 'status-pane-actions-refresh'
    });
    refreshButton.style.cssText = `
      padding: 6px 12px;
      margin: 5px 0 5px 10px;
      background: var(--background-primary);
      border: 1px solid var(--background-modifier-border);
      border-radius: 4px;
      cursor: pointer;
    `;
    refreshButton.addEventListener('click', async () => {
      await this.renderGroups(this.searchInput?.value.toLowerCase() || '');
      new Notice('Status pane refreshed');
    });
  }

  // Render only the dynamic groups
  async renderGroups(searchQuery: string = '') {
    const { containerEl } = this;
    // Remove existing groups, but keep the search bar
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
        const foundStatus = cachedMetadata.frontmatter.status.toLowerCase();
        if (this.plugin.settings.customStatuses.some(s => s.name === foundStatus)) {
          status = foundStatus;
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
        titleSpan.style.cssText = `
          color: ${this.plugin.settings.statusColors[status] || '#808080'};
          font-weight: 600;
          padding: 8px 12px;
          display: flex;
          align-items: center;
          gap: 5px;
          transition: background 0.2s ease;
        `;
        titleEl.style.cursor = 'pointer';
        const isCollapsed = this.plugin.settings.collapsedStatuses[status] ?? false;
        if (isCollapsed) {
          groupEl.addClass('is-collapsed');
        }

        titleEl.addEventListener('click', (e) => {
          e.preventDefault(); // Prevent any unwanted navigation
          groupEl.classList.toggle('is-collapsed');
          this.plugin.settings.collapsedStatuses[status] = !this.plugin.settings.collapsedStatuses[status];
          this.plugin.saveSettings();
        });
        titleEl.addEventListener('mouseover', () => {
          titleSpan.style.background = 'var(--background-modifier-hover)';
        });
        titleEl.addEventListener('mouseout', () => {
          titleSpan.style.background = 'transparent';
        });

        const childrenEl = groupEl.createDiv({ cls: 'nav-folder-children' });
        childrenEl.style.cssText = `
          padding-left: 20px;
          border-left: 1px solid var(--background-modifier-border);
          display: ${isCollapsed ? 'none' : 'block'};
        `;
        titleEl.addEventListener('click', () => {
          childrenEl.style.display = childrenEl.style.display === 'none' ? 'block' : 'none';
        });

        filteredFiles.sort((a, b) => a.basename.localeCompare(b.basename)).forEach(file => {
          const fileEl = childrenEl.createDiv({ cls: 'nav-file' });
          const fileTitleEl = fileEl.createDiv({ cls: 'nav-file-title' });
          const linkEl = fileTitleEl.createSpan({
            text: file.basename,
            cls: 'nav-file-title-content'
          });
          linkEl.style.cssText = `
            padding: 6px 12px;
            display: block;
            color: var(--text-normal);
            transition: background 0.2s ease;
          `;
          fileEl.addEventListener('click', (e) => {
            e.preventDefault();
            this.app.workspace.openLinkText(file.path, file.path, true);
          });
          fileEl.addEventListener('mouseover', () => {
            linkEl.style.background = 'var(--background-modifier-hover)';
          });
          fileEl.addEventListener('mouseout', () => {
            linkEl.style.background = 'transparent';
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
  currentStatus: string = 'unknown';
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
    this.statusBarItem.style.cursor = 'pointer';
    this.statusBarItem.addEventListener('click', () => {
      this.settings.showStatusDropdown = !this.settings.showStatusDropdown;
      this.updateStatusDropdown();
      this.saveSettings();
      new Notice(`Status dropdown ${this.settings.showStatusDropdown ? 'shown' : 'hidden'}`);
    });
    this.updateStatusBar();

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
        menu.addItem((item) =>
          item
            .setTitle('Change Note Status')
            .setIcon('tag')
            .onClick(() => this.showStatusDropdown(editor, view))
        );
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
      await leaf.setViewState({ type: 'status-pane', active: true });
    }
  }

  // Modified updateNoteStatus to accept optional file parameter
  async updateNoteStatus(newStatus: string, file?: TFile) {
    const targetFile = file || this.app.workspace.getActiveFile();
    if (!targetFile) return;

    let content = await this.app.vault.read(targetFile);
    let newContent = content;

    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      if (frontmatter.includes('status:')) {
        newContent = content.replace(/status:\s*\w+/i, `status: ${newStatus}`);
      } else {
        newContent = content.replace(/^---\n/, `---\nstatus: ${newStatus}\n`);
      }
    } else {
      newContent = `---\nstatus: ${newStatus}\n---\n${content.trim()}`;
    }

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
    if (!activeFile) {
      this.currentStatus = 'unknown';
      this.updateStatusBar();
      this.updateStatusDropdown();
      return;
    }

    const cachedMetadata = this.app.metadataCache.getFileCache(activeFile);
    this.currentStatus = 'unknown';

    if (cachedMetadata?.frontmatter?.status) {
      const status = cachedMetadata.frontmatter.status.toLowerCase();
      if (this.settings.customStatuses.some(s => s.name === status)) {
        this.currentStatus = status;
      }
    }

    this.updateStatusBar();
    this.updateStatusDropdown();
    this.updateFileExplorerIcons(activeFile);
  }

  updateStatusBar() {
    this.statusBarItem.empty();
    if (!this.settings.showStatusBar) {
      this.statusBarItem.style.display = 'none';
      return;
    }

    this.statusBarItem.style.display = 'flex';
    this.statusBarItem.style.justifyContent = this.settings.statusBarPosition === 'left' ? 'flex-start' : 'flex-end';
    
    const statusEl = this.statusBarItem.createEl('span', {
      text: `Status: ${this.currentStatus}`,
      cls: `note-status-${this.currentStatus}`
    });
    statusEl.style.color = this.settings.statusColors[this.currentStatus] || '#808080';
    this.statusBarItem.createEl('span', {
      text: this.getStatusIcon(this.currentStatus),
      cls: 'status-icon'
    });

    if (this.settings.autoHideStatusBar && this.currentStatus === 'unknown') {
      this.statusBarItem.style.opacity = '0';
      this.statusBarItem.style.transition = 'opacity 0.5s ease';
      setTimeout(() => {
        if (this.currentStatus === 'unknown' && this.settings.showStatusBar) {
          this.statusBarItem.style.display = 'none';
        }
      }, 500);
    } else {
      this.statusBarItem.style.opacity = '1';
      this.statusBarItem.style.display = 'flex';
    }
  }

  getStatusIcon(status: string): string {
    const customStatus = this.settings.customStatuses.find(s => s.name === status);
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
    const menu = new Menu(this.app);
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

    const rect = editor.getCursor('to');
    const pos = editor.coordsAtPos(rect);
    menu.showAtPosition({ x: pos.x, y: pos.y });
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
      this.statusDropdownContainer.className = 'note-status-dropdown';
      this.statusDropdownContainer.style.cssText = `
        padding: 5px;
        background: var(--background-secondary);
        border-${this.settings.dropdownPosition === 'top' ? 'bottom' : 'top'}: 1px solid var(--background-modifier-border);
        position: sticky;
        ${this.settings.dropdownPosition}: 0;
        z-index: 10;
        display: flex;
        align-items: center;
        gap: 10px;
      `;
    }

    this.statusDropdownContainer.empty();
    const label = this.statusDropdownContainer.createEl('span', {
      text: 'Status:',
      cls: 'status-label'
    });
    label.style.fontWeight = 'bold';

    const select = this.statusDropdownContainer.createEl('select', {
      cls: 'status-select'
    });
    select.style.cssText = `
      padding: 4px 8px;
      border: 1px solid var(--background-modifier-border);
      border-radius: 4px;
      background: var(--background-primary);
      color: var(--text-normal);
      cursor: pointer;
      outline: none;
      transition: all 0.2s ease;
    `;

    this.settings.customStatuses.forEach(status => {
      const option = select.createEl('option', {
        text: `${status.name} ${status.icon}`,
        value: status.name
      });
      option.style.color = this.settings.statusColors[status.name] || '#808080';
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

    select.addEventListener('mouseover', () => {
      select.style.boxShadow = '0 2px 4px var(--background-modifier-box-shadow)';
    });
    select.addEventListener('mouseout', () => {
      select.style.boxShadow = 'none';
    });

    const hideButton = this.statusDropdownContainer.createEl('button', {
      text: 'Hide Bar',
      cls: 'hide-status-bar-button'
    });
    hideButton.style.cssText = `
      padding: 4px 8px;
      border: 1px solid var(--background-modifier-border);
      border-radius: 4px;
      background: var(--background-primary);
      color: var(--text-normal);
      cursor: pointer;
      transition: all 0.2s ease;
    `;
    hideButton.addEventListener('click', () => {
      this.settings.showStatusDropdown = false;
      this.updateStatusDropdown();
      this.saveSettings();
      new Notice('Status dropdown hidden');
    });
    hideButton.addEventListener('mouseover', () => {
      hideButton.style.backgroundColor = 'var(--background-modifier-hover)';
    });
    hideButton.addEventListener('mouseout', () => {
      hideButton.style.backgroundColor = 'var(--background-primary)';
    });
  }

  async updateFileExplorerIcons(file: TFile) {
    if (!this.settings.showStatusIconsInExplorer) return;

    const content = await this.app.vault.read(file);
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    let status = 'unknown';

    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      const statusMatch = frontmatter.match(/status:\s*(\w+)/i);
      if (statusMatch) {
        const foundStatus = statusMatch[1].toLowerCase();
        if (this.settings.customStatuses.some(s => s.name === foundStatus)) {
          status = foundStatus;
        }
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
            cls: 'note-status-icon',
            text: this.getStatusIcon(status)
          });
          iconEl.style.marginLeft = '5px';
          iconEl.style.color = this.settings.statusColors[status] || '#808080';
          iconEl.style.fontSize = '12px';
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

    this.app.vault.getMarkdownFiles().forEach(file => {
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
        const statusSetting = new Setting(statusList)
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
            .setValue(this.plugin.settings.statusColors[status.name] || '#808080')
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