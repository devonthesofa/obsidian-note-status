import { Plugin, Notice } from 'obsidian';
import { DEFAULT_SETTINGS } from './constants/defaults';
import { NoteStatusSettings } from './models/types';
import { StatusService } from 'services/status-service';
import { StyleService } from 'services/style-service';

// Importar integraciones
import { ExplorerIntegration } from './integrations/explorer';
import { EditorIntegration, ToolbarIntegration } from './integrations/editor';
import { MetadataIntegration } from './integrations/metadata-cache';
import { WorkspaceIntegration } from './integrations/workspace';
import { FileContextMenuIntegration } from 'integrations/context-menu/file-context-menu-integration';
import { NoteStatusSettingTab } from 'integrations/settings/settings-tab';
//
// Importar vistas
import { StatusPaneViewController } from './views/status-pane-view';

// Importar componentes UI
import { StatusBar } from 'components/status-bar';
import { StatusDropdown } from 'components/status-dropdown';
import { StatusContextMenu } from 'integrations/context-menu/status-context-menu';

export default class NoteStatus extends Plugin {
  settings: NoteStatusSettings;
  
  // Servicios
  statusService: StatusService;
  styleService: StyleService;
  
  // Componentes UI
  statusBar: StatusBar;
  statusDropdown: StatusDropdown
  
  // Integraciones
  explorerIntegration: ExplorerIntegration;
  fileContextMenuIntegration: FileContextMenuIntegration;
  editorIntegration: EditorIntegration;
  toolbarIntegration: ToolbarIntegration;
  metadataIntegration: MetadataIntegration;
  workspaceIntegration: WorkspaceIntegration;

  statusPane: StatusPaneViewController;

  private boundHandleStatusChanged: (event: CustomEvent) => void;

  async onload() {
    try {
      await this.loadSettings();
      this.initializeServices();
      this.registerViews();
      this.initializeUI();
      this.initializeIntegrations();
      // 4. Registrar comandos
      // this.registerCommands();
      
      // 5. Registrar eventos personalizados
      this.setupCustomEvents();
      
      
    } catch (error) {
      console.error('Error loading Note Status plugin:', error);
      new Notice('Error loading Note Status plugin. Check console for details.');
    }
  }

  private async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  private initializeServices() {
    this.statusService = new StatusService(this.app, this.settings);
    this.styleService = new StyleService(this.settings);
  }

  private registerViews() {
	// Register status pane view
    this.registerView('status-pane', (leaf) => {
		this.statusPane = new StatusPaneViewController(leaf, this);
        return this.statusPane;
    });

    // Add ribbon icon
    this.addRibbonIcon('tag', 'Open status pane', () => {
        this.openStatusPane();
    });
    
    // Añadir pestaña de configuración
    this.addSettingTab(new NoteStatusSettingTab(this.app, this, this.statusService));
  }

  private initializeIntegrations() {
    // Crear integraciones en orden de dependencia
    this.explorerIntegration = new ExplorerIntegration(this.app, this.settings, this.statusService);
    this.toolbarIntegration = new ToolbarIntegration(this.app, this.settings, this.statusService, this.statusDropdown);
    
    // Integraciones que dependen de otras
    const statusContextMenu = new StatusContextMenu(this.app, this.settings, this.statusService, this.statusDropdown, this.explorerIntegration);
    this.fileContextMenuIntegration = new FileContextMenuIntegration(this.app, this.settings, this.statusService, this.explorerIntegration, statusContextMenu);
    
    // this.editorIntegration = new EditorIntegration(this.app, this.settings, this.statusService);
    
    // this.metadataIntegration = new MetadataIntegration(
    //   this.app, 
    //   this.settings, 
    //   this.statusService,
    //   this.explorerIntegration
    // );
    
    this.workspaceIntegration = new WorkspaceIntegration(
      this.app, 
      this.settings,
      this.statusService,
      this.toolbarIntegration
    );
    
    // // 3. Registrar eventos en cada integración
    this.fileContextMenuIntegration.registerFileContextMenuEvents();
    // this.editorIntegration.registerEditorMenus();
    // this.metadataIntegration.registerMetadataEvents();
    this.workspaceIntegration.registerWorkspaceEvents();
  }

