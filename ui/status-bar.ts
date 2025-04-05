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
	private currentStatus = 'unknown';

	constructor(statusBarEl: HTMLElement, settings: NoteStatusSettings, statusService: StatusService) {
		this.statusBarEl = statusBarEl;
		this.settings = settings;
		this.statusService = statusService;

		// Add initial class
		this.statusBarEl.addClass('note-status-bar');

		// Add click handler
		this.statusBarEl.addEventListener('click', this.handleClick.bind(this));

		// Initial render
		this.update('unknown');
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
	 * Update the status bar with a new status
	 */
	public update(status: string): void {
		this.currentStatus = status;
		this.render();
	}

	/**
	 * Render the status bar based on current settings and status
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

		// Create status text
		this.statusBarEl.createEl('span', {
			text: `Status: ${this.currentStatus}`,
			cls: `note-status-${this.currentStatus}`
		});

		// Create status icon
		this.statusBarEl.createEl('span', {
			text: this.statusService.getStatusIcon(this.currentStatus),
			cls: `note-status-icon status-${this.currentStatus}`
		});

		// Handle auto-hide behavior
		if (this.settings.autoHideStatusBar && this.currentStatus === 'unknown') {
			this.statusBarEl.addClass('auto-hide');
			setTimeout(() => {
				if (this.currentStatus === 'unknown' && this.settings.showStatusBar) {
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
