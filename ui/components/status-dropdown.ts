import { MarkdownView, Editor, Notice, TFile } from 'obsidian';
import { NoteStatusSettings } from '../../models/types';
import { StatusService } from '../../services/status-service';
import { StatusDropdownComponent } from './status-dropdown-component';

/**
 * Manages status dropdown UI and interactions
 */
export class StatusDropdown {
  private app: any;
  private settings: NoteStatusSettings;
  private statusService: StatusService;
  private currentStatuses: string[] = ['unknown'];
  private toolbarButton?: HTMLElement;
  private dropdownComponent: StatusDropdownComponent;

  constructor(app: any, settings: NoteStatusSettings, statusService: StatusService) {
    this.app = app;
    this.settings = settings;
    this.statusService = statusService;
    this.dropdownComponent = new StatusDropdownComponent(app, statusService, settings);
    this.setupDropdownCallbacks();
  }

  /**
   * Set up the dropdown callbacks
   */
  private setupDropdownCallbacks(): void {
    this.dropdownComponent.setOnStatusChange((statuses) => {
      this.currentStatuses = [...statuses];
      this.updateToolbarButton();
      this.notifyStatusChanged(statuses);
    });
  }

  /**
   * Notify that status has changed
   */
  private notifyStatusChanged(statuses: string[]): void {
    window.dispatchEvent(new CustomEvent('note-status:status-changed', {
      detail: { statuses }
    }));
    window.dispatchEvent(new CustomEvent('note-status:refresh-ui'));
  }

  /**
   * Updates the toolbar button appearance
   */
  private updateToolbarButton(): void {
    if (!this.toolbarButton) return;

    this.toolbarButton.empty();
    
    const hasValidStatus = this.currentStatuses.length > 0 &&
      !this.currentStatuses.every(status => status === 'unknown');

    const badgeContainer = document.createElement('div');
    badgeContainer.addClass('note-status-toolbar-badge-container');

    if (hasValidStatus) {
      this.addPrimaryStatusIcon(badgeContainer);
    } else {
      this.addUnknownStatusIcon(badgeContainer);
    }

    this.toolbarButton.appendChild(badgeContainer);
  }
  
  /**
   * Add primary status icon to container
   */
  private addPrimaryStatusIcon(container: HTMLElement): void {
    const primaryStatus = this.currentStatuses[0];
    const statusInfo = this.statusService.getAllStatuses().find(s => s.name === primaryStatus);

    if (statusInfo) {
      const iconSpan = document.createElement('span');
      iconSpan.addClass(`note-status-toolbar-icon`, `status-${primaryStatus}`);
      iconSpan.textContent = statusInfo.icon;
      container.appendChild(iconSpan);

      if (this.settings.useMultipleStatuses && this.currentStatuses.length > 1) {
        this.addCountBadge(container);
      }
    }
  }
  
  /**
   * Add unknown status icon
   */
  private addUnknownStatusIcon(container: HTMLElement): void {
    const iconSpan = document.createElement('span');
    iconSpan.addClass('note-status-toolbar-icon', 'status-unknown');
    iconSpan.textContent = this.statusService.getStatusIcon('unknown');
    container.appendChild(iconSpan);
  }
  
  /**
   * Add count badge for multiple statuses
   */
  private addCountBadge(container: HTMLElement): void {
    const countBadge = document.createElement('span');
    countBadge.addClass('note-status-count-badge');
    countBadge.textContent = `+${this.currentStatuses.length - 1}`;
    container.appendChild(countBadge);
  }

  /**
   * Updates the dropdown UI based on current statuses
   */
  public update(currentStatuses: string[] | string): void {
    this.currentStatuses = Array.isArray(currentStatuses) ? 
      [...currentStatuses] : [currentStatuses];
    
    this.updateToolbarButton();
    this.dropdownComponent.updateStatuses(this.currentStatuses);
  }

  /**
   * Updates settings reference
   */
  public updateSettings(settings: NoteStatusSettings): void {
    this.settings = settings;
    this.updateToolbarButton();
    this.dropdownComponent.updateSettings(settings);
  }

  /**
   * Show status dropdown in context menu
   */
  public showInContextMenu(editor: Editor, view: MarkdownView): void {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) return;

    const position = this.getCursorPosition(editor, view);
    