  private registerCommands() {
    // // Comando para actualizar estado
    // this.addCommand({
    //   id: 'refresh-status',
    //   name: 'Refresh status',
    //   callback: () => {
    //     this.refreshStatus();
    //     new Notice('Note status refreshed!');
    //   }
    // });

    // // Comando para forzar actualización de UI
    // this.addCommand({
    //   id: 'force-refresh-ui',
    //   name: 'Force refresh user interface',
    //   callback: () => this.forceRefreshUI()
    // });

    // // Comando para insertar metadatos de estado
    // this.addCommand({
    //   id: 'insert-status-metadata',
    //   name: 'Insert status metadata',
    //   editorCallback: (editor) => {
    //     this.editorIntegration.insertStatusMetadata(editor);
    //     new Notice('Status metadata inserted');
    //   }
    // });

    // // Comando para abrir panel de estado
    // this.addCommand({
    //   id: 'open-status-pane',
    //   name: 'Open status pane',
    //   callback: () => this.openStatusPane()
    // });
  }

  private setupCustomEvents() {
    // Evento para cambios de estado

    this.boundHandleStatusChanged = this.handleStatusChanged.bind(this);
    window.addEventListener('note-status:status-changed', this.boundHandleStatusChanged);
  }

  private initializeUI() {
    this.statusDropdown = new StatusDropdown(this.app, this.settings, this.statusService); 

    // Inicializar barra de estado
    this.statusBar = new StatusBar(
      this.addStatusBarItem(), 
      this.settings, 
      this.statusService
    );
    
    // Inicializar iconos del explorador (con retraso para evitar ralentizar el inicio)
    if (this.settings.showStatusIconsInExplorer) {
      setTimeout(() => {
        this.explorerIntegration.updateAllFileExplorerIcons();
      }, 2000);
    }
  }

  private handleStatusChanged(event: CustomEvent) {
    const { statuses, file } = event.detail;
    
    console.log("Note status changed", statuses)
    // Actualizar barra de estado
    this.statusBar.update(statuses);
    // Actualizar toolbar
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile?.path === file) {
        this.toolbarIntegration.updateStatusDisplay(statuses);
    }
    this.statusDropdown.update(statuses);
	// Actualizar status pane si está abierto
	const statusPaneLeaf = this.app.workspace.getLeavesOfType('status-pane')[0];
	if (statusPaneLeaf?.view && statusPaneLeaf.view instanceof StatusPaneViewController) {
		(statusPaneLeaf.view as StatusPaneViewController).update();
	}
    // Actualizar explorador si es necesario
    if (this.settings.showStatusIconsInExplorer && file) {
      const fileObj = this.app.vault.getFileByPath(file);
      if (fileObj) {
        this.explorerIntegration.updateFileExplorerIcons(fileObj);
      }
    }
  }

  private refreshStatus() {
    // const activeFile = this.app.workspace.getActiveFile();
    // if (activeFile) {
    //   const statuses = this.statusService.getFileStatuses(activeFile);
    //   window.dispatchEvent(new CustomEvent('note-status:status-changed', { 
    //     detail: { statuses, file: activeFile.path } 
    //   }));
    // }
  }

  private refreshUI() {
    // this.refreshStatus();
  }

  private async openStatusPane() {
    await StatusPaneViewController.open(this.app);
  }

  async saveSettings() {
    await this.saveData(this.settings);
    
    // Actualizar servicios
    this.statusService.updateSettings(this.settings);
    this.styleService.updateSettings(this.settings);
    
    // Actualizar integraciones
    this.explorerIntegration.updateSettings(this.settings);
    this.fileContextMenuIntegration.updateSettings(this.settings);
    // this.editorIntegration.updateSettings(this.settings);
    //this.metadataIntegration.updateSettings(this.settings);
    this.toolbarIntegration.updateSettings(this.settings);
    this.workspaceIntegration.updateSettings(this.settings);
	this.statusPane?.updateSettings(this.settings);
    // Actualizar componentes UI
    this.statusBar.updateSettings(this.settings);
    this.statusDropdown.updateSettings(this.settings)
  }

onunload() {
  // Clean up event listeners
  if (this.boundHandleStatusChanged) {
    window.removeEventListener('note-status:status-changed', this.boundHandleStatusChanged);
  }
  
  // Clean up integrations
  this.explorerIntegration?.unload();
  this.toolbarIntegration?.unload();
  this.fileContextMenuIntegration?.unload();
  this.workspaceIntegration?.unload();
  
  // Clean up services
  this.styleService?.unload();
  
  // Clean up UI components
  this.statusBar?.unload();
  this.statusDropdown?.unload();
}
}
