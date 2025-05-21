import { App, Menu, TFile } from 'obsidian';
import { NoteStatusSettings } from '../../models/types';
import { ExplorerIntegration } from '../explorer/explorer-integration';
import { StatusService } from 'services/status-service';
import { StatusContextMenu } from './status-context-menu';

/**
 * Gestiona menús contextuales del explorador de archivos
 */
export class FileContextMenuIntegration {
  private app: App;
  private settings: NoteStatusSettings;
  private statusService: StatusService;
  private explorerIntegration: ExplorerIntegration;
  private statusContextMenu: StatusContextMenu;

  constructor(
    app: App, 
    settings: NoteStatusSettings, 
    statusService: StatusService,
    explorerIntegration: ExplorerIntegration,
    statusContextMenu: StatusContextMenu
  ) {
    this.app = app;
    this.settings = settings;
    this.statusService = statusService;
    this.explorerIntegration = explorerIntegration;
    this.statusContextMenu = statusContextMenu;
  }

  /**
   * Actualiza la configuración
   */
  public updateSettings(settings: NoteStatusSettings): void {
    this.settings = settings;
  }

  /**
   * Registra los elementos del menú de archivo
   */
  public registerFileContextMenuEvents(): void {
    this.app.workspace.on('file-menu', (menu, file, source) => {
      if (source === 'file-explorer-context-menu' && file instanceof TFile && file.extension === 'md') {
        this.addStatusChangeMenu(menu, file);
      }
    });

    this.app.workspace.on('files-menu', (menu, files) => {
      const mdFiles = files.filter(file => 
        file instanceof TFile && file.extension === 'md'
      ) as TFile[];
      
      if (mdFiles.length > 0) {
        this.addBatchStatusChangeMenu(menu, mdFiles);
      }
    });
  }

  /**
   * Añade opción de cambio de estado al menú de archivo
   */
  private addStatusChangeMenu(menu: Menu, file: TFile): void {
    menu.addItem(item => 
      item
        .setTitle('Change status')
        .setIcon('tag')
        .onClick(() => {
          const selectedFiles = this.explorerIntegration.getSelectedFiles();
          if (selectedFiles.length > 1) {
            this.showStatusChangeModal(selectedFiles);
          } else {
            this.showStatusChangeModal([file]);
          }
        })
    );
  }

  /**
   * Añade opción de cambio de estado para múltiples archivos
   */
  private addBatchStatusChangeMenu(menu: Menu, files: TFile[]): void {
    menu.addItem(item => 
      item
        .setTitle('Change status')
        .setIcon('tag')
        .onClick(() => {
          this.showStatusChangeModal(files);
        })
    );
  }

  /**
   * Muestra el modal para cambiar estado
   */
  private showStatusChangeModal(files: TFile[]): void {
    // Implementación que mostraría un modal para seleccionar estado
    // En la práctica, esta función delegaría en un servicio de UI
    console.log(`Cambiar estado para ${files.length} archivos`);
    this.statusContextMenu.showForFiles(files)
  }
}