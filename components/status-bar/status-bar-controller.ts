import { NoteStatusSettings } from '../../models/types';
import { StatusService } from '../../services/status-service';
import { StatusBarView } from './status-bar-view';

/**
 * Controller for the status bar
 */
export class StatusBarController {
  private view: StatusBarView;
  private settings: NoteStatusSettings;
  private statusService: StatusService;
  private currentStatuses: string[] = ['unknown'];

  constructor(statusBarContainer: HTMLElement, settings: NoteStatusSettings, statusService: StatusService) {
    this.view = new StatusBarView(statusBarContainer);
    this.settings = settings;
    this.statusService = statusService;
    
    this.update(['unknown']);
  }

  /**
   * Update the status bar with new statuses
   */
  public update(statuses: string[]): void {
    this.currentStatuses = statuses;
    this.render();
  }

  /**
   * Render the status bar
   */
  private render(): void {
    this.view.reset();
    
    if (!this.settings.showStatusBar) {
      this.view.hide();
      return;
    }
    
    if (!this.settings.useMultipleStatuses) {
      this.renderStatuses([this.currentStatuses[0]]);
    } else {
      this.renderStatuses(this.currentStatuses);
    }
    
    this.handleAutoHide();
  }
  
  /**
   * Render statuses - handles both single and multiple status cases
   */
  private renderStatuses(statuses: string[]): void {
    const statusDetails = statuses.map(status => {
        const statusObj = this.statusService.getAllStatuses().find(s => s.name === status);
        return {
            name: status,
            icon: this.statusService.getStatusIcon(status),
            tooltipText: statusObj?.description ? `${status} - ${statusObj.description}` : status
        };
    });

    this.view.renderStatuses(statusDetails);
  }
  
  /**
   * Handle auto-hide behavior
   */
  private handleAutoHide(): void {
    const onlyUnknown = this.currentStatuses.length === 1 && 
                        this.currentStatuses[0] === 'unknown';
                        
    if (this.settings.autoHideStatusBar && onlyUnknown) {
      this.view.hide();
    } else {
      this.view.show();
    }
  }

  /**
   * Update settings reference
   */
  public updateSettings(settings: NoteStatusSettings): void {
    this.settings = settings;
    this.render();
  }

  /**
   * Clean up when plugin is unloaded
   */
  public unload(): void {
    this.view.destroy();
  }
}