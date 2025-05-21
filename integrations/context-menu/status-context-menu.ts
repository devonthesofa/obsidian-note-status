import { App, Menu, TFile } from 'obsidian';
import { NoteStatusSettings } from '../../models/types';
import { StatusService } from '../../services/status-service';
import { StatusDropdown } from 'components/status-dropdown';
import { ExplorerIntegration } from 'integrations/explorer';

/**
 * Handles context menu interactions for status changes
 */
export class StatusContextMenu {
  private statusDropdown: StatusDropdown;
  private settings: NoteStatusSettings;
  private statusService: StatusService;
  private explorerIntegration: ExplorerIntegration;
  public app: App;

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
   * Updates settings reference
   */
  public updateSettings(settings: NoteStatusSettings): void {
    this.settings = settings;
  }
  
  /**
   * Shows the context menu for changing status of one or more files
   */
  public showForFiles(files: TFile[], position?: { x: number; y: number }): void {
    if (files.length === 0) return;
    
    if (files.length === 1) {
      this.showForSingleFile(files[0], position);
    } else {
      const menu = new Menu();
      
      menu.addItem((item) => {
        item.setTitle(`Update ${files.length} files`)
          .setDisabled(true);
        return item;
      });

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
      
      if (position) {
        menu.showAtPosition(position);
      } else {
        menu.showAtMouseEvent(new MouseEvent('contextmenu'));
      }
    }
  }
  
  /**
   * Shows a context menu for a single file
   */
  public showForSingleFile(file: TFile, position?: { x: number; y: number }): void {
    if (!(file instanceof TFile) || file.extension !== 'md') return;

    this.statusDropdown.openStatusDropdown({
      position,
      files: [file]
    });
  }
}