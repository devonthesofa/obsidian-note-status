import { Editor, MarkdownView, Notice, Plugin, TFile, addIcon, WorkspaceLeaf } from 'obsidian';

// Import constants
import { ICONS } from './constants/icons';
import { DEFAULT_SETTINGS, DEFAULT_COLORS } from './constants/defaults';
import { PREDEFINED_TEMPLATES } from './constants/status-templates';

// Import interfaces and types
import { NoteStatusSettings } from './models/types';

// Import services
import { StatusService } from './services/status-service';
import { StyleService } from './services/style-service';

// Import UI components
import { StatusBar } from './ui/status-bar';
import { StatusDropdown } from './ui/status-dropdown';
import { StatusPaneView } from './ui/status-pane-view';
import { ExplorerIntegration } from './ui/explorer';
import { BatchStatusModal } from './ui/modals';
import { StatusContextMenu } from './ui/context-menus';

// Import settings
import { NoteStatusSettingTab } from './settings/settings-tab';

/**
 * Main plugin class
 */
export default class NoteStatus extends Plugin {
	settings: NoteStatusSettings;
	statusService: StatusService;
	styleService: StyleService;
	statusBar: StatusBar;
	statusDropdown: StatusDropdown;
	explorerIntegration: ExplorerIntegration;
	statusContextMenu: StatusContextMenu;
	private statusPaneLeaf: WorkspaceLeaf | null = null;

