import { ItemView, WorkspaceLeaf, TFile } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { GroupedStatusView as GroupedStatusViewComponent } from "@/components/GroupedStatusView/GroupedStatusView";
import {
	BaseNoteStatusService,
	NoteStatusService,
} from "@/core/noteStatusService";
import eventBus from "@/core/eventBus";
import { NoteStatus } from "@/types/noteStatus";
import { getAllFrontmatterKeys } from "@/core/statusKeyHelpers";

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
	lucideIcon?: string;
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
		lucideIcon: status.lucideIcon,
	});

	private getAllFiles = (): FileItem[] => {
		const tFiles = BaseNoteStatusService.app.vault.getFiles();
		return tFiles.map(this.convertTFileToFileItem);
	};

	private processFiles = (files: FileItem[]): GroupedByStatus => {
		const result: GroupedByStatus = {};
		const statusMetadataKeys = getAllFrontmatterKeys();
		const availableStatuses =
			BaseNoteStatusService.getAllAvailableStatuses();

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
			const tFile = BaseNoteStatusService.app.vault.getAbstractFileByPath(
				file.path,
			) as TFile;
			if (!tFile) return;

			const noteStatusService = new NoteStatusService(tFile);
			noteStatusService.populateStatuses();

			statusMetadataKeys.forEach((key) => {
				const statusesForKey = noteStatusService.getStatusesForKey(key);
				if (!statusesForKey.length) return;

				statusesForKey.forEach((status) => {
					const statusKey = status.templateId
						? `${status.templateId}:${status.name}`
						: status.name;
					if (!result[key][statusKey]) {
						result[key][statusKey] = [];
					}
					result[key][statusKey].push(file);
				});
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
			"status-changed",
			onDataChange,
			"grouped-dashboard-view-subscription",
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
					key === "statusFrontmatterMappings" ||
					key === "strictStatuses"
				) {
					onDataChange();
				}
			},
			"grouped-dashboard-view-settings-subscription",
		);
		const unsubscribeActiveFile = BaseNoteStatusService.app.workspace.on(
			"active-leaf-change",
			onDataChange,
		);

		return () => {
			eventBus.unsubscribe(
				"status-changed",
				"grouped-dashboard-view-subscription",
			);
			eventBus.unsubscribe(
				"plugin-settings-changed",
				"grouped-dashboard-view-settings-subscription",
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
