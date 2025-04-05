import { App, Editor, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, TFile, Menu, Modal, View, WorkspaceLeaf, addIcon } from 'obsidian';

// Define icons as constants
const ICONS = {
	statusPane: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path fill="currentColor" d="M3 3h18v18H3V3zm2 2v14h14V5H5zm2 2h10v2H7V7zm0 4h10v2H7v-2zm0 4h10v2H7v-2z"/>
  </svg>`,
	search: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" 
      stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>`,
	clear: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>`,
	standardView: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>`,
	compactView: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>`,
	refresh: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38"/></svg>`,
	collapseDown: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`,
	collapseRight: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`,
	file: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`
};

// Add custom icons to Obsidian
addIcon('status-pane', ICONS.statusPane);

// TypeScript interfaces
interface Status {
	name: string;
	icon: string;
}

interface NoteStatusSettings {
	statusColors: Record<string, string>;
	showStatusDropdown: boolean;
	showStatusBar: boolean;
	dropdownPosition: 'top' | 'bottom';
	statusBarPosition: 'left' | 'right';
	autoHideStatusBar: boolean;
	customStatuses: Status[];
	showStatusIconsInExplorer: boolean;
	collapsedStatuses: Record<string, boolean>;
	compactView?: boolean;
}

const DEFAULT_SETTINGS: NoteStatusSettings = {
	statusColors: {
		active: 'var(--text-success)',
		onHold: 'var(--text-warning)',
		completed: 'var(--text-accent)',
		dropped: 'var(--text-error)',
		unknown: 'var(--text-muted)'
	},
	showStatusDropdown: true,
	showStatusBar: true,
	dropdownPosition: 'top',
	statusBarPosition: 'right',
	autoHideStatusBar: false,
	customStatuses: [
		{ name: 'active', icon: '▶️' },
		{ name: 'onHold', icon: '⏸️' },
		{ name: 'completed', icon: '✅' },
		{ name: 'dropped', icon: '❌' },
		{ name: 'unknown', icon: '❓' }
	],
	showStatusIconsInExplorer: true,
	collapsedStatuses: {},
	compactView: false
};

// Default colors in hexadecimal format
const DEFAULT_COLORS: Record<string, string> = {
	active: '#00ff00',    // Green for success
	onHold: '#ffaa00',    // Orange for warning
	completed: '#00aaff', // Blue for accent
	dropped: '#ff0000',   // Red for error
	unknown: '#888888'    // Gray for muted
};

/**
 * Status Pane View for managing note statuses
 */
class StatusPaneView extends View {
	plugin: NoteStatus;
	searchInput: HTMLInputElement | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: NoteStatus) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType() { return 'status-pane'; }
	getDisplayText() { return 'Status Pane'; }
	getIcon() { return 'status-pane'; }

	async onOpen() {
		await this.setupPane();
		await this.renderGroups('');
	}

	async setupPane() {
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
		containerEl.toggleClass('compact-view', this.plugin.settings.compactView);

		// Add a container for the groups
		containerEl.createDiv({ cls: 'note-status-groups-container' });
	}

	private createSearchInput(container: HTMLElement) {
		const searchContainer = container.createDiv({ cls: 'note-status-search search-input-container' });
		const searchWrapper = searchContainer.createDiv({ cls: 'search-input-wrapper' });

		// Search icon
		searchWrapper.createEl('span', { cls: 'search-input-icon' }).innerHTML = ICONS.search;

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
		clearSearchBtn.innerHTML = ICONS.clear;

		clearSearchBtn.addEventListener('click', () => {
			if (this.searchInput) {
				this.searchInput.value = '';
				this.renderGroups('');
				this.toggleClearButton();
			}
		});
	}

	private toggleClearButton() {
		const clearBtn = this.containerEl.querySelector('.search-input-clear-button');
		if (clearBtn && this.searchInput) {
			clearBtn.toggleClass('is-visible', !!this.searchInput.value);
		}
	}

	private createActionToolbar(container: HTMLElement) {
		const actionsContainer = container.createDiv({ cls: 'status-pane-actions-container' });

		// Toggle compact view button
		const viewToggleButton = actionsContainer.createEl('button', {
			type: 'button',
			title: this.plugin.settings.compactView ? 'Switch to Standard View' : 'Switch to Compact View',
			cls: 'note-status-view-toggle clickable-icon'
		});

		viewToggleButton.innerHTML = this.plugin.settings.compactView ? ICONS.compactView : ICONS.standardView;

		viewToggleButton.addEventListener('click', async () => {
			this.plugin.settings.compactView = !this.plugin.settings.compactView;
			viewToggleButton.title = this.plugin.settings.compactView ? 'Switch to Standard View' : 'Switch to Compact View';
			viewToggleButton.innerHTML = this.plugin.settings.compactView ? ICONS.compactView : ICONS.standardView;

			await this.plugin.saveSettings();
			this.containerEl.toggleClass('compact-view', this.plugin.settings.compactView);
			await this.renderGroups(this.searchInput?.value.toLowerCase() || '');
		});

		// Refresh button
		const refreshButton = actionsContainer.createEl('button', {
			type: 'button',
			title: 'Refresh Statuses',
			cls: 'note-status-actions-refresh clickable-icon'
		});

		refreshButton.innerHTML = ICONS.refresh;

		refreshButton.addEventListener('click', async () => {
			await this.renderGroups(this.searchInput?.value.toLowerCase() || '');
			new Notice('Status pane refreshed');
		});
	}

	async renderGroups(searchQuery = '') {
		const { containerEl } = this;
		const groupsContainer = containerEl.querySelector('.note-status-groups-container');
		if (!groupsContainer) return;

		groupsContainer.empty();

		// Group files by status
		const statusGroups = this.groupFilesByStatus(searchQuery);

		// Render each status group
		Object.entries(statusGroups).forEach(([status, files]) => {
			if (files.length > 0) {
				this.renderStatusGroup(groupsContainer, status, files);
			}
		});
	}

	private groupFilesByStatus(searchQuery: string): Record<string, TFile[]> {
		const statusGroups: Record<string, TFile[]> = {};

		// Initialize groups for each status
		this.plugin.settings.customStatuses.forEach(status => {
			statusGroups[status.name] = [];
		});

		// Get all markdown files and filter by search query
		const files = this.app.vault.getMarkdownFiles();

		for (const file of files) {
			if (!searchQuery || file.basename.toLowerCase().includes(searchQuery)) {
				const status = this.plugin.getFileStatus(file);
				statusGroups[status].push(file);
			}
		}

		return statusGroups;
	}

	private renderStatusGroup(container: HTMLElement, status: string, files: TFile[]) {
		const groupEl = container.createDiv({ cls: 'status-group nav-folder' });
		const titleEl = groupEl.createDiv({ cls: 'nav-folder-title' });

		// Create a container for the collapse button and title
		const collapseContainer = titleEl.createDiv({ cls: 'collapse-indicator' });
		collapseContainer.innerHTML = ICONS.collapseDown;

		// Create a container for the title content
		const titleContentContainer = titleEl.createDiv({ cls: 'nav-folder-title-content' });

		const statusIcon = this.plugin.getStatusIcon(status);
		titleContentContainer.createSpan({
			text: `${status} ${statusIcon} (${files.length})`,
			cls: `status-${status}`
		});

		// Handle collapsing/expanding behavior
		titleEl.style.cursor = 'pointer';
		const isCollapsed = this.plugin.settings.collapsedStatuses[status] ?? false;

		if (isCollapsed) {
			groupEl.addClass('is-collapsed');
			collapseContainer.innerHTML = ICONS.collapseRight;
		}

		titleEl.addEventListener('click', (e) => {
			e.preventDefault();
			groupEl.toggleClass('is-collapsed');
			this.plugin.settings.collapsedStatuses[status] = groupEl.hasClass('is-collapsed');

			// Update the collapse icon
			collapseContainer.innerHTML = groupEl.hasClass('is-collapsed')
				? ICONS.collapseRight
				: ICONS.collapseDown;

			this.plugin.saveSettings();
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

	private createFileListItem(container: HTMLElement, file: TFile, status: string) {
		const fileEl = container.createDiv({ cls: 'nav-file' });
		const fileTitleEl = fileEl.createDiv({ cls: 'nav-file-title' });

		// Add file icon if in standard view
		if (!this.plugin.settings.compactView) {
			const fileIcon = fileTitleEl.createDiv({ cls: 'nav-file-icon' });
			fileIcon.innerHTML = ICONS.file;
		}

		// Add file name
		fileTitleEl.createSpan({
			text: file.basename,
			cls: 'nav-file-title-content'
		});

		// Add status indicator
		fileTitleEl.createSpan({
			cls: `note-status-icon nav-file-tag status-${status}`,
			text: this.plugin.getStatusIcon(status)
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

	private showFileContextMenu(e: MouseEvent, file: TFile) {
		const menu = new Menu();

		// Add status change options
		menu.addItem((item) =>
			item.setTitle('Change Status')
				.setIcon('tag')
				.onClick(() => {
					this.plugin.showStatusContextMenu([file]);
				})
		);

		// Add open options
		menu.addItem((item) =>
			item.setTitle('Open in New Tab')
				.setIcon('lucide-external-link')
				.onClick(() => {
					this.app.workspace.openLinkText(file.path, file.path, 'tab');
				})
		);

		menu.showAtMouseEvent(e);
	}

	onClose() {
		this.containerEl.empty();
		return Promise.resolve();
	}
}

/**
 * Main plugin class
 */
export default class NoteStatus extends Plugin {
	settings: NoteStatusSettings;
	statusBarItem: HTMLElement;
	currentStatus = 'unknown';
	statusDropdownContainer?: HTMLElement;
	private statusPaneLeaf: WorkspaceLeaf | null = null;
	private dynamicStyleEl?: HTMLStyleElement;

	async onload() {
		// Load settings and set defaults
		await this.loadSettings();
		this.initializeDefaultColors();

		// Initialize dynamic styles
		this.updateDynamicStyles();

		// Register the status pane view
		this.registerView('status-pane', (leaf) => {
			this.statusPaneLeaf = leaf;
			return new StatusPaneView(leaf, this);
		});

		// Add ribbon icon
		this.addRibbonIcon('status-pane', 'Open Status Pane', () => {
			this.openStatusPane();
		});

		// Add status bar item
		this.initializeStatusBar();

		// Register commands
		this.registerCommands();

		// Register file menu and context menu handlers
		this.registerMenuHandlers();

		// Register workspace and vault events
		this.registerEvents();

		// Initialize UI on layout ready
		this.app.workspace.onLayoutReady(async () => {
			// Small delay to ensure everything is loaded
			await new Promise(resolve => setTimeout(resolve, 500));
			this.checkNoteStatus();
			this.updateStatusDropdown();
			this.updateAllFileExplorerIcons();
		});

		// Add settings tab
		this.addSettingTab(new NoteStatusSettingTab(this.app, this));
	}

	private initializeDefaultColors() {
		// Ensure default colors are set for all statuses
		for (const [status, color] of Object.entries(DEFAULT_COLORS)) {
			if (!this.settings.statusColors[status]) {
				this.settings.statusColors[status] = color;
			}
		}
	}

	private initializeStatusBar() {
		this.statusBarItem = this.addStatusBarItem();
		this.statusBarItem.addClass('note-status-bar');

		// Add click handler to toggle status dropdown
		this.statusBarItem.addEventListener('click', () => {
			this.settings.showStatusDropdown = !this.settings.showStatusDropdown;
			this.updateStatusDropdown();
			this.saveSettings();
			new Notice(`Status dropdown ${this.settings.showStatusDropdown ? 'shown' : 'hidden'}`);
		});

		this.updateStatusBar();
	}

	private registerCommands() {
		// Refresh status command
		this.addCommand({
			id: 'refresh-status',
			name: 'Refresh Status',
			callback: () => {
				this.checkNoteStatus();
				new Notice('Note status refreshed!');
			}
		});

		// Batch update status command
		this.addCommand({
			id: 'batch-update-status',
			name: 'Batch Update Status',
			callback: () => this.showBatchStatusModal()
		});

		// Insert status metadata command
		this.addCommand({
			id: 'insert-status-metadata',
			name: 'Insert Status Metadata',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.insertStatusMetadataInEditor(editor);
			}
		});

		// Open status pane command
		this.addCommand({
			id: 'open-status-pane',
			name: 'Open Status Pane',
			callback: () => this.openStatusPane()
		});
	}

	private registerMenuHandlers() {
		// File explorer context menu
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file, source) => {
				if (source === 'file-explorer-context-menu' && file instanceof TFile && file.extension === 'md') {
					menu.addItem((item) =>
						item
							.setTitle('Change Status of Selected Files')
							.setIcon('tag')
							.onClick(() => {
								const selectedFiles = this.getSelectedFiles();
								if (selectedFiles.length > 1) {
									this.showBatchStatusContextMenu(selectedFiles);
								} else {
									this.showBatchStatusContextMenu([file]);
								}
							})
					);
				}
			})
		);

		// Multiple files selection menu
		this.registerEvent(
			this.app.workspace.on('files-menu', (menu, files) => {
				const mdFiles = files.filter(file => file instanceof TFile && file.extension === 'md') as TFile[];
				if (mdFiles.length > 0) {
					menu.addItem((item) =>
						item
							.setTitle('Change Status of Selected Files')
							.setIcon('tag')
							.onClick(() => {
								this.showBatchStatusContextMenu(mdFiles);
							})
					);
				}
			})
		);

		// Editor context menu
		this.registerEvent(
			this.app.workspace.on('editor-menu', (menu, editor, view) => {
				if (view instanceof MarkdownView) {
					menu.addItem((item) =>
						item
							.setTitle('Change Note Status')
							.setIcon('tag')
							.onClick(() => this.showStatusDropdown(editor, view))
					);
				}
			})
		);
	}

	private registerEvents() {
		// File open event
		this.registerEvent(this.app.workspace.on('file-open', () => {
			this.checkNoteStatus();
			this.updateStatusDropdown();
		}));

		// Editor change event
		this.registerEvent(this.app.workspace.on('editor-change', () => this.checkNoteStatus()));

		// Active leaf change event
		this.registerEvent(this.app.workspace.on('active-leaf-change', () => {
			this.updateStatusDropdown();
			this.updateStatusPane();
		}));

		// File modification events
		this.registerEvent(this.app.vault.on('modify', (file) => {
			if (file instanceof TFile) {
				this.updateFileExplorerIcons(file);
				this.updateStatusPane();
			}
		}));

		// File creation event
		this.registerEvent(this.app.vault.on('create', () => {
			this.updateAllFileExplorerIcons();
			this.updateStatusPane();
		}));

		// File deletion event
		this.registerEvent(this.app.vault.on('delete', () => {
			this.updateAllFileExplorerIcons();
			this.updateStatusPane();
		}));

		// File rename event
		this.registerEvent(this.app.vault.on('rename', () => {
			this.updateAllFileExplorerIcons();
			this.updateStatusPane();
		}));

		// Metadata change events
		this.registerEvent(this.app.metadataCache.on('changed', (file) => {
			this.checkNoteStatus();
			this.updateFileExplorerIcons(file);
			this.updateStatusPane();
		}));

		// Metadata resolved event
		this.registerEvent(this.app.metadataCache.on('resolved', () => {
			this.updateAllFileExplorerIcons();
		}));
	}

	async openStatusPane() {
		const existing = this.app.workspace.getLeavesOfType('status-pane')[0];
		if (existing) {
			this.app.workspace.setActiveLeaf(existing);
			await this.updateStatusPane();
		} else {
			const leaf = this.app.workspace.getLeftLeaf(false);
			if (leaf) await leaf.setViewState({ type: 'status-pane', active: true });
		}
	}

	getSelectedFiles(): TFile[] {
		const fileExplorer = this.app.workspace.getLeavesOfType('file-explorer')[0];
		if (!fileExplorer || !fileExplorer.view || !('fileItems' in fileExplorer.view)) {
			console.log('File explorer not found or no file items');
			return [];
		}

		const fileItems = fileExplorer.view.fileItems as Record<string, { el: HTMLElement; file: TFile }>;
		const selectedFiles: TFile[] = [];

		Object.entries(fileItems).forEach(([_, item]) => {
			if (item.el?.classList.contains('is-selected') && item.file instanceof TFile && item.file.extension === 'md') {
				selectedFiles.push(item.file);
			}
		});

		return selectedFiles;
	}

	showStatusContextMenu(files: TFile[]) {
		this.showBatchStatusContextMenu(files);
	}

	showBatchStatusContextMenu(files: TFile[]) {
		const menu = new Menu();

		this.settings.customStatuses
			.filter(status => status.name !== 'unknown')
			.forEach(status => {
				menu.addItem((item) =>
					item
						.setTitle(`${status.name} ${status.icon}`)
						.setIcon('tag')
						.onClick(async () => {
							for (const file of files) {
								await this.updateNoteStatus(status.name, file);
							}
							new Notice(`Updated status of ${files.length} file${files.length === 1 ? '' : 's'} to ${status.name}`);
						})
				);
			});

		menu.showAtMouseEvent(new MouseEvent('contextmenu'));
	}

	async updateNoteStatus(newStatus: string, file?: TFile) {
		const targetFile = file || this.app.workspace.getActiveFile();
		if (!targetFile || targetFile.extension !== 'md') return;

		const content = await this.app.vault.read(targetFile);
		let newContent = content;

		// Handle frontmatter update
		const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n?/);
		if (frontmatterMatch) {
			const frontmatter = frontmatterMatch[1];
			if (frontmatter.includes('status:')) {
				newContent = content.replace(
					/^---\n([\s\S]*?)status:\s*[^\n]+([\s\S]*?)\n---\n?/,
					`---\n$1status: ${newStatus}$2\n---\n`
				);
			} else {
				newContent = content.replace(
					/^---\n([\s\S]*?)\n---\n?/,
					`---\n$1\nstatus: ${newStatus}\n---\n`
				);
			}
		} else {
			newContent = `---\nstatus: ${newStatus}\n---\n${content.trim()}`;
		}

		// Clean up excess newlines
		newContent = newContent.replace(/\n{3,}/g, '\n\n');

		// Update the file
		await this.app.vault.modify(targetFile, newContent);

		// Update UI if this is the active file
		if (targetFile === this.app.workspace.getActiveFile()) {
			this.currentStatus = newStatus;
			this.updateStatusBar();
			this.updateStatusDropdown();
		}

		this.updateFileExplorerIcons(targetFile);
		this.updateStatusPane();
	}

	/**
	 * Get the status of a file from its metadata
	 */
	getFileStatus(file: TFile): string {
		const cachedMetadata = this.app.metadataCache.getFileCache(file);
		let status = 'unknown';

		if (cachedMetadata?.frontmatter?.status) {
			const frontmatterStatus = cachedMetadata.frontmatter.status.toLowerCase();
			const matchingStatus = this.settings.customStatuses.find(s =>
				s.name.toLowerCase() === frontmatterStatus);

			if (matchingStatus) status = matchingStatus.name;
		}

		return status;
	}

	checkNoteStatus() {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile || activeFile.extension !== 'md') {
			this.currentStatus = 'unknown';
			this.updateStatusBar();
			this.updateStatusDropdown();
			return;
		}

		this.currentStatus = this.getFileStatus(activeFile);
		this.updateStatusBar();
		this.updateStatusDropdown();
		this.updateFileExplorerIcons(activeFile);
	}

	async showBatchStatusModal() {
		const modal = new Modal(this.app);
		modal.contentEl.createEl('h2', { text: 'Batch Update Note Status' });
		modal.contentEl.addClass('note-status-batch-modal');

		// Create file selection with search filter
		const searchContainer = modal.contentEl.createDiv({ cls: 'note-status-modal-search' });
		const searchInput = searchContainer.createEl('input', {
			type: 'text',
			placeholder: 'Filter files...',
			cls: 'note-status-modal-search-input'
		});

		// File selection container
		const fileSelectContainer = modal.contentEl.createDiv({ cls: 'note-status-file-select-container' });
		const fileSelect = fileSelectContainer.createEl('select', {
			cls: 'note-status-file-select',
			attr: { multiple: 'true', size: '10' }
		});

		// Get all markdown files and populate select
		const mdFiles = this.app.vault.getMarkdownFiles();
		const populateFiles = (filter = '') => {
			fileSelect.empty();
			mdFiles
				.filter(file => !filter || file.path.toLowerCase().includes(filter.toLowerCase()))
				.sort((a, b) => a.path.localeCompare(b.path))
				.forEach(file => {
					const status = this.getFileStatus(file);
					const option = fileSelect.createEl('option', {
						text: `${file.path} ${this.getStatusIcon(status)}`,
						value: file.path
					});
					option.classList.add(`status-${status}`);
				});
		};

		populateFiles();

		// Add search functionality
		searchInput.addEventListener('input', () => {
			populateFiles(searchInput.value);
		});

		// Status selection
		const statusSelectContainer = modal.contentEl.createDiv({ cls: 'note-status-status-select-container' });
		const statusSelect = statusSelectContainer.createEl('select', { cls: 'note-status-status-select' });

		// Add status options
		this.settings.customStatuses.forEach(status => {
			const option = statusSelect.createEl('option', {
				text: `${status.name} ${status.icon}`,
				value: status.name
			});
			option.classList.add(`status-${status.name}`);
		});

		// Add action buttons
		const buttonContainer = modal.contentEl.createDiv({ cls: 'note-status-modal-buttons' });

		// Select all button
		const selectAllButton = buttonContainer.createEl('button', {
			text: 'Select All',
			cls: 'note-status-select-all'
		});

		selectAllButton.addEventListener('click', () => {
			for (const option of Array.from(fileSelect.options)) {
				option.selected = true;
			}
		});

		// Apply button
		const applyButton = buttonContainer.createEl('button', {
			text: 'Apply Status',
			cls: 'mod-cta'
		});

		applyButton.addEventListener('click', async () => {
			const selectedFiles = Array.from(fileSelect.selectedOptions)
				.map(opt => mdFiles.find(f => f.path === opt.value))
				.filter(Boolean) as TFile[];

			if (selectedFiles.length === 0) {
				new Notice('No files selected');
				return;
			}

			const newStatus = statusSelect.value;
			for (const file of selectedFiles) {
				await this.updateNoteStatus(newStatus, file);
			}

			new Notice(`Updated status of ${selectedFiles.length} note${selectedFiles.length !== 1 ? 's' : ''} to ${newStatus}`);
			modal.close();
		});

		modal.open();
	}

	private insertStatusMetadataInEditor(editor: Editor) {
		const content = editor.getValue();
		const statusMetadata = 'status: unknown';

		// Check if frontmatter exists
		const frontMatterMatch = content.match(/^---\n([\s\S]+?)\n---/);

		if (frontMatterMatch) {
			const frontMatter = frontMatterMatch[1];
			let updatedFrontMatter = frontMatter;

			// Check if status already exists in frontmatter
			if (/^status:/.test(frontMatter)) {
				updatedFrontMatter = frontMatter.replace(/^status: .*/m, statusMetadata);
			} else {
				updatedFrontMatter = `${frontMatter}\n${statusMetadata}`;
			}

			const updatedContent = content.replace(/^---\n([\s\S]+?)\n---/, `---\n${updatedFrontMatter}\n---`);
			editor.setValue(updatedContent);
		} else {
			// Create new frontmatter if it doesn't exist
			const newFrontMatter = `---\n${statusMetadata}\n---\n${content}`;
			editor.setValue(newFrontMatter);
		}
	}

	updateStatusBar() {
		this.statusBarItem.empty();
		this.statusBarItem.removeClass('left', 'hidden', 'auto-hide', 'visible');
		this.statusBarItem.addClass('note-status-bar');

		if (!this.settings.showStatusBar) {
			this.statusBarItem.addClass('hidden');
			return;
		}

		// Add left class if needed
		if (this.settings.statusBarPosition === 'left') {
			this.statusBarItem.addClass('left');
		}

		// Create status text
		this.statusBarItem.createEl('span', {
			text: `Status: ${this.currentStatus}`,
			cls: `note-status-${this.currentStatus}`
		});

		// Create status icon
		this.statusBarItem.createEl('span', {
			text: this.getStatusIcon(this.currentStatus),
			cls: `note-status-icon status-${this.currentStatus}`
		});

		// Handle auto-hide behavior
		if (this.settings.autoHideStatusBar && this.currentStatus === 'unknown') {
			this.statusBarItem.addClass('auto-hide');
			setTimeout(() => {
				if (this.currentStatus === 'unknown' && this.settings.showStatusBar) {
					this.statusBarItem.addClass('hidden');
				}
			}, 500);
		} else {
			this.statusBarItem.addClass('visible');
		}
	}

	getStatusIcon(status: string): string {
		const customStatus = this.settings.customStatuses.find(s => s.name.toLowerCase() === status.toLowerCase());
		return customStatus ? customStatus.icon : '❓';
	}

	async updateStatusPane() {
		if (this.statusPaneLeaf && this.statusPaneLeaf.view instanceof StatusPaneView) {
			const searchQuery = (this.statusPaneLeaf.view as StatusPaneView).searchInput?.value.toLowerCase() || '';
			await (this.statusPaneLeaf.view as StatusPaneView).renderGroups(searchQuery);
		}
	}

	showStatusDropdown(editor: Editor, view: MarkdownView) {
		const menu = new Menu();

		// Add status options to menu
		this.settings.customStatuses
			.filter(status => status.name !== 'unknown')
			.forEach(status => {
				menu.addItem((item) =>
					item
						.setTitle(`${status.name} ${status.icon}`)
						.setIcon('tag')
						.onClick(async () => {
							await this.updateNoteStatus(status.name);
						})
				);
			});

		// Position menu near cursor
		const cursor = editor.getCursor('to');
		editor.posToOffset(cursor);
		const editorEl = view.contentEl.querySelector('.cm-content');

		if (editorEl) {
			const rect = editorEl.getBoundingClientRect();
			menu.showAtPosition({ x: rect.left, y: rect.bottom });
		} else {
			menu.showAtPosition({ x: 0, y: 0 });
		}
	}

	updateStatusDropdown() {
		// Remove existing dropdown if setting is turned off
		if (!this.settings.showStatusDropdown) {
			if (this.statusDropdownContainer) {
				this.statusDropdownContainer.remove();
				this.statusDropdownContainer = undefined;
			}
			return;
		}

		// Check for active markdown view
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) {
			if (this.statusDropdownContainer) {
				this.statusDropdownContainer.remove();
				this.statusDropdownContainer = undefined;
			}
			return;
		}

		// Create or update the dropdown container
		const contentEl = view.contentEl;
		if (!this.statusDropdownContainer) {
			this.statusDropdownContainer = this.settings.dropdownPosition === 'top'
				? contentEl.insertBefore(document.createElement('div'), contentEl.firstChild)
				: contentEl.appendChild(document.createElement('div'));

			this.statusDropdownContainer.addClass('note-status-dropdown', this.settings.dropdownPosition);
		}

		// Populate the dropdown
		this.statusDropdownContainer.empty();

		// Add label
		this.statusDropdownContainer.createEl('span', { text: 'Status:', cls: 'note-status-label' });

		// Add select element
		const select = this.statusDropdownContainer.createEl('select', { cls: 'note-status-select dropdown' });

		// Add status options
		this.settings.customStatuses.forEach(status => {
			const option = select.createEl('option', {
				text: `${status.name} ${status.icon}`,
				value: status.name
			});

			if (status.name === this.currentStatus) option.selected = true;
		});

		// Add change event listener
		select.addEventListener('change', async (e) => {
			const newStatus = (e.target as HTMLSelectElement).value;
			if (newStatus !== 'unknown') await this.updateNoteStatus(newStatus);
		});

		// Add hide button
		const hideButton = this.statusDropdownContainer.createEl('button', {
			text: 'Hide Bar',
			cls: 'note-status-hide-button clickable-icon mod-cta'
		});

		hideButton.addEventListener('click', () => {
			this.settings.showStatusDropdown = false;
			this.updateStatusDropdown();
			this.saveSettings();
			new Notice('Status dropdown hidden');
		});
	}

	async updateFileExplorerIcons(file: TFile) {
		if (!this.settings.showStatusIconsInExplorer || file.extension !== 'md') return;

		const status = this.getFileStatus(file);
		const fileExplorer = this.app.workspace.getLeavesOfType('file-explorer')[0];

		if (fileExplorer && fileExplorer.view && 'fileItems' in fileExplorer.view) {
			const fileItems = fileExplorer.view.fileItems as Record<string, { titleEl?: HTMLElement; selfEl?: HTMLElement }>;
			const fileItem = fileItems[file.path];

			if (fileItem) {
				const titleEl = fileItem.titleEl || fileItem.selfEl;
				if (titleEl) {
					// Remove existing icon if present
					const existingIcon = titleEl.querySelector('.note-status-icon');
					if (existingIcon) existingIcon.remove();

					// Add new icon
					titleEl.createEl('span', {
						cls: `note-status-icon nav-file-tag status-${status}`,
						text: this.getStatusIcon(status)
					});
				}
			}
		}
	}

	updateAllFileExplorerIcons() {
		// Remove all icons if setting is turned off
		if (!this.settings.showStatusIconsInExplorer) {
			this.removeAllFileExplorerIcons();
			return;
		}

		// Update icons for all markdown files
		const files = this.app.vault.getMarkdownFiles();
		files.forEach(file => this.updateFileExplorerIcons(file));
	}

	private removeAllFileExplorerIcons() {
		const fileExplorer = this.app.workspace.getLeavesOfType('file-explorer')[0];
		if (fileExplorer && fileExplorer.view && 'fileItems' in fileExplorer.view) {
			const fileItems = fileExplorer.view.fileItems as Record<string, { titleEl?: HTMLElement; selfEl?: HTMLElement }>;

			Object.values(fileItems).forEach((fileItem) => {
				const titleEl = fileItem.titleEl || fileItem.selfEl;
				if (titleEl) {
					const existingIcon = titleEl.querySelector('.note-status-icon');
					if (existingIcon) existingIcon.remove();
				}
			});
		}
	}

	onunload() {
		// Clean up UI elements
		this.statusBarItem.remove();

		if (this.statusDropdownContainer) {
			this.statusDropdownContainer.remove();
		}

		// Remove file explorer icons
		this.removeAllFileExplorerIcons();

		// Close status pane if open
		const statusPane = this.app.workspace.getLeavesOfType('status-pane')[0];
		if (statusPane) statusPane.detach();

		// Remove dynamic styles
		if (this.dynamicStyleEl) {
			this.dynamicStyleEl.remove();
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	private updateDynamicStyles() {
		// Create style element if it doesn't exist
		if (!this.dynamicStyleEl) {
			this.dynamicStyleEl = document.createElement('style');
			document.head.appendChild(this.dynamicStyleEl);
		}

		// Generate CSS for status colors
		let css = '';
		for (const [status, color] of Object.entries(this.settings.statusColors)) {
			css += `
        .status-${status} {
          color: ${color} !important;
        }
        .note-status-bar .note-status-${status},
        .nav-file-title .note-status-${status} {
          color: ${color} !important;
        }
      `;
		}

		// Add modern styling for the batch modal
		css += `
      .note-status-batch-modal {
        max-width: 500px;
      }
      
      .note-status-modal-search {
        margin-bottom: 10px;
      }
      
      .note-status-modal-search-input {
        width: 100%;
        padding: var(--input-padding);
        border-radius: var(--input-radius);
      }
      
      .note-status-file-select,
      .note-status-status-select {
        width: 100%;
        margin-bottom: 10px;
        border-radius: var(--input-radius);
      }
      
      .note-status-modal-buttons {
        display: flex;
        justify-content: space-between;
        margin-top: 15px;
      }
    `;

		this.dynamicStyleEl.textContent = css;
	}

	async saveSettings() {
		await this.saveData(this.settings);
		this.updateDynamicStyles();
		this.updateStatusPane();
		this.updateStatusBar();
		this.updateStatusDropdown();
		this.updateAllFileExplorerIcons();
	}

	async resetDefaultColors() {
		// Reset colors for default statuses
		const defaultStatuses = ['active', 'onHold', 'completed', 'dropped', 'unknown'];

		for (const status of defaultStatuses) {
			if (this.settings.customStatuses.some(s => s.name === status)) {
				this.settings.statusColors[status] = DEFAULT_COLORS[status];
			}
		}

		await this.saveSettings();
	}
}

/**
 * Settings tab for the Note Status plugin
 */
class NoteStatusSettingTab extends PluginSettingTab {
	plugin: NoteStatus;

	constructor(app: App, plugin: NoteStatus) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// Header
		containerEl.createEl('h2', { text: 'Note Status Settings' });

		// UI section
		containerEl.createEl('h3', { text: 'UI Settings' });

		// Status dropdown settings
		new Setting(containerEl)
			.setName('Show status dropdown')
			.setDesc('Display status dropdown in notes')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showStatusDropdown)
				.onChange(async (value) => {
					this.plugin.settings.showStatusDropdown = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Dropdown position')
			.setDesc('Where to place the status dropdown')
			.addDropdown(dropdown => dropdown
				.addOption('top', 'Top')
				.addOption('bottom', 'Bottom')
				.setValue(this.plugin.settings.dropdownPosition)
				.onChange(async (value: 'top' | 'bottom') => {
					this.plugin.settings.dropdownPosition = value;
					await this.plugin.saveSettings();
				}));

		// Status bar settings
		new Setting(containerEl)
			.setName('Show status bar')
			.setDesc('Display the status bar')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showStatusBar)
				.onChange(async (value) => {
					this.plugin.settings.showStatusBar = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Status bar position')
			.setDesc('Align the status bar text')
			.addDropdown(dropdown => dropdown
				.addOption('left', 'Left')
				.addOption('right', 'Right')
				.setValue(this.plugin.settings.statusBarPosition)
				.onChange(async (value: 'left' | 'right') => {
					this.plugin.settings.statusBarPosition = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Auto-hide status bar')
			.setDesc('Hide the status bar when status is unknown')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoHideStatusBar)
				.onChange(async (value) => {
					this.plugin.settings.autoHideStatusBar = value;
					await this.plugin.saveSettings();
				}));

		// File explorer settings
		new Setting(containerEl)
			.setName('Show status icons in file explorer')
			.setDesc('Display status icons in the file explorer')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showStatusIconsInExplorer)
				.onChange(async (value) => {
					this.plugin.settings.showStatusIconsInExplorer = value;
					await this.plugin.saveSettings();
				}));

		// Compact view setting
		new Setting(containerEl)
			.setName('Default to compact view')
			.setDesc('Start the status pane in compact view by default')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.compactView || false)
				.onChange(async (value) => {
					this.plugin.settings.compactView = value;
					await this.plugin.saveSettings();
				}));

		// Status management section
		containerEl.createEl('h3', { text: 'Custom Statuses' });
		const statusList = containerEl.createDiv({ cls: 'custom-status-list' });

		const renderStatuses = () => {
			statusList.empty();

			this.plugin.settings.customStatuses.forEach((status, index) => {
				const setting = new Setting(statusList)
					.setName(status.name)
					.setClass('status-item');

				// Name field
				setting.addText(text => text
					.setPlaceholder('Status Name')
					.setValue(status.name)
					.onChange(async (value) => {
						if (value && !this.plugin.settings.customStatuses.some(s => s.name === value && s !== status)) {
							const oldName = status.name;
							status.name = value;

							// Update color mapping
							if (this.plugin.settings.statusColors[oldName]) {
								this.plugin.settings.statusColors[value] = this.plugin.settings.statusColors[oldName];
								delete this.plugin.settings.statusColors[oldName];
							}

							await this.plugin.saveSettings();
							renderStatuses(); // Refresh the list
						}
					}));

				// Icon field
				setting.addText(text => text
					.setPlaceholder('Icon')
					.setValue(status.icon)
					.onChange(async (value) => {
						status.icon = value || '❓';
						await this.plugin.saveSettings();
					}));

				// Color picker
				setting.addColorPicker(colorPicker => colorPicker
					.setValue(this.plugin.settings.statusColors[status.name] || '#ffffff')
					.onChange(async (value) => {
						this.plugin.settings.statusColors[status.name] = value;
						await this.plugin.saveSettings();
					}));

				// Remove button
				setting.addButton(button => button
					.setButtonText('Remove')
					.setClass('status-remove-button')
					.setWarning()
					.onClick(async () => {
						this.plugin.settings.customStatuses.splice(index, 1);
						delete this.plugin.settings.statusColors[status.name];
						await this.plugin.saveSettings();
						renderStatuses();
					}));
			});
		};

		renderStatuses();

		// Add new status
		new Setting(containerEl)
			.setName('Add new status')
			.setDesc('Add a custom status with a name, icon, and color')
			.addButton(button => button
				.setButtonText('Add Status')
				.setCta()
				.onClick(async () => {
					const newStatus = {
						name: `status${this.plugin.settings.customStatuses.length + 1}`,
						icon: '⭐'
					};

					this.plugin.settings.customStatuses.push(newStatus);
					this.plugin.settings.statusColors[newStatus.name] = '#ffffff'; // Initial white color

					await this.plugin.saveSettings();
					renderStatuses();
				}));

		// Reset colors
		new Setting(containerEl)
			.setName('Reset default status colors')
			.setDesc('Restore the default colors for predefined statuses')
			.addButton(button => button
				.setButtonText('Reset Colors')
				.setWarning()
				.onClick(async () => {
					await this.plugin.resetDefaultColors();
					renderStatuses();
					new Notice('Default status colors restored');
				}));
	}
}
