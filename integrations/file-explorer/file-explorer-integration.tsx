import { FileExplorerIcon } from "@/components/FileExplorer/FileExplorerIcon";
import eventBus from "@/core/eventBus";
import {
	LazyElementObserver,
	IElementProcessor,
} from "@/core/lazyElementObserver";
import { NoteStatusService } from "@/core/noteStatusService";
import settingsService from "@/core/settingsService";
import { GroupedStatuses } from "@/types/noteStatus";
import {
	getPrimaryStatus,
	getUnknownStatusColor,
	resolveStatusColor,
} from "@/utils/statusColor";
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
	private readonly FILE_NAME_COLORIZED_ATTR = "noteStatusColorized";
	private readonly FILE_NAME_ORIGINAL_COLOR_ATTR = "noteStatusOriginalColor";
	private readonly FILE_BLOCK_CLASS = "note-status-colored-block";
	private readonly FILE_BLOCK_COLOR_VAR = "--note-status-block-color";
	private readonly FILE_BORDER_CLASS = "note-status-border-left";
	private readonly FILE_BORDER_COLOR_VAR = "--note-status-border-color";
	private readonly FILE_UNDERLINE_CLASS = "note-status-underline";
	private readonly FILE_UNDERLINE_COLOR_VAR = "--note-status-underline-color";
	private readonly STATUS_DOT_CLASS = "note-status-dot-badge";

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
			"status-changed",
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
					key === "statusFrontmatterMappings" ||
					key === "strictStatuses" ||
					key === "fileExplorerIconPosition" ||
					key === "fileExplorerIconFrame" ||
					key === "fileExplorerIconColorMode" ||
					key === "fileExplorerColorFileName" ||
					key === "fileExplorerColorBlock" ||
					key === "fileExplorerLeftBorder" ||
					key === "fileExplorerStatusDot" ||
					key === "fileExplorerUnderlineFileName" ||
					key === "unknownStatusIcon" ||
					key === "unknownStatusLucideIcon" ||
					key === "unknownStatusColor" ||
					key === "templates"
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
		const abstractFile =
			this.plugin.app.vault.getAbstractFileByPath(dataPath);
		if (!(abstractFile instanceof TFile)) {
			return null;
		}

		const noteStatusService = new NoteStatusService(abstractFile);
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
			const statuses = noteStatusService?.statuses ?? null;
			const primaryStatus = getPrimaryStatus(statuses);
			const hasStatus = Boolean(primaryStatus);
			const fallbackColor = getUnknownStatusColor();
			const statusColor = primaryStatus
				? resolveStatusColor(primaryStatus, fallbackColor)
				: undefined;
			const textElement = textEl as HTMLElement;
			const navItem = this.getNavItemElement(textElement);

			this.applyFileNameColor(textElement, statusColor, hasStatus);
			this.applyFileNameUnderline(textElement, statusColor, hasStatus);
			this.applyStatusDot(textElement, statusColor, hasStatus);
			this.applyFileBlockColor(navItem, statusColor, hasStatus);
			this.applyLeftBorder(navItem, statusColor, hasStatus);

			if (noteStatusService) {
				this.render(textEl, noteStatusService.statuses);
			}
		}
	}

	private getUnknownStatusConfig() {
		return {
			icon: settingsService.settings.unknownStatusIcon || "❓",
			lucideIcon: settingsService.settings.unknownStatusLucideIcon || "",
			color: getUnknownStatusColor(),
		};
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
				unknownStatusConfig={this.getUnknownStatusConfig()}
				iconFrameMode={
					settingsService.settings.fileExplorerIconFrame || "never"
				}
				iconColorMode={
					settingsService.settings.fileExplorerIconColorMode ||
					"status"
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
		eventBus.unsubscribe("status-changed", this.EVENT_SUBSCRIPTION_ID);
		eventBus.unsubscribe(
			"status-changed",
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

	private applyFileNameColor(
		element?: HTMLElement | null,
		color?: string,
		hasStatus?: boolean,
	): void {
		if (!element) {
			return;
		}

		if (
			!settingsService.settings.fileExplorerColorFileName ||
			!hasStatus ||
			!color
		) {
			this.clearFileNameColor(element);
			return;
		}

		if (!element.dataset[this.FILE_NAME_ORIGINAL_COLOR_ATTR]) {
			element.dataset[this.FILE_NAME_ORIGINAL_COLOR_ATTR] =
				element.style.color || "";
		}

		element.dataset[this.FILE_NAME_COLORIZED_ATTR] = "true";
		element.style.color = color;
	}

	private applyFileBlockColor(
		navItem?: HTMLElement | null,
		color?: string,
		hasStatus?: boolean,
	): void {
		if (!navItem) {
			return;
		}

		if (
			!settingsService.settings.fileExplorerColorBlock ||
			!hasStatus ||
			!color
		) {
			this.clearFileBlockColor(navItem);
			return;
		}

		navItem.classList.add(this.FILE_BLOCK_CLASS);
		navItem.style.setProperty(this.FILE_BLOCK_COLOR_VAR, color);
	}

	private applyLeftBorder(
		navItem?: HTMLElement | null,
		color?: string,
		hasStatus?: boolean,
	): void {
		if (!navItem) {
			return;
		}

		if (
			!settingsService.settings.fileExplorerLeftBorder ||
			!hasStatus ||
			!color
		) {
			this.clearFileLeftBorder(navItem);
			return;
		}

		navItem.classList.add(this.FILE_BORDER_CLASS);
		navItem.style.setProperty(this.FILE_BORDER_COLOR_VAR, color);
	}

	private applyFileNameUnderline(
		element?: HTMLElement | null,
		color?: string,
		hasStatus?: boolean,
	): void {
		if (!element) {
			return;
		}

		if (
			!settingsService.settings.fileExplorerUnderlineFileName ||
			!hasStatus ||
			!color
		) {
			this.clearFileNameUnderline(element);
			return;
		}

		element.classList.add(this.FILE_UNDERLINE_CLASS);
		element.style.setProperty(this.FILE_UNDERLINE_COLOR_VAR, color);
	}

	private applyStatusDot(
		element?: HTMLElement | null,
		color?: string,
		hasStatus?: boolean,
	): void {
		if (!element) {
			return;
		}

		const existingDot = element.querySelector(
			`.${this.STATUS_DOT_CLASS}`,
		) as HTMLElement | null;
		if (
			!settingsService.settings.fileExplorerStatusDot ||
			!hasStatus ||
			!color
		) {
			if (existingDot) {
				existingDot.remove();
			}
			return;
		}

		const dot =
			existingDot ||
			createSpan({
				cls: this.STATUS_DOT_CLASS,
			});

		dot.setAttribute("aria-hidden", "true");
		dot.style.backgroundColor = color;

		if (!existingDot) {
			element.appendChild(dot);
		}
	}

	private getNavItemElement(
		element?: HTMLElement | null,
	): HTMLElement | null {
		if (!element) {
			return null;
		}
		return element.closest(".nav-file, .nav-folder") as HTMLElement | null;
	}

	private clearFileNameColor(element: HTMLElement): void {
		if (!element.dataset[this.FILE_NAME_COLORIZED_ATTR]) {
			return;
		}

		const previousColor =
			element.dataset[this.FILE_NAME_ORIGINAL_COLOR_ATTR] || "";
		if (previousColor) {
			element.style.color = previousColor;
		} else {
			element.style.removeProperty("color");
		}

		delete element.dataset[this.FILE_NAME_ORIGINAL_COLOR_ATTR];
		delete element.dataset[this.FILE_NAME_COLORIZED_ATTR];
	}

	private clearFileBlockColor(navItem?: HTMLElement | null): void {
		if (!navItem) {
			return;
		}
		navItem.classList.remove(this.FILE_BLOCK_CLASS);
		navItem.style.removeProperty(this.FILE_BLOCK_COLOR_VAR);
	}

	private clearFileLeftBorder(navItem?: HTMLElement | null): void {
		if (!navItem) {
			return;
		}
		navItem.classList.remove(this.FILE_BORDER_CLASS);
		navItem.style.removeProperty(this.FILE_BORDER_COLOR_VAR);
	}

	private clearFileNameUnderline(element: HTMLElement): void {
		element.classList.remove(this.FILE_UNDERLINE_CLASS);
		element.style.removeProperty(this.FILE_UNDERLINE_COLOR_VAR);
	}
}
