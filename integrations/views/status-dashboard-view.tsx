import { ItemView, WorkspaceLeaf, Notice, App, TFile } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { StatusDashboard } from "@/components/StatusDashboard/StatusDashboard";
import { DashboardAction } from "@/components/StatusDashboard/QuickActionsPanel";
import {
	BaseNoteStatusService,
	NoteStatusService,
} from "@/core/noteStatusService";
import settingsService from "@/core/settingsService";
import eventBus from "@/core/eventBus";
import { VaultStats } from "@/components/StatusDashboard/useVaultStats";
import { NoteStatus } from "@/types/noteStatus";

interface AppWithCommands extends App {
	commands: {
		executeCommandById(commandId: string): boolean;
	};
}

interface CurrentNoteInfo {
	file: TFile | null;
	statuses: Record<string, NoteStatus[]>;
	lastModified: number;
}

export const VIEW_TYPE_STATUS_DASHBOARD = "status-dashboard-view";

export class StatusDashboardView extends ItemView {
	root: Root | null = null;
	private vaultStats: VaultStats = {
		totalNotes: 0,
		notesWithStatus: 0,
		statusDistribution: {},
		tagDistribution: {},
		recentChanges: [],
	};
	private currentNote: CurrentNoteInfo = {
		file: null,
		statuses: {},
		lastModified: 0,
	};
	private isLoading: boolean = true;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_STATUS_DASHBOARD;
	}

	getDisplayText() {
		return "Status Dashboard";
	}

	getIcon() {
		return "bar-chart-2";
	}

	private calculateVaultStats = (): VaultStats => {
		const files = this.app.vault.getMarkdownFiles();
		const availableStatuses =
			BaseNoteStatusService.getAllAvailableStatuses();
		const statusMetadataKeys = [settingsService.settings.tagPrefix];

		let notesWithStatus = 0;
		const statusDistribution: Record<string, number> = {};
		const tagDistribution: Record<string, number> = {};

		// Initialize distribution using full scoped identifiers
		availableStatuses.forEach((status) => {
			const scopedIdentifier = status.templateId
				? `${status.templateId}:${status.name}`
				: status.name;
			statusDistribution[scopedIdentifier] = 0;
		});

		statusMetadataKeys.forEach((tag) => {
			tagDistribution[tag] = 0;
		});

		files.forEach((file) => {
			const cachedMetadata = this.app.metadataCache.getFileCache(file);
			const frontmatter = cachedMetadata?.frontmatter;

			if (!frontmatter) return;

			let hasAnyStatus = false;

			statusMetadataKeys.forEach((key) => {
				const value = frontmatter[key];
				if (value) {
					hasAnyStatus = true;
					tagDistribution[key]++;

					const statusNames = Array.isArray(value) ? value : [value];
					statusNames.forEach((statusName) => {
						const statusStr = statusName.toString();

						// Determine the scoped identifier to use
						let scopedIdentifier: string;

						if (statusStr.includes(":")) {
							// Already scoped
							scopedIdentifier = statusStr;
						} else {
							// Legacy status - find first template that has this status
							const firstTemplateWithStatus =
								availableStatuses.find(
									(s) => s.name === statusStr && s.templateId,
								);
							scopedIdentifier = firstTemplateWithStatus
								? `${firstTemplateWithStatus.templateId}:${statusStr}`
								: statusStr; // Fallback to unscoped if no template found
						}

						// Initialize status if not already present
						if (
							!statusDistribution.hasOwnProperty(scopedIdentifier)
						) {
							statusDistribution[scopedIdentifier] = 0;
						}
						statusDistribution[scopedIdentifier]++;
					});
				}
			});

			if (hasAnyStatus) {
				notesWithStatus++;
			}
		});

		return {
			totalNotes: files.length,
			notesWithStatus,
			statusDistribution,
			tagDistribution,
			recentChanges: [],
		};
	};

	private updateCurrentNote = () => {
		const activeFile = this.app.workspace.getActiveFile();

		if (!activeFile) {
			this.currentNote = { file: null, statuses: {}, lastModified: 0 };
			this.renderDashboard();
			return;
		}

		const noteStatusService = new NoteStatusService(activeFile);
		noteStatusService.populateStatuses();

		this.currentNote = {
			file: activeFile,
			statuses: noteStatusService.statuses,
			lastModified: activeFile.stat.mtime,
		};
		this.renderDashboard();
	};

	private updateVaultStats = () => {
		this.vaultStats = this.calculateVaultStats();
		this.renderDashboard();
	};

	private loadData = () => {
		this.isLoading = true;
		this.renderDashboard();

		try {
			this.vaultStats = this.calculateVaultStats();
			this.updateCurrentNote();
		} finally {
			this.isLoading = false;
			this.renderDashboard();
		}
	};

	private handleAction = (action: DashboardAction, value?: string) => {
		const appWithCommands = this.app as AppWithCommands;

		switch (action) {
			case "refresh":
				this.loadData();
				break;
			case "open-grouped-view":
				this.openGroupedView();
				break;
			case "find-unassigned":
				this.findUnassignedNotes();
				break;
			case "change-status":
				appWithCommands.commands.executeCommandById(
					"note-status:change-status",
				);
				break;
			case "cycle-status":
				appWithCommands.commands.executeCommandById(
					"note-status:cycle-status",
				);
				break;
			case "clear-status":
				appWithCommands.commands.executeCommandById(
					"note-status:clear-status",
				);
				break;
			case "copy-status":
				appWithCommands.commands.executeCommandById(
					"note-status:copy-status",
				);
				break;
			case "paste-status":
				appWithCommands.commands.executeCommandById(
					"note-status:paste-status",
				);
				break;
			case "search-by-status":
				appWithCommands.commands.executeCommandById(
					"note-status:search-by-status",
				);
				break;
			case "toggle-multiple-mode":
				appWithCommands.commands.executeCommandById(
					"note-status:toggle-multiple-statuses",
				);
				break;
			case "set-quick-status":
				if (value) {
					const commandId = `note-status:set-status-${value}`;
					const result =
						appWithCommands.commands.executeCommandById(commandId);
					if (!result) {
						new Notice(
							`Quick status command failed: ${value}. Make sure the status exists and multiple statuses mode is disabled.`,
						);
					}
				}
				break;
			case "search-by-specific-status":
				if (value) {
					this.searchBySpecificStatus(value);
				}
				break;
		}
	};

	private openGroupedView() {
		const leaf = this.app.workspace.getLeaf();
		leaf.setViewState({ type: "grouped-status-view", active: true });
	}

	private findUnassignedNotes() {
		const files = this.app.vault.getMarkdownFiles();
		const filesWithoutStatus = files.filter((file) => {
			const cachedMetadata = this.app.metadataCache.getFileCache(file);
			const frontmatter = cachedMetadata?.frontmatter;
			return (
				!frontmatter || !frontmatter[settingsService.settings.tagPrefix]
			);
		});

		if (filesWithoutStatus.length === 0) {
			new Notice("All notes have status assigned!");
			return;
		}

		new Notice(
			`Found ${filesWithoutStatus.length} notes without status. Opening search...`,
		);

		// Create a search query to find files without the status tag
		const tagPrefix = settingsService.settings.tagPrefix;
		const query = `-[${tagPrefix}:]`;

		// @ts-ignore
		this.app.internalPlugins.plugins[
			"global-search"
		].instance.openGlobalSearch(query);
	}

	private searchBySpecificStatus(statusName: string) {
		const tagPrefix = settingsService.settings.tagPrefix;
		const query = `[${tagPrefix}:"${statusName}"]`;

		// @ts-ignore
		this.app.internalPlugins.plugins[
			"global-search"
		].instance.openGlobalSearch(query);
	}

	private renderDashboard() {
		if (!this.root) return;

		this.root.render(
			<StatusDashboard
				onAction={this.handleAction}
				settings={settingsService.settings}
				vaultStats={this.vaultStats}
				currentNote={this.currentNote}
				isLoading={this.isLoading}
				availableStatuses={BaseNoteStatusService.getAllAvailableStatuses()}
			/>,
		);
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		container.addClass("status-dashboard-view-container");

		this.root = createRoot(container);

		// Set up event listeners
		const handleFileChange = () => {
			this.updateCurrentNote();
		};

		const handleVaultChange = () => {
			this.loadData();
		};

		eventBus.subscribe(
			"frontmatter-manually-changed",
			handleVaultChange,
			"status-dashboard-vault-subscription",
		);
		eventBus.subscribe(
			"active-file-change",
			handleFileChange,
			"status-dashboard-file-subscription",
		);
		eventBus.subscribe(
			"plugin-settings-changed",
			({ key }) => {
				if (
					key === "tagPrefix" ||
					key === "enabledTemplates" ||
					key === "useCustomStatusesOnly" ||
					key === "customStatuses" ||
					key === "useMultipleStatuses" ||
					key === "strictStatuses" ||
					key === "excludeUnknownStatus"
				) {
					handleVaultChange();
					handleFileChange();
				}
			},
			"status-dashboard-settings-subscription",
		);

		this.app.workspace.on("active-leaf-change", handleFileChange);

		// Initial load
		this.loadData();
	}

	async onClose() {
		// Clean up event listeners
		eventBus.unsubscribe(
			"frontmatter-manually-changed",
			"status-dashboard-vault-subscription",
		);
		eventBus.unsubscribe(
			"active-file-change",
			"status-dashboard-file-subscription",
		);
		eventBus.unsubscribe(
			"plugin-settings-changed",
			"status-dashboard-settings-subscription",
		);

		this.root?.unmount();
		this.root = null;
	}
}
