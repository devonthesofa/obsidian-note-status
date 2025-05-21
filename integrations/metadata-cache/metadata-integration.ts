import { App, TFile } from 'obsidian';
import { NoteStatusSettings } from '../../models/types';
import { ExplorerIntegration } from '../explorer/explorer-integration';
import { StatusService } from 'services/status-service';

/**
 * Gestiona la integración con la caché de metadatos
 */
export class MetadataIntegration {
  private app: App;
  private settings: NoteStatusSettings;
  private statusService: StatusService;
  private explorerIntegration: ExplorerIntegration;

  constructor(
    app: App, 
    settings: NoteStatusSettings, 
    statusService: StatusService,
    explorerIntegration: ExplorerIntegration
  ) {
    this.app = app;
    this.settings = settings;
    this.statusService = statusService;
    this.explorerIntegration = explorerIntegration;
  }

  /**
   * Actualiza la configuración
   */
  public updateSettings(settings: NoteStatusSettings): void {
    this.settings = settings;
  }

  /**
   * Registra los eventos de metadatos
   */
  public registerMetadataEvents(): void {
    // Evento cuando cambian los metadatos de un archivo
    this.app.metadataCache.on('changed', (file) => {
      if (file instanceof TFile && file.extension === 'md') {
        this.handleMetadataChanged(file);
      }
    });

    // Evento cuando se resuelven todos los metadatos (al cargar)
    this.app.metadataCache.on('resolved', () => {
      setTimeout(() => {
        if (this.settings.showStatusIconsInExplorer) {
          this.explorerIntegration.updateAllFileExplorerIcons();
        }
      }, 500);
    });
  }

  /**
   * Maneja cambios en metadatos de un archivo
   */
  private handleMetadataChanged(file: TFile): void {
    // Actualiza el explorador si está habilitado
    if (this.settings.showStatusIconsInExplorer) {
      this.explorerIntegration.updateFileExplorerIcons(file);
    }
    
    // Actualiza otros componentes si es el archivo activo
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile?.path === file.path) {
      const statuses = this.statusService.getFileStatuses(file);
      window.dispatchEvent(new CustomEvent('note-status:status-changed', { 
        detail: { statuses, file: file.path } 
      }));
    }
  }
}