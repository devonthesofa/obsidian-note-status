import { Notice } from 'obsidian';
import { NoteStatusSettings } from '../models/types';
import { StatusService } from '../services/status-service';

/**
 * Handles the status bar functionality
 */
export class StatusBar {
	private statusBarEl: HTMLElement;
	private settings: NoteStatusSettings;
	private statusService: StatusService;
	private currentStatuses: string[] = ['unknown'];

	constructor(statusBarEl: HTMLElement, settings: NoteStatusSettings, statusService: StatusService) {
		this.statusBarEl = statusBarEl;
		this.settings = settings;
		this.statusService = statusService;

		// Add initial class
		this.statusBarEl.addClass('note-status-bar');

		// Add click handler
		this.statusBarEl.addEventListener('click', this.handleClick.bind(this));

		// Initial render
		this.update(['unknown']);
	}

	/**
	 * Handle click on status bar
	 */
	private handleClick(): void {
		this.settings.showStatusDropdown = !this.settings.showStatusDropdown;

		// Notify UI listeners through an event
		window.dispatchEvent(new CustomEvent('note-status:refresh-dropdown'));

		new Notice(`Status dropdown ${this.settings.showStatusDropdown ? 'shown' : 'hidden'}`);
	}

	/**
	 * Update the status bar with new statuses
	 */
	public update(statuses: string[]): void {
		this.currentStatuses = statuses;
		this.render();
	}

	/**
	 * Render the status bar based on current settings and statuses
	 */
	public render(): void {
		this.statusBarEl.empty();
		this.statusBarEl.removeClass('left', 'hidden', 'auto-hide', 'visible');
		this.statusBarEl.addClass('note-status-bar');

		if (!this.settings.showStatusBar) {
			this.statusBarEl.addClass('hidden');
			return;
		}

		// Add left class if needed
		if (this.settings.statusBarPosition === 'left') {
			this.statusBarEl.addClass('left');
		}
		
		// Handle single vs. multiple status display
		if (this.currentStatuses.length === 1 || !this.settings.useMultipleStatuses) {
			// Display single status
			const primaryStatus = this.currentStatuses[0];
			
			// Create status text
			this.statusBarEl.createEl('span', {
				text: `Status: ${primaryStatus}`,
				cls: `note-status-${primaryStatus}`
			});

			// Create status icon
			this.statusBarEl.createEl('span', {
				text: this.statusService.getStatusIcon(primaryStatus),
				cls: `note-status-icon status-${primaryStatus}`
			});
		} else {
			// Display multiple statuses
			// Create status text
			this.statusBarEl.createEl('span', {
				text: `Statuses: `,
				cls: 'note-status-label'
			});
			
			// Create container for status badges
			const badgesContainer = this.statusBarEl.createEl('span', {
				cls: 'note-status-badges'
			});
			
			// Add status badges
			this.currentStatuses.forEach(status => {
				const badge = badgesContainer.createEl('span', {
					cls: `note-status-badge status-${status}`
				});
				
				badge.createEl('span', {
					text: this.statusService.getStatusIcon(status),
					cls: 'note-status-badge-icon'
				});
				
				badge.createEl('span', {
					text: status,
					cls: 'note-status-badge-text'
				});
			});
		}

		// Handle auto-hide behavior
		const onlyUnknown = this.currentStatuses.length === 1 && this.currentStatuses[0] === 'unknown';
		if (this.settings.autoHideStatusBar && onlyUnknown) {
			this.statusBarEl.addClass('auto-hide');
			setTimeout(() => {
				if (onlyUnknown && this.settings.showStatusBar) {
					this.statusBarEl.addClass('hidden');
				}
			}, 500);
		} else {
			this.statusBarEl.addClass('visible');
		}
	}

	/**
	 * Update settings reference
	 */
	public updateSettings(settings: NoteStatusSettings): void {
		this.settings = settings;
		this.render();
	}

	/**
	 * Clean up when plugin is unloaded
	 */
	public unload(): void {
		// Clean up any event listeners or DOM elements
		this.statusBarEl.empty();
	}
}