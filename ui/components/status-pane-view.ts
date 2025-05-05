import { TFile, WorkspaceLeaf, View, Menu, Notice, setIcon } from 'obsidian';
import { NoteStatusSettings } from '../../models/types';
import { StatusService } from '../../services/status-service';
import NoteStatus from 'main';

/**
 * Status Pane View for managing note statuses
 */
export class StatusPaneView extends View {
	plugin: NoteStatus;
	searchInput: HTMLInputElement | null = null;
	private settings: NoteStatusSettings;
	private statusService: StatusService;

	constructor(leaf: WorkspaceLeaf, plugin: NoteStatus) {
		super(leaf);
		this.plugin = plugin;
		this.settings = plugin.settings;
		this.statusService = plugin.statusService;
	}

	getViewType(): string {
		return 'status-pane';
	}

	getDisplayText(): string {
		return 'Status pane';
	}

	getIcon(): string {
		return 'status-pane';
	}

	async onOpen(): Promise<void> {
		await this.setupPane();
		await this.renderGroups('');
	}

	async setupPane(): Promise<void> {
		const { containerEl } = this;
		containerEl.empty();
		containerEl.addClass('note-status-pane', 'nav-files-container');

		// Add a header container for better layout
		const headerContainer = containerEl.createDiv({ cls: 'note-status-header' });

		// Search container with search input
		this.createSearchInput(headerContainer);

		// Actions toolbar (view toggle, refresh)
		this.createActionToolbar(headerContainer);

		// Set initial compact view state
		containerEl.toggleClass('compact-view', this.settings.compactView);

		// Add a container for the groups
		containerEl.createDiv({ cls: 'note-status-groups-container' });
	}

	private createSearchInput(container: HTMLElement): void {
		const searchContainer = container.createDiv({ cls: 'note-status-search search-input-container' });
		const searchWrapper = searchContainer.createDiv({ cls: 'search-input-wrapper' });

		// Search icon
		const searchIcon = searchWrapper.createEl('span', { cls: 'search-input-icon' });
		setIcon(searchIcon, 'search');

		// Create the search input
		this.searchInput = searchWrapper.createEl('input', {
			type: 'text',
			placeholder: 'Search notes...',
			cls: 'note-status-search-input search-input'
		});

		// Add search event listener
		this.searchInput.addEventListener('input', () => {
			this.renderGroups(this.searchInput!.value.toLowerCase());
			this.toggleClearButton();
		});

		// Clear search button (hidden by default)
		const clearSearchBtn = searchWrapper.createEl('span', { cls: 'search-input-clear-button' });
		setIcon(clearSearchBtn, 'x');

		clearSearchBtn.addEventListener('click', () => {
			if (this.searchInput) {
				this.searchInput.value = '';
				this.renderGroups('');
				this.toggleClearButton();
			}
		});
	}

	private toggleClearButton(): void {
		const clearBtn = this.containerEl.querySelector('.search-input-clear-button');
		if (clearBtn && this.searchInput) {
			clearBtn.toggleClass('is-visible', !!this.searchInput.value);
		}
	}

	private createActionToolbar(container: HTMLElement): void {
		const actionsContainer = container.createDiv({ cls: 'status-pane-actions-container' });
		
		// Toggle compact view button
		const viewToggleButton = actionsContainer.createEl('button', {
			type: 'button',
			title: this.settings.compactView ? 'Switch to Standard View' : 'Switch to Compact View',
			cls: 'note-status-view-toggle clickable-icon'
		});
		
		setIcon(viewToggleButton, this.settings.compactView ? 'layout' : 'table');
		
		viewToggleButton.addEventListener('click', async () => {
			this.settings.compactView = !this.settings.compactView;
			viewToggleButton.title = this.settings.compactView ? 'Switch to Standard View' : 'Switch to Compact View';
			viewToggleButton.empty();
			setIcon(viewToggleButton, this.settings.compactView ? 'layout' : 'table');
		
			// Trigger settings update
			window.dispatchEvent(new CustomEvent('note-status:settings-changed'));
		
			this.containerEl.toggleClass('compact-view', this.settings.compactView);
			await this.renderGroups(this.searchInput?.value.toLowerCase() || '');
		});
		
		// Refresh button
		const refreshButton = actionsContainer.createEl('button', {
			type: 'button',
			title: 'Refresh statuses',
			cls: 'note-status-actions-refresh clickable-icon'
		});
		
		setIcon(refreshButton, 'refresh-cw');
		
		refreshButton.addEventListener('click', async () => {
			await this.renderGroups(this.searchInput?.value.toLowerCase() || '');
			new Notice('Status pane refreshed');
		});
	}