    this.openStatusDropdown({
      position,
      files: [activeFile],
      onStatusChange: async (statuses) => {
        if (statuses.length > 0) {
          await this.updateFileStatus(activeFile, statuses);
        }
      }
    });
  }
  
  /**
   * Update a file's status
   */
  private async updateFileStatus(file: TFile, statuses: string[]): Promise<void> {
    await this.statusService.handleStatusChange({
      files: file,
      statuses: statuses,
      afterChange: (updatedStatuses) => {
        this.notifyStatusChanged(updatedStatuses);
      }
    });
  }

  /**
   * Get position from cursor or fallback
   */
  private getCursorPosition(editor: Editor, view: MarkdownView): { x: number, y: number } {
    try {
      const cursor = editor.getCursor('head');
      const lineElement = view.contentEl.querySelector(`.cm-line:nth-child(${cursor.line + 1})`);

      if (lineElement) {
        const rect = lineElement.getBoundingClientRect();
        return { x: rect.left + 20, y: rect.bottom + 5 };
      }

      const editorEl = view.contentEl.querySelector('.cm-editor');
      if (editorEl) {
        const rect = editorEl.getBoundingClientRect();
        return { x: rect.left + 100, y: rect.top + 100 };
      }
    } catch (error) {
      console.error('Error getting position for dropdown:', error);
    }

    return { x: window.innerWidth / 2, y: window.innerHeight / 3 };
  }

  /**
   * Render method (kept for compatibility)
   */
  public render(): void {
    // No-op - dropdown component handles rendering internally
  }

  /**
   * Remove dropdown when plugin is unloaded
   */
  public unload(): void {
    this.dropdownComponent.dispose();
    
    if (this.toolbarButton) {
      this.toolbarButton.remove();
      this.toolbarButton = undefined;
    }
  }

  /**
   * Universal function to open the status dropdown
   */
  public openStatusDropdown(options: {
    target?: HTMLElement;
    position?: { x: number, y: number };
    files?: TFile[];
    editor?: Editor;
    view?: MarkdownView;
    mode?: 'replace' | 'add';
    onStatusChange?: (statuses: string[]) => void;
  }): void {
    if (this.dropdownComponent.isOpen) {
      this.dropdownComponent.close();
      setTimeout(() => this._openStatusDropdown(options), 50);
    } else {
      this._openStatusDropdown(options);
    }
  }

  /**
   * Internal method to open dropdown
   */
  private _openStatusDropdown(options: {
    target?: HTMLElement;
    position?: { x: number, y: number };
    files?: TFile[];
    editor?: Editor;
    view?: MarkdownView;
    mode?: 'replace' | 'add';
    onStatusChange?: (statuses: string[]) => void;
  }): void {
    const files = options.files || [this.app.workspace.getActiveFile()].filter(Boolean);
    if (!files.length) {
      new Notice('No files selected');
      return;
    }

    this.resetDropdownState();
    
    const isSingleFile = files.length === 1;
    const targetFile = isSingleFile ? files[0] : null;
    this.dropdownComponent.setTargetFile(targetFile);

    const currentStatuses = targetFile ? 
      this.statusService.getFileStatuses(targetFile) : 
      this.findCommonStatuses(files);
    
    this.dropdownComponent.updateStatuses(currentStatuses);
    this.setupStatusChangeCallback(options, files, isSingleFile);
    this.positionAndOpenDropdown(options);
  }
  
  /**
   * Reset dropdown state before opening
   */
  private resetDropdownState(): void {
    this.dropdownComponent.setTargetFile(null);
    this.dropdownComponent.setOnStatusChange(() => {});
  }

  /**
   * Setup the appropriate callback for status changes
   */
  private setupStatusChangeCallback(
    options: {
      onStatusChange?: (statuses: string[]) => void;
      mode?: 'replace' | 'add';
    }, 
    files: TFile[], 
    isSingleFile: boolean
  ): void {
    if (options.onStatusChange) {
      this.dropdownComponent.setOnStatusChange(options.onStatusChange);
    } else if (!isSingleFile) {
      const filesForBatch = [...files];
      
      this.dropdownComponent.setOnStatusChange(async (statuses) => {
        if (statuses.length > 0) {
          const toggledStatus = statuses[statuses.length - 1];
          await this.toggleStatusForFiles(filesForBatch, toggledStatus);
          
          window.dispatchEvent(new CustomEvent('note-status:batch-update-complete', {
            detail: {
              status: toggledStatus,
              fileCount: filesForBatch.length
            }
          }));
          window.dispatchEvent(new CustomEvent('note-status:refresh-ui'));
        }
      });
    } else {
      this.dropdownComponent.setOnStatusChange(this.notifyStatusChanged.bind(this));
    }
  }

  /**
   * Position and open the dropdown
   */
  private positionAndOpenDropdown(options: {
    target?: HTMLElement;
    position?: { x: number, y: number };
    editor?: Editor;
    view?: MarkdownView;
  }): void {
    if (options.editor && options.view) {
      const position = this.getCursorPosition(options.editor, options.view);
      this.openWithPosition(position);
      return;
    }

    if (options.target) {
      if (options.position) {
        this.dropdownComponent.open(options.target, options.position);
      } else {
        const rect = options.target.getBoundingClientRect();
        this.dropdownComponent.open(options.target, {
          x: rect.left,
          y: rect.bottom + 5
        });
      }
      return;
    }

    if (options.position) {
      this.openWithPosition(options.position);
      return;
    }

    this.openWithPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 3
    });
  }
  
  /**
   * Open dropdown at a specific position using dummy target
   */
  private openWithPosition(position: { x: number, y: number }): void {
    const dummyTarget = this.createDummyTarget(position);
    this.dropdownComponent.open(dummyTarget, position);
    
    setTimeout(() => {
      if (dummyTarget.parentNode) {
        dummyTarget.parentNode.removeChild(dummyTarget);
      }
    }, 100);
  }

  /**
   * Create a dummy target element for positioning
   */
  private createDummyTarget(position: { x: number, y: number }): HTMLElement {
    const dummyTarget = document.createElement('div');
    dummyTarget.addClass('note-status-dummy-target');
    dummyTarget.style.setProperty('--pos-x-px', `${position.x}px`);
    dummyTarget.style.setProperty('--pos-y-px', `${position.y}px`);
    document.body.appendChild(dummyTarget);
    return dummyTarget;
  }

  /**
   * Find common statuses across multiple files
   */
  private findCommonStatuses(files: TFile[]): string[] {
    if (files.length === 0) return ['unknown'];
    
    const firstFileStatuses = this.statusService.getFileStatuses(files[0]);
    
    return firstFileStatuses.filter(status => 
      status !== 'unknown' && 
      files.every(file => this.statusService.getFileStatuses(file).includes(status))
    );
  }

  /**
   * Toggle a status across multiple files
   */
  private async toggleStatusForFiles(files: TFile[], status: string): Promise<void> {
    await this.statusService.handleStatusChange({
      files: files,
      statuses: status,
      isMultipleSelection: true,
      afterChange: () => {
        window.dispatchEvent(new CustomEvent('note-status:batch-update-complete', {
          detail: {
            status: status,
            fileCount: files.length
          }
        }));
        window.dispatchEvent(new CustomEvent('note-status:refresh-ui'));
      }
    });
  }

  /**
   * Adds the toolbar button to the active leaf
   */
  public addToolbarButtonToActiveLeaf(): void {
    const activeLeaf = this.app.workspace.activeLeaf;
    if (!activeLeaf?.view || !(activeLeaf.view instanceof MarkdownView)) return;

    const toolbarContainer = activeLeaf.view.containerEl.querySelector('.view-header .view-actions');
    if (!toolbarContainer) return;

    const existingButton = toolbarContainer.querySelector('.note-status-toolbar-button');
    if (existingButton) {
      this.toolbarButton = existingButton as HTMLElement;
      this.updateToolbarButton();
      return;
    }

    this.toolbarButton = this.createToolbarButton();

    if (toolbarContainer.firstChild) {
      toolbarContainer.insertBefore(this.toolbarButton, toolbarContainer.firstChild);
    } else {
      toolbarContainer.appendChild(this.toolbarButton);
    }
  }
  
  /**
   * Create the toolbar button
   */
  private createToolbarButton(): HTMLElement {
    const button = document.createElement('button');
    button.addClass('note-status-toolbar-button', 'clickable-icon', 'view-action');
    button.setAttribute('aria-label', 'Note status');
    
    this.updateToolbarButton();
    
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.toggleStatusPopover();
    });
    
    return button;
  }
  
  /**
   * Toggle the status popover
   */
  private toggleStatusPopover(): void {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) return;

    this.openStatusDropdown({
      target: this.toolbarButton,
      files: [activeFile]
    });
  }
}