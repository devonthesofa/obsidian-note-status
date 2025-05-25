// integrations/commands/command-integration.ts
import { App, Editor, MarkdownView, Notice, TFile } from "obsidian";
import { NoteStatusSettings } from "../../models/types";
import { StatusService } from "services/status-service";
import { StatusDropdown } from "components/status-dropdown";
import { StatusPaneViewController } from "views/status-pane-view";
import NoteStatus from "main";

export class CommandIntegration {
	private app: App;
	private plugin: NoteStatus;
	private settings: NoteStatusSettings;
	private statusService: StatusService;
	private statusDropdown: StatusDropdown;

	constructor(
		app: App,
		plugin: NoteStatus,
		settings: NoteStatusSettings,
		statusService: StatusService,
		statusDropdown: StatusDropdown,
	) {
		this.app = app;
		this.plugin = plugin;
		this.settings = settings;
		this.statusService = statusService;
		this.statusDropdown = statusDropdown;
	}

	public updateSettings(settings: NoteStatusSettings): void {
		this.settings = settings;
		// Re-register commands when settings change
		this.unload();
		this.registerCommands();
	}

	public registerCommands(): void {
		// Open status pane
		this.plugin.addCommand({
			id: "open-status-pane",
			name: "Open status pane",
			callback: () => StatusPaneViewController.open(this.app),
		});

		// Change status of current note
		this.plugin.addCommand({
			id: "change-status",
			name: "Change status of current note",
			checkCallback: (checking: boolean) => {
				const file = this.app.workspace.getActiveFile();
				if (!file) return false;

				if (!checking) {
					this.statusDropdown.openStatusDropdown({ files: [file] });
				}
				return true;
			},
		});

		// Add status to current note
		this.plugin.addCommand({
			id: "add-status",
			name: "Add status to current note",
			checkCallback: (checking: boolean) => {
				const file = this.app.workspace.getActiveFile();
				if (!file) return false;

				if (!checking) {
					this.statusDropdown.openStatusDropdown({
						files: [file],
						mode: this.settings.useMultipleStatuses
							? "add"
							: "replace",
					});
				}
				return true;
			},
		});

		// Insert status metadata
		this.plugin.addCommand({
			id: "insert-status-metadata",
			name: "Insert status metadata",
			editorCheckCallback: (
				checking: boolean,
				editor: Editor,
				view: MarkdownView,
			) => {
				if (!view.file) return false;

				const statuses = this.statusService.getFileStatuses(view.file);
				const hasNoStatus =
					statuses.length === 1 && statuses[0] === "unknown";

				if (!checking && hasNoStatus) {
					this.statusService.insertStatusMetadataInEditor(editor);
					new Notice("Status metadata inserted");
				}
				return hasNoStatus;
			},
		});

		// Cycle through statuses
		this.plugin.addCommand({
			id: "cycle-status",
			name: "Cycle to next status",
			checkCallback: (checking: boolean) => {
				const file = this.app.workspace.getActiveFile();
				if (!file) return false;

				if (!checking) {
					this.cycleStatus(file);
				}
				return true;
			},
		});

		// Register dynamic quick status commands
		this.registerQuickStatusCommands();

		// Clear status
		this.plugin.addCommand({
			id: "clear-status",
			name: "Clear status (set to unknown)",
			checkCallback: (checking: boolean) => {
				const file = this.app.workspace.getActiveFile();
				if (!file) return false;

				if (!checking) {
					this.statusService.handleStatusChange({
						files: file,
						statuses: "unknown",
						operation: "set",
					});
					new Notice("Status cleared");
				}
				return true;
			},
		});

		// Copy status from current note
		this.plugin.addCommand({
			id: "copy-status",
			name: "Copy status from current note",
			checkCallback: (checking: boolean) => {
				const file = this.app.workspace.getActiveFile();
				if (!file) return false;

				if (!checking) {
					const statuses = this.statusService.getFileStatuses(file);
					this.app.clipboard = statuses;
					new Notice(`Copied status: ${statuses.join(", ")}`);
				}
				return true;
			},
		});

		// Paste status to current note
		this.plugin.addCommand({
			id: "paste-status",
			name: "Paste status to current note",
			checkCallback: (checking: boolean) => {
				const file = this.app.workspace.getActiveFile();
				const clipboard = this.app.clipboard;
				if (!file || !clipboard || !Array.isArray(clipboard))
					return false;

				if (!checking) {
					this.statusService.handleStatusChange({
						files: file,
						statuses: clipboard,
						operation: "set",
					});
					new Notice(`Pasted status: ${clipboard.join(", ")}`);
				}
				return true;
			},
		});

		// Toggle multiple statuses mode
		this.plugin.addCommand({
			id: "toggle-multiple-statuses",
			name: "Toggle multiple statuses mode",
			callback: () => {
				this.settings.useMultipleStatuses =
					!this.settings.useMultipleStatuses;
				this.plugin.saveSettings();
				new Notice(
					`Multiple statuses mode ${this.settings.useMultipleStatuses ? "enabled" : "disabled"}`,
				);
			},
		});

		// Search notes by status
		this.plugin.addCommand({
			id: "search-by-status",
			name: "Search notes by current status",
			checkCallback: (checking: boolean) => {
				const file = this.app.workspace.getActiveFile();
				if (!file) return false;

				if (!checking) {
					const statuses = this.statusService.getFileStatuses(file);
					const query = `[${this.settings.tagPrefix}:"${statuses[0]}"]`;
					this.app.internalPlugins
						.getPluginById("global-search")
						?.instance.openGlobalSearch(query);
				}
				return true;
			},
		});
	}

