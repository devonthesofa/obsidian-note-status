import { Plugin, WorkspaceLeaf, TFile } from "obsidian";
import StatusBarIntegration from "integrations/status-bar/status-bar";
import eventBus from "core/eventBus";
import { PluginSettingIntegration } from "./integrations/settings/pluginSettings";
import settingsService from "./core/settingsService";
import {
	BaseNoteStatusService,
	NoteStatusService,
} from "./core/noteStatusService";
import { StatusModalIntegration } from "./integrations/modals/statusModalIntegration";
import ContextMenuIntegration from "./integrations/context-menu/contextMenuIntegration";
import { FileExplorerIntegration } from "./integrations/file-explorer/file-explorer-integration";
import { CommandsIntegration } from "./integrations/commands/commandsIntegration";
import EditorToolbarIntegration from "./integrations/toolbar/editorToolbarIntegration";
import {
	GroupedStatusView,
	VIEW_TYPE_EXAMPLE,
} from "./integrations/views/grouped-status-view";
import {
	StatusDashboardView,
	VIEW_TYPE_STATUS_DASHBOARD,
} from "./integrations/views/status-dashboard-view";
import { StatusesInfoPopup } from "./integrations/popups/statusesInfoPopupIntegration";
import statusStoreManager from "./core/statusStoreManager";
import { isExperimentalFeatureEnabled } from "@/utils/experimentalFeatures";

export default class NoteStatusPlugin extends Plugin {
	private statusBarIntegration: StatusBarIntegration;
	private pluginSettingsIntegration: PluginSettingIntegration;
	private contextMenuIntegration: ContextMenuIntegration;
	private fileExplorerIntegration: FileExplorerIntegration;
	private commandsIntegration: CommandsIntegration;
	private editorToolbarIntegration: EditorToolbarIntegration;
	private experimentalRibbonShortcuts: Map<string, HTMLElement> = new Map();
	private pendingDefaultStatusTimers = new Set<number>();

	async onload() {
		BaseNoteStatusService.initialize(this.app);
		await this.loadPluginSettings();
		await statusStoreManager.initialize(this);

		// INFO: initialize all integrations
		await Promise.all([
			this.loadContextMenu(),
			this.loadStatusBar(),
			this.loadFileExplorer(),
			this.loadCommands(),
			this.loadEditorToolbar(),
			this.loadEventBus(),
		]);

		this.registerView(
			VIEW_TYPE_EXAMPLE,
			(leaf) => new GroupedStatusView(leaf),
		);

		this.registerView(
			VIEW_TYPE_STATUS_DASHBOARD,
			(leaf) => new StatusDashboardView(leaf),
		);

		this.syncExperimentalFeatureShortcuts();
	}

	onunload() {
		this.pendingDefaultStatusTimers.forEach((timer) =>
			window.clearTimeout(timer),
		);
		this.pendingDefaultStatusTimers.clear();

		// Clean up all integrations
		this.statusBarIntegration?.destroy();
		this.contextMenuIntegration?.destroy();
		this.fileExplorerIntegration?.destroy();
		this.commandsIntegration?.destroy();
		this.editorToolbarIntegration?.destroy();
		this.pluginSettingsIntegration?.destroy();
		this.experimentalRibbonShortcuts.forEach((el) => el.remove());
		this.experimentalRibbonShortcuts.clear();

		// Clean up event subscriptions
		eventBus.unsubscribe(
			"triggered-open-modal",
			"main-triggered-open-modal-subscriptor",
		);
		eventBus.unsubscribe(
			"plugin-settings-changed",
			"main-status-popup-setting-subscriptor",
		);
	}

