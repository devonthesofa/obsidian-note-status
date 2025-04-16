import { Editor, MarkdownView, Notice, Plugin, TFile, addIcon, WorkspaceLeaf, debounce, Menu } from 'obsidian';

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

// Plugin version
const PLUGIN_VERSION = '1.5.0';

/**
 * Main plugin class with performance optimizations and enhanced error handling
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
	private lastActiveFile: TFile | null = null;
	
	// Debounced methods for better performance
	private debouncedCheckNoteStatus = debounce(
		() => this.checkNoteStatus(), 
		100, 
		true
	);
	
	private debouncedUpdateExplorer = debounce(
		() => this.explorerIntegration?.updateAllFileExplorerIcons(),
		300
	);
	
	private debouncedUpdateStatusPane = debounce(
		() => this.updateStatusPane(),
		200
	);
	
	// Flag to prevent excessive notifications
	private hasShownErrorNotification = false;

	async onload() {
		console.log(`Loading Note Status plugin v${PLUGIN_VERSION}`);
		
		try {
			// Register custom icons
			this.registerIcons();

			// Load settings
			await this.loadSettings();

			// Initialize services
			this.initializeServices();

			// Initialize UI components
			this.initializeUI();

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
				await new Promise(resolve => setTimeout(resolve, 200));
				this.checkNoteStatus();
				this.statusDropdown.update(this.getCurrentStatuses());
				this.explorerIntegration.updateAllFileExplorerIcons();
			});

			// Add settings tab
			this.addSettingTab(new NoteStatusSettingTab(this.app, this));

			// Set up custom events
			this.setupCustomEvents();
			
			console.log(`Note Status plugin v${PLUGIN_VERSION} loaded successfully`);
		} catch (error) {
			console.error('Error loading Note Status plugin:', error);
			new Notice('Error loading Note Status plugin. Check console for details.');
		}
	}
	
	/**
	 * Register custom icons
	 */
	private registerIcons(): void {
		Object.entries(ICONS).forEach(([name, svg]) => {
			if (name === 'statusPane') {
				addIcon('status-pane', svg);
			} else {
				addIcon(`note-status-${name}`, svg);
			}
		});
	}
	
	/**
	 * Initialize plugin services
	 */
	private initializeServices(): void {
		this.statusService = new StatusService(this.app, this.settings);
		this.styleService = new StyleService(this.settings);
	}
	
	/**
	 * Initialize UI components
	 */
	private initializeUI(): void {
		this.statusBar = new StatusBar(this.addStatusBarItem(), this.settings, this.statusService);
		this.statusDropdown = new StatusDropdown(this.app, this.settings, this.statusService);
		this.explorerIntegration = new ExplorerIntegration(this.app, this.settings, this.statusService);
		this.statusContextMenu = new StatusContextMenu(this.app, this.settings, this.statusService);

		// Register event to update toolbar button when plugin is loaded
		this.app.workspace.onLayoutReady(() => {
			this.statusDropdown.update(this.getCurrentStatuses());
		});
	}

	/**
	 * Set up custom events for status changes and UI updates
	 */
	private setupCustomEvents() {
		// Listen for settings changes
		window.addEventListener('note-status:settings-changed', async () => {
			await this.saveSettings();
		});

		// Listen for status changes
		window.addEventListener('note-status:status-changed', (e: any) => {
			try {
				const statuses = e.detail?.statuses || ['unknown'];
				this.statusBar.update(statuses);
				this.statusDropdown.update(statuses);
				
				// Update explorer icons for the active file
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					this.explorerIntegration.updateFileExplorerIcons(activeFile);
				}
				
				// Small delay to ensure all data is updated first
				setTimeout(() => {
					this.statusDropdown.render();
				}, 50);
			} catch (error) {
				console.error('Error handling status change event:', error);
			}
		});

		// Listen for refresh dropdown
		window.addEventListener('note-status:refresh-dropdown', () => {
			try {
				const currentStatuses = this.getCurrentStatuses();
				this.statusDropdown.update(currentStatuses);
			} catch (error) {
				console.error('Error refreshing dropdown:', error);
			}
		});

		// Listen for UI refresh
		window.addEventListener('note-status:refresh-ui', () => {
			try {
				this.debouncedCheckNoteStatus();
				this.debouncedUpdateExplorer();
				this.debouncedUpdateStatusPane();
			} catch (error) {
				console.error('Error refreshing UI:', error);
			}
		});
		
		// Listen for batch modal opening
		window.addEventListener('note-status:open-batch-modal', () => {
			try {
				this.showBatchStatusModal();
			} catch (error) {
				console.error('Error opening batch modal:', error);
			}
		});
	}

	/**
	 * Register plugin commands
	 */
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
				new Notice('Status metadata inserted');
			}
		});

		// Open status pane command
		this.addCommand({
			id: 'open-status-pane',
			name: 'Open Status Pane',
			callback: () => this.openStatusPane()
		});
		
		// Toggle status dropdown command
		this.addCommand({
			id: 'toggle-status-dropdown',
			name: 'Toggle Status Dropdown',
			callback: () => {
				this.settings.showStatusDropdown = !this.settings.showStatusDropdown;
				this.saveSettings();
				
				if (this.settings.showStatusDropdown) {
					this.statusDropdown.update(this.getCurrentStatuses());
					new Notice('Status dropdown shown');
				} else {
					new Notice('Status dropdown hidden');
				}
			}
		});
		
		// Add status to note command
		this.addCommand({
			id: 'add-status-to-note',
			name: 'Add Status to Current Note',
			callback: () => {
				const activeFile = this.app.workspace.getActiveFile();
				if (!activeFile || activeFile.extension !== 'md') {
					new Notice('No markdown file is active');
					return;
				}
				
				const menu = new Menu();
				const allStatuses = this.statusService.getAllStatuses()
					.filter(status => status.name !== 'unknown');
					
				allStatuses.forEach(status => {
					menu.addItem(item => 
						item.setTitle(`${status.icon} ${status.name}`)
							.onClick(async () => {
								await this.statusService.addNoteStatus(status.name);
								new Notice(`Added "${status.name}" status to note`);
							})
					);
				});
				
				menu.showAtMouseEvent(new MouseEvent('click'));
			}
		});
	}

	/**
	 * Register menu handlers
	 */
	private registerMenuHandlers() {
		// File explorer context menu
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file, source) => {
				if (source === 'file-explorer-context-menu' && file instanceof TFile && file.extension === 'md') {
					menu.addItem((item) =>
						item
							.setTitle('Change Status')
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
							.setTitle('Change Status')
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

	/**
	 * Register workspace and vault events
	 */
	private registerEvents() {
		// File open event with optimization to avoid redundant updates
		this.registerEvent(this.app.workspace.on('file-open', (file) => {
			if (file instanceof TFile) {
				// Only update if the file actually changed
				if (this.lastActiveFile?.path !== file.path) {
					this.lastActiveFile = file;
					this.checkNoteStatus();
					this.statusDropdown.update(this.getCurrentStatuses());
				}
			} else {
				this.lastActiveFile = null;
				this.statusBar.update(['unknown']);
				this.statusDropdown.update(['unknown']);  // Add this line to update toolbar when no file is open
			}
		}));

		// Editor change event - debounced to avoid performance issues
		this.registerEvent(this.app.workspace.on('editor-change', () => {
			this.debouncedCheckNoteStatus();
		}));

		// Active leaf change event - optimized to avoid redundant updates
		this.registerEvent(this.app.workspace.on('active-leaf-change', () => {
			const activeFile = this.app.workspace.getActiveFile();
			
			// Only update if the file actually changed
			if (this.lastActiveFile?.path !== activeFile?.path) {
				this.lastActiveFile = activeFile;
				this.statusDropdown.update(this.getCurrentStatuses());
				this.debouncedUpdateStatusPane();
			}
		}));

		// File modification events with optimization
		this.registerEvent(this.app.vault.on('modify', (file) => {
			if (file instanceof TFile && file.extension === 'md') {
				// Only update UI for the modified file
				this.explorerIntegration.updateFileExplorerIcons(file);
				
				// If this is the active file, also update other UI elements
				if (this.app.workspace.getActiveFile()?.path === file.path) {
					this.checkNoteStatus();
					this.statusDropdown.update(this.getCurrentStatuses());
				}
				
				// Update the status pane but debounced
				this.debouncedUpdateStatusPane();
			}
		}));

		// File creation, deletion, and rename events
		this.registerEvent(this.app.vault.on('create', (file) => {
			if (file instanceof TFile && file.extension === 'md') {
				this.explorerIntegration.updateFileExplorerIcons(file);
				this.debouncedUpdateStatusPane();
			}
		}));

		this.registerEvent(this.app.vault.on('delete', () => {
			this.debouncedUpdateExplorer();
			this.debouncedUpdateStatusPane();
		}));

		this.registerEvent(this.app.vault.on('rename', (file) => {
			if (file instanceof TFile && file.extension === 'md') {
				this.explorerIntegration.updateAllFileExplorerIcons();
				this.debouncedUpdateStatusPane();
			}
		}));

		// Metadata change events
		this.registerEvent(this.app.metadataCache.on('changed', (file) => {
			if (file instanceof TFile && file.extension === 'md') {
				this.explorerIntegration.updateFileExplorerIcons(file);
				
				// Update other UI elements if this is the active file
				if (this.app.workspace.getActiveFile()?.path === file.path) {
					this.checkNoteStatus();
					this.statusDropdown.update(this.getCurrentStatuses());
				}
				
				this.debouncedUpdateStatusPane();
			}
		}));

		// Metadata resolved event - when all files are indexed
		this.registerEvent(this.app.metadataCache.on('resolved', () => {
			this.debouncedUpdateExplorer();
		}));
		
		// Layout change event - ensure status pane is properly rendered
		this.registerEvent(this.app.workspace.on('layout-change', () => {
			this.debouncedUpdateStatusPane();
		}));
	}

	/**
	 * Check and update the status display for the active file
	 */
	checkNoteStatus() {
		try {
			const activeFile = this.app.workspace.getActiveFile();
			if (!activeFile || activeFile.extension !== 'md') {
				this.statusBar.update(['unknown']);
				this.statusDropdown.update(['unknown']);
				return;
			}
		
			const statuses = this.statusService.getFileStatuses(activeFile);
			this.statusBar.update(statuses);
			this.statusDropdown.update(statuses);
		} catch (error) {
			console.error('Error checking note status:', error);
			if (!this.hasShownErrorNotification) {
				new Notice('Error checking note status. Check console for details.');
				this.hasShownErrorNotification = true;
				setTimeout(() => { this.hasShownErrorNotification = false; }, 10000);
			}
		}
	}

	/**
	 * Get the current statuses for the active file
	 * Always returns an array of status names
	 */
	getCurrentStatuses(): string[] {
		try {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile || activeFile.extension !== 'md') {
			return ['unknown'];
		}
		return this.statusService.getFileStatuses(activeFile);
		} catch (error) {
		console.error('Error getting current statuses:', error);
		return ['unknown'];
		}
	}

	/**
	 * Open the status pane
	 */
	async openStatusPane() {
		try {
			const existing = this.app.workspace.getLeavesOfType('status-pane')[0];
			if (existing) {
				this.app.workspace.setActiveLeaf(existing);
				await this.updateStatusPane();
			} else {
				const leaf = this.app.workspace.getLeftLeaf(false);
				if (leaf) {
					await leaf.setViewState({ type: 'status-pane', active: true });
					this.statusPaneLeaf = leaf;
				}
			}
		} catch (error) {
			console.error('Error opening status pane:', error);
			new Notice('Error opening status pane. Check console for details.');
		}
	}

	/**
	 * Show the batch status modal
	 */
	showBatchStatusModal() {
		try {
			new BatchStatusModal(this.app, this.settings, this.statusService).open();
		} catch (error) {
			console.error('Error showing batch status modal:', error);
			new Notice('Error showing batch status modal. Check console for details.');
		}
	}

	/**
	 * Show status context menu
	 */
	showStatusContextMenu(files: TFile[]) {
		try {
			this.statusContextMenu.showForFiles(files);
		} catch (error) {
			console.error('Error showing status context menu:', error);
			new Notice('Error showing status context menu. Check console for details.');
		}
	}

	/**
	 * Update the status pane
	 */
	async updateStatusPane() {
		try {
			if (this.statusPaneLeaf && this.statusPaneLeaf.view instanceof StatusPaneView) {
				const searchQuery = (this.statusPaneLeaf.view as StatusPaneView).searchInput?.value.toLowerCase() || '';
				await (this.statusPaneLeaf.view as StatusPaneView).renderGroups(searchQuery);
			}
		} catch (error) {
			console.error('Error updating status pane:', error);
		}
	}

	/**
	 * Reset default colors
	 */
	async resetDefaultColors() {
		try {
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
			new Notice('Default colors have been restored');
		} catch (error) {
			console.error('Error resetting default colors:', error);
			new Notice('Error resetting default colors. Check console for details.');
		}
	}

	/**
	 * Load settings with error handling
	 */
	async loadSettings() {
		try {
			const loadedData = await this.loadData();
			this.settings = Object.assign({}, DEFAULT_SETTINGS, loadedData);
			this.initializeDefaultColors();
		} catch (error) {
			console.error('Error loading settings:', error);
			new Notice('Error loading settings. Using defaults. Check console for details.');
			this.settings = Object.assign({}, DEFAULT_SETTINGS);
			this.initializeDefaultColors();
		}
	}

	/**
	 * Initialize default colors
	 */
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

	/**
	 * Save settings with error handling
	 */
	async saveSettings() {
		try {
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
		} catch (error) {
			console.error('Error saving settings:', error);
			new Notice('Error saving settings. Check console for details.');
		}
	}

	/**
	 * Clean up when the plugin is unloaded
	 */
	onunload() {
		console.log('Unloading Note Status plugin');
		
		// Cancel debounced functions
		this.debouncedCheckNoteStatus.cancel();
		this.debouncedUpdateExplorer.cancel();
		this.debouncedUpdateStatusPane.cancel();
		
		// Clean up UI elements
		this.statusBar.unload?.();
		this.statusDropdown.unload?.();
		this.explorerIntegration.unload?.();
		this.styleService.unload?.();

		// Close status pane if open
		const statusPane = this.app.workspace.getLeavesOfType('status-pane')[0];
		if (statusPane) statusPane.detach();

		// Remove event listeners for custom events
		window.removeEventListener('note-status:settings-changed', this.saveSettings);
		window.removeEventListener('note-status:status-changed', this.checkNoteStatus);
		window.removeEventListener('note-status:refresh-dropdown', this.statusDropdown.render);
		window.removeEventListener('note-status:refresh-ui', this.checkNoteStatus);
		window.removeEventListener('note-status:open-batch-modal', this.showBatchStatusModal);
		
		console.log('Note Status plugin unloaded');
	}
}