	async onload() {
		// Register custom icons
		addIcon('status-pane', ICONS.statusPane);

		// Load settings
		await this.loadSettings();

		// Initialize services
		this.statusService = new StatusService(this.app, this.settings);
		this.styleService = new StyleService(this.settings);

		// Initialize UI components
		this.statusBar = new StatusBar(this.addStatusBarItem(), this.settings, this.statusService);
		this.statusDropdown = new StatusDropdown(this.app, this.settings, this.statusService);
		this.explorerIntegration = new ExplorerIntegration(this.app, this.settings, this.statusService);
		this.statusContextMenu = new StatusContextMenu(this.app, this.settings, this.statusService,);

		// Register status pane view
		this.registerView('status-pane', (leaf) => {
			this.statusPaneLeaf = leaf;
			return new StatusPaneView(leaf, this);
		});

		// Add ribbon icon
		this.addRibbonIcon('status-pane', 'Open Status Pane', () => {
			this.openStatusPane();
		});

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
			this.statusDropdown.update(this.getCurrentStatus());
			this.explorerIntegration.updateAllFileExplorerIcons();
		});

		// Add settings tab
		this.addSettingTab(new NoteStatusSettingTab(this.app, this));

		// Set up custom events
		this.setupCustomEvents();
	}

	private setupCustomEvents() {
		// Listen for settings changes
		window.addEventListener('note-status:settings-changed', async () => {
			await this.saveSettings();
		});

		// Listen for status changes
		window.addEventListener('note-status:status-changed', (e: any) => {
			const status = e.detail?.status || 'unknown';
			this.statusBar.update(status);
			this.statusDropdown.update(status);
		});

		// Listen for refresh dropdown
		window.addEventListener('note-status:refresh-dropdown', () => {
			this.statusDropdown.render();
		});

		// Listen for UI refresh
		window.addEventListener('note-status:refresh-ui', () => {
			this.checkNoteStatus();
			this.explorerIntegration.updateAllFileExplorerIcons();
			this.updateStatusPane();
		});
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
				this.statusService.insertStatusMetadataInEditor(editor);
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
								const selectedFiles = this.explorerIntegration.getSelectedFiles();
								if (selectedFiles.length > 1) {
									this.statusContextMenu.showForFiles(selectedFiles);
								} else {
									this.statusContextMenu.showForFiles([file]);
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
								this.statusContextMenu.showForFiles(mdFiles);
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
							.onClick(() => this.statusDropdown.showInContextMenu(editor, view))
					);
				}
			})
		);
	}

	private registerEvents() {
		// File open event
		this.registerEvent(this.app.workspace.on('file-open', () => {
			this.checkNoteStatus();
			this.statusDropdown.update(this.getCurrentStatus());
		}));

		// Editor change event
		this.registerEvent(this.app.workspace.on('editor-change', () => this.checkNoteStatus()));

		// Active leaf change event
		this.registerEvent(this.app.workspace.on('active-leaf-change', () => {
			this.statusDropdown.update(this.getCurrentStatus());
			this.updateStatusPane();
		}));

		// File modification events
		this.registerEvent(this.app.vault.on('modify', (file) => {
			if (file instanceof TFile) {
				this.explorerIntegration.updateFileExplorerIcons(file);
				this.updateStatusPane();
			}
		}));

		// File creation, deletion, and rename events
		this.registerEvent(this.app.vault.on('create', () => {
			this.explorerIntegration.updateAllFileExplorerIcons();
			this.updateStatusPane();
		}));

		this.registerEvent(this.app.vault.on('delete', () => {
			this.explorerIntegration.updateAllFileExplorerIcons();
			this.updateStatusPane();
		}));

		this.registerEvent(this.app.vault.on('rename', () => {
			this.explorerIntegration.updateAllFileExplorerIcons();
			this.updateStatusPane();
		}));

		// Metadata change events
		this.registerEvent(this.app.metadataCache.on('changed', (file) => {
			this.checkNoteStatus();
			this.explorerIntegration.updateFileExplorerIcons(file);
			this.updateStatusPane();
		}));

		// Metadata resolved event
		this.registerEvent(this.app.metadataCache.on('resolved', () => {
			this.explorerIntegration.updateAllFileExplorerIcons();
		}));
	}

	checkNoteStatus() {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile || activeFile.extension !== 'md') {
			this.statusBar.update('unknown');
			return;
		}

		const status = this.statusService.getFileStatus(activeFile);
		this.statusBar.update(status);
	}

	getCurrentStatus(): string {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile || activeFile.extension !== 'md') {
			return 'unknown';
		}
		return this.statusService.getFileStatus(activeFile);
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

	showBatchStatusModal() {
		new BatchStatusModal(this.app, this.settings, this.statusService).open();
	}

	showStatusContextMenu(files: TFile[]) {
		this.statusContextMenu.showForFiles(files);
	}

	async updateStatusPane() {
		if (this.statusPaneLeaf && this.statusPaneLeaf.view instanceof StatusPaneView) {
			const searchQuery = (this.statusPaneLeaf.view as StatusPaneView).searchInput?.value.toLowerCase() || '';
			await (this.statusPaneLeaf.view as StatusPaneView).renderGroups(searchQuery);
		}
	}

	async resetDefaultColors() {
		// Reset colors for default statuses
		const defaultStatuses = ['active', 'onHold', 'completed', 'dropped', 'unknown'];

		for (const status of defaultStatuses) {
			if (this.settings.customStatuses.some(s => s.name === status)) {
				this.settings.statusColors[status] = DEFAULT_COLORS[status];
			}
		}

		// Also reset template status colors
		if (!this.settings.useCustomStatusesOnly) {
			for (const templateId of this.settings.enabledTemplates) {
				const template = PREDEFINED_TEMPLATES.find(t => t.id === templateId);
				if (template) {
					for (const status of template.statuses) {
						if (status.color) {
							this.settings.statusColors[status.name] = status.color;
						}
					}
				}
			}
		}

		await this.saveSettings();
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		this.initializeDefaultColors();
	}

	private initializeDefaultColors() {
		// Ensure default colors are set for all statuses
		for (const [status, color] of Object.entries(DEFAULT_COLORS)) {
			if (!this.settings.statusColors[status]) {
				this.settings.statusColors[status] = color;
			}
		}

		// Also initialize colors from enabled templates if not present
		if (!this.settings.useCustomStatusesOnly) {
			for (const templateId of this.settings.enabledTemplates) {
				const template = PREDEFINED_TEMPLATES.find(t => t.id === templateId);
				if (template) {
					for (const status of template.statuses) {
						if (status.color && !this.settings.statusColors[status.name]) {
							this.settings.statusColors[status.name] = status.color;
						}
					}
				}
			}
		}
	}

	async saveSettings() {
		await this.saveData(this.settings);

		// Update services with new settings
		this.statusService.updateSettings(this.settings);
		this.styleService.updateSettings(this.settings);

		// Update UI components with new settings
		this.statusBar.updateSettings(this.settings);
		this.statusDropdown.updateSettings(this.settings);
		this.explorerIntegration.updateSettings(this.settings);
		this.statusContextMenu.updateSettings(this.settings);

		// Update status pane if open
		if (this.statusPaneLeaf && this.statusPaneLeaf.view instanceof StatusPaneView) {
			(this.statusPaneLeaf.view as StatusPaneView).updateSettings(this.settings);
		}
	}

	onunload() {
		// Clean up UI elements
		this.statusBar.unload?.();
		this.statusDropdown.unload?.();
		this.explorerIntegration.unload?.();
		this.styleService.unload?.();

		// Close status pane if open
		const statusPane = this.app.workspace.getLeavesOfType('status-pane')[0];
		if (statusPane) statusPane.detach();

		// Remove event listeners
		window.removeEventListener('note-status:settings-changed', this.saveSettings);
		window.removeEventListener('note-status:status-changed', this.checkNoteStatus);
		window.removeEventListener('note-status:refresh-dropdown', this.statusDropdown.render);
		window.removeEventListener('note-status:refresh-ui', this.checkNoteStatus);
	}
}