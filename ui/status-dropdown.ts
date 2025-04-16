import { MarkdownView, Notice, Editor, Menu, setIcon } from 'obsidian';
import { NoteStatusSettings, Status } from '../models/types';
import { StatusService } from '../services/status-service';

/**
 * Enhanced status dropdown with toolbar integration
 */
export class StatusDropdown {
	private app: any;
	private settings: NoteStatusSettings;
	private statusService: StatusService;
	private dropdownContainer?: HTMLElement;
	private statusChipsContainer?: HTMLElement;
	private currentStatuses: string[] = ['unknown'];
	private statusPopover?: HTMLElement;
	private isPopoverOpen = false;
	private clickOutsideHandler: any;
	private toolbarButtonContainer?: HTMLElement;
	private toolbarButton?: HTMLElement;
	
	// Animation timings
	private readonly ANIMATION_DURATION = 220;

	constructor(app: any, settings: NoteStatusSettings, statusService: StatusService) {
		this.app = app;
		this.settings = settings;
		this.statusService = statusService;
		
		// Bind methods to preserve this context
		this.handleClickOutside = this.handleClickOutside.bind(this);
		
		// Initialize toolbar button after layout is ready
		this.app.workspace.onLayoutReady(() => {
			this.initToolbarButton();
		});
	}
		
