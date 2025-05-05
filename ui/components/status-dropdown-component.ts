import { App, setIcon, TFile, setTooltip } from 'obsidian';
import { NoteStatusSettings, Status } from '../../models/types';
import { StatusService } from '../../services/status-service';

/**
 * Unified dropdown component for status selection
 * This component handles the UI for selecting statuses across multiple contexts
 */
export class StatusDropdownComponent {
  private app: App;
  private statusService: StatusService;
  private settings: NoteStatusSettings;
  private dropdownElement: HTMLElement | null = null;
  private currentStatuses: string[] = ['unknown'];
  private onStatusChange: (statuses: string[]) => void;
  private animationDuration = 220;
  private clickOutsideHandler: (e: MouseEvent) => void;
  private targetFile: TFile | null = null;
  public isOpen = false;

  
  constructor(app: App, statusService: StatusService, settings: NoteStatusSettings) {
    this.app = app;
    this.statusService = statusService;
    this.settings = settings;
    this.onStatusChange = () => {};
    
    // Bind methods
    this.handleClickOutside = this.handleClickOutside.bind(this);
    this.handleEscapeKey = this.handleEscapeKey.bind(this);
    this.clickOutsideHandler = this.handleClickOutside;
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
      // Add small delay to ensure dropdown is fully closed before potentially reopening
      // This prevents state conflicts when clicking in rapid succession
      setTimeout(() => {
        // Check if we're still in the closing state to prevent reopening if user clicked elsewhere
        if (!this.isOpen && !this.dropdownElement) {
          this.open(targetEl, position);
        }
      }, 50);
    } else {
      this.open(targetEl, position);
    }
  }
  
  /**
   * Open the dropdown
   */
  public open(targetEl: HTMLElement, position?: { x: number, y: number }): void {
    // Make sure any existing dropdown is fully closed
    if (this.isOpen || this.dropdownElement) {
      this.close();
      // Add small delay before opening new dropdown to ensure proper cleanup
      setTimeout(() => {
        this.actuallyOpen(targetEl, position);
      }, 10);
      return;
    }
    
    this.actuallyOpen(targetEl, position);
  }

  private actuallyOpen(targetEl: HTMLElement, position?: { x: number, y: number }): void {
    this.isOpen = true;
    
    // Create dropdown element
    this.createDropdownElement();
    
    // Fill dropdown content
    this.refreshDropdownContent();
    
    // Position the dropdown
    if (position) {
      this.positionAt(position.x, position.y);
    } else {
      this.positionRelativeTo(targetEl);
    }
    
    // Add animation class
    this.dropdownElement?.addClass('note-status-popover-animate-in');
    
    // Add event listeners
    setTimeout(() => {
      document.addEventListener('click', this.clickOutsideHandler);
      document.addEventListener('keydown', this.handleEscapeKey);
    }, 10);
  }
  
  /**
   * Create the dropdown element
   */
  private createDropdownElement(): void {
    this.dropdownElement = document.createElement('div');
    this.dropdownElement.addClass('note-status-popover', 'note-status-unified-dropdown');
    document.body.appendChild(this.dropdownElement);
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
    
    // Set isOpen to false immediately to prevent multiple open/close conflicts
    this.isOpen = false;
    
    // Remove after animation completes
    setTimeout(() => {
      if (this.dropdownElement) {
        this.dropdownElement.remove();
        this.dropdownElement = null;
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
    this.createHeader();
    
    // Create status chips section
    this.createStatusChips();
    
    // Create search filter
    const searchInput = this.createSearchFilter();
    
    // Create status options container
    const statusOptionsContainer = this.dropdownElement.createDiv({ 
      cls: 'note-status-options-container' 
    });
    
    // Get all available statuses
    const allStatuses = this.statusService.getAllStatuses()
      .filter(status => status.name !== 'unknown');
    
    // Create a function to populate options with filtering
    const populateOptions = (filter = '') => {
      this.populateStatusOptions(statusOptionsContainer, allStatuses, filter);
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
   * Create the dropdown header
   */
  private createHeader(): void {
    if (!this.dropdownElement) return;
    
    const headerEl = this.dropdownElement.createDiv({ cls: 'note-status-popover-header' });
    
    // Title with icon
    const titleEl = headerEl.createDiv({ cls: 'note-status-popover-title' });
    const iconContainer = titleEl.createDiv({ cls: 'note-status-popover-icon' });
    setIcon(iconContainer, 'tag');
    titleEl.createSpan({ text: 'Note status', cls: 'note-status-popover-label' });
  }
  
  /**
   * Create the status chips section
   */
  private createStatusChips(): void {
    if (!this.dropdownElement) return;
    
    const chipsContainer = this.dropdownElement.createDiv({ cls: 'note-status-popover-chips' });
    
    // Show 'No status' indicator if no statuses or only unknown status
    if (this.hasNoValidStatus()) {
      this.createEmptyStatusIndicator(chipsContainer);
    } else {
      // Add chip for each status
      this.createStatusChipElements(chipsContainer);
    }
  }
  
  /**
   * Check if there are no valid statuses
   */
  private hasNoValidStatus(): boolean {
    return this.currentStatuses.length === 0 || 
           (this.currentStatuses.length === 1 && this.currentStatuses[0] === 'unknown');
  }
  
  /**
   * Create empty status indicator
   */
  private createEmptyStatusIndicator(container: HTMLElement): void {
    container.createDiv({ 
      cls: 'note-status-empty-indicator',
      text: 'No status assigned'
    });
  }
  
  /**
   * Create chips for all current statuses
   */
  private createStatusChipElements(container: HTMLElement): void {
    this.currentStatuses.forEach(status => {
      if (status === 'unknown') return; // Skip unknown status
      
      const statusObj = this.statusService.getAllStatuses().find(s => s.name === status);
      if (!statusObj) return;
      
      this.createSingleStatusChip(container, status, statusObj);
    });
  }
  
  /**
   * Create a single status chip
   */
  private createSingleStatusChip(container: HTMLElement, status: string, statusObj: Status): void {
    const chipEl = container.createDiv({ 
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
    
    // Add remove button regardless of the number of statuses
    // This allows removal even when there's only one status
    this.addRemoveButton(chipEl, status);
  }
  
  /**
   * Add a remove button to a status chip
   */
  private addRemoveButton(chipEl: HTMLElement, status: string): void {
    const statusObj = this.statusService.getAllStatuses().find(s => s.name === status);
    const tooltipValue = statusObj?.description ? `${status} - ${statusObj.description}`: status;
    
    // Add tooltip to the chip element
    setTooltip(chipEl, tooltipValue);
    
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
          await this.removeStatus(status);
        }, 150);
      }
    });
  }
  
  /**
   * Remove a status from the target file
   */
  private async removeStatus(status: string): Promise<void> {
    if (!this.targetFile) return;
    
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
  }
  
  /**
   * Create the search filter input
   */
  private createSearchFilter(): HTMLInputElement {
    if (!this.dropdownElement) {
      throw new Error("Dropdown element not initialized");
    }
    
    const searchContainer = this.dropdownElement.createDiv({ cls: 'note-status-popover-search' });
    const searchInput = searchContainer.createEl('input', {
      type: 'text',
      placeholder: 'Filter statuses...',
      cls: 'note-status-popover-search-input'
    });
    
    return searchInput;
  }
  
  /**
   * Populate status options with optional filtering
   */
  private populateStatusOptions(
    container: HTMLElement, 
    statuses: Status[], 
    filter = ''
  ): void {
    container.empty();
    
    const filteredStatuses = this.filterStatuses(statuses, filter);
    
    if (filteredStatuses.length === 0) {
      this.createNoMatchingStatusesMessage(container, filter);
      return;
    }
    
    filteredStatuses.forEach(status => {
      this.createStatusOption(container, status);
    });
  }
  
  /**
   * Filter statuses based on search term
   */
  private filterStatuses(statuses: Status[], filter: string): Status[] {
    if (!filter) return statuses;
    
    return statuses.filter(status => 
      status.name.toLowerCase().includes(filter.toLowerCase()) ||
      status.icon.includes(filter)
    );
  }
  
  /**
   * Create a message for no matching statuses
   */
  private createNoMatchingStatusesMessage(container: HTMLElement, filter: string): void {
    container.createDiv({
      cls: 'note-status-empty-options',
      text: filter ? `No statuses match "${filter}"` : 'No statuses found'
    });
  }
  
  /**
   * Create a single status option element
   */
  private createStatusOption(container: HTMLElement, status: Status): void {
    const isSelected = this.currentStatuses.includes(status.name);
    
    const optionEl = container.createDiv({ 
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
    
    // Add tooltip with description if available
    if (status.description) {
      setTooltip(optionEl, `${status.name} - ${status.description}`);
    }
    
    // Check icon for selected status
    if (isSelected) {
      const checkIcon = optionEl.createDiv({ cls: 'note-status-option-check' });
      setIcon(checkIcon, 'check');
    }
    
    // Add click handler
    optionEl.addEventListener('click', () => this.handleStatusOptionClick(optionEl, status));
  }
  
  /**
   * Handle click on a status option
   */
  private handleStatusOptionClick(optionEl: HTMLElement, status: Status): void {
    try {
      // Add selection animation
      optionEl.addClass('note-status-option-selecting');
      
      // Apply status changes after brief delay for animation
      setTimeout(async () => {
        if (this.targetFile) {
          await this.handleStatusChangeForTargetFile(status);
        } else {
          // This is for batch operations or when no specific file is targeted
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
  }
  
  /**
   * Handle status change for a specific target file
   */
  private async handleStatusChangeForTargetFile(status: Status): Promise<void> {
    if (!this.targetFile) return;
    
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
    
    // Call status change callback
    this.onStatusChange(freshStatuses);
  }

  /**
   * Position the dropdown at specific coordinates
   */
  private positionAt(x: number, y: number): void {
    if (!this.dropdownElement) return;
    
    this.dropdownElement.addClass('note-status-popover-fixed');
    this.dropdownElement.style.setProperty('--pos-x-px', `${x}px`);
    this.dropdownElement.style.setProperty('--pos-y-px', `${y}px`);
    
    // Ensure dropdown doesn't go off-screen
    setTimeout(() => this.adjustPositionToViewport(), 0);
  }
  
  /**
   * Adjust the dropdown position to ensure it's visible in the viewport
   */
  private adjustPositionToViewport(): void {
    if (!this.dropdownElement) return;
    
    const rect = this.dropdownElement.getBoundingClientRect();
    
    if (rect.right > window.innerWidth) {
      this.dropdownElement.addClass('note-status-popover-right');
      this.dropdownElement.style.setProperty('--right-offset-px', '10px');
    } else {
      this.dropdownElement.removeClass('note-status-popover-right');
    }
    
    if (rect.bottom > window.innerHeight) {
      this.dropdownElement.addClass('note-status-popover-bottom');
      this.dropdownElement.style.setProperty('--bottom-offset-px', '10px');
    } else {
      this.dropdownElement.removeClass('note-status-popover-bottom');
    }
    
    // Set max height based on viewport
    const maxHeight = window.innerHeight - rect.top - 20;
    this.dropdownElement.style.setProperty('--max-height-px', `${maxHeight}px`);
  }
  
  /**
   * Position the dropdown relative to a target element
   */
  private positionRelativeTo(targetEl: HTMLElement): void {
    if (!this.dropdownElement) return;
    
    // Apply positioning class
    this.dropdownElement.addClass('note-status-popover-fixed');
    
    // Get target element's position
    const targetRect = targetEl.getBoundingClientRect();
    
    // Position below the element - using CSS custom properties
    this.dropdownElement.style.setProperty('--pos-y-px', `${targetRect.bottom + 5}px`);
    
    // Align to left edge of target by default
    this.dropdownElement.style.setProperty('--pos-x-px', `${targetRect.left}px`);
    
    // Check if dropdown would go off-screen
    setTimeout(() => this.adjustRelativePosition(targetRect), 0);
  }
  
  /**
   * Adjust position when positioned relative to an element
   */
  private adjustRelativePosition(targetRect: DOMRect): void {
    if (!this.dropdownElement) return;
    
    const rect = this.dropdownElement.getBoundingClientRect();
    
    if (rect.right > window.innerWidth) {
      // Align to right edge instead
      this.dropdownElement.addClass('note-status-popover-right');
      this.dropdownElement.style.setProperty('--right-offset-px', `${window.innerWidth - targetRect.right}px`);
    } else {
      this.dropdownElement.removeClass('note-status-popover-right');
    }
    
    if (rect.bottom > window.innerHeight) {
      // Position above the element instead
      this.dropdownElement.addClass('note-status-popover-bottom');
      this.dropdownElement.style.setProperty('--bottom-offset-px', `${window.innerHeight - targetRect.top + 5}px`);
    } else {
      this.dropdownElement.removeClass('note-status-popover-bottom');
    }
    
    // Set max height based on viewport
    const maxHeight = window.innerHeight - rect.top - 20;
    this.dropdownElement.style.setProperty('--max-height-px', `${maxHeight}px`);
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
