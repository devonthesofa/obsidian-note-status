import { ItemView, WorkspaceLeaf, TFile } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import {
	FileItem,
	GroupedByStatus,
	GroupedStatusView as GroupedStatusViewComponent,
	StatusItem,
} from "@/components/GroupedStatusView/GroupedStatusView";
import { BaseNoteStatusService } from "@/core/noteStatusService";
import eventBus from "@/core/eventBus";
import settingsService from "@/core/settingsService";
import { NoteStatus } from "@/types/noteStatus";

export const VIEW_TYPE_EXAMPLE = "grouped-status-view";

export class GroupedStatusView extends ItemView {
	root: Root | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_EXAMPLE;
	}

	getDisplayText() {
		return "Grouped Status";
	}

	getIcon() {
		return "list-tree";
	}

	private convertTFileToFileItem = (file: TFile): FileItem => ({
		id: file.path,
		name: file.basename,
		path: file.path,
	});

	private convertStatusToStatusItem = (status: NoteStatus): StatusItem => ({
		name: status.name,
		color: status.color || "white",
		icon: status.icon,
	});

	private getAllFiles = (): FileItem[] => {
		const tFiles = BaseNoteStatusService.app.vault.getMarkdownFiles();
		return tFiles.map(this.convertTFileToFileItem);
	};

	private processFiles = (files: FileItem[]): GroupedByStatus => {
		const result: GroupedByStatus = {};
		const statusMetadataKeys = [settingsService.settings.tagPrefix];
		const availableStatuses =
			BaseNoteStatusService.getAllAvailableStatuses();
		// Create maps for both scoped and legacy status lookup
		const statusMap = new Map(
			availableStatuses.map((s) => {
				const key = s.templateId ? `${s.templateId}:${s.name}` : s.name;
				return [key, s];
			}),
		);
		const legacyStatusMap = new Map(
			availableStatuses.map((s) => [s.name, s]),
		);

		statusMetadataKeys.forEach((key) => {
			result[key] = {};
			availableStatuses.forEach((status) => {
				const statusKey = status.templateId
					? `${status.templateId}:${status.name}`
					: status.name;
				result[key][statusKey] = [];
			});
		});

		files.forEach((file) => {
			// Find the TFile to get metadata
			const tFile = BaseNoteStatusService.app.vault.getAbstractFileByPath(
				file.path,
			) as TFile;
			if (!tFile) return;

			const cachedMetadata =
				BaseNoteStatusService.app.metadataCache.getFileCache(tFile);
			const frontmatter = cachedMetadata?.frontmatter;

			if (!frontmatter) return;

			statusMetadataKeys.forEach((key) => {
				const value = frontmatter[key];
				if (value) {
					const statusNames = Array.isArray(value) ? value : [value];
					statusNames.forEach((statusName) => {
						const statusStr = statusName.toString();
						// Try to find status by exact match first, then by legacy name
						let resolvedStatus = statusMap.get(statusStr);
						if (!resolvedStatus) {
							resolvedStatus = legacyStatusMap.get(statusStr);
						}

						if (resolvedStatus) {
							const statusKey = resolvedStatus.templateId
								? `${resolvedStatus.templateId}:${resolvedStatus.name}`
								: resolvedStatus.name;
							if (!result[key][statusKey]) {
								result[key][statusKey] = [];
							}
							result[key][statusKey].push(file);
						}
					});
				}
			});
		});

		return result;
	};

	private getAvailableStatuses = (): StatusItem[] => {
		const statuses = BaseNoteStatusService.getAllAvailableStatuses();
		return statuses.map(this.convertStatusToStatusItem);
	};

	private getAvailableStatusesWithTemplateInfo = () => {
		return BaseNoteStatusService.getAllAvailableStatuses();
	};

	private handleFileClick = (file: FileItem) => {
		const tFile = BaseNoteStatusService.app.vault.getAbstractFileByPath(
			file.path,
		) as TFile;
		if (tFile) {
			const leaf = BaseNoteStatusService.app.workspace.getLeaf();
			leaf.openFile(tFile);
		}
	};

	private subscribeToEvents = (onDataChange: () => void) => {
		eventBus.subscribe(
			"frontmatter-manually-changed",
			onDataChange,
			"grouped-status-view-subscription",
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
					key === "vaultSizeLimit"
				) {
					onDataChange();
				}
			},
			"grouped-status-view-settings-subscription",
		);
		const unsubscribeActiveFile = BaseNoteStatusService.app.workspace.on(
			"active-leaf-change",
			onDataChange,
		);

		return () => {
			eventBus.unsubscribe(
				"frontmatter-manually-changed",
				"grouped-status-view-subscription",
			);
			eventBus.unsubscribe(
				"plugin-settings-changed",
				"grouped-status-view-settings-subscription",
			);
			BaseNoteStatusService.app.workspace.offref(unsubscribeActiveFile);
		};
	};

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		container.addClass("grouped-status-view-container");

		// Check if vault exceeds the size limit
		const files = BaseNoteStatusService.app.vault.getMarkdownFiles();
		const vaultSizeLimit = settingsService.settings.vaultSizeLimit || 15000;

		if (vaultSizeLimit > 0 && files.length > vaultSizeLimit) {
			// Show disabled message
			container.createEl("div", {
				cls: "grouped-status-view-disabled",
				text: `Grouped Status View disabled: Vault has ${files.length} notes (limit: ${vaultSizeLimit}). You can adjust this limit in plugin settings.`,
			});
			return;
		}

		this.root = createRoot(container);
		this.root.render(
			<GroupedStatusViewComponent
				getAllFiles={this.getAllFiles}
				processFiles={this.processFiles}
				onFileClick={this.handleFileClick}
				subscribeToEvents={this.subscribeToEvents}
				getAvailableStatuses={this.getAvailableStatuses}
				getAvailableStatusesWithTemplateInfo={
					this.getAvailableStatusesWithTemplateInfo
				}
			/>,
		);
	}

	async onClose() {
		this.root?.unmount();
		this.root = null;
	}
}
