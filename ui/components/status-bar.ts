import { setTooltip } from 'obsidian';
import { NoteStatusSettings } from '../../models/types';
import { StatusService } from '../../services/status-service';

/**
 * Handles the status bar functionality
 */
export class StatusBar {
  private statusBarEl: HTMLElement;
  private settings: NoteStatusSettings;
  private statusService: StatusService;
  private currentStatuses: string[] = ['unknown'];

  constructor(statusBarEl: HTMLElement, settings: NoteStatusSettings, statusService: StatusService) {
    this.statusBarEl = statusBarEl;
    this.settings = settings;
    this.statusService = statusService;

    this.statusBarEl.addClass('note-status-bar');
    this.setupContextMenu();
    this.update(['unknown']);
  }

  /**
   * Set up right-click context menu for force refresh
   */
  private setupContextMenu(): void {
    this.statusBarEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      window.dispatchEvent(new CustomEvent('note-status:force-refresh'));
    });
  }

  /**
   * Update the status bar with new statuses
   */
  public update(statuses: string[]): void {
    this.currentStatuses = statuses;
    this.render();
  }

  /**
   * Render the status bar based on current settings and statuses
   */
  public render(): void {
    this.statusBarEl.empty();
    this.resetClasses();
    
    if (!this.settings.showStatusBar) {
      this.statusBarEl.addClass('hidden');
      return;
    }
    
    // Select display mode based on number of statuses and settings
    if (this.currentStatuses.length === 1 || !this.settings.useMultipleStatuses) {
      this.renderSingleStatus();
    } else {
      this.renderMultipleStatuses();
    }
    
    this.handleAutoHide();
  }

  /**
   * Reset CSS classes to their default state
   */
  private resetClasses(): void {
    this.statusBarEl.removeClass('left', 'hidden', 'auto-hide', 'visible');
    this.statusBarEl.addClass('note-status-bar');
  }
  
  /**
   * Render a single status display
   */
  private renderSingleStatus(): void {
    const primaryStatus = this.currentStatuses[0];
    const statusObj = this.statusService.getAllStatuses().find(s => s.name === primaryStatus);
    const tooltipText = statusObj?.description 
      ? `${primaryStatus} - ${statusObj.description}` 
      : primaryStatus;
    
    // Create status text
    const statusText = this.statusBarEl.createEl('span', {
      text: `Status: ${primaryStatus}`,
      cls: `note-status-${primaryStatus}`
    });
    setTooltip(statusText, tooltipText);
    
    // Create status icon
    const statusIcon = this.statusBarEl.createEl('span', {
      text: this.statusService.getStatusIcon(primaryStatus),
      cls: `note-status-icon status-${primaryStatus}`
    });
    setTooltip(statusIcon, tooltipText);
  }
  
  /**
   * Render multiple statuses display
   */
  private renderMultipleStatuses(): void {
    this.statusBarEl.createEl('span', {
      text: 'Statuses: ',
      cls: 'note-status-label'
    });
    
    const badgesContainer = this.statusBarEl.createEl('span', {
      cls: 'note-status-badges'
    });
    
    this.currentStatuses.forEach(status => 
      this.createStatusBadge(badgesContainer, status));
  }
  
  /**
   * Create a status badge for multiple status display
   */
  private createStatusBadge(container: HTMLElement, status: string): void {
    const statusObj = this.statusService.getAllStatuses().find(s => s.name === status);
    const tooltipText = statusObj?.description 
      ? `${status} - ${statusObj.description}` 
      : status;
    
    const badge = container.createEl('span', {
      cls: `note-status-badge status-${status}`
    });
    setTooltip(badge, tooltipText);
    
    badge.createEl('span', {
      text: this.statusService.getStatusIcon(status),
      cls: 'note-status-badge-icon'
    });
    
    badge.createEl('span', {
      text: status,
      cls: 'note-status-badge-text'
    });
  }
  
  /**
   * Handle auto-hide behavior
   */
  private handleAutoHide(): void {
    const onlyUnknown = this.currentStatuses.length === 1 && 
                        this.currentStatuses[0] === 'unknown';
                        
    if (this.settings.autoHideStatusBar && onlyUnknown) {
      this.statusBarEl.addClass('auto-hide');
      setTimeout(() => {
        if (onlyUnknown && this.settings.showStatusBar) {
          this.statusBarEl.addClass('hidden');
        }
      }, 500);
    } else {
      this.statusBarEl.addClass('visible');
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
    this.statusBarEl.empty();
  }
}