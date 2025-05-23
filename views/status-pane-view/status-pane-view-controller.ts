import { TFile, WorkspaceLeaf, View, Notice } from 'obsidian';
import { NoteStatusSettings } from '../../models/types';
import { StatusService } from '../../services/status-service';
import NoteStatus from 'main';
import { StatusPaneView } from './status-pane-view';

export class StatusPaneViewController extends View {
	private renderer: StatusPaneView;
	private settings: NoteStatusSettings;
	private statusService: StatusService;
	private plugin: NoteStatus;
	private searchQuery = '';
	private paginationState = {
		itemsPerPage: 100,
		currentPage: {} as Record<string, number>
	};

	constructor(leaf: WorkspaceLeaf, plugin: NoteStatus) {
		super(leaf);
		this.plugin = plugin;
		this.settings = plugin.settings;
		this.statusService = plugin.statusService;
		this.renderer = new StatusPaneView(this.statusService);
	}

	getViewType(): string { return 'status-pane'; }

	getDisplayText(): string { return 'Status pane'; }

	getIcon(): string { return 'tag'; }

	async onOpen(): Promise<void> {
		await this.setupPane();
	}

	onClose(): Promise<void> {
		this.containerEl.empty();
		return Promise.resolve();
	}


	private async setupPane(): Promise<void> {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass('note-status-pane', 'nav-files-container');
		containerEl.toggleClass('note-status-compact-view', this.settings.compactView);

		this.renderer.createHeader(containerEl, this.settings.compactView, {
			onSearch: (query) => {
				this.paginationState = {
					itemsPerPage: 100,
					currentPage: {} as Record<string, number>
				}
				this.searchQuery = query;
				this.renderGroups(query);
			},
			onToggleView: () => {
				this.settings.compactView = !this.settings.compactView;
				containerEl.toggleClass('note-status-compact-view', this.settings.compactView);
				window.dispatchEvent(new CustomEvent('note-status:settings-changed'));
				this.renderGroups(this.searchQuery);
			},
			onRefresh: async () => {
				await this.renderGroups(this.searchQuery);
				new Notice('Status pane refreshed');
			}
		});

		const groupsContainer = containerEl.createDiv({ cls: 'note-status-groups-container' });
		const loadingIndicator = this.renderer.createLoadingIndicator(groupsContainer);

		setTimeout(async () => {
			await this.renderGroups('');
			loadingIndicator.remove();
		}, 10);
	}

	private async renderGroups(searchQuery = ''): Promise<void> {
		const groupsContainerEl = this.containerEl.querySelector('.note-status-groups-container') as HTMLElement;
		if (!groupsContainerEl) return;

		if (searchQuery) {
			groupsContainerEl.empty();
			this.renderer.createLoadingIndicator(groupsContainerEl, `Searching for "${searchQuery}"...`);
			await new Promise(resolve => setTimeout(resolve, 0));
		} else {
			groupsContainerEl.empty();
		}

		const statusGroups = this.getFilteredStatusGroups(searchQuery);
		groupsContainerEl.empty();

		const hasGroups = this.renderer.renderStatusGroups(
			groupsContainerEl,
			statusGroups,
			{
				excludeUnknown: this.settings.excludeUnknownStatus,
				isCompactView: this.settings.compactView,
				collapsedStatuses: this.settings.collapsedStatuses,
				pagination: this.paginationState,
				callbacks: {
					onFileClick: (file) => {
						this.app.workspace.openLinkText(file.path, file.path, true);
					},
					onStatusToggle: (status, collapsed) => {
						this.settings.collapsedStatuses[status] = collapsed;
						window.dispatchEvent(new CustomEvent('note-status:settings-changed'));
					},
					onContextMenu: (e, file) => {
					},
					onPageChange: (status, page) => {
						this.paginationState.currentPage[status] = page;
						this.renderGroups(this.searchQuery);
					}
				}
			}
		);

		if (!hasGroups) {
			this.renderer.renderEmptyState(
				groupsContainerEl,
				searchQuery,
				this.settings.excludeUnknownStatus,
				async () => {
					this.settings.excludeUnknownStatus = false;
					await this.plugin.saveSettings();
					this.renderGroups(searchQuery);
				}
			);
		}
	}

	private getFilteredStatusGroups(searchQuery = ''): Record<string, TFile[]> {
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
		this.containerEl.toggleClass('note-status-compact-view', settings.compactView);
		this.renderGroups(this.searchQuery);
	}
}
