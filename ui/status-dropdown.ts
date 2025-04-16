import { MarkdownView, Notice, Editor, Menu, setIcon } from 'obsidian';
import { NoteStatusSettings, Status } from '../models/types';
import { StatusService } from '../services/status-service';

/**
 * Enhanced status dropdown with improved UI/UX and touch support
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
	
	// Animation timings
	private readonly ANIMATION_DURATION = 220;

	constructor(app: any, settings: NoteStatusSettings, statusService: StatusService) {
		this.app = app;
		this.settings = settings;
		this.statusService = statusService;
		
		// Bind methods to preserve this context
		this.handleClickOutside = this.handleClickOutside.bind(this);
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
		
		// Clear and render fresh dropdown - force a complete UI rebuild
		this.render();
	}

	/**
	 * Updates settings reference
	 */
	public updateSettings(settings: NoteStatusSettings): void {
		this.settings = settings;
		this.render();
	}

	/**
	 * Render or remove the dropdown based on settings
	 */
	public render(): void {
		// Get current active view
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		
		// Find all existing dropdowns and remove them
		document.querySelectorAll('.note-status-dropdown').forEach(el => el.remove());
		this.dropdownContainer = undefined;
		
		// If setting is turned off or no active markdown view, don't render
		if (!this.settings.showStatusDropdown || !view) {
			return;
		}

		// Get container for the dropdown
		const contentEl = view.contentEl;
		
		// Create new dropdown container
		const dropdownEl = document.createElement('div');
		dropdownEl.addClass('note-status-dropdown', this.settings.dropdownPosition);
		
		// Add animation class
		dropdownEl.addClass('note-status-animate-in');
		
		// Insert at correct position
		if (this.settings.dropdownPosition === 'top') {
			contentEl.insertBefore(dropdownEl, contentEl.firstChild);
		} else {
			contentEl.appendChild(dropdownEl);
		}

		// Store reference
		this.dropdownContainer = dropdownEl;

		// Create header with label and toggle button
		this.createDropdownHeader();
		
		// Create chips display for current statuses
		this.createStatusChips();
		
		// Add "Add Status" button that shows popover
		this.createAddStatusButton();
		
		// Remove animation class after animation completes
		setTimeout(() => {
			dropdownEl.removeClass('note-status-animate-in');
		}, this.ANIMATION_DURATION);
	}

	/**
	 * Create the dropdown header with label and control buttons
	 */
	private createDropdownHeader(): void {
		if (!this.dropdownContainer) return;
		
		const headerEl = this.dropdownContainer.createDiv({ cls: 'note-status-dropdown-header' });
		
		// Create title with icon
		const titleEl = headerEl.createDiv({ cls: 'note-status-dropdown-title' });
		const iconContainer = titleEl.createDiv({ cls: 'note-status-dropdown-icon' });
		setIcon(iconContainer, 'tag');
		titleEl.createSpan({ text: 'Note Status', cls: 'note-status-dropdown-label' });
		
		// Add action buttons
		const actionsEl = headerEl.createDiv({ cls: 'note-status-dropdown-actions' });
		
		// Toggle multi/single mode button
		const toggleModeButton = actionsEl.createEl('button', {
			cls: 'note-status-action-button',
			attr: {
				'aria-label': this.settings.useMultipleStatuses ? 'Switch to single status mode' : 'Switch to multiple statuses mode',
				'title': this.settings.useMultipleStatuses ? 'Switch to single status mode' : 'Switch to multiple statuses mode'
			}
		});
		setIcon(toggleModeButton, this.settings.useMultipleStatuses ? 'list-minus' : 'list-plus');
		
		toggleModeButton.addEventListener('click', async (e) => {
			e.stopPropagation();
			
			// Add animation
			toggleModeButton.addClass('note-status-button-active');
			
			// Update setting
			this.settings.useMultipleStatuses = !this.settings.useMultipleStatuses;
			
			// Trigger settings save
			window.dispatchEvent(new CustomEvent('note-status:settings-changed'));
			
			// Re-render the dropdown
			setTimeout(() => {
				this.render();
				new Notice(`Switched to ${this.settings.useMultipleStatuses ? 'multiple' : 'single'} status mode`);
			}, 150);
		});
		
		// Close button
		const closeButton = actionsEl.createEl('button', {
			cls: 'note-status-action-button',
			attr: {
				'aria-label': 'Hide status bar',
				'title': 'Hide status bar'
			}
		});
		setIcon(closeButton, 'x');
		
		closeButton.addEventListener('click', (e) => {
			e.stopPropagation();
			
			// Add animation
			this.dropdownContainer?.addClass('note-status-animate-out');
			
			setTimeout(() => {
				this.settings.showStatusDropdown = false;
				this.render();
				
				// Trigger settings save
				window.dispatchEvent(new CustomEvent('note-status:settings-changed'));
				
				new Notice('Status dropdown hidden');
			}, this.ANIMATION_DURATION);
		});
	}

	/**
	 * Create the chips display for current statuses
	 */
	private createStatusChips(): void {
		if (!this.dropdownContainer) return;
    
		// Make sure previous container is removed
		if (this.statusChipsContainer) {
			this.statusChipsContainer.remove();
		}
		
		// Create container for status chips
		this.statusChipsContainer = this.dropdownContainer.createDiv({
			cls: 'note-status-chips-container'
		});
		
		// Show 'No status' indicator if no statuses or only unknown status
		if (this.currentStatuses.length === 0 || 
			(this.currentStatuses.length === 1 && this.currentStatuses[0] === 'unknown')) {
			if (this.statusChipsContainer) {
				this.statusChipsContainer.createDiv({ 
					cls: 'note-status-empty-indicator',
					text: 'No status assigned'
				});
			}
			return;
		}
		
		// Add chip for each status
		if (this.statusChipsContainer) {
			this.currentStatuses.forEach(status => {
				if (status === 'unknown') return; // Skip unknown status
				
				const statusObj = this.statusService.getAllStatuses().find(s => s.name === status);
				if (!statusObj) return;
				if (!this.statusChipsContainer) return;
				
				const chipEl = this.statusChipsContainer.createDiv({ 
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
							
							// Dispatch event for UI update
							window.dispatchEvent(new CustomEvent('note-status:status-changed', {
								detail: { statuses: updatedStatuses }
							}));
						}, 150);
					});
				}
				
				// Make the whole chip clickable if in single status mode
				if (!this.settings.useMultipleStatuses) {
					chipEl.addClass('clickable');
					chipEl.addEventListener('click', (e) => {
						this.openStatusPopover(chipEl);
					});
				}
			});
		}
	}

	/**
	 * Create the add status button
	 */
	private createAddStatusButton(): void {
		if (!this.dropdownContainer) return;
		
		// Only show add button if using multiple statuses or no status is set
		if (!this.settings.useMultipleStatuses && 
			this.currentStatuses.length > 0 && 
			this.currentStatuses[0] !== 'unknown') {
			return;
		}
		
		const addButton = this.dropdownContainer.createDiv({ 
			cls: 'note-status-add-button',
			attr: {
				'aria-label': 'Add status',
				'title': 'Add status'
			}
		});
		
		const iconContainer = addButton.createSpan({ cls: 'note-status-add-icon' });
		setIcon(iconContainer, 'plus-circle');
		addButton.createSpan({ text: 'Add status', cls: 'note-status-add-text' });
		
		// Add click handler to open status popover
		addButton.addEventListener('click', (e) => {
			this.openStatusPopover(addButton);
		});
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
		if (!this.dropdownContainer) return;
		
		this.statusPopover = this.dropdownContainer.createDiv({ cls: 'note-status-popover' });
		
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
						
						// First close the popover if in single status mode to improve perceived performance
						if (!this.settings.useMultipleStatuses) {
							this.closeStatusPopover();
						}
						
						// Apply status changes after brief delay for animation
						setTimeout(async () => {
							if (this.settings.useMultipleStatuses) {
								await this.statusService.toggleNoteStatus(status.name);
							} else {
								await this.statusService.updateNoteStatuses([status.name]);
							}
							
							// Get fresh status from file
							const freshStatuses = this.statusService.getFileStatuses(activeFile);
							
							// Force-update both the current instance and trigger global update
							// Update dropdown display first
							this.currentStatuses = [...freshStatuses];
							this.render();
							
							// Then notify other components like status bar
							window.dispatchEvent(new CustomEvent('note-status:status-changed', {
								detail: { statuses: freshStatuses }
							}));
							
							// Also dispatch the refresh-ui event to update the status panel
							window.dispatchEvent(new CustomEvent('note-status:refresh-ui'));
							
							// Keep popover open for multi-select mode
							if (this.settings.useMultipleStatuses) {
								// Re-open the popover to maintain multi-select mode
								setTimeout(() => {
									this.openStatusPopover(targetEl);
								}, 10);
							}
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
		
		// Position the popover relative to the target element
		this.positionPopover(targetEl);
		
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
	 * Position the popover relative to the target element
	 */
	private positionPopover(targetEl?: HTMLElement): void {
		if (!this.statusPopover || !this.dropdownContainer) return;
		
		// Reset positioning
		this.statusPopover.style.position = 'absolute';
		this.statusPopover.style.top = '';
		this.statusPopover.style.bottom = '';
		this.statusPopover.style.left = '';
		this.statusPopover.style.right = '';
		this.statusPopover.style.transform = '';
		
		if (targetEl) {
			// Get target element's position
			const targetRect = targetEl.getBoundingClientRect();
			const containerRect = this.dropdownContainer.getBoundingClientRect();
			
			// Calculate popover position relative to the dropdown container
			const top = targetRect.bottom - containerRect.top;
			const left = targetRect.left - containerRect.left;
			
			// Position popover above or below target element based on available space
			const viewportHeight = window.innerHeight;
			const spaceBelow = viewportHeight - targetRect.bottom;
			const availableStatuses = this.statusService.getAllStatuses().filter(s => s.name !== 'unknown');
			const popoverHeight = Math.min(300, availableStatuses.length * 40 + 60); // Estimate popover height
			
			if (spaceBelow < popoverHeight && targetRect.top > popoverHeight) {
				// Position above if not enough space below but enough space above
				this.statusPopover.style.bottom = `${containerRect.bottom - targetRect.top}px`;
				this.statusPopover.style.maxHeight = `${targetRect.top - 20}px`;
				this.statusPopover.classList.add('popover-top');
				this.statusPopover.classList.remove('popover-bottom');
			} else {
				// Position below (default)
				this.statusPopover.style.top = `${top}px`;
				this.statusPopover.style.maxHeight = `${viewportHeight - targetRect.bottom - 20}px`;
				this.statusPopover.classList.add('popover-bottom');
				this.statusPopover.classList.remove('popover-top');
			}
			
			// Center horizontally relative to target
			const targetWidth = targetRect.width;
			const popoverWidth = Math.min(250, targetWidth * 1.5);
			this.statusPopover.style.width = `${popoverWidth}px`;
			this.statusPopover.style.left = `${left + (targetWidth / 2) - (popoverWidth / 2)}px`;
			
			// Ensure popover doesn't go out of container bounds
			const leftBound = parseInt(this.statusPopover.style.left);
			if (leftBound < 10) {
				this.statusPopover.style.left = '10px';
			} else if (leftBound + popoverWidth > containerRect.width - 10) {
				this.statusPopover.style.left = `${containerRect.width - popoverWidth - 10}px`;
			}
		} else {
			// Default positioning if no target element
			this.statusPopover.style.top = '100%';
			this.statusPopover.style.left = '50%';
			this.statusPopover.style.transform = 'translateX(-50%)';
			this.statusPopover.style.width = '250px';
			this.statusPopover.classList.add('popover-bottom');
		}
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
		if (this.statusPopover && !this.statusPopover.contains(e.target as Node)) {
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
		if (this.dropdownContainer) {
			this.dropdownContainer.remove();
			this.dropdownContainer = undefined;
		}
		
		// Remove any popover and event listeners
		this.closeStatusPopover();
	}
}