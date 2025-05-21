import { App, Menu, TFile } from 'obsidian';
import { NoteStatusSettings } from 'models/types';
import { StatusService } from 'services/status-service';
import { StatusDropdown } from 'components/status-dropdown';
import { ExplorerIntegration } from 'integrations/explorer/explorer-integration';

/**
 * Gestiona los menús contextuales para cambios de estado
 */
export class StatusContextMenu {
  private app: App;
  private settings: NoteStatusSettings;
  private statusService: StatusService;
  private statusDropdown: StatusDropdown;
  private explorerIntegration: ExplorerIntegration;

  constructor(
    app: App, 
    settings: NoteStatusSettings, 
    statusService: StatusService, 
    statusDropdown: StatusDropdown, 
    explorerIntegration: ExplorerIntegration
  ) {
    this.app = app;
    this.settings = settings;
    this.statusService = statusService;
    this.statusDropdown = statusDropdown;
    this.explorerIntegration = explorerIntegration;
  }

  /**
   * Actualiza la configuración
   */
  public updateSettings(settings: NoteStatusSettings): void {
    this.settings = settings;
  }
  
  /**
   * Añade ítem de menú para cambiar estado de un archivo
   */
  public addStatusMenuItemToSingleFile(menu: Menu, file: TFile, onClick: (file: TFile) => void): void {
    menu.addItem(item => 
      item
        .setTitle('Change status')
        .setIcon('tag')
        .onClick(() => onClick(file))
    );
  }
  
  /**
   * Añade ítem de menú para cambiar estado de múltiples archivos
   */
  public addStatusMenuItemToBatch(menu: Menu, files: TFile[], onClick: (files: TFile[]) => void): void {
    menu.addItem(item => 
      item
        .setTitle('Change status')
        .setIcon('tag')
        .onClick(() => onClick(files))
    );
  }
  
  /**
   * Muestra el menú contextual para cambiar estado de uno o más archivos
   * @param files Archivos a los que cambiar el estado
   * @param position Posición opcional para mostrar el menú
   */
  public showForFiles(files: TFile[], position?: { x: number; y: number }): void {
    if (files.length === 0) return;
    
    if (files.length === 1) {
      this.showForSingleFile(files[0], position);
    } else {
      this.showForMultipleFiles(files, position);
    }
  }
  
  /**
   * Muestra el menú contextual para un solo archivo
   * @param file Archivo al que cambiar el estado
   * @param position Posición opcional para mostrar el menú
   */
  private showForSingleFile(file: TFile, position?: { x: number; y: number }): void {
    if (!(file instanceof TFile) || file.extension !== 'md') return;

    this.statusDropdown.openStatusDropdown({
      position,
      files: [file]
    });
  }
  
  /**
   * Muestra el menú contextual para múltiples archivos
   * @param files Archivos a los que cambiar el estado
   * @param position Posición opcional para mostrar el menú
   */
  private showForMultipleFiles(files: TFile[], position?: { x: number; y: number }): void {
    const menu = new Menu();
    
    // Elemento de información (deshabilitado)
    menu.addItem((item) => {
      item.setTitle(`Update ${files.length} files`)
        .setDisabled(true);
      return item;
    });

    // Opción para gestionar estados
    menu.addItem((item) => 
      item
        .setTitle('Manage statuses...')
        .setIcon('tag')
        .onClick(() => {
          this.statusDropdown.openStatusDropdown({
            position,
            files
          });
        })
    );
    
    // Mostrar el menú en la posición adecuada
    if (position) {
      menu.showAtPosition(position);
    } else {
      menu.showAtMouseEvent(new MouseEvent('contextmenu'));
    }
  }
}