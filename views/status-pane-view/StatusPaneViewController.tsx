import React from "react";
import { TFile, WorkspaceLeaf, View, Notice, App } from "obsidian";
import { NoteStatusSettings } from "../../models/types";
import { StatusService } from "../../services/status-service";
import NoteStatus from "../../main";
import { StatusPaneComponent } from "./StatusPaneComponent";
import { ReactUtils } from "../../utils/react-utils";

export class StatusPaneViewController extends View {
	private settings: NoteStatusSettings;
	private statusService: StatusService;
	private plugin: NoteStatus;
	private searchQuery = "";
	private paginationState = {
		itemsPerPage: 100,
		currentPage: {} as Record<string, number>,
	};

	static async open(app: App): Promise<void> {
		const existing = app.workspace.getLeavesOfType("status-pane")[0];
		if (existing) {
			app.workspace.setActiveLeaf(existing);
			return;
		}

		const leaf = app.workspace.getLeftLeaf(false);
		if (leaf) {
			await leaf.setViewState({ type: "status-pane", active: true });
		}
	}

	constructor(leaf: WorkspaceLeaf, plugin: NoteStatus) {
		super(leaf);
		this.plugin = plugin;
		this.settings = plugin.settings;
		this.statusService = plugin.statusService;
	}

	getViewType(): string {
		return "status-pane";
	}

	getDisplayText(): string {
		return "Status pane";
	}

	getIcon(): string {
		return "tag";
	}

	async onOpen(): Promise<void> {
		await this.setupPane();
	}

	onClose(): Promise<void> {
		ReactUtils.unmount(this.containerEl);
		this.containerEl.empty();
		return Promise.resolve();
	}

	private async setupPane(): Promise<void> {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass("note-status-pane", "nav-files-container");
		containerEl.toggleClass(
			"note-status-compact-view",
			this.settings.compactView,
		);

		this.renderStatusPane();
	}

	private renderStatusPane(): void {
		const statusGroups = this.getFilteredStatusGroups(this.searchQuery);

		ReactUtils.render(
			React.createElement(StatusPaneWrapper, {
				statusGroups,
				statusService: this.statusService,
				settings: this.settings,
				searchQuery: this.searchQuery,
				paginationState: this.paginationState,
				onSearch: this.handleSearch.bind(this),
				onToggleView: this.handleToggleView.bind(this),
				onRefresh: this.handleRefresh.bind(this),
				onFileClick: this.handleFileClick.bind(this),
				onStatusToggle: this.handleStatusToggle.bind(this),
				onContextMenu: this.handleContextMenu.bind(this),
				onPageChange: this.handlePageChange.bind(this),
				onShowUnassigned: this.handleShowUnassigned.bind(this),
			}),
			this.containerEl,
		);
	}

	private handleSearch(query: string): void {
		this.paginationState = {
			itemsPerPage: 100,
			currentPage: {} as Record<string, number>,
		};
		this.searchQuery = query;
		this.renderStatusPane();
	}

	private handleToggleView(): void {
		this.settings.compactView = !this.settings.compactView;
		this.containerEl.toggleClass(
			"note-status-compact-view",
			this.settings.compactView,
		);
		window.dispatchEvent(new CustomEvent("note-status:settings-changed"));
		this.renderStatusPane();
	}

	private async handleRefresh(): Promise<void> {
		this.renderStatusPane();
		new Notice("Status pane refreshed");
	}

	private handleFileClick(file: TFile): void {
		this.app.workspace.openLinkText(file.path, file.path, true);
	}

	private handleStatusToggle(status: string, collapsed: boolean): void {
		this.settings.collapsedStatuses[status] = collapsed;
	}

	private handleContextMenu(e: React.MouseEvent, file: TFile): void {
		// Context menu handling can be implemented here if needed
	}

	private handlePageChange(status: string, page: number): void {
		this.paginationState.currentPage[status] = page;
		this.renderStatusPane();
	}

	private async handleShowUnassigned(): Promise<void> {
		this.settings.excludeUnknownStatus = false;
		await this.plugin.saveSettings();
		this.renderStatusPane();
	}

	private getFilteredStatusGroups(searchQuery = ""): Record<string, TFile[]> {
		const rawGroups = this.statusService.groupFilesByStatus(searchQuery);
		const filteredGroups: Record<string, TFile[]> = {};

		Object.entries(rawGroups).forEach(([status, files]) => {
			if (files.length > 0) {
				filteredGroups[status] = files;
			}
		});

		return filteredGroups;
	}

	updateSettings(settings: NoteStatusSettings): void {
		this.settings = settings;
		this.containerEl.toggleClass(
			"note-status-compact-view",
			settings.compactView,
		);
		this.renderStatusPane();
	}

	public update(): void {
		this.renderStatusPane();
	}
}

interface StatusPaneWrapperProps {
	statusGroups: Record<string, TFile[]>;
	statusService: StatusService;
	settings: NoteStatusSettings;
	searchQuery: string;
	paginationState: {
		itemsPerPage: number;
		currentPage: Record<string, number>;
	};
	onSearch: (query: string) => void;
	onToggleView: () => void;
	onRefresh: () => Promise<void>;
	onFileClick: (file: TFile) => void;
	onStatusToggle: (status: string, collapsed: boolean) => void;
	onContextMenu: (e: React.MouseEvent, file: TFile) => void;
	onPageChange: (status: string, page: number) => void;
	onShowUnassigned: () => Promise<void>;
}

const StatusPaneWrapper: React.FC<StatusPaneWrapperProps> = ({
	statusGroups,
	statusService,
	settings,
	paginationState,
	onSearch,
	onToggleView,
	onRefresh,
	onFileClick,
	onStatusToggle,
	onContextMenu,
	onPageChange,
	onShowUnassigned,
}) => {
	return (
		<StatusPaneComponent
			statusGroups={statusGroups}
			statusService={statusService}
			isCompactView={settings.compactView}
			excludeUnknown={settings.excludeUnknownStatus}
			collapsedStatuses={settings.collapsedStatuses}
			pagination={paginationState}
			onFileClick={onFileClick}
			onStatusToggle={onStatusToggle}
			onContextMenu={onContextMenu}
			onPageChange={onPageChange}
			onSearch={onSearch}
			onToggleView={onToggleView}
			onRefresh={onRefresh}
			onShowUnassigned={onShowUnassigned}
		/>
	);
};
