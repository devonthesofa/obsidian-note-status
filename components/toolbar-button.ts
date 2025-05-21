import { NoteStatusSettings } from "models/types";
import { StatusService } from "services/status-service";

export class ToolbarButton {
  private element: HTMLElement | null = null;
  private settings: NoteStatusSettings;
  private statusService: StatusService;
  
  constructor(settings: NoteStatusSettings, statusService: StatusService) {
    this.settings = settings;
    this.statusService = statusService;
  }
  
  public createElement(): HTMLElement {
    const button = document.createElement('button');
    button.addClass('note-status-toolbar-button', 'clickable-icon', 'view-action');
    button.setAttribute('aria-label', 'Note status');
    
    this.element = button;
    return button;
  }
  
  public updateDisplay(statuses: string[]): void {
    if (!this.element) return;
    
    this.element.empty();
    
    const hasValidStatus = statuses.length > 0 && statuses[0] !== 'unknown';
    const badgeContainer = document.createElement('div');
    badgeContainer.addClass('note-status-toolbar-badge-container');
    
    if (hasValidStatus) {
      this.renderStatusBadge(badgeContainer, statuses);
    } else {
      this.renderUnknownBadge(badgeContainer);
    }
    
    this.element.appendChild(badgeContainer);
  }
  
  private renderStatusBadge(container: HTMLElement, statuses: string[]): void {
    const primaryStatus = statuses[0];
    const icon = this.statusService.getStatusIcon(primaryStatus);
    
    const iconSpan = document.createElement('span');
    iconSpan.addClass(`note-status-toolbar-icon`, `status-${primaryStatus}`);
    iconSpan.textContent = icon;
    container.appendChild(iconSpan);
    
    if (this.settings.useMultipleStatuses && statuses.length > 1) {
      const countBadge = document.createElement('span');
      countBadge.addClass('note-status-count-badge');
      countBadge.textContent = `+${statuses.length - 1}`;
      container.appendChild(countBadge);
    }
  }
  
  private renderUnknownBadge(container: HTMLElement): void {
    const iconSpan = document.createElement('span');
    iconSpan.addClass('note-status-toolbar-icon', 'status-unknown');
    iconSpan.textContent = this.statusService.getStatusIcon('unknown');
    container.appendChild(iconSpan);
  }
  
  public updateSettings(settings: NoteStatusSettings): void {
    this.settings = settings;
  }
  
  public destroy(): void {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}