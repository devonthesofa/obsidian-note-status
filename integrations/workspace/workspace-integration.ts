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
    // Evento al abrir un archivo
    this.app.workspace.on('file-open', (file) => {
      if (file instanceof TFile) {
        this.handleFileOpen(file);
      }
    });

    // Evento de cambio de hoja activa
    this.app.workspace.on('active-leaf-change', (leaf: WorkspaceLeaf) => {
      this.handleActiveLeafChange(leaf);
    });

    // Evento de cambio en el layout
    this.app.workspace.on('layout-change', () => {
      this.handleLayoutChange();
    });
  }

  /**
   * Maneja apertura de archivo
   */
  private handleFileOpen(file: TFile): void {
    // Añade el botón de la barra de herramientas
    this.toolbarIntegration.addToolbarButtonToActiveLeaf();
    
    // Actualiza estado
    this.checkNoteStatus();
  }

  /**
   * Maneja cambio de hoja activa
   */
  private handleActiveLeafChange(leaf: WorkspaceLeaf): void {
    // Añade el botón de la barra de herramientas
    this.toolbarIntegration.addToolbarButtonToActiveLeaf();
    
    const activeFile = this.app.workspace.getActiveFile();
    
    // Solo actualiza si el archivo realmente cambió
    if (this.lastActiveFile?.path !== activeFile?.path) {
      this.lastActiveFile = activeFile;
      this.checkNoteStatus();
    }
  }

  /**
   * Maneja cambio de layout
   */
  private handleLayoutChange(): void {
    // Actualiza componentes que dependen del layout
    this.updateStatusPane();
  }

  /**
   * Verifica y actualiza el estado de la nota activa
   */
  private checkNoteStatus(): void {
    try {
      const activeFile = this.app.workspace.getActiveFile();
      if (!activeFile || activeFile.extension !== 'md') {
        this.updateStatusComponents(['unknown']);
        return;
      }
    
      const statuses = this.statusService.getFileStatuses(activeFile);
      this.updateStatusComponents(statuses);
    } catch (error) {
      console.error('Error checking note status:', error);
    }
  }

  /**
   * Actualiza componentes de estado con nuevos estados
   */
  private updateStatusComponents(statuses: string[]): void {
    // Dispara evento para que otros componentes se actualicen
    window.dispatchEvent(new CustomEvent('note-status:status-changed', { 
      detail: { statuses } 
    }));
  }

  /**
   * Actualiza el panel de estado
   */
  private updateStatusPane(): void {
    window.dispatchEvent(new CustomEvent('note-status:update-pane'));
  }
}