	/**
	 * Initialize the toolbar button in the Obsidian ribbon
 	*/
	private initToolbarButton(): void {
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
				this.toggleStatusPopover(this.toolbarButton);
			});
			
			// Add the button to the container
			this.toolbarButtonContainer.appendChild(this.toolbarButton);
			
			// Insert at specific position - before the last element (which is usually the more options button)
			// If there's no children or insertion fails, just append it
			try {
				if (toolbarContainer.children.length > 0) {
					// Insert before the last element (more options button)
					toolbarContainer.insertBefore(
						this.toolbarButtonContainer, 
						toolbarContainer.children[toolbarContainer.children.length - 1]
					);
				} else {
					toolbarContainer.appendChild(this.toolbarButtonContainer);
				}
				
				console.log('Note Status: Toolbar button added successfully');
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
		
		// Clear and render fresh dropdown if it exists
		if (this.dropdownContainer) {
			this.render();
		}
	}

	/**
	 * Updates settings reference
	 */
	public updateSettings(settings: NoteStatusSettings): void {
		this.settings = settings;
		this.updateToolbarButton();
		if (this.dropdownContainer) {
			this.render();
		}
	}

	/**
	 * Render or remove the dropdown based on settings
	 */
	public render(): void {
		// Remove existing popover if open
		if (this.isPopoverOpen) {
			this.closeStatusPopover();
		}
	}

	/**
	 * Toggle the status popover
	 */
	private toggleStatusPopover(targetEl?: HTMLElement): void {
		if (this.isPopoverOpen) {
			this.closeStatusPopover();
		} else {
			this.openStatusPopover(targetEl);
		}
	}

	/**
	 * Open the status selection popover
	 * @param targetEl - The element that triggered the popover (for positioning)
	 */
	private openStatusPopover(targetEl?: HTMLElement): void {
		if (this.isPopoverOpen) {
			this.closeStatusPopover();
			return;
		}
		
		this.isPopoverOpen = true;
		
		// Create popover element
		this.statusPopover = document.createElement('div');
		this.statusPopover.addClass('note-status-popover', 'note-status-toolbar-popover');
		document.body.appendChild(this.statusPopover);
		
		// Create header
		const headerEl = this.statusPopover.createDiv({ cls: 'note-status-popover-header' });
		
		// Title with icon
		const titleEl = headerEl.createDiv({ cls: 'note-status-popover-title' });
		const iconContainer = titleEl.createDiv({ cls: 'note-status-popover-icon' });
		setIcon(iconContainer, 'tag');
		titleEl.createSpan({ text: 'Note Status', cls: 'note-status-popover-label' });
		
		// Current status chips
		const chipsContainer = this.statusPopover.createDiv({ cls: 'note-status-popover-chips' });
		
		// Show 'No status' indicator if no statuses or only unknown status
		if (this.currentStatuses.length === 0 || 
			(this.currentStatuses.length === 1 && this.currentStatuses[0] === 'unknown')) {
			chipsContainer.createDiv({ 
				cls: 'note-status-empty-indicator',
				text: 'No status assigned'
			});
		} else {
			// Add chip for each status
			this.currentStatuses.forEach(status => {
				if (status === 'unknown') return; // Skip unknown status
				
				const statusObj = this.statusService.getAllStatuses().find(s => s.name === status);
				if (!statusObj) return;
				
				const chipEl = chipsContainer.createDiv({ 
					cls: `note-status-chip status-${status}`
				});
				
				// Status icon
				chipEl.createSpan({ 
					text: statusObj.icon,
					cls: 'note-status-chip-icon'
				});
				
				// Status name
				chipEl.createSpan({ 
					text: statusObj.name,
					cls: 'note-status-chip-text' 
				});
				
				// Remove button (only show if multiple statuses allowed)
				if (this.settings.useMultipleStatuses && this.currentStatuses.length > 1) {
					const removeBtn = chipEl.createDiv({ 
						cls: 'note-status-chip-remove',
						attr: {
							'aria-label': `Remove ${status} status`,
							'title': `Remove ${status} status`
						}
					});
					setIcon(removeBtn, 'x');
					
					removeBtn.addEventListener('click', async (e) => {
						e.stopPropagation();
						
						// Add remove animation
						chipEl.addClass('note-status-chip-removing');
						
						// Wait for animation to complete before actually removing
						setTimeout(async () => {
							// Remove this status
							await this.statusService.removeNoteStatus(status);
							
							// Get updated statuses
							const updatedStatuses = this.statusService.getFileStatuses(this.app.workspace.getActiveFile());
							
							// Update current statuses
							this.currentStatuses = updatedStatuses;
							
							// Update toolbar button
							this.updateToolbarButton();
							
							// Refresh chips
							this.openStatusPopover(targetEl);
							
							// Dispatch event for UI update
							window.dispatchEvent(new CustomEvent('note-status:status-changed', {
								detail: { statuses: updatedStatuses }
							}));
						}, 150);
					});
				}
			});
		}
		
		// Create search filter
		const searchContainer = this.statusPopover.createDiv({ cls: 'note-status-popover-search' });
		const searchInput = searchContainer.createEl('input', {
			type: 'text',
			placeholder: 'Filter statuses...',
			cls: 'note-status-popover-search-input'
		});
		
		// Create status options container
		const statusOptionsContainer = this.statusPopover.createDiv({ cls: 'note-status-options-container' });
		
		// Get all available statuses
		const allStatuses = this.statusService.getAllStatuses()
			.filter(status => status.name !== 'unknown');
		
		// Populate status options
		const populateOptions = (filter = '') => {
			statusOptionsContainer.empty();
			
			const filteredStatuses = allStatuses.filter(status => !filter || 
				status.name.toLowerCase().includes(filter.toLowerCase()) ||
				status.icon.includes(filter));
				
			if (filteredStatuses.length === 0) {
				// Show empty state
				statusOptionsContainer.createDiv({
					cls: 'note-status-empty-options',
					text: filter ? `No statuses match "${filter}"` : 'No statuses found'
				});
				return;
			}
			
			filteredStatuses.forEach(status => {
				const isSelected = this.currentStatuses.includes(status.name);
				
				const optionEl = statusOptionsContainer.createDiv({ 
					cls: `note-status-option ${isSelected ? 'is-selected' : ''} status-${status.name}`
				});
				
				// Status icon
				optionEl.createSpan({ 
					text: status.icon,
					cls: 'note-status-option-icon'
				});
				
				// Status name
				optionEl.createSpan({ 
					text: status.name,
					cls: 'note-status-option-text' 
				});
				
				// Check icon for selected status
				if (isSelected) {
					const checkIcon = optionEl.createDiv({ cls: 'note-status-option-check' });
					setIcon(checkIcon, 'check');
				}
				
				// Add click handler
				optionEl.addEventListener('click', async () => {
					const activeFile = this.app.workspace.getActiveFile();
					if (!activeFile) return;
					
					try {
						// Add selection animation
						optionEl.addClass('note-status-option-selecting');
						
						// Apply status changes after brief delay for animation
						setTimeout(async () => {
							if (this.settings.useMultipleStatuses) {
								await this.statusService.toggleNoteStatus(status.name);
							} else {
								await this.statusService.updateNoteStatuses([status.name]);
								// Close popover in single status mode
								this.closeStatusPopover();
							}
							
							// Get fresh status from file
							const freshStatuses = this.statusService.getFileStatuses(activeFile);
							
							// Update current statuses and toolbar button
							this.currentStatuses = [...freshStatuses];
							this.updateToolbarButton();
							
							// Refresh status options if popover still open
							if (this.isPopoverOpen && this.settings.useMultipleStatuses) {
								populateOptions(searchInput.value);
							}
							
							// Dispatch events for UI update
							window.dispatchEvent(new CustomEvent('note-status:status-changed', {
								detail: { statuses: freshStatuses }
							}));
							window.dispatchEvent(new CustomEvent('note-status:refresh-ui'));
						}, 150);
					} catch (error) {
						console.error('Error updating status:', error);
						new Notice('Failed to update status');
					}
				});
			});
		};
		
		// Initial population
		populateOptions();
		
		// Add search functionality
		searchInput.addEventListener('input', () => {
			populateOptions(searchInput.value);
		});
		
		// Position the popover relative to the toolbar button
		this.positionToolbarPopover(targetEl);
		
		// Add animation class
		this.statusPopover.addClass('note-status-popover-animate-in');
		
		// Focus search input
		setTimeout(() => {
			searchInput.focus();
		}, 50);
		
		// Add click outside listener to close popover
		setTimeout(() => {
			this.clickOutsideHandler = this.handleClickOutside;
			document.addEventListener('click', this.clickOutsideHandler);
			
			// Also add escape key listener
			document.addEventListener('keydown', this.handleEscapeKey);
		}, 10);
	}
	
	/**
	 * Position the popover relative to the toolbar button
	 */
	private positionToolbarPopover(targetEl?: HTMLElement): void {
		if (!this.statusPopover || !targetEl) return;
		
		// Reset positioning
		this.statusPopover.style.position = 'fixed';
		this.statusPopover.style.zIndex = '999';
		
		// Get target element's position
		const targetRect = targetEl.getBoundingClientRect();
		
		// Position below the button
		this.statusPopover.style.top = `${targetRect.bottom + 5}px`;
		this.statusPopover.style.right = `${window.innerWidth - targetRect.right}px`;
		
		// Set max height based on viewport
		const maxHeight = window.innerHeight - targetRect.bottom - 40;
		this.statusPopover.style.maxHeight = `${maxHeight}px`;
	}
	
	/**
	 * Handle escape key to close popover
	 */
	private handleEscapeKey = (e: KeyboardEvent) => {
		if (e.key === 'Escape' && this.isPopoverOpen) {
			this.closeStatusPopover();
		}
	};
	
	/**
	 * Handle click outside the popover
	 */
	private handleClickOutside(e: MouseEvent) {
		if (this.statusPopover && !this.statusPopover.contains(e.target as Node) && 
			this.toolbarButton && !this.toolbarButton.contains(e.target as Node)) {
			this.closeStatusPopover();
		}
	}
	
	/**
	 * Close the status selection popover
	 */
	private closeStatusPopover(): void {
		if (!this.statusPopover) return;
		
		// Add exit animation
		this.statusPopover.addClass('note-status-popover-animate-out');
		
		// Clean up event listeners immediately
		document.removeEventListener('click', this.clickOutsideHandler);
		document.removeEventListener('keydown', this.handleEscapeKey);
		
		// Remove after animation completes
		setTimeout(() => {
			if (this.statusPopover) {
				this.statusPopover.remove();
				this.statusPopover = undefined;
				this.isPopoverOpen = false;
			}
		}, this.ANIMATION_DURATION);
	}
	
	/**
	 * Show status dropdown in context menu
	 */
	public showInContextMenu(editor: Editor, view: MarkdownView): void {
		const menu = new Menu();
		const customClass = 'note-status-context-menu';
		// Apply class manually since Menu doesn't have addClass method
		(menu as any).dom?.addClass?.(customClass);
		
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile) return;
		
		const currentStatuses = this.statusService.getFileStatuses(activeFile);
		
		// Add a header item
		menu.addItem((item) => {
			item.setTitle('Change Note Status')
				.setDisabled(true);
			// Apply class manually since MenuItem doesn't have setClass method
			(item as any).dom?.addClass?.('note-status-menu-header');
			return item;
		});

		// Get all available statuses grouped by template
		const allStatuses = this.statusService.getAllStatuses();
		
		// Group statuses by template name if they have one
		const statusesByTemplate: Record<string, Status[]> = { 'Custom': [] };
		
		allStatuses.forEach(status => {
			if (status.name !== 'unknown') {
				// For now, just put all in custom group
				// In a future version, we could implement proper template grouping
				statusesByTemplate['Custom'].push(status);
			}
		});
		
		// Add status options by template
		Object.entries(statusesByTemplate).forEach(([templateName, statuses]) => {
			if (statuses.length === 0) return;
			
			// Add template section
			if (Object.keys(statusesByTemplate).length > 1) {
				menu.addSeparator();
				
				menu.addItem((item) => {
					item.setTitle(templateName)
						.setDisabled(true);
					// Apply class manually since MenuItem doesn't have setClass method
					(item as any).dom?.addClass?.('note-status-menu-section');
					return item;
				});
			}
			
			// Add statuses from this template
			statuses.forEach(status => {
				const isActive = currentStatuses.includes(status.name);
				
				menu.addItem((item) => {
					item.setTitle(`${status.icon} ${status.name}`)
						.setIcon(isActive ? 'check-circle' : 'circle');
					
					// Apply class manually if active
					if (isActive) {
						(item as any).dom?.addClass?.('is-active');
					}
					
					if (this.settings.useMultipleStatuses) {
						// Toggle mode - add checkmark for active statuses
						item.onClick(async () => {
							await this.statusService.toggleNoteStatus(status.name);
							
							// Get updated statuses
							const updatedStatuses = this.statusService.getFileStatuses(activeFile);
							
							// Update current statuses and toolbar button
							this.currentStatuses = updatedStatuses;
							this.updateToolbarButton();
							
							// Dispatch events for UI update
							window.dispatchEvent(new CustomEvent('note-status:status-changed', {
								detail: { statuses: updatedStatuses }
							}));
							window.dispatchEvent(new CustomEvent('note-status:refresh-ui'));
						});
					} else {
						// Single select mode
						item.onClick(async () => {
							await this.statusService.updateNoteStatus(status.name);
							
							// Update current statuses and toolbar button
							this.currentStatuses = [status.name];
							this.updateToolbarButton();
							
							// Dispatch events for UI update
							window.dispatchEvent(new CustomEvent('note-status:status-changed', {
								detail: { statuses: [status.name] }
							}));
							window.dispatchEvent(new CustomEvent('note-status:refresh-ui'));
						});
					}
					
					return item;
				});
			});
		});
		
		// Add separator and additional actions
		menu.addSeparator();
		
		// Add "batch update" option
		menu.addItem((item) => {
			item.setTitle('Batch Update Status...')
				.setIcon('folders')
				.onClick(() => {
					// Dispatch event to open batch modal
					window.dispatchEvent(new CustomEvent('note-status:open-batch-modal'));
				});
			return item;
		});

		// Position menu near cursor
		const cursor = editor.getCursor('to');
		editor.posToOffset(cursor);
		const editorEl = view.contentEl.querySelector('.cm-content');

		if (editorEl) {
			const rect = editorEl.getBoundingClientRect();
			menu.showAtPosition({ x: rect.left + 20, y: rect.top + 40 });
		} else {
			menu.showAtPosition({ x: 0, y: 0 });
		}
	}

	/**
	 * Remove dropdown when plugin is unloaded
	 */
	public unload(): void {
		// Close any open popover
		this.closeStatusPopover();
		
		// Remove toolbar button
		if (this.toolbarButtonContainer) {
			this.toolbarButtonContainer.remove();
			this.toolbarButtonContainer = undefined;
		}
	}
}