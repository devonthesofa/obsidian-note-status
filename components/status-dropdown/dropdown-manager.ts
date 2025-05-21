import { MarkdownView, Editor, Notice, TFile, App } from 'obsidian';
import { DropdownUI } from './dropdown-ui';
import { DropdownOptions, DropdownDependencies } from './types';
import { createDummyTarget } from './dropdown-position';
import { StatusService } from 'services/status-service';
import { NoteStatusSettings } from 'models/types';

/**
 * High-level manager for status dropdown interactions
 */
export class DropdownManager {
  private app: App;
  private settings: NoteStatusSettings;
  private statusService: StatusService;
  private currentStatuses: string[] = ['unknown'];
  private toolbarButton?: HTMLElement;
  private dropdownUI: DropdownUI;  
  
  // Singleton para gestionar todos los dropdowns
  private static activeInstance: DropdownManager | null = null;

  constructor(app: any, settings: NoteStatusSettings, statusService: StatusService) {
    this.app = app;
    this.settings = settings;
    this.statusService = statusService;
    
    const deps: DropdownDependencies = { app, settings, statusService };
    this.dropdownUI = new DropdownUI(deps);
    
    this.setupDropdownCallbacks();
    this.setupCustomEvents();
  }

  /**
   * Set up dropdown callbacks
   */
  private setupDropdownCallbacks(): void {
    this.dropdownUI.setOnStatusChange((statuses) => {
      this.currentStatuses = [...statuses];
      this.updateToolbarButton();
    });

    this.dropdownUI.setOnRemoveStatusHandler(async (status, targetFile) => {
      if (!targetFile) return;
      
      await this.statusService.handleStatusChange({
        files: targetFile,
        statuses: status,
        operation: 'remove',
        showNotice: false,
        afterChange: (updatedStatuses) => {
          this.currentStatuses = updatedStatuses;
        }
      });
    });
    
    this.dropdownUI.setOnSelectStatusHandler(async (status, targetFile) => {
      // Check if handling multiple files
      const isMultipleFiles = Array.isArray(targetFile) && targetFile.length > 1;
      
      if (isMultipleFiles) {
        const files = targetFile as TFile[];
        // Count how many files already have this status
        const filesWithStatus = files.filter(file => 
          this.statusService.getFileStatuses(file).includes(status)
        );
        
        // If ALL have the status, remove it. Otherwise, add it
        const operation = filesWithStatus.length === files.length ? 'remove' : 'add';
        
        await this.statusService.handleStatusChange({
          files: targetFile,
          statuses: status,
          isMultipleSelection: true,
          operation: operation
        });
      } else {
        // For individual files, maintain default behavior
        await this.statusService.handleStatusChange({
          files: targetFile,
          statuses: status
        });
      }
    });
  }

  /**
   * Set up custom events
   */
  private setupCustomEvents(): void {
    window.addEventListener('note-status:dropdown-close', () => {
      if (this.dropdownUI.isOpen) {
        this.dropdownUI.close();
      }
    });
  }

  /**
   * Updates the toolbar button appearance
   */
  private updateToolbarButton(): void {
    if (!this.toolbarButton) return;

    DropdownManager.activeInstance?.dropdownUI.close();
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
  public update(currentStatuses: string[] | string, file?: TFile): void {

    this.currentStatuses = Array.isArray(currentStatuses) ? 
      [...currentStatuses] : [currentStatuses];
    
    this.updateToolbarButton();
    this.dropdownUI.updateStatuses(this.currentStatuses);
  }

  /**
   * Updates settings reference
   */
  public updateSettings(settings: NoteStatusSettings): void {
    this.settings = settings;
    this.updateToolbarButton();
    this.dropdownUI.updateSettings(settings);
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
      files: [activeFile]
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
    this.dropdownUI.dispose();
    
    if (this.toolbarButton) {
      this.toolbarButton.remove();
      this.toolbarButton = undefined;
    }
    
    window.removeEventListener('note-status:dropdown-close', () => {});
  }

  /**
   * Universal function to open the status dropdown
   */
  public openStatusDropdown(options: DropdownOptions): void {
    // Cerrar dropdown activo antes de abrir uno nuevo
    if (DropdownManager.activeInstance && DropdownManager.activeInstance !== this) {
      console.log("close this:, ",DropdownManager.activeInstance)
      this.resetDropdownState();
      DropdownManager.activeInstance.dropdownUI.close();
    }
    DropdownManager.activeInstance = this;

    const files = options.files || [this.app.workspace.getActiveFile()].filter(Boolean);
    if (!files.length) {
      new Notice('No files selected');
      return;
    }

    this.resetDropdownState();
    
    const isSingleFile = files.length === 1;
    
    // Set up target files appropriately
    if (isSingleFile) {
      const targetFile = files[0];
      this.dropdownUI.setTargetFile(targetFile);
      const currentStatuses = this.statusService.getFileStatuses(targetFile);
      this.dropdownUI.updateStatuses(currentStatuses);
    } else {
      // For multiple files, set the whole collection
      this.dropdownUI.setTargetFiles(files);
      const commonStatuses = this.findCommonStatuses(files);
      this.dropdownUI.updateStatuses(commonStatuses);
    }
    
    this.positionAndOpenDropdown(options);
  }

  
  /**
   * Reset dropdown state before opening
   */
  private resetDropdownState(): void {
    this.dropdownUI.setTargetFile(null);
    this.dropdownUI.setOnStatusChange(() => {});
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
        this.dropdownUI.open(options.target, options.position);
      } else {
        const rect = options.target.getBoundingClientRect();
        this.dropdownUI.open(options.target, {
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
    const dummyTarget = createDummyTarget(position);
    this.dropdownUI.open(dummyTarget, position);
    
    setTimeout(() => {
      if (dummyTarget.parentNode) {
        dummyTarget.parentNode.removeChild(dummyTarget);
      }
    }, 100);
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