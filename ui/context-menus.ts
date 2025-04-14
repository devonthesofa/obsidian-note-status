import { App, Menu, TFile } from 'obsidian';
import { NoteStatusSettings } from '../models/types';
import { StatusService } from '../services/status-service';

/**
 * Handles context menu interactions for status changes
 */
export class StatusContextMenu {
	private settings: NoteStatusSettings;
	private statusService: StatusService;
	public app: App;

	constructor(app: App, settings: NoteStatusSettings, statusService: StatusService) {
		this.app = app;
		this.settings = settings;
		this.statusService = statusService;
	}

	/**
	 * Updates settings reference
	 */
	public updateSettings(settings: NoteStatusSettings): void {
		this.settings = settings;
	}

	/**
	 * Shows the context menu for changing a status of one or more files
	 */
	public showForFiles(files: TFile[], position?: { x: number; y: number }): void {
		const menu = new Menu();

		// Get all available statuses (from custom statuses and enabled templates)
		const allStatuses = this.statusService.getAllStatuses();

		// Add status options to menu
		allStatuses
			.filter(status => status.name !== 'unknown')
			.forEach(status => {
				menu.addItem((item) =>
					item
						.setTitle(`${status.name} ${status.icon}`)
						.setIcon('tag')
						.onClick(async () => {
							await this.statusService.batchUpdateStatus(files, status.name);

							// Dispatch event for UI update
							window.dispatchEvent(new CustomEvent('note-status:refresh-ui'));
						})
				);
			});

		// Show the menu
		if (position) {
			menu.showAtPosition(position);
		} else {
			// Use a default position at mouse event
			menu.showAtMouseEvent(new MouseEvent('contextmenu'));
		}
	}

	/**
	 * Shows a context menu for a single file
	 */
	public showForFile(file: TFile, event: MouseEvent): void {
		const menu = new Menu();

		// Add status change options
		menu.addItem((item) =>
			item.setTitle('Change Status')
				.setIcon('tag')
				.onClick(() => {
					this.showForFiles([file]);
				})
		);

		// Add other file options
		// Example: Open in new tab
		menu.addItem((item) =>
			item.setTitle('Open in New Tab')
				.setIcon('lucide-external-link')
				.onClick(() => {
					this.app.workspace.openLinkText(file.path, file.path, 'tab');
				})
		);

		menu.showAtMouseEvent(event);
	}
}