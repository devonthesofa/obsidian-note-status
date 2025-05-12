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

    // Initialize the dropdown component
    this.dropdownComponent = new StatusDropdownComponent(app, statusService, settings);

    // Configure dropdown component callbacks
    this.setupDropdownCallbacks();
  }

  /**
   * Set up the dropdown callbacks
   */
  private setupDropdownCallbacks(): void {
    this.dropdownComponent.setOnStatusChange((statuses) => {
      // Update current statuses and toolbar button
      this.currentStatuses = [...statuses]; // Make sure to copy the array
      this.updateToolbarButton();

      // Dispatch events for UI update
      window.dispatchEvent(new CustomEvent('note-status:status-changed', {
        detail: { statuses }
      }));
      window.dispatchEvent(new CustomEvent('note-status:refresh-ui'));
    });
  }

  /**
   * Updates the toolbar button appearance based on current statuses
   */
  private updateToolbarButton(): void {
    if (!this.toolbarButton) return;

    // Clear existing content
    this.toolbarButton.empty();

    // Check if we have a valid status
    const hasValidStatus = this.currentStatuses.length > 0 &&
      !this.currentStatuses.every(status => status === 'unknown');

    // Create badge container
    const badgeContainer = document.createElement('div');
    badgeContainer.addClass('note-status-toolbar-badge-container');

    if (hasValidStatus) {
      // Add primary status icon
      const primaryStatus = this.currentStatuses[0];
      const statusInfo = this.statusService.getAllStatuses().find(s => s.name === primaryStatus);

      if (statusInfo) {
        // Primary status icon
        const iconSpan = document.createElement('span');
        iconSpan.addClass(`note-status-toolbar-icon`, `status-${primaryStatus}`);
        iconSpan.textContent = statusInfo.icon;
        badgeContainer.appendChild(iconSpan);

        // Add count indicator if multiple statuses
        if (this.settings.useMultipleStatuses && this.currentStatuses.length > 1) {
          const countBadge = document.createElement('span');
          countBadge.addClass('note-status-count-badge');
          countBadge.textContent = `+${this.currentStatuses.length - 1}`;
          badgeContainer.appendChild(countBadge);
        }
      }
    } else {
      // Add default unknown status icon
      const iconSpan = document.createElement('span');
      iconSpan.addClass('note-status-toolbar-icon', 'status-unknown');
      iconSpan.textContent = this.statusService.getStatusIcon('unknown');
      badgeContainer.appendChild(iconSpan);
    }

    this.toolbarButton.appendChild(badgeContainer);
  }

  /**
   * Updates the dropdown UI based on current statuses
   */
  public update(currentStatuses: string[] | string): void {
    // Normalize input to always be an array
    if (typeof currentStatuses === 'string') {
      this.currentStatuses = [currentStatuses];
    } else {
      this.currentStatuses = [...currentStatuses]; // Create a copy
    }

    // Update toolbar button with new status
    this.updateToolbarButton();

    // Update dropdown component
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

  /**
   * Show status dropdown in context menu
   */
  public showInContextMenu(editor: Editor, view: MarkdownView): void {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) return;

    const position = this.getCursorPosition(editor, view);
    
    this.openStatusDropdown({
      position: position,
      files: [activeFile],
      onStatusChange: async (statuses) => {
        if (statuses.length > 0) {
          if (this.settings.useMultipleStatuses) {
            await this.statusService.toggleNoteStatus(statuses[0], activeFile);
          } else {
            await this.statusService.updateNoteStatuses(statuses, activeFile);
          }

          // Trigger UI updates
          window.dispatchEvent(new CustomEvent('note-status:status-changed', {
            detail: { statuses, file: activeFile.path }
          }));
          window.dispatchEvent(new CustomEvent('note-status:refresh-ui'));
        }
      }
    });
  }

  /**
   * Get position from cursor or fallback positions
   */
  private getCursorPosition(editor: Editor, view: MarkdownView): { x: number, y: number } {
    try {
      // Get cursor position in the document
      const cursor = editor.getCursor('head');

      // Try to find the DOM representation of the cursor position
      const lineElement = view.contentEl.querySelector(`.cm-line:nth-child(${cursor.line + 1})`);

      if (lineElement) {
        const rect = lineElement.getBoundingClientRect();
        // Position near the current line with some offset
        return {
          x: rect.left + 20,
          y: rect.bottom + 5
        };
      }

      // Fallback to editor element position
      const editorEl = view.contentEl.querySelector('.cm-editor');
      if (editorEl) {
        const rect = editorEl.getBoundingClientRect();
        return {
          x: rect.left + 100, // Offset from left
          y: rect.top + 100   // Offset from top
        };
      }
    } catch (error) {
      console.error('Error getting position for dropdown:', error);
    }

    // Last resort - use middle of viewport
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight / 3
    };
  }

  /**
   * Stub render method (kept for compatibility)
   */
  public render(): void {
    // No-op - dropdown component handles rendering internally
  }

  /**
   * Remove dropdown when plugin is unloaded
   */
  public unload(): void {
    // Clean up dropdown component
    this.dropdownComponent.dispose();

    // Remove toolbar button
    if (this.toolbarButton) {
      this.toolbarButton.remove();
      this.toolbarButton = undefined;
    }
  }

  /**
   * Universal function to open the status dropdown in any context
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
    // Force reset if dropdown is already open
    if (this.dropdownComponent.isOpen) {
      this.dropdownComponent.close();
      // Give it a moment to clean up before proceeding
      setTimeout(() => {
        this._openStatusDropdown(options);
      }, 50);
      return;
    }

    this._openStatusDropdown(options);
  }

  /**
   * Internal method to open dropdown after reset
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
    // If no files provided, use active file
    const files = options.files || [this.app.workspace.getActiveFile()].filter(Boolean);
    if (!files.length) {
      new Notice('No files selected');
      return;
    }

    // Always reset state at the beginning
    this.dropdownComponent.setTargetFile(null);
    this.dropdownComponent.setOnStatusChange(() => {});

    // Determine if we're handling single or multiple files
    const isSingleFile = files.length === 1;
    const targetFile = isSingleFile ? files[0] : null;

    // Set target file (if single) or null (if multiple)
    this.dropdownComponent.setTargetFile(targetFile);

    // Get current statuses appropriately
    let currentStatuses: string[];
    
    if (targetFile) {
      // For single file, get its current statuses
      currentStatuses = this.statusService.getFileStatuses(targetFile);
    } else if (files.length > 1) {
      // For multiple files, find common statuses to display
      currentStatuses = this.findCommonStatuses(files);
    } else {
      currentStatuses = ['unknown'];
    }

    // Update dropdown with current statuses
    this.dropdownComponent.updateStatuses(currentStatuses);

    // Set the appropriate callback
    this.setupStatusChangeCallback(options, files, isSingleFile);

    // Position and open the dropdown
    this.positionAndOpenDropdown(options);
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
      // Use the provided callback directly
      this.dropdownComponent.setOnStatusChange(options.onStatusChange);
    } else if (!isSingleFile) {
      // Create a local copy of files to avoid closure issues
      const filesForBatch = [...files];
      
      // Set batch operation callback for multiple files
      this.dropdownComponent.setOnStatusChange(async (statuses) => {
        if (statuses.length > 0) {
          // Get the last selected status for toggling
          const toggledStatus = statuses[statuses.length - 1];
          
          // Toggle this status across all files
          await this.toggleStatusForFiles(filesForBatch, toggledStatus);

          // Dispatch events for UI update
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
      // Default callback for single file operations
      this.dropdownComponent.setOnStatusChange((statuses) => {
        // Just emit events for UI updates
        window.dispatchEvent(new CustomEvent('note-status:status-changed', {
          detail: { statuses }
        }));
        window.dispatchEvent(new CustomEvent('note-status:refresh-ui'));
      });
    }
  }

  /**
   * Position and open the dropdown based on options
   */
  private positionAndOpenDropdown(options: {
    target?: HTMLElement;
    position?: { x: number, y: number };
    editor?: Editor;
    view?: MarkdownView;
  }): void {
    // For dropdown from editor
    if (options.editor && options.view) {
      const position = this.getCursorPosition(options.editor, options.view);
      const dummyTarget = this.createDummyTarget(position);
      this.dropdownComponent.open(dummyTarget, position);

      // Clean up dummy target
      setTimeout(() => {
        if (dummyTarget.parentNode) {
          dummyTarget.parentNode.removeChild(dummyTarget);
        }
      }, 100);
      return;
    }

    // For dropdown from toolbar button
    if (options.target) {
      if (options.position) {
        this.dropdownComponent.open(options.target, options.position);
      } else {
        const rect = options.target.getBoundingClientRect();
        const position = {
          x: rect.left,
          y: rect.bottom + 5
        };
        this.dropdownComponent.open(options.target, position);
      }
      return;
    }

    // For direct position (context menus)
    if (options.position) {
      const dummyTarget = this.createDummyTarget(options.position);
      this.dropdownComponent.open(dummyTarget, options.position);

      // Clean up dummy target
      setTimeout(() => {
        if (dummyTarget.parentNode) {
          dummyTarget.parentNode.removeChild(dummyTarget);
        }
      }, 100);
      return;
    }

    // Fallback to center position
    const center = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 3
    };
    
    const fallbackTarget = this.createDummyTarget(center);
    this.dropdownComponent.open(fallbackTarget, center);

    // Clean up fallback target
    setTimeout(() => {
      if (fallbackTarget.parentNode) {
        fallbackTarget.parentNode.removeChild(fallbackTarget);
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
    
    // Get statuses for first file
    const firstFileStatuses = this.statusService.getFileStatuses(files[0]);
    
    // Filter to only include statuses that exist on all files, except unknown
    return firstFileStatuses.filter(status => {
      if (status === 'unknown') return false;
      
      // Check if status exists on all files
      return files.every(file => 
        this.statusService.getFileStatuses(file).includes(status)
      );
    });
  }

  /**
   * Toggle a status across multiple files
   */
  private async toggleStatusForFiles(files: TFile[], status: string): Promise<void> {
    // Count how many files have this status
    const filesWithStatus = files.filter(file => 
      this.statusService.getFileStatuses(file).includes(status)
    );
    
    // If more than half have the status, remove it; otherwise, add it
    const shouldRemove = filesWithStatus.length > files.length / 2;
    
    for (const file of files) {
      if (shouldRemove) {
        await this.statusService.removeNoteStatus(status, file);
      } else {
        await this.statusService.addNoteStatus(status, file);
      }
    }
  }

  /**
   * Adds the toolbar button to the active leaf
   */
  public addToolbarButtonToActiveLeaf(): void {
    const activeLeaf = this.app.workspace.activeLeaf;
    if (!activeLeaf || !activeLeaf.view || !(activeLeaf.view instanceof MarkdownView)) {
      return;
    }

    // Get the toolbar container
    const containerEl = activeLeaf.view.containerEl;
    const toolbarContainer = containerEl.querySelector('.view-header .view-actions');
    if (!toolbarContainer) {
      return;
    }

    // Check if button already exists in this toolbar
    const existingButton = toolbarContainer.querySelector('.note-status-toolbar-button');
    if (existingButton) {
      this.toolbarButton = existingButton as HTMLElement;
      this.updateToolbarButton(); // Update existing button
      return;
    }

    // Create new button
    this.toolbarButton = document.createElement('button');
    this.toolbarButton.addClass('note-status-toolbar-button', 'clickable-icon', 'view-action');
    this.toolbarButton.setAttribute('aria-label', 'Note status');

    // Update the button state
    this.updateToolbarButton();

    // Add click handler
    this.toolbarButton.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.toggleStatusPopover();
    });

    // Add to toolbar at the beginning
    if (toolbarContainer.firstChild) {
      toolbarContainer.insertBefore(this.toolbarButton, toolbarContainer.firstChild);
    } else {
      toolbarContainer.appendChild(this.toolbarButton);
    }
  }
}