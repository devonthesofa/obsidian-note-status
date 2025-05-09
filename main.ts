import { Editor, MarkdownView, Notice, Plugin, TFile, addIcon, WorkspaceLeaf, debounce } from 'obsidian';

// Constants
import { ICONS } from './constants/icons';
import { DEFAULT_SETTINGS, DEFAULT_COLORS } from './constants/defaults';

// Types
import { NoteStatusSettings } from './models/types';

// Services
import { StatusService } from './services/status-service';
import { StyleService } from './services/style-service';

// UI Components
import { StatusBar } from './ui/components/status-bar';
import { StatusDropdown } from './ui/components/status-dropdown';
import { StatusPaneView } from './ui/components/status-pane-view';
import { ExplorerIntegration } from './ui/integrations/explorer-integration';
import { StatusContextMenu } from './ui/menus/status-context-menu';

// Settings
import { NoteStatusSettingTab } from './settings/settings-tab';

/**
 * Main plugin class for Note Status functionality
 */
export default class NoteStatus extends Plugin {
	private boundSaveSettings: () => Promise<void>;
	private boundCheckNoteStatus: () => void;
	private boundRefreshDropdown: () => void;
	private boundRefreshUI: () => void;

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
		150
	);

	private debouncedUpdateStatusPane = debounce(
		() => this.updateStatusPane(),
		200
	);

	private hasShownErrorNotification = false;

	async onload() {
		try {
			// Load settings first before initializing other components
			await this.loadSettings();
	
			this.boundSaveSettings = this.saveSettings.bind(this);
			this.boundCheckNoteStatus = this.checkNoteStatus.bind(this);
			this.boundRefreshDropdown = () => this.statusDropdown?.render();
			this.boundRefreshUI = () => this.checkNoteStatus();
	
			// Register icons and essential services first
			this.registerIcons();
			this.statusService = new StatusService(this.app, this.settings);
			this.styleService = new StyleService(this.settings);
	
			// Register views and commands right away
			this.registerViews();
			this.registerCommands();
			
			// Add settings tab
			this.addSettingTab(new NoteStatusSettingTab(this.app, this));
	
			// Set up custom events early
			this.setupCustomEvents();
	
			// Delay UI-heavy initialization until the layout is ready
			this.app.workspace.onLayoutReady(async () => {
				// Split initialization into phases for better performance
				await this.initializeUIComponents();
			});
		} catch (error) {
			console.error('Error loading Note Status plugin:', error);
			new Notice('Error loading Note Status plugin. Check console for details.');
		}
	}

	private async initializeUIComponents(): Promise<void> {
		// Initialize UI components
		this.statusBar = new StatusBar(this.addStatusBarItem(), this.settings, this.statusService);
		this.statusDropdown = new StatusDropdown(this.app, this.settings, this.statusService);
		
		// Initialize explorer integration with a slight delay
		setTimeout(() => {
			this.explorerIntegration = new ExplorerIntegration(this.app, this.settings, this.statusService);
			this.statusContextMenu = new StatusContextMenu(
				this.app, 
				this.settings, 
				this.statusService, 
				this.statusDropdown, 
				this.explorerIntegration
			);
		
			// Register events after explorer integration is ready
			this.registerMenuHandlers();
			this.registerEvents();
		
			// Check status for active file only initially
			this.checkNoteStatus();
		
			// Update only active file icon initially for better performance
			const activeFile = this.app.workspace.getActiveFile();
			if (activeFile && this.settings.showStatusIconsInExplorer) {
				this.explorerIntegration.updateFileExplorerIcons(activeFile);
			}
		
			// Delay full explorer icon update to avoid startup lag
			if (this.settings.showStatusIconsInExplorer) {
				setTimeout(() => {
					this.explorerIntegration.updateAllFileExplorerIcons();
				}, 2000);
			}
		}, 300);
	}

	/**
	 * Initialize the plugin components
	 */
	private async initialize(): Promise<void> {
		// Register custom icons
		this.registerIcons();

		// Initialize services
		this.initializeServices();

		// Initialize UI components
		this.initializeUI();

		// Register views, commands, and events
		this.registerViews();
		this.registerCommands();
		this.registerMenuHandlers();
		this.registerEvents();

		// Set up custom events
		this.setupCustomEvents();

		// Add settings tab
		this.addSettingTab(new NoteStatusSettingTab(this.app, this));

		// Initialize UI on layout ready
		this.app.workspace.onLayoutReady(async () => {
			await this.onLayoutReady();
		});
	}

	/**
	 * Handle layout ready event for final initialization steps
	 */
	private async onLayoutReady(): Promise<void> {
		// Small delay to ensure everything is loaded
		await new Promise(resolve => setTimeout(resolve, 200));
		this.checkNoteStatus();
		this.statusDropdown.update(this.getCurrentStatuses());

		this.explorerIntegration.updateAllFileExplorerIcons();

		// Add additional retry with delay to ensure icons are updated
		setTimeout(() => {
			this.explorerIntegration.updateAllFileExplorerIcons();
		}, 2000);
	}

	/**
	 * Register custom icons
	 */
	private registerIcons(): void {
		Object.entries(ICONS).forEach(([name, svg]) => {
			// Create a parser and get a DOM element for the SVG
			const parser = new DOMParser();
			const svgDoc = parser.parseFromString(svg, 'image/svg+xml');
			const svgElement = svgDoc.documentElement;
			
			// Get the SVG as a string using XMLSerializer
			const serializer = new XMLSerializer();
			const sanitizedSvg = serializer.serializeToString(svgElement);
			
			if (name === 'statusPane') {
				addIcon('status-pane', sanitizedSvg);
			} else {
				addIcon(`note-status-${name}`, sanitizedSvg);
			}
		});
	}

	/**
	 * Register views for status pane
	 */
	private registerViews(): void {
		this.registerView('status-pane', (leaf) => {
			this.statusPaneLeaf = leaf;
			return new StatusPaneView(leaf, this);
		});

		// Add ribbon icon
		this.addRibbonIcon('status-pane', 'Open status pane', () => {
			this.openStatusPane();
		});
	}

	/**
	 * Initialize plugin services
	 */
	private initializeServices(): void {
		// These services depend on settings being loaded first
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
		this.statusContextMenu = new StatusContextMenu(this.app, this.settings, this.statusService, this.statusDropdown, this.explorerIntegration);
	}

	/**
	 * Set up custom events for status changes and UI updates
	 */
	private setupCustomEvents(): void {
		// Listen for settings changes
		window.addEventListener('note-status:settings-changed', this.boundSaveSettings);


		// Listen for force refresh
		window.addEventListener('note-status:force-refresh', () => {
			try {
				this.forceRefreshUI();
			} catch (error) {
				console.error('Error handling force refresh event:', error);
			}
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

				setTimeout(() => this.statusDropdown.render(), 50);
			} catch (error) {
				console.error('Error handling status change event:', error);
			}
		});

		// Listen for refresh dropdown
		window.addEventListener('note-status:refresh-dropdown', this.boundRefreshDropdown);

		// Listen for UI refresh
		window.addEventListener('note-status:refresh-ui', this.boundRefreshUI);
	}

	/**
	 * Register plugin commands
	 */
	private registerCommands(): void {
		// Refresh status command
		this.addCommand({
			id: 'refresh-status',
			name: 'Refresh status',
			callback: () => {
				this.checkNoteStatus();
				new Notice('Note status refreshed!');
			}
		});

		this.addCommand({
			id: 'force-refresh-ui',
			name: 'Force refresh user interface',
			callback: () => this.forceRefreshUI()
		});


		// Insert status metadata command
		this.addCommand({
			id: 'insert-status-metadata',
			name: 'Insert status metadata',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.statusService.insertStatusMetadataInEditor(editor);
				new Notice('Status metadata inserted');
			}
		});

		// Open status pane command
		this.addCommand({
			id: 'open-status-pane',
			name: 'Open status pane',
			callback: () => this.openStatusPane()
		});

		// Add status to note command
		this.addCommand({
			id: 'add-status-to-note',
			name: 'Add status to current note',
			callback: () => this.showAddStatusToNoteMenu()
		});
	}

	/**
	 * Show menu for adding a status to the current note
	 */
	private showAddStatusToNoteMenu(): void {
		const activeFile = this.app.workspace.getActiveFile();
		if (!activeFile || activeFile.extension !== 'md') {
			new Notice('No markdown file is active');
			return;
		}

		this.statusContextMenu.showForFile(activeFile, new MouseEvent('click'));
	}

	/**
	 * Register menu handlers
	 */
	private registerMenuHandlers(): void {
		// File explorer context menu
		this.registerEvent(
			this.app.workspace.on('file-menu', (menu, file, source) => {
			if (source === 'file-explorer-context-menu' && file instanceof TFile && file.extension === 'md') {
				menu.addItem((item) =>
				item
					.setTitle('Change status')
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
			const mdFiles: TFile[] = [];
			for (const file of files) {
				if (file instanceof TFile && file.extension === 'md') {
					mdFiles.push(file);
				}
			}
			if (mdFiles.length > 0) {
				menu.addItem((item) =>
				item
					.setTitle('Change status')
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
					.setTitle('Change note status')
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
	private registerEvents(): void {
		// File open event with optimization to avoid redundant updates
		this.registerEvent(this.app.workspace.on('file-open', (file) => {
			if (file instanceof TFile) {
				// First make sure the button exists
				this.statusDropdown.addToolbarButtonToActiveLeaf();
				// Then check status and update button
				this.checkNoteStatus();
			}
		}));

		// Editor change event - debounced to avoid performance issues
		this.registerEvent(this.app.workspace.on('editor-change', () => {
			this.debouncedCheckNoteStatus();
		}));

		// Add this for toolbar button persistence
		this.registerEvent(
			this.app.workspace.on('active-leaf-change', () => {
				this.statusDropdown.addToolbarButtonToActiveLeaf();
				// Update the status after adding the button to ensure icon is correct
				this.checkNoteStatus();
			})
		);

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

		this.registerFileEvents();
		this.registerMetadataEvents();

		// Layout change event - ensure status pane is properly rendered
		this.registerEvent(this.app.workspace.on('layout-change', () => {
			this.debouncedUpdateStatusPane();
		}));
	}

	/**
	 * Register file modification events
	 */
	private registerFileEvents(): void {
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
	}

	/**
	 * Register metadata cache events
	 */
	private registerMetadataEvents(): void {
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
		this.registerEvent(
			this.app.metadataCache.on('resolved', () => {
				// When metadata cache is fully resolved, update all icons
				setTimeout(() => this.explorerIntegration.updateAllFileExplorerIcons(), 500);
			})
		);
	}

	/**
	 * Check and update the status display for the active file
	 */
	checkNoteStatus(): void {
		try {
			const activeFile = this.app.workspace.getActiveFile();
			if (!activeFile || !(activeFile instanceof TFile) || activeFile.extension !== 'md') {
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
			if (!activeFile || !(activeFile instanceof TFile) || activeFile.extension !== 'md') {
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
	public async openStatusPane(): Promise<void> {
		try {
			// Check if already open
			const existing = this.app.workspace.getLeavesOfType('status-pane')[0];
			if (existing) {
				this.app.workspace.setActiveLeaf(existing);
				return;
			}
			
			// Create a new leaf and show loading state
			const leaf = this.app.workspace.getLeftLeaf(false);
			if (leaf) {
				await leaf.setViewState({ type: 'status-pane', active: true });
				this.statusPaneLeaf = leaf;
			}
		} catch (error) {
			console.error('Error opening status pane:', error);
			new Notice('Error opening status pane. Check console for details.');
		}
	}

	/**
	 * Show status context menu
	 */
	showStatusContextMenu(files: TFile[]): void {
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
	async updateStatusPane(): Promise<void> {
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
	 * Load settings with error handling
	 */
	async loadSettings(): Promise<void> {
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
	private initializeDefaultColors(): void {
		// Ensure default colors are set for all statuses
		for (const [status, color] of Object.entries(DEFAULT_COLORS)) {
			if (!this.settings.statusColors[status]) {
				this.settings.statusColors[status] = color;
			}
		}

		// Also initialize colors from enabled templates if not present
		this.initializeTemplateColors();
	}

	/**
	 * Initialize colors from templates
	 */
	private initializeTemplateColors(): void {
		// Make sure settings are properly initialized
		if (!this.settings) {
			console.error('Settings not initialized properly');
			return;
		}

		if (!this.settings.useCustomStatusesOnly && this.statusService) {
			const templateStatuses = this.statusService.getTemplateStatuses();
			for (const status of templateStatuses) {
				if (status.color && !this.settings.statusColors[status.name]) {
					this.settings.statusColors[status.name] = status.color;
				}
			}
		}
	}

	/**
	 * Save settings with error handling
	 */
	async saveSettings(): Promise<void> {
		try {
			await this.saveData(this.settings);
			this.updateComponentSettings();
		} catch (error) {
			console.error('Error saving settings:', error);
			new Notice('Error saving settings. Check console for details.');
		}
	}

	/**
	 * Update all components with new settings
	 */
	private updateComponentSettings(): void {
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

	/**
	 * Force refresh all UI components
	 */
	public forceRefreshUI(): void {
		try {
			// Cancel any pending updates
			this.debouncedCheckNoteStatus.cancel();
			this.debouncedUpdateExplorer.cancel();
			this.debouncedUpdateStatusPane.cancel();

			// Immediate updates
			this.checkNoteStatus();
			this.explorerIntegration.updateAllFileExplorerIcons();
			this.updateStatusPane();

			new Notice('UI forcefully refreshed');
		} catch (error) {
			console.error('Error force refreshing UI:', error);
			new Notice('Error refreshing UI. Check console for details.');
		}
	}

	/**
	 * Clean up when the plugin is unloaded
	 */
	onunload(): void {
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
		this.removeCustomEventListeners();
	}

	/**
	 * Remove custom event listeners
	 */
	private removeCustomEventListeners(): void {
		window.removeEventListener('note-status:settings-changed', this.boundSaveSettings);
		window.removeEventListener('note-status:status-changed', this.boundCheckNoteStatus);
		window.removeEventListener('note-status:refresh-dropdown', this.boundRefreshDropdown);
		window.removeEventListener('note-status:refresh-ui', this.boundRefreshUI);
	}
}
