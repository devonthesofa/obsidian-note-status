import { App, TFile, WorkspaceLeaf } from 'obsidian';
import { NoteStatusSettings } from '../../models/types';
import { ToolbarIntegration } from '../editor/toolbar-integration';
import { StatusService } from 'services/status-service';

/**
 * Gestiona la integración con el workspace de Obsidian
 */
export class WorkspaceIntegration {
  private app: App;
  private settings: NoteStatusSettings;
  private statusService: StatusService;
  private toolbarIntegration: ToolbarIntegration;
  private lastActiveFile: TFile | null = null;
  private fileOpenEventRef: any;
  private activeLeafChangeEventRef: any;
  private layoutChangeEventRef: any;

  constructor(
    app: App, 
    settings: NoteStatusSettings,
    statusService: StatusService,
    toolbarIntegration: ToolbarIntegration
  ) {
    this.app = app;
    this.settings = settings;
    this.statusService = statusService;
    this.toolbarIntegration = toolbarIntegration;
  }

  /**
   * Actualiza la configuración
   */
  public updateSettings(settings: NoteStatusSettings): void {
    this.settings = settings;
  }

  /**
   * Registra eventos del workspace
   */
  public registerWorkspaceEvents(): void {
    this.fileOpenEventRef = (file: any) => {
      if (file instanceof TFile) {
        this.handleFileOpen(file);
      }
    };

    this.activeLeafChangeEventRef = (leaf: WorkspaceLeaf) => {
      this.handleActiveLeafChange(leaf);
    };

    this.layoutChangeEventRef = () => {
      this.handleLayoutChange();
    };

    this.app.workspace.on('file-open', this.fileOpenEventRef);
    this.app.workspace.on('active-leaf-change', this.activeLeafChangeEventRef);
    this.app.workspace.on('layout-change', this.layoutChangeEventRef);
  }

  /**
   * Maneja apertura de archivo
   */
  private handleFileOpen(file: TFile): void {
    // Añade el botón de la barra de herramientas
    this.toolbarIntegration.addToolbarButtonToActiveLeaf();
    
    // Actualiza estado
    this.propagateNoteStatusChange(file);
  }

  /**
   * Maneja cambio de hoja activa
   */
  private handleActiveLeafChange(leaf: WorkspaceLeaf): void {
    // Añade el botón de la barra de herramientas
    this.toolbarIntegration.addToolbarButtonToActiveLeaf();
    
    const activeFile = this.app.workspace.getActiveFile();
    
    // Solo actualiza si el archivo realmente cambió
    // if (this.lastActiveFile?.path !== activeFile?.path) {
    //   this.lastActiveFile = activeFile;
    //   this.propagateNoteStatusChange();
    // }
  }

  /**
   * Maneja y propaga el cambio de layout
   */
  private handleLayoutChange(): void {
    window.dispatchEvent(new CustomEvent('note-status:update-pane'));
  }

  /**
   * Verifica y propaga el estado de la nota activa
   */
  private propagateNoteStatusChange(file: TFile): void {
    try {
      const activeFile = this.app.workspace.getActiveFile();
      let fileStatuses: string[] = [];
      if (activeFile && activeFile.extension === 'md') {
        fileStatuses = this.statusService.getFileStatuses(activeFile)
      }
      // Dispara evento para que otros componentes se actualicen
      window.dispatchEvent(new CustomEvent('note-status:status-changed', { 
        detail: { statuses: fileStatuses, file: file } 
      }));
    } catch (error) {
      console.error('Error checking note status:', error);
    }
  }
  public unload(): void {
    if (this.fileOpenEventRef) {
      this.app.workspace.off('file-open', this.fileOpenEventRef);
    }
    if (this.activeLeafChangeEventRef) {
      this.app.workspace.off('active-leaf-change', this.activeLeafChangeEventRef);
    }
    if (this.layoutChangeEventRef) {
      this.app.workspace.off('layout-change', this.layoutChangeEventRef);
    }
  }
}