	async activateView() {
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
			await workspace.revealLeaf(leaf);
		}
	}

	async activateDashboard() {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(VIEW_TYPE_STATUS_DASHBOARD);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf
			// in the right sidebar for it
			leaf = workspace.getRightLeaf(false);
			if (!leaf) {
				console.error(
					"getRightLeaf return null, unable to setup the dashboard",
				);
			} else {
				await leaf.setViewState({
					type: VIEW_TYPE_STATUS_DASHBOARD,
					active: true,
				});
			}
		}

		// "Reveal" the leaf in case it is in a collapsed sidebar
		if (!leaf) {
			console.error("leaf not found, unable to activate the dashboard");
		} else {
			await workspace.revealLeaf(leaf);
		}
	}

	private syncExperimentalFeatureShortcuts(): void {
		const shortcuts = this.getExperimentalShortcuts();
		Object.entries(shortcuts).forEach(([key, config]) => {
			this.toggleExperimentalRibbon(key, config);
		});
	}

	private getExperimentalShortcuts() {
		return {
			groupedStatusView: {
				feature: "groupedStatusView" as const,
				icon: "list-tree",
				title: "Open grouped status view",
				handler: () => this.activateView(),
			},
			statusDashboard: {
				feature: "statusDashboard" as const,
				icon: "activity",
				title: "Open status dashboard",
				handler: () => this.activateDashboard(),
			},
		};
	}

	private toggleExperimentalRibbon(
		key: string,
		config: {
			feature: Parameters<typeof isExperimentalFeatureEnabled>[0];
			icon: string;
			title: string;
			handler: () => Promise<void>;
		},
	): void {
		const isEnabled = isExperimentalFeatureEnabled(config.feature);
		const existingIcon = this.experimentalRibbonShortcuts.get(key);

		if (isEnabled && !existingIcon) {
			const ribbonEl = this.addRibbonIcon(
				config.icon,
				config.title,
				() => {
					config.handler().catch(console.error);
				},
			);
			this.experimentalRibbonShortcuts.set(key, ribbonEl);
			return;
		}

		if (!isEnabled && existingIcon) {
			existingIcon.remove();
			this.experimentalRibbonShortcuts.delete(key);
		}
	}

	private async loadEventBus() {
		// Propagate to custom event bus the new active file
		this.registerEvent(
			this.app.workspace.on("active-leaf-change", (leaf) => {
				eventBus.publish("active-file-change", { leaf });
			}),
		);

		// Propagate to custom event bus the manually frontmatter data
		this.registerEvent(
			this.app.metadataCache.on("changed", (file) => {
				eventBus.publish("status-changed", { file });
			}),
		);

		// Register listeners
		eventBus.subscribe(
			"triggered-open-modal",
			({ statusService, activeStatus }) => {
				StatusModalIntegration.open(
					this.app,
					statusService,
					activeStatus,
				);
			},
			"main-triggered-open-modal-subscriptor",
		);

		eventBus.subscribe(
			"plugin-settings-changed",
			({ key, value }) => {
				if (key === "enableStatusOverviewPopup" && value === false) {
					StatusesInfoPopup.close();
				}
				if (
					key === "enableExperimentalFeatures" ||
					key === "enableStatusDashboard" ||
					key === "enableGroupedStatusView"
				) {
					this.syncExperimentalFeatureShortcuts();
				}
			},
			"main-status-popup-setting-subscriptor",
		);

		this.registerEvent(
			this.app.vault.on("create", (file) => {
				if (
					file instanceof TFile &&
					file.extension === "md" &&
					settingsService.settings.defaultStatusForNewNotes
				) {
					// Wait a bit to ensure metadata is processed or templates are applied
					const timer = window.setTimeout(() => {
						this.pendingDefaultStatusTimers.delete(timer);
						this.applyDefaultStatus(file).catch(console.error);
					}, 500);
					this.pendingDefaultStatusTimers.add(timer);
				}
			}),
		);

		this.registerEvent(
			this.app.vault.on("rename", (file) => {
				if (file instanceof TFile) {
					eventBus.publish("status-changed", { file });
				}
			}),
		);

		this.registerEvent(
			this.app.vault.on("delete", (file) => {
				if (file instanceof TFile) {
					eventBus.publish("status-changed", { file });
				}
			}),
		);
	}

	private async applyDefaultStatus(file: TFile): Promise<void> {
		const { defaultStatusForNewNotes, tagPrefix } =
			settingsService.settings;
		if (
			!defaultStatusForNewNotes ||
			file.extension !== "md" ||
			this.app.vault.getAbstractFileByPath(file.path) !== file
		) {
			return;
		}

		const service = new NoteStatusService(file);
		service.populateStatuses();
		const hasStatuses = Object.values(service.getStatusesByAllKeys()).some(
			(statuses) => statuses.length > 0,
		);
		if (!hasStatuses) {
			await service.addStatus(tagPrefix, defaultStatusForNewNotes);
		}
	}

	async loadPluginSettings() {
		// INFO: Loads the settings data
		await settingsService.initialize(this);
		// INFO: Integrates the plugin settings section
		this.pluginSettingsIntegration = new PluginSettingIntegration(this);
		await this.pluginSettingsIntegration.integrate();
	}

	private async loadContextMenu() {
		this.contextMenuIntegration = new ContextMenuIntegration(this);
		await this.contextMenuIntegration.integrate();
	}
	private async loadStatusBar() {
		this.statusBarIntegration = new StatusBarIntegration(this);
		await this.statusBarIntegration.integrate();
	}
	private async loadFileExplorer() {
		this.fileExplorerIntegration = new FileExplorerIntegration(this);
		await this.fileExplorerIntegration.integrate();
	}

	private async loadCommands() {
		this.commandsIntegration = new CommandsIntegration(this);
		await this.commandsIntegration.integrate();
	}

	private async loadEditorToolbar() {
		this.editorToolbarIntegration = new EditorToolbarIntegration(this);
		await this.editorToolbarIntegration.integrate();
	}
}
