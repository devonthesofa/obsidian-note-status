import { setIcon, TFile } from 'obsidian';
import { NoteStatusSettings, Status } from '../models/types';
import { StatusService } from '../services/status-service';

/**
 * Unified dropdown component for status selection
 */
export class StatusDropdownComponent {
  private app: any;
  private statusService: StatusService;
  private settings: NoteStatusSettings;
  private dropdownElement: HTMLElement | null = null;
  private currentStatuses: string[] = ['unknown'];
  private onStatusChange: (statuses: string[]) => void;
  private isOpen = false;
  private animationDuration = 220;
  private clickOutsideHandler: (e: MouseEvent) => void;
  private targetFile: TFile | null = null;
  
  constructor(app: any, statusService: StatusService, settings: NoteStatusSettings) {
    this.app = app;
    this.statusService = statusService;
    this.settings = settings;
    this.onStatusChange = () => {};
    
    // Bind methods
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.handleEscapeKey = this.handleEscapeKey.bind(this);
  }
  
  /**
   * Updates the current statuses
   */
  public updateStatuses(statuses: string[] | string): void {
    // Normalize input to always be an array
    if (typeof statuses === 'string') {
      this.currentStatuses = [statuses];
    } else {
      this.currentStatuses = [...statuses]; // Create a copy to ensure it's updated
    }
    
    // Update dropdown if it's open
    if (this.isOpen && this.dropdownElement) {
      this.refreshDropdownContent();
    }
  }
  
  /**
   * Set the target file for status updates
   */
  public setTargetFile(file: TFile | null): void {
    this.targetFile = file;
  }
  
  /**
   * Updates settings reference
   */
  public updateSettings(settings: NoteStatusSettings): void {
    this.settings = settings;
    
    // Update dropdown if it's open
    if (this.isOpen && this.dropdownElement) {
      this.refreshDropdownContent();
    }
  }
  
  /**
   * Set callback for status changes
   */
  public setOnStatusChange(callback: (statuses: string[]) => void): void {
    this.onStatusChange = callback;
  }
  
  /**
   * Get the current status change callback
   */
  public getOnStatusChange(): (statuses: string[]) => void {
    return this.onStatusChange;
  }
  
