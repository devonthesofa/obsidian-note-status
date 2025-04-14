import { MarkdownView, Notice, Editor, Menu } from 'obsidian';
import { NoteStatusSettings } from '../models/types';
import { StatusService } from '../services/status-service';

/**
 * Handles the status dropdown functionality
 */
export class StatusDropdown {
	private app: any;
	private settings: NoteStatusSettings;
	private statusService: StatusService;
	private dropdownContainer?: HTMLElement;
	private currentStatus = 'unknown';

	constructor(app: any, settings: NoteStatusSettings, statusService: StatusService) {
		this.app = app;
		this.settings = settings;
		this.statusService = statusService;
	}

	/**
	 * Updates the dropdown UI based on current settings
	 */
	public update(currentStatus: string): void {
		this.currentStatus = currentStatus;
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
		// Remove existing dropdown if setting is turned off
		if (!this.settings.showStatusDropdown) {
			if (this.dropdownContainer) {
				this.dropdownContainer.remove();
				this.dropdownContainer = undefined;
			}
			return;
		}

		// Check for active markdown view
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) {
			if (this.dropdownContainer) {
				this.dropdownContainer.remove();
				this.dropdownContainer = undefined;
			}
			return;
		}

		// Create or update the dropdown container
		const contentEl = view.contentEl;
		if (!this.dropdownContainer) {
			this.dropdownContainer = this.settings.dropdownPosition === 'top'
				? contentEl.insertBefore(document.createElement('div'), contentEl.firstChild)
				: contentEl.appendChild(document.createElement('div'));

			if (this.dropdownContainer) {
				this.dropdownContainer.addClass('note-status-dropdown', this.settings.dropdownPosition);
			}
		}

		// Ensure dropdown container exists before continuing
		if (!this.dropdownContainer) return;

		// Populate the dropdown
		this.dropdownContainer.empty();

		// Add label
		this.dropdownContainer.createEl('span', { text: 'Status:', cls: 'note-status-label' });

		// Add select element
		const select = this.dropdownContainer.createEl('select', { cls: 'note-status-select dropdown' });

		// Get all available statuses (from custom statuses and enabled templates)
		const allStatuses = this.statusService.getAllStatuses();

		// Add status options
		allStatuses.forEach(status => {
			const option = select.createEl('option', {
				text: `${status.name} ${status.icon}`,
				value: status.name
			});
			if (status.name === 'unknown') option.disabled = true;

			if (status.name === this.currentStatus) option.selected = true;
		});

		// Add change event listener
		select.addEventListener('change', async (e) => {
			const newStatus = (e.target as HTMLSelectElement).value;
			await this.statusService.updateNoteStatus(newStatus);

			// Dispatch event for UI update
			window.dispatchEvent(new CustomEvent('note-status:status-changed', {
				detail: { status: newStatus }
			}));
		});

		// Add hide button
		if (!this.dropdownContainer) return;

		const hideButton = this.dropdownContainer.createEl('button', {
			text: 'Hide Bar',
			cls: 'note-status-hide-button clickable-icon mod-cta'
		});

		hideButton.addEventListener('click', () => {
			this.settings.showStatusDropdown = false;
			this.render();

			// Trigger settings save
			window.dispatchEvent(new CustomEvent('note-status:settings-changed'));

			new Notice('Status dropdown hidden');
		});
	}

	/**
	 * Show status dropdown in context menu
	 */
	public showInContextMenu(editor: Editor, view: MarkdownView): void {
		const menu = new Menu();

		// Get all available statuses (from custom statuses and enabled templates)
		const allStatuses = this.statusService.getAllStatuses();

		// Add status options to menu (excluding 'unknown')
		allStatuses
			.filter(status => status.name !== 'unknown')
			.forEach(status => {
				menu.addItem((item) =>
					item
						.setTitle(`${status.name} ${status.icon}`)
						.setIcon('tag')
						.onClick(async () => {
							await this.statusService.updateNoteStatus(status.name);

							// Dispatch event for UI update
							window.dispatchEvent(new CustomEvent('note-status:status-changed', {
								detail: { status: status.name }
							}));
						})
				);
			});

		// Position menu near cursor
		const cursor = editor.getCursor('to');
		editor.posToOffset(cursor);
		const editorEl = view.contentEl.querySelector('.cm-content');

		if (editorEl) {
			const rect = editorEl.getBoundingClientRect();
			menu.showAtPosition({ x: rect.left, y: rect.bottom });
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
	}
}