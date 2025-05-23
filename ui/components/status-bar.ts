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

		// Add initial class
		this.statusBarEl.addClass('note-status-bar');

		// Add right-click handler for force refresh
		this.statusBarEl.addEventListener('contextmenu', (e) => {
			e.preventDefault();
			window.dispatchEvent(new CustomEvent('note-status:force-refresh'));
		});

		// Initial render
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
	 * Render the status bar based on current settings and statuses
	 */
	public render(): void {
	  this.statusBarEl.empty();
	  this.statusBarEl.removeClass('left', 'hidden', 'auto-hide', 'visible');
	  this.statusBarEl.addClass('note-status-bar');
	
	  if (!this.settings.showStatusBar) {
	    this.statusBarEl.addClass('hidden');
	    return;
	  }
	
	  // Handle single vs. multiple status display
	  if (this.currentStatuses.length === 1 || !this.settings.useMultipleStatuses) {
	    // Display single status
	    const primaryStatus = this.currentStatuses[0];
	    
	    // Get status object to get description
	    const statusObj = this.statusService.getAllStatuses().find(s => s.name === primaryStatus);
	    const tooltipValue = statusObj?.description ? `${primaryStatus} - ${statusObj.description}` : primaryStatus;
	    
	    // Create status text
	    const statusText = this.statusBarEl.createEl('span', {
	      text: `Status: ${primaryStatus}`,
	      cls: `note-status-${primaryStatus}`
	    });
	    
	    // Add tooltip
	    setTooltip(statusText, tooltipValue);
	
	    // Create status icon
	    const statusIcon = this.statusBarEl.createEl('span', {
	      text: this.statusService.getStatusIcon(primaryStatus),
	      cls: `note-status-icon status-${primaryStatus}`
	    });
	    
	    // Add tooltip to icon too
	    setTooltip(statusIcon, tooltipValue);
	  } else {
	    // Display multiple statuses
	    // Create status text
	    this.statusBarEl.createEl('span', {
	      text: `Statuses: `,
	      cls: 'note-status-label'
	    });
	    
	    // Create container for status badges
	    const badgesContainer = this.statusBarEl.createEl('span', {
	      cls: 'note-status-badges'
	    });
	    
	    // Add status badges
	    this.currentStatuses.forEach(status => {
	      const statusObj = this.statusService.getAllStatuses().find(s => s.name === status);
	      const tooltipValue = statusObj?.description ? `${status} - ${statusObj.description}` : status;
	      
	      const badge = badgesContainer.createEl('span', {
	        cls: `note-status-badge status-${status}`
	      });
	      
	      // Add tooltip
	      setTooltip(badge, tooltipValue);
	      
	      badge.createEl('span', {
	        text: this.statusService.getStatusIcon(status),
	        cls: 'note-status-badge-icon'
	      });
	      
	      badge.createEl('span', {
	        text: status,
	        cls: 'note-status-badge-text'
	      });
	    });
	  }
	
	  // Handle auto-hide behavior
	  const onlyUnknown = this.currentStatuses.length === 1 && this.currentStatuses[0] === 'unknown';
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
		// Clean up any event listeners or DOM elements
		this.statusBarEl.empty();
	}
}
