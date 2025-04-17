import { App, Menu, TFile } from 'obsidian';
import { NoteStatusSettings } from '../models/types';
import { StatusService } from '../services/status-service';
import { StatusDropdownComponent } from './status-dropdown-component';

/**
 * Handles context menu interactions for status changes
 */
export class StatusContextMenu {
	private settings: NoteStatusSettings;
	private statusService: StatusService;
	public app: App;
	private dropdownComponent: StatusDropdownComponent;

	constructor(app: App, settings: NoteStatusSettings, statusService: StatusService) {
		this.app = app;
		this.settings = settings;
		this.statusService = statusService;
		this.dropdownComponent = new StatusDropdownComponent(app, statusService, settings);
		
					// Set up the callback to handle status changes
		this.dropdownComponent.setOnStatusChange((statuses) => {
			// Notify UI of status changes
			window.dispatchEvent(new CustomEvent('note-status:status-changed', {
				detail: { statuses }
			}));
			
			// Force a full UI refresh to ensure all elements are updated
			window.dispatchEvent(new CustomEvent('note-status:force-refresh'));
			
			// Also trigger explorer update specifically
			setTimeout(() => {
				window.dispatchEvent(new CustomEvent('note-status:refresh-ui'));
			}, 50);
		});
	}

	/**
	 * Updates settings reference
	 */
	public updateSettings(settings: NoteStatusSettings): void {
		this.settings = settings;
		this.dropdownComponent.updateSettings(settings);
	}

	/**
	 * Shows the context menu for changing a status of one or more files
	 */
	public showForFiles(files: TFile[], position?: { x: number; y: number }): void {
		if (files.length === 0) return;
		
		// For single file, we can show the dropdown directly without menu
		if (files.length === 1) {
			const targetFile = files[0];
			// Get the current statuses for this file
			const currentStatuses = this.statusService.getFileStatuses(targetFile);
			
			// Create a dummy target element for dropdown positioning
			const dummyTarget = document.createElement('div');
			if (position) {
				dummyTarget.style.position = 'fixed';
				dummyTarget.style.left = `${position.x}px`;
				dummyTarget.style.top = `${position.y}px`;
				dummyTarget.style.width = '0';
				dummyTarget.style.height = '0';
				document.body.appendChild(dummyTarget);
			}
			
			// Set the target file for the dropdown to update
			this.dropdownComponent.setTargetFile(targetFile);
			
			// Update dropdown with current statuses
			this.dropdownComponent.updateStatuses(currentStatuses);
			
			// Show the dropdown
			if (position) {
				this.dropdownComponent.open(dummyTarget, position);
			} else {
				// If no position, use screen center
				const center = {
					x: window.innerWidth / 2,
					y: window.innerHeight / 2
				};
				this.dropdownComponent.open(dummyTarget, center);
			}
			
			// Clean up dummy target after dropdown is shown
			setTimeout(() => {
				if (dummyTarget.parentNode) {
					dummyTarget.parentNode.removeChild(dummyTarget);
				}
			}, 100);
			
			return;
		}
		
		// For multiple files, show a menu first with options for batch actions
		const menu = new Menu();
		menu.addClass('note-status-batch-menu');
		
		// Add title section
		menu.addItem((item) => {
			item.setTitle(`Update ${files.length} files`)
				.setDisabled(true);
			return item;
		});

		// Add "Replace with status" option
		menu.addItem((item) => 
			item
				.setTitle('Replace with status...')
				.setIcon('tag')
				.onClick(() => {
					// Create dummy element for positioning
					const dummyTarget = document.createElement('div');
					if (position) {
						dummyTarget.style.position = 'fixed';
						dummyTarget.style.left = `${position.x}px`;
						dummyTarget.style.top = `${position.y}px`;
						document.body.appendChild(dummyTarget);
					}
					
					// Clear target file since we're handling multiple
					this.dropdownComponent.setTargetFile(null);
					
					// Set up callback for multiple files
					this.dropdownComponent.setOnStatusChange(async (statuses) => {
						if (statuses.length > 0) {
							// Batch update all files with the selected statuses
							await this.statusService.batchUpdateStatuses(files, statuses, 'replace');
							
							// Dispatch events for UI update
							window.dispatchEvent(new CustomEvent('note-status:batch-update-complete', {
								detail: { 
									statuses,
									fileCount: files.length,
									mode: 'replace'
								}
							}));
							window.dispatchEvent(new CustomEvent('note-status:refresh-ui'));
						}
					});
					
					// Reset to unknown status for selection
					this.dropdownComponent.updateStatuses(['unknown']);
					
					// Show the dropdown
					if (position) {
						this.dropdownComponent.open(dummyTarget, position);
					} else {
						const center = {
							x: window.innerWidth / 2,
							y: window.innerHeight / 2
						};
						this.dropdownComponent.open(dummyTarget, center);
					}
					
					// Clean up dummy target
					setTimeout(() => {
						if (dummyTarget.parentNode) {
							dummyTarget.parentNode.removeChild(dummyTarget);
						}
					}, 100);
				})
		);

		// Add "Add status" option (only for multiple status mode)
		if (this.settings.useMultipleStatuses) {
			menu.addItem((item) => 
				item
					.setTitle('Add status...')
					.setIcon('plus')
					.onClick(() => {
						// Create dummy element for positioning
						const dummyTarget = document.createElement('div');
						if (position) {
							dummyTarget.style.position = 'fixed';
							dummyTarget.style.left = `${position.x}px`;
							dummyTarget.style.top = `${position.y}px`;
							document.body.appendChild(dummyTarget);
						}
						
						// Clear target file since we're handling multiple
						this.dropdownComponent.setTargetFile(null);
						
						// Set up callback for batch add
						this.dropdownComponent.setOnStatusChange(async (statuses) => {
							if (statuses.length > 0) {
								// We'll use the explicitly selected status for the add operation
								// Get only the newly selected status
								const statusToAdd = statuses[0]; // Use the first selected status
								
								if (statusToAdd && statusToAdd !== 'unknown') {
									// Add this status to all files
									for (const file of files) {
										await this.statusService.addNoteStatus(statusToAdd, file);
									}
									
									// Dispatch events for UI update
									window.dispatchEvent(new CustomEvent('note-status:batch-update-complete', {
										detail: { 
											statuses: [statusToAdd],
											fileCount: files.length,
											mode: 'add'
										}
									}));
									window.dispatchEvent(new CustomEvent('note-status:refresh-ui'));
								}
							}
						});
						
						// Reset to unknown status for selection
						this.dropdownComponent.updateStatuses(['unknown']);
						
						// Show the dropdown
						if (position) {
							this.dropdownComponent.open(dummyTarget, position);
						} else {
							const center = {
								x: window.innerWidth / 2,
								y: window.innerHeight / 2
							};
							this.dropdownComponent.open(dummyTarget, center);
						}
						
						// Clean up dummy target
						setTimeout(() => {
							if (dummyTarget.parentNode) {
								dummyTarget.parentNode.removeChild(dummyTarget);
							}
						}, 100);
					})
			);
		}
		
		// Add option to open the batch modal for more advanced options
		menu.addItem((item) => 
			item
				.setTitle('Open batch update modal...')
				.setIcon('lucide-edit')
				.onClick(() => {
					window.dispatchEvent(new CustomEvent('note-status:open-batch-modal'));
				})
		);

		// Show the menu
		if (position) {
			menu.showAtPosition(position);
		} else {
			menu.showAtMouseEvent(new MouseEvent('contextmenu'));
		}
	}

