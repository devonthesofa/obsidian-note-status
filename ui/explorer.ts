import { App, TFile } from 'obsidian';
import { FileExplorerView, NoteStatusSettings } from '../models/types';
import { StatusService } from '../services/status-service';

/**
 * Handles file explorer integration for displaying status icons
 */
export class ExplorerIntegration {
	private app: App;
	private settings: NoteStatusSettings;
	private statusService: StatusService;

	constructor(app: App, settings: NoteStatusSettings, statusService: StatusService) {
		this.app = app;
		this.settings = settings;
		this.statusService = statusService;
	}

	/**
	 * Update settings reference
	 */
	public updateSettings(settings: NoteStatusSettings): void {
		this.settings = settings;

		// Update icons based on new settings
		if (settings.showStatusIconsInExplorer) {
			this.updateAllFileExplorerIcons();
		} else {
			this.removeAllFileExplorerIcons();
		}
	}

	/**
	 * Update a single file's icon in the file explorer
	 */
	public updateFileExplorerIcons(file: TFile): void {
		if (!this.settings.showStatusIconsInExplorer || file.extension !== 'md') return;

		const status = this.statusService.getFileStatus(file);
		const fileExplorer = this.app.workspace.getLeavesOfType('file-explorer')[0];

		if (fileExplorer && fileExplorer.view) {
			// Cast fileExplorer.view to FileExplorerView
			const fileExplorerView = fileExplorer.view as FileExplorerView;

			if (fileExplorerView.fileItems) {
				const fileItem = fileExplorerView.fileItems[file.path];

				if (fileItem) {
					const titleEl = fileItem.titleEl || fileItem.selfEl;
					if (titleEl) {
						// Remove existing icon if present
						const existingIcon = titleEl.querySelector('.note-status-icon');
						if (existingIcon) existingIcon.remove();

						// Add new icon
						titleEl.createEl('span', {
							cls: `note-status-icon nav-file-tag status-${status}`,
							text: this.statusService.getStatusIcon(status)
						});
					}
				}
			}
		}
	}

	/**
	 * Update all file icons in the explorer
	 */
	public updateAllFileExplorerIcons(): void {
		// Remove all icons if setting is turned off
		if (!this.settings.showStatusIconsInExplorer) {
			this.removeAllFileExplorerIcons();
			return;
		}

		// Update icons for all markdown files
		const files = this.app.vault.getMarkdownFiles();
		files.forEach(file => this.updateFileExplorerIcons(file));
	}

	/**
	 * Remove all status icons from the file explorer
	 */
	public removeAllFileExplorerIcons(): void {
		const fileExplorer = this.app.workspace.getLeavesOfType('file-explorer')[0];
		if (fileExplorer && fileExplorer.view) {
			// Cast fileExplorer.view to FileExplorerView
			const fileExplorerView = fileExplorer.view as FileExplorerView;

			if (fileExplorerView.fileItems) {
				Object.values(fileExplorerView.fileItems).forEach((fileItem) => {
					const titleEl = fileItem.titleEl || fileItem.selfEl;
					if (titleEl) {
						const existingIcon = titleEl.querySelector('.note-status-icon');
						if (existingIcon) existingIcon.remove();
					}
				});
			}
		}
	}

	/**
	 * Get selected files from the file explorer
	 */
	public getSelectedFiles(): TFile[] {
		const fileExplorer = this.app.workspace.getLeavesOfType('file-explorer')[0];
		if (!fileExplorer || !fileExplorer.view) {
			console.log('File explorer not found or no file items');
			return [];
		}

		const fileExplorerView = fileExplorer.view as FileExplorerView;
		if (!fileExplorerView.fileItems) {
			console.log('No file items found');
			return [];
		}

		const selectedFiles: TFile[] = [];
		Object.entries(fileExplorerView.fileItems).forEach(([_, item]) => {
			if (item.el?.classList.contains('is-selected') && item.file instanceof TFile && item.file.extension === 'md') {
				selectedFiles.push(item.file);
			}
		});

		return selectedFiles;
	}

	/**
	 * Clean up when plugin is unloaded
	 */
	public unload(): void {
		this.removeAllFileExplorerIcons();
	}
}
