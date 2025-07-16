import { ItemView, WorkspaceLeaf, TFile } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { GroupedStatusView as GroupedStatusViewComponent } from "@/components/GroupedStatusView/GroupedStatusView";
import { BaseNoteStatusService } from "@/core/noteStatusService";
import eventBus from "@/core/eventBus";
import settingsService from "@/core/settingsService";
import { NoteStatus } from "@/types/noteStatus";

export const VIEW_TYPE_GROUPED_DASHBOARD = "grouped-dashboard-view";

interface FileItem {
	id: string;
	name: string;
	path: string;
}

interface StatusItem {
	name: string;
	color: string;
	icon?: string;
}

interface FilesByStatus {
	[statusName: string]: FileItem[];
}

interface GroupedByStatus {
	[frontmatterTag: string]: FilesByStatus;
}

export class GroupedDashboardView extends ItemView {
	root: Root | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_GROUPED_DASHBOARD;
	}

	getDisplayText() {
		return "Grouped Status Dashboard";
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
		color: status.color || "",
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
		const statusMap = new Map(availableStatuses.map((s) => [s.name, s]));

		statusMetadataKeys.forEach((key) => {
			result[key] = {};
			availableStatuses.forEach((status) => {
				result[key][status.name] = [];
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
						if (statusMap.has(statusStr)) {
							if (!result[key][statusStr]) {
								result[key][statusStr] = [];
							}
							result[key][statusStr].push(file);
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
			"grouped-dashboard-view-subscription",
		);
		const unsubscribeActiveFile = BaseNoteStatusService.app.workspace.on(
			"active-leaf-change",
			onDataChange,
		);

		return () => {
			eventBus.unsubscribe(
				"frontmatter-manually-changed",
				"grouped-dashboard-view-subscription",
			);
			BaseNoteStatusService.app.workspace.offref(unsubscribeActiveFile);
		};
	};

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		container.addClass("grouped-dashboard-view-container");

		this.root = createRoot(container);
		this.root.render(
			<GroupedStatusViewComponent
				getAllFiles={this.getAllFiles}
				processFiles={this.processFiles}
				onFileClick={this.handleFileClick}
				subscribeToEvents={this.subscribeToEvents}
				getAvailableStatuses={this.getAvailableStatuses}
			/>,
		);
	}

	async onClose() {
		this.root?.unmount();
		this.root = null;
	}
}