  /**
   * Toggle the dropdown visibility
   */
  public toggle(targetEl: HTMLElement, position?: { x: number, y: number }): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open(targetEl, position);
    }
  }
  
  /**
   * Open the dropdown
   */
  public open(targetEl: HTMLElement, position?: { x: number, y: number }): void {
    if (this.isOpen) {
      this.close();
    }
    
    this.isOpen = true;
    
    // Create dropdown element
    this.dropdownElement = document.createElement('div');
    this.dropdownElement.addClass('note-status-popover', 'note-status-unified-dropdown');
    document.body.appendChild(this.dropdownElement);
    
    // Fill dropdown content
    this.refreshDropdownContent();
    
    // Position the dropdown
    if (position) {
      this.positionAt(position.x, position.y);
    } else {
      this.positionRelativeTo(targetEl);
    }
    
    // Add animation class
    this.dropdownElement.addClass('note-status-popover-animate-in');
    
    // Add event listeners
    setTimeout(() => {
      this.clickOutsideHandler = this.handleClickOutside;
      document.addEventListener('click', this.clickOutsideHandler);
      document.addEventListener('keydown', this.handleEscapeKey);
    }, 10);
  }
  
  /**
   * Close the dropdown
   */
  public close(): void {
    if (!this.dropdownElement || !this.isOpen) return;
    
    // Add exit animation
    this.dropdownElement.addClass('note-status-popover-animate-out');
    
    // Clean up event listeners
    document.removeEventListener('click', this.clickOutsideHandler);
    document.removeEventListener('keydown', this.handleEscapeKey);
    
    // Remove after animation completes
    setTimeout(() => {
      if (this.dropdownElement) {
        this.dropdownElement.remove();
        this.dropdownElement = null;
        this.isOpen = false;
      }
    }, this.animationDuration);
  }
  
  /**
   * Refresh the dropdown content
   */
  private refreshDropdownContent(): void {
    if (!this.dropdownElement) return;
    
    // Clear content
    this.dropdownElement.empty();
    
    // Create header
    const headerEl = this.dropdownElement.createDiv({ cls: 'note-status-popover-header' });
    
    // Title with icon
    const titleEl = headerEl.createDiv({ cls: 'note-status-popover-title' });
    const iconContainer = titleEl.createDiv({ cls: 'note-status-popover-icon' });
    setIcon(iconContainer, 'tag');
    titleEl.createSpan({ text: 'Note Status', cls: 'note-status-popover-label' });
    
    // Current status chips
    const chipsContainer = this.dropdownElement.createDiv({ cls: 'note-status-popover-chips' });
    
    // Show 'No status' indicator if no statuses or only unknown status
    if (this.currentStatuses.length === 0 || 
        (this.currentStatuses.length === 1 && this.currentStatuses[0] === 'unknown')) {
      chipsContainer.createDiv({ 
        cls: 'note-status-empty-indicator',
        text: 'No status assigned'
      });
    } else {
      // Add chip for each status
      this.currentStatuses.forEach(status => {
        if (status === 'unknown') return; // Skip unknown status
        
        const statusObj = this.statusService.getAllStatuses().find(s => s.name === status);
        if (!statusObj) return;
        
        const chipEl = chipsContainer.createDiv({ 
          cls: `note-status-chip status-${status}`
        });
        
        // Status icon
        chipEl.createSpan({ 
          text: statusObj.icon,
          cls: 'note-status-chip-icon'
        });
        
        // Status name
        chipEl.createSpan({ 
          text: statusObj.name,
          cls: 'note-status-chip-text' 
        });
        
        // Remove button (only show if multiple statuses allowed)
        if (this.settings.useMultipleStatuses && this.currentStatuses.length > 1) {
          const removeBtn = chipEl.createDiv({ 
            cls: 'note-status-chip-remove',
            attr: {
              'aria-label': `Remove ${status} status`,
              'title': `Remove ${status} status`
            }
          });
          setIcon(removeBtn, 'x');
          
          removeBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            
            // Add remove animation
            chipEl.addClass('note-status-chip-removing');
            
            // Only proceed with removal if we have a target file
            if (this.targetFile) {
              // Wait for animation to complete before actually removing
              setTimeout(async () => {
                // Remove this status
                await this.statusService.removeNoteStatus(status, this.targetFile);
                
                // Get updated statuses
                const updatedStatuses = this.statusService.getFileStatuses(this.targetFile);
                
                // Update current statuses
                this.currentStatuses = updatedStatuses;
                
                // Refresh chips
                this.refreshDropdownContent();
                
                // Call status change callback
                this.onStatusChange(updatedStatuses);
              }, 150);
            }
          });
        }
      });
    }
    
    // Create search filter
    const searchContainer = this.dropdownElement.createDiv({ cls: 'note-status-popover-search' });
    const searchInput = searchContainer.createEl('input', {
      type: 'text',
      placeholder: 'Filter statuses...',
      cls: 'note-status-popover-search-input'
    });
    
    // Create status options container
    const statusOptionsContainer = this.dropdownElement.createDiv({ cls: 'note-status-options-container' });
    
    // Get all available statuses
    const allStatuses = this.statusService.getAllStatuses()
      .filter(status => status.name !== 'unknown');
    
    // Populate status options
    const populateOptions = (filter = '') => {
      statusOptionsContainer.empty();
      
      const filteredStatuses = allStatuses.filter(status => !filter || 
        status.name.toLowerCase().includes(filter.toLowerCase()) ||
        status.icon.includes(filter));
        
      if (filteredStatuses.length === 0) {
        // Show empty state
        statusOptionsContainer.createDiv({
          cls: 'note-status-empty-options',
          text: filter ? `No statuses match "${filter}"` : 'No statuses found'
        });
        return;
      }
      
      filteredStatuses.forEach(status => {
        const isSelected = this.currentStatuses.includes(status.name);
        
        const optionEl = statusOptionsContainer.createDiv({ 
          cls: `note-status-option ${isSelected ? 'is-selected' : ''} status-${status.name}`
        });
        
        // Status icon
        optionEl.createSpan({ 
          text: status.icon,
          cls: 'note-status-option-icon'
        });
        
        // Status name
        optionEl.createSpan({ 
          text: status.name,
          cls: 'note-status-option-text' 
        });
        
        // Check icon for selected status
        if (isSelected) {
          const checkIcon = optionEl.createDiv({ cls: 'note-status-option-check' });
          setIcon(checkIcon, 'check');
        }
        
        // Add click handler
        optionEl.addEventListener('click', async () => {
          try {
            // Add selection animation
            optionEl.addClass('note-status-option-selecting');
            
            // Apply status changes after brief delay for animation
            setTimeout(async () => {
              // Handle the case where we have a specific target file
              if (this.targetFile) {
                if (this.settings.useMultipleStatuses) {
                  await this.statusService.toggleNoteStatus(status.name, this.targetFile);
                } else {
                  await this.statusService.updateNoteStatuses([status.name], this.targetFile);
                  // Close dropdown in single status mode
                  this.close();
                }
                
                // Get fresh status from file
                const freshStatuses = this.statusService.getFileStatuses(this.targetFile);
                
                // Update current statuses
                this.currentStatuses = [...freshStatuses];
                
                // Refresh status options if dropdown still open
                if (this.isOpen && this.settings.useMultipleStatuses) {
                  populateOptions(searchInput.value);
                }
                
                // Call status change callback
                this.onStatusChange(freshStatuses);
              } else {
                // This is for batch operations or when no specific file is targeted
                // We'll just trigger the callback with the selected status
                this.onStatusChange([status.name]);
                
                // Usually we want to close after selection in this case
                if (!this.settings.useMultipleStatuses) {
                  this.close();
                }
              }
            }, 150);
          } catch (error) {
            console.error('Error updating status:', error);
          }
        });
      });
    };
    
    // Initial population
    populateOptions();
    
    // Add search functionality
    searchInput.addEventListener('input', () => {
      populateOptions(searchInput.value);
    });
    
    // Focus search input after a short delay
    setTimeout(() => {
      searchInput.focus();
    }, 50);
  }
  
  /**
   * Position the dropdown at specific coordinates
   */
  private positionAt(x: number, y: number): void {
    if (!this.dropdownElement) return;
    
    this.dropdownElement.style.position = 'fixed';
    this.dropdownElement.style.zIndex = '999';
    this.dropdownElement.style.left = `${x}px`;
    this.dropdownElement.style.top = `${y}px`;
    
    // Ensure dropdown doesn't go off-screen
    setTimeout(() => {
      if (!this.dropdownElement) return;
      
      const rect = this.dropdownElement.getBoundingClientRect();
      
      if (rect.right > window.innerWidth) {
        this.dropdownElement.style.left = `${window.innerWidth - rect.width - 10}px`;
      }
      
      if (rect.bottom > window.innerHeight) {
        this.dropdownElement.style.top = `${window.innerHeight - rect.height - 10}px`;
      }
      
      // Set max height based on viewport
      const maxHeight = window.innerHeight - rect.top - 20;
      this.dropdownElement.style.maxHeight = `${maxHeight}px`;
    }, 0);
  }
  
  /**
   * Position the dropdown relative to a target element
   */
  private positionRelativeTo(targetEl: HTMLElement): void {
    if (!this.dropdownElement) return;
    
    // Reset positioning
    this.dropdownElement.style.position = 'fixed';
    this.dropdownElement.style.zIndex = '999';
    
    // Get target element's position
    const targetRect = targetEl.getBoundingClientRect();
    
    // Position below the element
    this.dropdownElement.style.top = `${targetRect.bottom + 5}px`;
    
    // Align to left edge of target by default
    this.dropdownElement.style.left = `${targetRect.left}px`;
    
    // Check if dropdown would go off-screen to the right
    setTimeout(() => {
      if (!this.dropdownElement) return;
      
      const rect = this.dropdownElement.getBoundingClientRect();
      
      if (rect.right > window.innerWidth) {
        // Align to right edge instead
        this.dropdownElement.style.left = 'auto';
        this.dropdownElement.style.right = `${window.innerWidth - targetRect.right}px`;
      }
      
      if (rect.bottom > window.innerHeight) {
        // Position above the element instead
        this.dropdownElement.style.top = 'auto';
        this.dropdownElement.style.bottom = `${window.innerHeight - targetRect.top + 5}px`;
      }
      
      // Set max height based on viewport
      const maxHeight = window.innerHeight - rect.top - 20;
      this.dropdownElement.style.maxHeight = `${maxHeight}px`;
    }, 0);
  }
  
  /**
   * Handle click outside the dropdown
   */
  private handleClickOutside(e: MouseEvent): void {
    if (this.dropdownElement && !this.dropdownElement.contains(e.target as Node)) {
      this.close();
    }
  }
  
  /**
   * Handle escape key to close dropdown
   */
  private handleEscapeKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.close();
    }
  }
  
  /**
   * Dispose of resources
   */
  public dispose(): void {
    this.close();
  }
}