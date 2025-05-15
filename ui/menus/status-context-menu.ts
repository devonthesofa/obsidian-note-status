import { App, Menu, TFile } from 'obsidian';
import { NoteStatusSettings } from '../../models/types';
import { StatusService } from '../../services/status-service';
import { StatusDropdown } from '../components/status-dropdown';
import { ExplorerIntegration } from '../integrations/explorer-integration';

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
      this.showSingleFileDropdown(files[0], position);
    } else {
      this.showMultipleFilesMenu(files, position);
    }
  }
  
  /**
   * Show dropdown for a single file
   */
  private showSingleFileDropdown(file: TFile, position?: { x: number; y: number }): void {
    this.statusDropdown.openStatusDropdown({
      position,
      files: [file],
      onStatusChange: async (statuses) => {
        if (statuses.length > 0) {
          await this.handleStatusUpdateForFile(file, statuses);
        }
      }
    });
  }
  
  /**
   * Show menu for multiple files
   */
  private showMultipleFilesMenu(files: TFile[], position?: { x: number; y: number }): void {
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
    
    this.showMenu(menu, position);
  }
  
  /**
   * Show the menu at the specified position
   */
  private showMenu(menu: Menu, position?: { x: number; y: number }): void {
    if (position) {
      menu.showAtPosition(position);
    } else {
      menu.showAtMouseEvent(new MouseEvent('contextmenu'));
    }
  }
  
  /**
   * Shows a context menu for a single file
   */
  public showForFile(file: TFile, event: MouseEvent): void {
    if (!(file instanceof TFile) || file.extension !== 'md') return;
    
    const position = { x: event.clientX, y: event.clientY };
  
    this.statusDropdown.openStatusDropdown({
      position,
      files: [file],
      onStatusChange: async (statuses) => {
        if (statuses.length > 0) {
          await this.handleStatusUpdateForFile(file, statuses);
        }
      }
    });
  }
  
  /**
   * Handle status update for a specific file
   */
  private async handleStatusUpdateForFile(file: TFile, statuses: string[]): Promise<void> {
    if (!(file instanceof TFile) || file.extension !== 'md' || statuses.length === 0) return;
    
    await this.statusService.handleStatusChange({
      files: file,
      statuses: statuses,
      showNotice: false
    });
  }
}