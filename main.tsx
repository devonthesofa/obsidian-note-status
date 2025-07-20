import { Plugin, WorkspaceLeaf } from "obsidian";
import StatusBarIntegration from "integrations/status-bar/status-bar";
import eventBus from "core/eventBus";
import { PluginSettingIntegration } from "./integrations/settings/pluginSettings";
import settingsService from "./core/settingsService";
import { BaseNoteStatusService } from "./core/noteStatusService";
import { StatusModalIntegration } from "./integrations/modals/statusModalIntegration";
import ContextMenuIntegration from "./integrations/context-menu/contextMenuIntegration";
import { FileExplorerIntegration } from "./integrations/file-explorer/file-explorer-integration";
import { CommandsIntegration } from "./integrations/commands/commandsIntegration";
import {
	GroupedStatusView,
	VIEW_TYPE_EXAMPLE,
} from "./integrations/views/grouped-status-view";
import {
	StatusDashboardView,
	VIEW_TYPE_STATUS_DASHBOARD,
} from "./integrations/views/status-dashboard-view";

export default class NoteStatusPlugin extends Plugin {
	private statusBarIntegration: StatusBarIntegration;
	private pluginSettingsIntegration: PluginSettingIntegration;
	private contextMenuIntegration: ContextMenuIntegration;
	private fileExplorerIntegration: FileExplorerIntegration;
	private commandsIntegration: CommandsIntegration;

	async onload() {
		BaseNoteStatusService.initialize(this.app);
		await this.loadPluginSettings();

		// INFO: initialize all integrations
		Promise.all([
			this.loadContextMenu(),
			this.loadStatusBar(),
			this.loadFileExplorer(),
			this.loadCommands(),
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

		this.addRibbonIcon("list-tree", "Open grouped status view", () => {
			this.activateView();
		});

		this.addRibbonIcon("activity", "Open status dashboard", () => {
			this.activateDashboard();
		});
	}

	async onunload() {
		// Clean up all integrations
		this.statusBarIntegration?.destroy();
		this.contextMenuIntegration?.destroy();
		this.fileExplorerIntegration?.destroy();
		this.commandsIntegration?.destroy();
		this.pluginSettingsIntegration?.destroy();

		// Clean up event subscriptions
		eventBus.unsubscribe(
			"triggered-open-modal",
			"main-triggered-open-modal-subscriptor",
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
			workspace.revealLeaf(leaf);
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
			workspace.revealLeaf(leaf);
		}
	}

	private async loadEventBus() {
		// Propagate to custom event bus the new active file
		this.app.workspace.on(
			"active-leaf-change",
			(leaf: WorkspaceLeaf | null) => {
				eventBus.publish("active-file-change", { leaf });
			},
		);

		// Propagate to custom event bus the manually frontmatter data
		this.registerEvent(
			this.app.metadataCache.on("changed", (file) => {
				eventBus.publish("frontmatter-manually-changed", { file });
			}),
		);

		// Register listeners
		eventBus.subscribe(
			"triggered-open-modal",
			({ statusService }) => {
				StatusModalIntegration.open(this.app, statusService);
			},
			"main-triggered-open-modal-subscriptor",
		);
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
}
