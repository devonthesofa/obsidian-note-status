import { Plugin, Notice, Editor, MarkdownView, TFile, App } from "obsidian";
import { NoteStatusService, BaseNoteStatusService } from "./noteStatusService";
import settingsService from "./settingsService";
import eventBus from "./eventBus";

export class CommandsService {
	private plugin: Plugin;
	private app: App;
	private registeredCommands: Set<string> = new Set();

	constructor(plugin: Plugin) {
		this.plugin = plugin;
		this.app = plugin.app;
	}

	private createStatusService(file: TFile): NoteStatusService {
		const service = new NoteStatusService(file);
		service.populateStatuses();
		return service;
	}

	registerAllCommands(): void {
		// Change status of current note
		this.plugin.addCommand({
			id: "change-status",
			name: "Change status of current note",
			checkCallback: (checking: boolean) => {
				const file = this.app.workspace.getActiveFile();
				if (!file) return false;

				if (!checking) {
					const statusService = this.createStatusService(file);
					statusService.populateStatuses();
					eventBus.publish("triggered-open-modal", {
						statusService: statusService,
					});
				}
				return true;
			},
		});
		this.registeredCommands.add("change-status");

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

				const cache = this.plugin.app.metadataCache.getFileCache(
					view.file,
				);
				const frontmatter = cache?.frontmatter;

				// Check if any frontmatter property starts with tagPrefix
				let hasFronttmatter = false;
				if (frontmatter) {
					hasFronttmatter = Object.keys(frontmatter).some((key) =>
						key.startsWith(settingsService.settings.tagPrefix),
					);
				}

				if (!checking && !hasFronttmatter) {
					BaseNoteStatusService.insertStatusMetadataInEditor(
						view.file,
					).then(() => {
						new Notice("Status metadata inserted");
					});
				}
				return !hasFronttmatter;
			},
		});
		this.registeredCommands.add("insert-status-metadata");

		// Cycle through statuses
		this.plugin.addCommand({
			id: "cycle-status",
			name: "Cycle to next status",
			checkCallback: (checking: boolean) => {
				if (settingsService.settings.useMultipleStatuses) {
					// For now the cycle status is for single statuses
					return false;
				}
				const file = this.app.workspace.getActiveFile();
				if (!file) {
					return false;
				}

				if (
					!checking &&
					!settingsService.settings.useMultipleStatuses
				) {
					const allStatuses =
						BaseNoteStatusService.getAllAvailableStatuses().map(
							(s) => s.name,
						);

					if (allStatuses.length === 0) {
						new Notice("No statuses available");
						return;
					}

					// Get the current file data
					const statusService = this.createStatusService(file);
					statusService.populateStatuses();
					const statuses =
						statusService.statuses[
							settingsService.settings.tagPrefix
						] || [];
					const currentStatus = statuses.length
						? statuses?.[0].name
						: undefined;
					let nextIndex = 0;
					if (currentStatus) {
						const currentIndex = allStatuses.indexOf(currentStatus);
						if (currentIndex !== -1) {
							nextIndex =
								currentIndex === -1
									? 0
									: (currentIndex + 1) % allStatuses.length;
						}
					}

					statusService
						.addStatus(
							settingsService.settings.tagPrefix,
							allStatuses[nextIndex],
						)
						.then((resolve) => {
							new Notice(
								`Status changed to ${allStatuses[nextIndex]}`,
							);
						});
				}
				return true;
			},
		});
		this.registeredCommands.add("cycle-status");

		// Register dynamic quick status commands
		this.registerQuickStatusCommands();

		// Clear status
		this.plugin.addCommand({
			id: "clear-status",
			name: "Clear status",
			checkCallback: (checking: boolean) => {
				const file = this.app.workspace.getActiveFile();
				if (!file) return false;
				if (!checking) {
					const statusService = this.createStatusService(file);
					statusService
						.clearStatus(settingsService.settings.tagPrefix)
						.then(() => {
							new Notice("Status cleared");
						});
				}
				return true;
			},
		});
		this.registeredCommands.add("clear-status");

		// Copy status from current note
		this.plugin.addCommand({
			id: "copy-status",
			name: "Copy status from current note",
			checkCallback: (checking: boolean) => {
				const file = this.app.workspace.getActiveFile();
				if (!file) return false;
				if (!checking) {
					const statuses = this.getFileStatuses(file);
					navigator.clipboard
						.writeText(statuses.join(", "))
						.then(() => {
							new Notice(`Copied status: ${statuses.join(", ")}`);
						});
				}
				return true;
			},
		});
		this.registeredCommands.add("copy-status");

		// Paste status to current note
		this.plugin.addCommand({
			id: "paste-status",
			name: "Paste status to current note",
			checkCallback: (checking: boolean) => {
				const file = this.app.workspace.getActiveFile();
				if (!file) return false;
				if (!checking) {
					const statusService = this.createStatusService(file);
					statusService.populateStatuses();
					navigator.clipboard.readText().then((text) => {
						const statuses = text.split(", ");

						statusService
							.overrideStatuses(
								settingsService.settings.tagPrefix,
								statuses,
							)
							.then(() => {
								new Notice(
									`Pasted status: ${statuses.join(", ")}`,
								);
							});
					});
				}
				return true;
			},
		});
		this.registeredCommands.add("paste-status");

		// Toggle multiple statuses mode
		this.plugin.addCommand({
			id: "toggle-multiple-statuses",
			name: "Toggle multiple statuses mode",
			callback: () => {
				const currentValue =
					settingsService.settings.useMultipleStatuses;
				settingsService.setValue("useMultipleStatuses", !currentValue);
				new Notice(
					`Multiple statuses mode ${!currentValue ? "enabled" : "disabled"}`,
				);
			},
		});
		this.registeredCommands.add("toggle-multiple-statuses");

		// Search notes by status
		this.plugin.addCommand({
			id: "search-by-status",
			name: "Search notes by current status",
			checkCallback: (checking: boolean) => {
				const file = this.app.workspace.getActiveFile();
				if (!file) return false;

				if (!checking) {
					const statuses = this.getFileStatuses(file);

					if (!statuses || statuses.length === 0) return false;

					const tagPrefix = settingsService.settings.tagPrefix;
					const queries = statuses.map(
						(status) => `[${tagPrefix}:"${status}"]`,
					);
					const query = queries.join(" OR ");

					// @ts-ignore
					this.app.internalPlugins.plugins[
						"global-search"
					].instance.openGlobalSearch(query);
				}
				return true;
			},
		});
		this.registeredCommands.add("search-by-status");
	}

	/**
	 * Register quick status commands based on settings
	 */
	private registerQuickStatusCommands(): void {
		const quickCommands =
			settingsService.settings.quickStatusCommands || [];
		const allStatuses = BaseNoteStatusService.getAllAvailableStatuses();

		quickCommands.forEach((statusName) => {
			const status = allStatuses.find((s) => s.name === statusName);
			if (!status) return;

			this.plugin.addCommand({
				id: `set-status-${statusName}`,
				name: `Set status to ${statusName}`,
				checkCallback: (checking: boolean) => {
					const file = this.app.workspace.getActiveFile();
					if (!file) return false;
					if (settingsService.settings.useMultipleStatuses) {
						return false;
					}

					if (
						!checking &&
						!settingsService.settings.useMultipleStatuses
					) {
						const statusService = this.createStatusService(file);
						statusService
							.overrideStatuses(
								settingsService.settings.tagPrefix,
								[statusName],
							)
							.then(() => {
								new Notice(`Status set to ${statusName}`);
							});
					}
					return true;
				},
			});
			this.registeredCommands.add(`set-status-${statusName}`);
		});
	}

	private getFileStatuses(file: TFile): string[] {
		const statusService = this.createStatusService(file);
		statusService.populateStatuses();
		const tagPrefix = settingsService.settings.tagPrefix;
		const statuses = statusService.statuses[tagPrefix] || [];
		return statuses.length > 0 ? statuses.map((s) => s.name) : ["unknown"];
	}

	public unload(): void {
		// Remove existing commands
		this.removeQuickStatusCommands();
	}

	/**
	 * Remove all quick status commands
	 */
	private removeQuickStatusCommands(): void {
		const allStatuses = BaseNoteStatusService.getAllAvailableStatuses();

		allStatuses.forEach((status) => {
			// @ts-ignore
			this.app.commands.removeCommand(
				`note-status:set-status-${status.name}`,
			);
			// @ts-ignore
			this.app.commands.removeCommand(
				`note-status:toggle-status-${status.name}`,
			);
		});
	}

	destroy(): void {
		// Commands are automatically cleaned up when the plugin is disabled
		// But we can track them for debugging purposes
		this.registeredCommands.clear();
	}
}
