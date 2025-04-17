import { MarkdownView, Editor, Notice, TFile } from 'obsidian';
import { NoteStatusSettings } from '../../models/types';
import { StatusService } from '../../services/status-service';
import { StatusDropdownComponent } from './status-dropdown-component';

/**
 * Enhanced status dropdown with toolbar integration
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
    
    // Initialize toolbar button after layout is ready
    this.app.workspace.onLayoutReady(() => {
      this.initToolbarButton();
    });
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
   * Initialize the toolbar button in the Obsidian ribbon
   */
  private initToolbarButton(): void {
    // Clear any existing button
    if (this.toolbarButton) {
      this.toolbarButton.remove();
      this.toolbarButton = undefined;
    }
  
    // Wait for next tick to ensure the UI is fully rendered
    setTimeout(() => {
      const toolbarContainer = this.findToolbarContainer();
      
      if (!toolbarContainer) {
        console.error('Note Status: Could not find toolbar container');
        return;
      }
      this.createToolbarButton(toolbarContainer);
    }, 500); // Waiting 500ms to ensure the UI is ready
  }
  
  /**
   * Find the toolbar container element
   */
  private findToolbarContainer(): HTMLElement | null {
    return document.querySelector('.workspace-leaf .view-header .view-actions')
  }
  
  /**
   * Create the toolbar button element
   */
  private createToolbarButton(toolbarContainer: HTMLElement): void {
    // Create the button element
    this.toolbarButton = document.createElement('button');
    this.toolbarButton.addClass('note-status-toolbar-button', 'clickable-icon', 'view-action');
    this.toolbarButton.setAttribute('aria-label', 'Note Status');
    
    // Update initial button state
    this.updateToolbarButton();
    
    // Add click handler
    this.toolbarButton.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.toggleStatusPopover();
    });
    
	// Insert at a more reliable position - just prepend to the container
	try {
		toolbarContainer.prepend(this.toolbarButton);
	} catch (error) {
		console.error('Note Status: Error inserting toolbar button', error);
		// Fallback - just append it
		toolbarContainer.appendChild(this.toolbarButton);
	}
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
      this.addStatusBadge(badgeContainer);
    } else {
      this.addDefaultStatusIcon(badgeContainer);
    }
    
    this.toolbarButton.appendChild(badgeContainer);
  }
  
  /**
   * Add a status badge to the toolbar button
   */
  private addStatusBadge(container: HTMLElement): void {
    // Show primary status icon and indicator for multiple statuses
    const primaryStatus = this.currentStatuses[0];
    const statusInfo = this.statusService.getAllStatuses().find(s => s.name === primaryStatus);
    
    if (statusInfo) {
      // Primary status icon
      const iconSpan = document.createElement('span');
      iconSpan.addClass(`note-status-toolbar-icon`, `status-${primaryStatus}`);
      iconSpan.textContent = statusInfo.icon;
      container.appendChild(iconSpan);
      
      // Add count indicator if multiple statuses
      if (this.settings.useMultipleStatuses && this.currentStatuses.length > 1) {
        const countBadge = document.createElement('span');
        countBadge.addClass('note-status-count-badge');
        countBadge.textContent = `+${this.currentStatuses.length - 1}`;
        container.appendChild(countBadge);
      }
    }
  }
  
  /**
   * Add default status icon when no valid status
   */
  private addDefaultStatusIcon(container: HTMLElement): void {
    const iconSpan = document.createElement('span');
    iconSpan.addClass('note-status-toolbar-icon', 'status-unknown');
    iconSpan.textContent = '📌'; // Default tag icon
    container.appendChild(iconSpan);
  }

  /**
   * Updates the dropdown UI based on current statuses
   */
  public update(currentStatuses: string[] | string): void {
    // Normalize input to always be an array
    if (typeof currentStatuses === 'string') {
      this.currentStatuses = [currentStatuses];
    } else {
      this.currentStatuses = [...currentStatuses]; // Create a copy to ensure it's updated
    }
    
    // Update toolbar button
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
	
	this.openStatusDropdown({
		editor: editor,
		view: view,
		files: [activeFile]
	});
  }
  
  /**
   * Get position from cursor or fallback positions
   */
  private getCursorPosition(editor: Editor, view: MarkdownView): {x: number, y: number} {
    try {
      // Try to get cursor position
      const cursor = editor.getCursor('head');
      const editorPosition = editor.posToCoords(cursor);
      
      if (editorPosition) {
        return {
          x: editorPosition.left,
          y: editorPosition.top + 20 // Add small offset below cursor
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
   * Create a dummy target element for positioning
   */
  private createDummyTarget(position: {x: number, y: number}): HTMLElement {
    const dummyTarget = document.createElement('div');
    dummyTarget.style.position = 'fixed';
    dummyTarget.style.left = `${position.x}px`;
    dummyTarget.style.top = `${position.y}px`;
    dummyTarget.style.zIndex = '1000';
    document.body.appendChild(dummyTarget);
    return dummyTarget;
  }

  /**
   * Render method (kept for compatibility)
   */
  public render(): void {
    // This is now a no-op, as the dropdown component handles everything internally
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
	 * @param options Configuration options for opening the dropdown
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
		// IMPORTANT: Force reset the dropdown component's state
		// Add this at the beginning of the method
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
		console.log("filesfilesfiles", files)

		// Determine if we're handling single or multiple files
		const isSingleFile = files.length === 1;
		const targetFile = isSingleFile ? files[0] : null;

		// Set target file (if single) or null (if multiple)
		this.dropdownComponent.setTargetFile(targetFile);

		// Get current statuses if single file, or reset to unknown for multiple
		const currentStatuses = targetFile ? 
			this.statusService.getFileStatuses(targetFile) : 
			['unknown'];

		// Update dropdown with current statuses
		this.dropdownComponent.updateStatuses(currentStatuses);

		// Set custom callback for status changes if provided
		if (options.onStatusChange) {
			const originalCallback = this.dropdownComponent.getOnStatusChange();
			this.dropdownComponent.setOnStatusChange(options.onStatusChange);

			// Restore original callback after operation
			setTimeout(() => {
				this.dropdownComponent.setOnStatusChange(originalCallback);
			}, 300);
		} else if (!isSingleFile && options.mode) {
			// Set batch operation callback for multiple files
			this.dropdownComponent.setOnStatusChange(async (statuses) => {
				if (statuses.length > 0) {
					await this.statusService.batchUpdateStatuses(files, statuses, options.mode || 'replace');

					// Dispatch events for UI update
					window.dispatchEvent(new CustomEvent('note-status:batch-update-complete', {
					detail: { 
					statuses,
					fileCount: files.length,
					mode: options.mode
					}
					}));
					window.dispatchEvent(new CustomEvent('note-status:refresh-ui'));
				}
			});
		}

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
			const dummyTarget = document.createElement('div');
			dummyTarget.style.position = 'fixed';
			dummyTarget.style.left = `${options.position.x}px`;
			dummyTarget.style.top = `${options.position.y}px`;
			dummyTarget.style.width = '0';
			dummyTarget.style.height = '0';
			document.body.appendChild(dummyTarget);

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
		const fallbackTarget = document.createElement('div');
		fallbackTarget.style.position = 'fixed';
		fallbackTarget.style.left = `${center.x}px`;
		fallbackTarget.style.top = `${center.y}px`;
		document.body.appendChild(fallbackTarget);

		this.dropdownComponent.open(fallbackTarget, center);

		// Clean up fallback target
		setTimeout(() => {
			if (fallbackTarget.parentNode) {
				fallbackTarget.parentNode.removeChild(fallbackTarget);
			}
		}, 100);
	}

}