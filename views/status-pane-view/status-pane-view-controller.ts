import React from "react";
import { TFile, WorkspaceLeaf, View, Notice, App } from "obsidian";
import { NoteStatusSettings } from "../../models/types";
import { StatusService } from "../../services/status-service";
import NoteStatus from "main";
import { StatusPaneView, StatusPaneOptions } from "./StatusPaneView";
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
	private collapsedStatuses: Record<string, boolean> = {};

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

		await this.renderPane();
	}

	private async renderPane(): Promise<void> {
		const statusGroups = this.statusService.groupFilesByStatus(
			this.searchQuery,
		);

		const options: StatusPaneOptions = {
			excludeUnknown: this.settings.excludeUnknownStatus || false,
			isCompactView: this.settings.compactView || false,
			collapsedStatuses: this.collapsedStatuses,
			pagination: this.paginationState,
			callbacks: {
				onFileClick: (file: TFile) => {
					this.app.workspace.getLeaf().openFile(file);
				},
				onStatusToggle: (status: string, collapsed: boolean) => {
					this.collapsedStatuses[status] = collapsed;
				},
				onContextMenu: (e: MouseEvent, file: TFile) => {
					// Handle context menu for file
					console.log("Context menu for file:", file.path);
				},
				onPageChange: (status: string, page: number) => {
					this.paginationState.currentPage[status] = page;
					this.renderPane();
				},
			},
		};

		const headerCallbacks = {
			onSearch: (query: string) => {
				this.paginationState = {
					itemsPerPage: 100,
					currentPage: {} as Record<string, number>,
				};
				this.searchQuery = query;
				this.renderPane();
			},
			onToggleView: () => {
				this.settings.compactView = !this.settings.compactView;
				this.containerEl.toggleClass(
					"note-status-compact-view",
					this.settings.compactView,
				);
				window.dispatchEvent(
					new CustomEvent("note-status:settings-changed"),
				);
				this.renderPane();
			},
			onRefresh: async () => {
				await this.renderPane();
				new Notice("Status pane refreshed");
			},
		};

		const onShowUnassigned = () => {
			this.settings.excludeUnknownStatus = false;
			this.renderPane();
		};

		ReactUtils.render(
			React.createElement(StatusPaneView, {
				statusGroups,
				options,
				statusService: this.statusService,
				searchQuery: this.searchQuery,
				headerCallbacks,
				onShowUnassigned,
			}),
			this.containerEl,
		);
	}

	public async update(): Promise<void> {
		await this.renderPane();
	}

	public updateSettings(settings: NoteStatusSettings): void {
		this.settings = settings;
		this.renderPane();
	}
}