	async renderGroups(searchQuery = ''): Promise<void> {
		const { containerEl } = this;
		const groupsContainer = containerEl.querySelector('.note-status-groups-container');
		if (!groupsContainer) return;

		groupsContainer.empty();

		// Group files by status
		const statusGroups = this.statusService.groupFilesByStatus(searchQuery);
		// Render each status group
		Object.entries(statusGroups).forEach(([status, files]) => {
			if (files.length > 0) {
				this.renderStatusGroup(groupsContainer as HTMLElement, status, files);
			}
		});
	}

	private renderStatusGroup(container: HTMLElement, status: string, files: TFile[]): void {
		const groupEl = container.createDiv({ cls: 'status-group nav-folder' });
		const titleEl = groupEl.createDiv({ cls: 'nav-folder-title' });

		// Create a container for the collapse button and title
		const collapseContainer = titleEl.createDiv({ cls: 'collapse-indicator' });
		setIcon(collapseContainer, 'chevron-down');

		// Create a container for the title content
		const titleContentContainer = titleEl.createDiv({ cls: 'nav-folder-title-content' });

		const statusIcon = this.statusService.getStatusIcon(status);
		titleContentContainer.createSpan({
			text: `${status} ${statusIcon} (${files.length})`,
			cls: `status-${status}`
		});

		// Handle collapsing/expanding behavior
		const isCollapsed = this.settings.collapsedStatuses[status] ?? false;

		if (isCollapsed) {
			groupEl.addClass('is-collapsed');
			collapseContainer.empty();
			setIcon(collapseContainer, 'chevron-right');
		}

		titleEl.addEventListener('click', (e) => {
			e.preventDefault();
			const isCurrentlyCollapsed = groupEl.hasClass('is-collapsed');

			// Toggle the collapsed state
			if (isCurrentlyCollapsed) {
			groupEl.removeClass('is-collapsed');
			collapseContainer.empty();
			setIcon(collapseContainer, 'chevron-down');
			} else {
			groupEl.addClass('is-collapsed');
			collapseContainer.empty();
			setIcon(collapseContainer, 'chevron-right');
			}

			// Update the settings
			this.settings.collapsedStatuses[status] = !isCurrentlyCollapsed;

			// Trigger settings save
			window.dispatchEvent(new CustomEvent('note-status:settings-changed'));
		});

		// Create and populate child elements
		const childrenEl = groupEl.createDiv({ cls: 'nav-folder-children' });

		// Sort files by name
		files.sort((a, b) => a.basename.localeCompare(b.basename));

		// Create file list items
		files.forEach(file => {
			this.createFileListItem(childrenEl, file, status);
		});
	}

	private createFileListItem(container: HTMLElement, file: TFile, status: string): void {
		const fileEl = container.createDiv({ cls: 'nav-file' });
		const fileTitleEl = fileEl.createDiv({ cls: 'nav-file-title' });

		// Add file icon if in standard view
		if (!this.settings.compactView) {
			const fileIcon = fileTitleEl.createDiv({ cls: 'nav-file-icon' });
			setIcon(fileIcon, 'file');
		}

		// Add file name
		fileTitleEl.createSpan({
			text: file.basename,
			cls: 'nav-file-title-content'
		});

		// Add status indicator
		fileTitleEl.createSpan({
			cls: `note-status-icon nav-file-tag status-${status}`,
			text: this.statusService.getStatusIcon(status)
		});

		// Add click handler to open the file
		fileEl.addEventListener('click', (e) => {
			e.preventDefault();
			this.app.workspace.openLinkText(file.path, file.path, true);
		});

		// Add context menu
		fileEl.addEventListener('contextmenu', (e) => {
			e.preventDefault();
			this.showFileContextMenu(e, file);
		});
	}

	private showFileContextMenu(e: MouseEvent, file: TFile): void {
		const menu = new Menu();
	
		// Add status change options
		menu.addItem((item) =>
		item.setTitle('Change status')
			.setIcon('tag')
			.onClick(() => {
			// Use the position from the event
			// const position = { x: e.clientX, y: e.clientY };
			this.plugin.statusContextMenu.showForFile(file, e);
			})
		);
	
		// Add open options
		menu.addItem((item) =>
		item.setTitle('Open in new tab')
			.setIcon('lucide-external-link')
			.onClick(() => {
			this.app.workspace.openLinkText(file.path, file.path, 'tab');
			})
		);
	
		menu.showAtMouseEvent(e);
	}

	onClose(): Promise<void> {
		this.containerEl.empty();
		return Promise.resolve();
	}

	/**
	 * Update view when settings change
	 */
	updateSettings(settings: NoteStatusSettings): void {
		this.settings = settings;
		this.containerEl.toggleClass('compact-view', settings.compactView);

		// Refresh the view with the current search query
		this.renderGroups(this.searchInput?.value.toLowerCase() || '');
	}
}
