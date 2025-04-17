import { MarkdownView, Editor, setIcon } from 'obsidian';
import { NoteStatusSettings } from '../models/types';
import { StatusService } from '../services/status-service';
import { StatusDropdownComponent } from './status-dropdown-component';

/**
 * Enhanced status dropdown with toolbar integration
 */
export class StatusDropdown {
	private app: any;
	private settings: NoteStatusSettings;
	private statusService: StatusService;
	private currentStatuses: string[] = ['unknown'];
	private toolbarButtonContainer?: HTMLElement;
	private toolbarButton?: HTMLElement;
	private dropdownComponent: StatusDropdownComponent;
	
	constructor(app: any, settings: NoteStatusSettings, statusService: StatusService) {
		this.app = app;
		this.settings = settings;
		this.statusService = statusService;
		
		// Initialize the dropdown component
		this.dropdownComponent = new StatusDropdownComponent(app, statusService, settings);
		
		// Configure dropdown component callbacks
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
		
		// Initialize toolbar button after layout is ready
		this.app.workspace.onLayoutReady(() => {
			this.initToolbarButton();
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
		if (this.toolbarButtonContainer) {
			this.toolbarButtonContainer.remove();
			this.toolbarButtonContainer = undefined;
		}
	
		// Wait for next tick to ensure the UI is fully rendered
		setTimeout(() => {
			// Try different selectors to find the toolbar
			const toolbarContainer = document.querySelector('.view-header-actions') || 
									document.querySelector('.view-actions') || 
									document.querySelector('.workspace-ribbon.mod-right');
									
			if (!toolbarContainer) {
				console.error('Note Status: Could not find toolbar container');
				return;
			}
			
			// Create button container for proper positioning
			this.toolbarButtonContainer = document.createElement('div');
			this.toolbarButtonContainer.addClass('note-status-toolbar-button-container');
			
			// Create the button element
			this.toolbarButton = document.createElement('button');
			this.toolbarButton.addClass('note-status-toolbar-button', 'clickable-icon');
			this.toolbarButton.setAttribute('aria-label', 'Note Status');
			
			// Update initial button state
			this.updateToolbarButton();
			
			// Add click handler
			this.toolbarButton.addEventListener('click', (e) => {
				e.stopPropagation();
				e.preventDefault();
				this.toggleStatusPopover();
			});
			
			// Add the button to the container
			this.toolbarButtonContainer.appendChild(this.toolbarButton);
			
			// Insert at a more reliable position - just prepend to the container
			try {
				toolbarContainer.prepend(this.toolbarButtonContainer);
			} catch (error) {
				console.error('Note Status: Error inserting toolbar button', error);
				// Fallback - just append it
				toolbarContainer.appendChild(this.toolbarButtonContainer);
			}
		}, 500); // Waiting 500ms to ensure the UI is ready
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
			// Show primary status icon and indicator for multiple statuses
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
			// Show default status icon
			const iconSpan = document.createElement('span');
			iconSpan.addClass('note-status-toolbar-icon', 'status-unknown');
			iconSpan.textContent = '📌'; // Default tag icon
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
		// Get the active file first
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) return;
		
		// Set the target file for the dropdown component
		this.dropdownComponent.setTargetFile(activeFile);
		
		// Get current statuses
		const currentStatuses = this.statusService.getFileStatuses(activeFile);
		this.dropdownComponent.updateStatuses(currentStatuses);
		
		// Create a position below the toolbar button
		if (this.toolbarButton) {
			const rect = this.toolbarButton.getBoundingClientRect();
			const position = { 
			x: rect.left, 
			y: rect.bottom + 5 
			};
			
			// Force open the dropdown with explicit position
			this.dropdownComponent.open(this.toolbarButton, position);
		}
	}

	/**
	 * Show status dropdown in context menu
	 */
	public showInContextMenu(editor: Editor, view: MarkdownView): void {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) return;
		
		// For editor context menu, use cursor position if possible
		let position: {x: number, y: number};
		
		try {
			// Try to get cursor position
			const cursor = editor.getCursor('head');
			const editorPosition = editor.posToCoords(cursor);
			
			if (editorPosition) {
				position = {
					x: editorPosition.left,
					y: editorPosition.top + 20 // Add small offset below cursor
				};
			} else {
				// If can't get cursor position, use editor element position
				const editorEl = view.contentEl.querySelector('.cm-editor');
				if (editorEl) {
					const rect = editorEl.getBoundingClientRect();
					position = {
						x: rect.left + 100, // Offset from left
						y: rect.top + 100   // Offset from top
					};
				} else {
					// Last resort - use middle of viewport
					position = {
						x: window.innerWidth / 2,
						y: window.innerHeight / 3
					};
				}
			}
		} catch (error) {
			console.error('Error getting position for dropdown:', error);
			// Fallback to center of screen
			position = {
				x: window.innerWidth / 2,
				y: window.innerHeight / 3
			};
		}
		
		// Create a dummy target element for positioning
		const dummyTarget = document.createElement('div');
		dummyTarget.style.position = 'fixed';
		dummyTarget.style.left = `${position.x}px`;
		dummyTarget.style.top = `${position.y}px`;
		dummyTarget.style.zIndex = '1000';
		document.body.appendChild(dummyTarget);
		
		// Set the active file as the target for the dropdown
		this.dropdownComponent.setTargetFile(activeFile);
		
		// Get current statuses for this file
		const currentStatuses = this.statusService.getFileStatuses(activeFile);
		
		// Update dropdown with current statuses
		this.dropdownComponent.updateStatuses(currentStatuses);
		
		// Show dropdown at the calculated position
		this.dropdownComponent.open(dummyTarget, position);
		
		// Clean up dummy target after dropdown is shown
		setTimeout(() => {
			if (dummyTarget.parentNode) {
				dummyTarget.parentNode.removeChild(dummyTarget);
			}
		}, 100);
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
		if (this.toolbarButtonContainer) {
			this.toolbarButtonContainer.remove();
			this.toolbarButtonContainer = undefined;
		}
	}
}