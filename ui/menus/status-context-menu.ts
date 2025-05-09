import { App, Menu, TFile } from 'obsidian';
import { NoteStatusSettings } from '../../models/types';
import { StatusService } from '../../services/status-service';
import { StatusDropdown } from 'ui/components/status-dropdown';
import { ExplorerIntegration } from 'ui/integrations/explorer-integration';

/**
 * Handles context menu interactions for status changes
 */
export class StatusContextMenu {
	private statusDropdown: StatusDropdown;
  private settings: NoteStatusSettings;
  private statusService: StatusService;
  private explorerIntegration: ExplorerIntegration;
  public app: App;

  constructor(app: App, settings: NoteStatusSettings, statusService: StatusService, statusDropdown: StatusDropdown, explorerIntegration:ExplorerIntegration) {
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
   * Shows the context menu for changing a status of one or more files
   */
  public showForFiles(files: TFile[], position?: { x: number; y: number }): void {
    if (files.length === 0) return;
    
    // For a single file, show dropdown directly
    if (files.length === 1) {
      this.showSingleFileDropdown(files[0], position);
      return;
    }
    
    // For multiple files, show menu first
    this.showMultipleFilesMenu(files, position);
  }
  
  /**
   * Show dropdown for a single file
   */
  private showSingleFileDropdown(file: TFile, position?: { x: number; y: number }): void {
    this.statusDropdown.openStatusDropdown({
      position: position,
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
    
    // Add title section
    menu.addItem((item) => {
      item.setTitle(`Update ${files.length} files`)
        .setDisabled(true);
      return item;
    });

    // Simplified toggle-based approach for multiple files
    menu.addItem((item) => 
      item
        .setTitle('Manage statuses...')
        .setIcon('tag')
        .onClick(() => {
          this.statusDropdown.openStatusDropdown({
            position: position,
            files: files
          });
        })
    );
    
    // Show the menu
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
    // Ensure file is a valid TFile instance before proceeding
    if (!(file instanceof TFile) || file.extension !== 'md') {
      return;
    }
    
    const position = { x: event.clientX, y: event.clientY };
  
    this.statusDropdown.openStatusDropdown({
      position: position,
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
    // Add instanceof check for safety
    if (!(file instanceof TFile) || file.extension !== 'md' || statuses.length === 0) return;
    
    // Update the file with the selected status
    if (this.settings.useMultipleStatuses) {
      // If the status is already applied, toggle it off
      const currentStatuses = this.statusService.getFileStatuses(file);
      if (currentStatuses.includes(statuses[0])) {
        await this.statusService.removeNoteStatus(statuses[0], file);
      } else {
        // Add the status
        await this.statusService.addNoteStatus(statuses[0], file);
      }
    } else {
      // Replace with the single status - use the direct method, not batch
      await this.statusService.updateNoteStatuses([statuses[0]], file);
    }
    
    // Force explorer icon update for this specific file
    this.app.metadataCache.trigger('changed', file);
    
    // Directly update the explorer icon
    this.updateExplorerIcon(file);
    
    // Dispatch events to update other UI components
    this.triggerUIUpdates(statuses, file);
  }
  
  /**
   * Update explorer icon for a file
   */
  private updateExplorerIcon(file: TFile): void {
    setTimeout(() => {
      if (this.explorerIntegration) {
        this.explorerIntegration.updateFileExplorerIcons(file);
      }
    }, 50);
  }
  
  /**
   * Trigger UI updates after status changes
   */
  private triggerUIUpdates(statuses: string[], file: TFile): void {
    window.dispatchEvent(new CustomEvent('note-status:status-changed', {
      detail: { statuses, file: file.path }
    }));
    
    window.dispatchEvent(new CustomEvent('note-status:refresh-ui'));
    
    // Force a full UI refresh to ensure all elements are updated
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('note-status:force-refresh'));
    }, 100);
  }
}