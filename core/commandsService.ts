import { Plugin, Notice, TFile, App, WorkspaceLeaf } from "obsidian";
import { NoteStatusService, BaseNoteStatusService } from "./noteStatusService";
import settingsService from "./settingsService";
import eventBus from "./eventBus";
import { VIEW_TYPE_EXAMPLE } from "../integrations/views/grouped-status-view";

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
			name: "Change current note status",
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

		// Cycle through statuses
		this.plugin.addCommand({
			id: "cycle-status",
			name: "Cycle through statuses",
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
						BaseNoteStatusService.getAllAvailableStatuses();

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
						const currentIndex = allStatuses.findIndex(
							(s) => s.name === currentStatus,
						);
						if (currentIndex !== -1) {
							nextIndex =
								currentIndex === -1
									? 0
									: (currentIndex + 1) % allStatuses.length;
						}
					}

					const nextStatus = allStatuses[nextIndex];
					const scopedIdentifier = nextStatus.templateId
						? BaseNoteStatusService.formatStatusIdentifier({
								templateId: nextStatus.templateId,
								name: nextStatus.name,
							})
						: nextStatus.name;

					statusService
						.addStatus(
							settingsService.settings.tagPrefix,
							scopedIdentifier,
						)
						.then((resolve) => {
							new Notice(`Status changed to ${nextStatus.name}`);
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
			name: "Copy current note status",
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

		// Open Status Pane command
		this.plugin.addCommand({
			id: "open-status-pane",
			name: "Open status pane",
			callback: async () => {
				await this.openStatusPane();
			},
		});
		this.registeredCommands.add("open-status-pane");
	}

	private async openStatusPane(): Promise<void> {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf
			// in the right sidebar for it
			leaf = workspace.getRightLeaf(false);
			if (!leaf) {
				console.error(
					"getRightLeaf return null, unable to setup the view",
				);
				return;
			} else {
				await leaf.setViewState({
					type: VIEW_TYPE_EXAMPLE,
					active: true,
				});
			}
		}

		// "Reveal" the leaf in case it is in a collapsed sidebar
		if (!leaf) {
			console.error("leaf not found, unable to activate the view");
		} else {
			workspace.revealLeaf(leaf);
		}
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
						const scopedIdentifier = status.templateId
							? BaseNoteStatusService.formatStatusIdentifier({
									templateId: status.templateId,
									name: status.name,
								})
							: status.name;

						statusService
							.overrideStatuses(
								settingsService.settings.tagPrefix,
								[scopedIdentifier],
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

	/**
	 * Remove all quick status commands
	 */
	private removeQuickStatusCommands(): void {
		const allStatuses = BaseNoteStatusService.getAllAvailableStatuses();

		//TODO: If there is an update the
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

	public destroy(): void {
		// Remove existing commands
		this.removeQuickStatusCommands();
		this.registeredCommands.clear();
	}
}
