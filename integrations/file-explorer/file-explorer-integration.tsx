import { FileExplorerIcon } from "@/components/FileExplorer/FileExplorerIcon";
import eventBus from "@/core/eventBus";
import {
	LazyElementObserver,
	IElementProcessor,
} from "@/core/lazyElementObserver";
import { NoteStatusService } from "@/core/noteStatusService";
import settingsService from "@/core/settingsService";
import { GroupedStatuses } from "@/types/noteStatus";
import { Plugin, TFile, View } from "obsidian";
import { createRoot } from "react-dom/client";
import { StatusesInfoPopup } from "../popups/statusesInfoPopupIntegration";

export class FileExplorerIntegration implements IElementProcessor {
	private plugin: Plugin;
	private observerService: LazyElementObserver;

	private readonly ICON_CLASS = "custom-icon";
	private readonly EVENT_SUBSCRIPTION_ID =
		"file-explorer-integration-subscription1";
	private readonly FILE_EXPLORER_TYPE = "file-explorer";
	private readonly CONTAINER_SELECTOR = ".nav-files-container";

	constructor(plugin: Plugin) {
		this.plugin = plugin;
		this.observerService = new LazyElementObserver(this);
	}

	/**
	 * Initializes file explorer integration
	 */
	async integrate(): Promise<void> {
		this.setupWorkspaceIntegration();

		eventBus.subscribe(
			"frontmatter-manually-changed",
			({ file }) => {
				const element = this.findFileElement(file.path);
				if (!element) return;

				this.refreshElementIcon(element, file.path);
			},
			this.EVENT_SUBSCRIPTION_ID,
		);

		eventBus.subscribe(
			"plugin-settings-changed",
			({ key }) => {
				if (
					key === "showStatusIconsInExplorer" ||
					key === "hideUnknownStatusInExplorer" ||
					key === "enabledTemplates" ||
					key === "useCustomStatusesOnly" ||
					key === "customStatuses" ||
					key === "useMultipleStatuses" ||
					key === "tagPrefix" ||
					key === "strictStatuses" ||
					key === "fileExplorerIconPosition"
				) {
					this.destroy();
					this.integrate().catch((r) => console.error(r));
				}
			},
			"fileExplorerIntegrationSubscription2",
		);
	}

	private getFileNoteStatusService(
		dataPath: string,
	): NoteStatusService | null {
		if (!dataPath.endsWith(".md")) {
			return null;
		}

		const file = this.plugin.app.vault.getAbstractFileByPath(
			dataPath,
		) as TFile;
		if (!file) {
			return null;
		}

		const noteStatusService = new NoteStatusService(file);
		noteStatusService.populateStatuses();
		return noteStatusService;
	}

	/**
	 * Processes visible file explorer elements (IElementProcessor implementation)
	 */
	processElement(element: HTMLElement, dataPath?: string | null): void {
		if (!dataPath) {
			dataPath = element.getAttribute("data-path");
		}
		if (dataPath) {
			const textEl = element.querySelector(
				".nav-file-title-content, .tree-item-inner, .nav-folder-title-content",
			);
			if (!textEl) {
				return;
			}

			const noteStatusService = this.getFileNoteStatusService(dataPath);

			// Only render icons for markdown files
			if (noteStatusService) {
				this.render(textEl, noteStatusService.statuses);
			}
		}
	}

	render(element: Element, statuses: GroupedStatuses): void {
		// Remove existing icon
		const existingIcon = element.querySelector(`.${this.ICON_CLASS}`);
		if (existingIcon) {
			existingIcon.remove();
		}

		if (!settingsService.settings.showStatusIconsInExplorer) {
			return;
		}

		let positionClassName = "";
		if (
			settingsService.settings.fileExplorerIconPosition ===
			"absolute-right"
		) {
			positionClassName = "custom-icon__absolute-right";
		}
		const icon = createSpan({ cls: [this.ICON_CLASS, positionClassName] });
		const root = createRoot(icon);
		root.render(
			<FileExplorerIcon
				statuses={statuses}
				onMouseEnter={(s) => this.openModalInfo(s)}
				onMouseLeave={this.closeModalInfo}
				hideUnknownStatus={
					settingsService.settings.hideUnknownStatusInExplorer
				}
			/>,
		);

		if (
			settingsService.settings.fileExplorerIconPosition ===
			"file-name-right"
		) {
			element.append(icon);
		} else {
			element.prepend(icon);
		}
	}

	private openModalInfo(statuses: GroupedStatuses) {
		if (!this.plugin) {
			return;
		}
		StatusesInfoPopup.open(statuses);
	}
	private closeModalInfo() {
		StatusesInfoPopup.close();
	}

	/**
	 * Cleanup integration and unsubscribe from events
	 */
	destroy(): void {
		this.observerService.cleanup();
		eventBus.unsubscribe(
			"frontmatter-manually-changed",
			this.EVENT_SUBSCRIPTION_ID,
		);
		eventBus.unsubscribe(
			"frontmatter-manually-changed",
			"fileExplorerIntegrationSubscription2",
		);
	}

	/**
	 * Sets up workspace-level integration
	 */
	private setupWorkspaceIntegration(): void {
		this.plugin.app.workspace.onLayoutReady(() => {
			this.patchFileExplorer();
			this.registerActiveLeafChangeHandler();
		});
	}

	/**
	 * Registers handler for active leaf changes
	 */
	private registerActiveLeafChangeHandler(): void {
		this.plugin.registerEvent(
			this.plugin.app.workspace.on("active-leaf-change", () => {
				this.patchFileExplorer();
			}),
		);
	}

	/**
	 * Finds file element in the file explorer
	 */
	private findFileElement(filePath: string): HTMLElement | null {
		const fileExplorerView = this.getFileExplorerView();
		if (!fileExplorerView) return null;

		return fileExplorerView.containerEl.querySelector(
			`[data-path="${filePath}"]`,
		) as HTMLElement;
	}

	/**
	 * Refreshes icon for a specific element
	 */
	private refreshElementIcon(element: HTMLElement, dataPath: string): void {
		//
		// Remove existing icon
		// this.iconRenderer.removeIcon(element);

		// Mark for reprocessing
		this.observerService.markElementForReprocessing(element);

		this.processElement(element, dataPath);
		//
		// // Re-add icon with updated status
		// this.iconRenderer.renderIcon(element, dataPath);
	}

	/**
	 * Patches the file explorer with observers
	 */
	private patchFileExplorer(): void {
		const container = this.getFileExplorerContainer();
		if (!container) return;

		this.observerService.setupObservers(container);
	}

	/**
	 * Gets the file explorer view
	 */
	private getFileExplorerView(): View | null {
		const leaves = this.plugin.app.workspace.getLeavesOfType(
			this.FILE_EXPLORER_TYPE,
		);
		return leaves[0]?.view || null;
	}

	/**
	 * Gets the file explorer container element
	 */
	private getFileExplorerContainer(): Element | null {
		const fileExplorerView = this.getFileExplorerView();
		if (!fileExplorerView) return null;

		return fileExplorerView.containerEl.querySelector(
			this.CONTAINER_SELECTOR,
		);
	}
}
