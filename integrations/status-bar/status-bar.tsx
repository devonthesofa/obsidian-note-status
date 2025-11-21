import { createRoot, Root } from "react-dom/client";
import eventBus from "core/eventBus";
import { MarkdownView, Plugin, WorkspaceLeaf } from "obsidian";
import settingsService from "@/core/settingsService";
import { StatusBar } from "@/components/StatusBar/StatusBar";
import { NoteStatusService } from "@/core/noteStatusService";

export class StatusBarIntegration {
	private static instance: StatusBarIntegration | null = null;
	private root: Root | null = null;
	private plugin: Plugin;
	private statusBarContainer: HTMLElement | null = null;
	private noteStatusService: NoteStatusService | null = null;
	private currentLeaf: WorkspaceLeaf | null = null;

	constructor(plugin: Plugin) {
		if (StatusBarIntegration.instance) {
			throw new Error("The status bar instance is already created");
		}
		this.plugin = plugin;
		StatusBarIntegration.instance = this;
	}

	async integrate() {
		eventBus.subscribe(
			"active-file-change",
			({ leaf }) => {
				if (this.isValidMarkdownLeaf(leaf)) {
					this.currentLeaf = leaf;
					this.handleActiveFileChange().catch(console.error);
				}
			},
			"statusBarIntegrationSubscription1",
		);

		eventBus.subscribe(
			"plugin-settings-changed",
			({ key }) => {
				if (key === "showStatusBar") {
					this.render(); // INFO: Force a render to set disabled or enabled
				}
				if (key === "statusBarShowTemplateName") {
					this.render(); // INFO: Force a render to set disabled or enabled
				}
				if (key === "enabledTemplates" || key === "templates") {
					this.handleActiveFileChange().catch(console.error); // INFO: Force a re-read of the statuses and render
				}
				if (key === "autoHideStatusBar") {
					this.render();
				}
				if (key === "useMultipleStatuses") {
					this.handleActiveFileChange().catch(console.error); // INFO: Force a re-read of the statuses and render
				}
				if (key === "tagPrefix") {
					this.handleActiveFileChange().catch(console.error); // INFO: Force a re-read of the statuses and render
				}
				if (key === "useCustomStatusesOnly") {
					this.handleActiveFileChange().catch(console.error); // INFO: Force a re-read of the statuses and render
				}
				if (key === "customStatuses") {
					this.handleActiveFileChange().catch(console.error); // INFO: Force a re-read of the statuses and render
				}
				if (
					key === "unknownStatusIcon" ||
					key === "unknownStatusLucideIcon" ||
					key === "unknownStatusColor" ||
					key === "statusBarNoStatusText" ||
					key === "statusBarShowNoStatusIcon" ||
					key === "statusBarShowNoStatusText"
				) {
					this.render(); // INFO: Force a render for unknown status customization
				}
			},
			"statusBarIntegrationSubscription2",
		);

		eventBus.subscribe(
			"frontmatter-manually-changed",
			() => {
				this.handleActiveFileChange().catch(console.error);
			},
			"statusBarIntegrationSubscription3",
		);
	}

	private async handleActiveFileChange() {
		this.extractStatusesFromLeaf(this.currentLeaf);
		this.render();
	}

	private extractStatusesFromLeaf(leaf: WorkspaceLeaf | null) {
		if (!this.isValidMarkdownLeaf(leaf)) {
			return {};
		}

		const markdownView = leaf!.view as MarkdownView;
		if (!markdownView.file) {
			return {};
		}

		this.noteStatusService = new NoteStatusService(markdownView.file);
		this.noteStatusService.populateStatuses();
	}

	private isValidMarkdownLeaf(leaf: WorkspaceLeaf | null): boolean {
		return leaf !== null && leaf.view.getViewType() === "markdown";
	}

	private openStatusModal() {
		if (!this.noteStatusService) {
			throw new Error(
				"open status modal failed bcse there is no noteStatusService available",
			);
		}
		eventBus.publish("triggered-open-modal", {
			statusService: this.noteStatusService,
		});
	}

	private getNoStatusConfig() {
		const settings = settingsService.settings;
		return {
			text: settings.statusBarNoStatusText || "No status",
			showIcon: settings.statusBarShowNoStatusIcon || false,
			showText: settings.statusBarShowNoStatusText ?? true,
			icon: settings.unknownStatusIcon || "❓",
			lucideIcon: settings.unknownStatusLucideIcon || "",
			color: settings.unknownStatusColor || "#8b949e",
		};
	}

	private ensureStatusBarItem() {
		if (this.statusBarContainer) {
			return;
		}
		this.statusBarContainer = this.plugin.addStatusBarItem();
		this.statusBarContainer.classList.add("mod-clickable");
		this.statusBarContainer.style.padding = "unset";
		this.root = createRoot(this.statusBarContainer);
	}

	private destroyStatusBarItem() {
		if (this.root) {
			this.root.unmount();
			this.root = null;
		}
		if (this.statusBarContainer) {
			this.statusBarContainer.remove();
			this.statusBarContainer = null;
		}
	}

	private render() {
		if (!settingsService.settings.showStatusBar) {
			this.destroyStatusBarItem();
			return;
		}

		this.ensureStatusBarItem();

		this.root!.render(
			<StatusBar
				statuses={this.noteStatusService?.statuses || {}}
				hideIfNotStatuses={settingsService.settings.autoHideStatusBar}
				templateNameMode={
					settingsService.settings.statusBarShowTemplateName
				}
				onStatusClick={() => this.openStatusModal()}
				noStatusConfig={this.getNoStatusConfig()}
			/>,
		);
	}

	destroy() {
		eventBus.unsubscribe(
			"active-file-change",
			"statusBarIntegrationSubscription1",
		);
		eventBus.unsubscribe(
			"plugin-settings-changed",
			"statusBarIntegrationSubscription2",
		);
		eventBus.unsubscribe(
			"plugin-settings-changed",
			"statusBarIntegrationSubscription3",
		);

		this.destroyStatusBarItem();
		this.currentLeaf = null;
		this.noteStatusService = null;
		StatusBarIntegration.instance = null;
	}
}

export default StatusBarIntegration;