	/**
	 * Shows a context menu for a single file
	 */
	public showForFile(file: TFile, event: MouseEvent): void {
		// Create position from event
		const position = { x: event.clientX, y: event.clientY };
		
		// Modify the onStatusChange callback specifically for this file
		const originalCallback = this.dropdownComponent.getOnStatusChange();
		
		// Set a custom callback for this specific file operation
		this.dropdownComponent.setOnStatusChange(async (statuses) => {
			if (statuses.length > 0) {
				// Update the file with the selected status
				if (this.settings.useMultipleStatuses) {
					// If the status is already applied, toggle it off
					const currentStatuses = this.statusService.getFileStatuses(file);
					if (currentStatuses.includes(statuses[0])) {
						await this.statusService.removeNoteStatus(statuses[0], file);
					} else {
						// Add the status
						await this.statusService.addNoteStatus(statuses[0], file);
					}
				} else {
					// Replace with the single status
					await this.statusService.updateNoteStatuses([statuses[0]], file);
				}
				
				// Force explorer icon update for this specific file
				this.app.metadataCache.trigger('changed', file);
				
				// Directly update the explorer icon
				setTimeout(() => {
					const explorerIntegration = (this.app as any).plugins.plugins['note-status']?.explorerIntegration;
					if (explorerIntegration) {
						explorerIntegration.updateFileExplorerIcons(file);
					}
				}, 50);
				
				// Dispatch events to update other UI components
				window.dispatchEvent(new CustomEvent('note-status:status-changed', {
					detail: { statuses, file: file.path }
				}));
				
				window.dispatchEvent(new CustomEvent('note-status:refresh-ui'));
				
				// Force a full UI refresh to ensure all elements are updated
				setTimeout(() => {
					window.dispatchEvent(new CustomEvent('note-status:force-refresh'));
				}, 100);
			}
		});
		
		// Show the dropdown
		this.showForFiles([file], position);
		
		// Restore the original callback after a delay
		setTimeout(() => {
			this.dropdownComponent.setOnStatusChange(originalCallback);
		}, 300);
	}
	
	/**
	 * Clean up resources
	 */
	public dispose(): void {
		this.dropdownComponent.dispose();
	}
}