	/**
	 * Register quick status commands based on settings
	 */
	private registerQuickStatusCommands(): void {
		const quickCommands = this.settings.quickStatusCommands || [];
		const allStatuses = this.statusService.getAllStatuses();

		quickCommands.forEach((statusName) => {
			const status = allStatuses.find((s) => s.name === statusName);
			if (!status) return;

			this.plugin.addCommand({
				id: `set-status-${statusName}`,
				name: `Set status to ${statusName}`,
				checkCallback: (checking: boolean) => {
					const file = this.app.workspace.getActiveFile();
					if (!file) return false;

					if (!checking) {
						this.statusService.handleStatusChange({
							files: file,
							statuses: statusName,
							operation: "set",
						});
						new Notice(`Status set to ${statusName}`);
					}
					return true;
				},
			});

			// Add toggle command for multiple status mode
			if (this.settings.useMultipleStatuses) {
				this.plugin.addCommand({
					id: `toggle-status-${statusName}`,
					name: `Toggle status ${statusName}`,
					checkCallback: (checking: boolean) => {
						const file = this.app.workspace.getActiveFile();
						if (!file) return false;

						if (!checking) {
							this.statusService.handleStatusChange({
								files: file,
								statuses: statusName,
								operation: "toggle",
							});
							const currentStatuses =
								this.statusService.getFileStatuses(file);
							const hasStatus =
								currentStatuses.includes(statusName);
							new Notice(
								`Status ${statusName} ${hasStatus ? "added" : "removed"}`,
							);
						}
						return true;
					},
				});
			}
		});
	}

	private cycleStatus(file: TFile): void {
		const allStatuses = this.statusService
			.getAllStatuses()
			.filter((s) => s.name !== "unknown")
			.map((s) => s.name);

		if (allStatuses.length === 0) {
			new Notice("No statuses available");
			return;
		}

		const currentStatuses = this.statusService.getFileStatuses(file);
		const currentStatus = currentStatuses[0];

		let nextIndex = 0;
		if (currentStatus !== "unknown") {
			const currentIndex = allStatuses.indexOf(currentStatus);
			nextIndex = (currentIndex + 1) % allStatuses.length;
		}

		this.statusService.handleStatusChange({
			files: file,
			statuses: allStatuses[nextIndex],
			operation: "set",
		});

		new Notice(`Status changed to ${allStatuses[nextIndex]}`);
	}

	public unload(): void {
		// Remove existing commands
		this.removeQuickStatusCommands();
	}

	/**
	 * Remove all quick status commands
	 */
	private removeQuickStatusCommands(): void {
		const allStatuses = this.statusService.getAllStatuses();

		allStatuses.forEach((status) => {
			this.app.commands.removeCommand(
				`note-status:set-status-${status.name}`,
			);
			this.app.commands.removeCommand(
				`note-status:toggle-status-${status.name}`,
			);
		});
	}
}
