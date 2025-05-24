import { App, Menu, TFile } from 'obsidian';
import { NoteStatusSettings } from 'models/types';
import { StatusService } from 'services/status-service';
import { ExplorerIntegration } from 'integrations/explorer/explorer-integration';
import { StatusContextMenu } from 'integrations/context-menu/status-context-menu';

/**
 * Gestiona la integración de menús contextuales con el explorador de archivos
 */
export class FileContextMenuIntegration {
  private app: App;
  private settings: NoteStatusSettings;
  private statusService: StatusService;
  private explorerIntegration: ExplorerIntegration;
  private statusContextMenu: StatusContextMenu;
  private fileMenuEventRef: any;
  private filesMenuEventRef: any;

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
   * Registra los eventos del menú contextual de archivos
   */
public registerFileContextMenuEvents(): void {
    this.fileMenuEventRef = (menu: Menu, file: any, source: string) => {
      if (source === 'file-explorer-context-menu' && file instanceof TFile && file.extension === 'md') {
        this.addStatusChangeMenu(menu, file);
      }
    };

    this.filesMenuEventRef = (menu: Menu, files: any[]) => {
      const mdFiles = files.filter(file => 
        file instanceof TFile && file.extension === 'md'
      ) as TFile[];
      
      if (mdFiles.length > 0) {
        this.addBatchStatusChangeMenu(menu, mdFiles);
      }
    };

    this.app.workspace.on('file-menu', this.fileMenuEventRef);
    this.app.workspace.on('files-menu', this.filesMenuEventRef);
  }

  /**
   * Añade opción de cambio de estado al menú contextual de un archivo
   */
  private addStatusChangeMenu(menu: Menu, file: TFile): void {
    this.statusContextMenu.addStatusMenuItemToSingleFile(menu, file, (file) => {
      const selectedFiles = this.explorerIntegration.getSelectedFiles();
      if (selectedFiles.length > 1) {
        this.statusContextMenu.showForFiles(selectedFiles);
      } else {
        this.statusContextMenu.showForFiles([file]);
      }
    });
  }

  /**
   * Añade opción de cambio de estado para múltiples archivos
   */
  private addBatchStatusChangeMenu(menu: Menu, files: TFile[]): void {
    this.statusContextMenu.addStatusMenuItemToBatch(menu, files, (files) => {
      this.statusContextMenu.showForFiles(files);
    });
  }

  public unload(): void {
    if (this.fileMenuEventRef) {
      this.app.workspace.off('file-menu', this.fileMenuEventRef);
    }
    if (this.filesMenuEventRef) {
      this.app.workspace.off('files-menu', this.filesMenuEventRef);
    }
  }
}
