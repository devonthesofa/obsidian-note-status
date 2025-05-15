import { App, setIcon, TFile, setTooltip } from 'obsidian';
import { NoteStatusSettings, Status } from '../../models/types';
import { StatusService } from '../../services/status-service';

/**
 * Unified dropdown component for status selection
 */
export class StatusDropdownComponent {
  private app: App;
  private statusService: StatusService;
  private settings: NoteStatusSettings;
  private dropdownElement: HTMLElement | null = null;
  private currentStatuses: string[] = ['unknown'];
  private onStatusChange: (statuses: string[]) => void = () => {};
  private animationDuration = 220;
  private targetFile: TFile | null = null;
  public isOpen = false;

  // Bind methods once in constructor
  private clickOutsideHandler: (e: MouseEvent) => void;
  
  constructor(app: App, statusService: StatusService, settings: NoteStatusSettings) {
    this.app = app;
    this.statusService = statusService;
    this.settings = settings;
    
    this.clickOutsideHandler = this.handleClickOutside.bind(this);
  }
  
  /**
   * Updates the current statuses
   */
  public updateStatuses(statuses: string[] | string): void {
    this.currentStatuses = Array.isArray(statuses) ? [...statuses] : [statuses];
    
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
      setTimeout(() => {
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
    if (this.isOpen || this.dropdownElement) {
      this.close();
      setTimeout(() => this.actuallyOpen(targetEl, position), 10);
      return;
    }
    
    this.actuallyOpen(targetEl, position);
  }

  private actuallyOpen(targetEl: HTMLElement, position?: { x: number, y: number }): void {
    this.isOpen = true;
    
    // Create and position dropdown
    this.createDropdownElement();
    this.refreshDropdownContent();
    
    position ? 
      this.positionAt(position.x, position.y) : 
      this.positionRelativeTo(targetEl);
    
    this.dropdownElement?.addClass('note-status-popover-animate-in');
    
    // Add event listeners with slight delay to prevent immediate triggering
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
    
    this.dropdownElement.addClass('note-status-popover-animate-out');
    
    document.removeEventListener('click', this.clickOutsideHandler);
    document.removeEventListener('keydown', this.handleEscapeKey);
    
    this.isOpen = false;
    
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
    
    this.dropdownElement.empty();
    
    // Create UI sections
    this.createHeader();
    this.createStatusChips();
    const searchInput = this.createSearchFilter();
    
    // Create status options container
    const statusOptionsContainer = this.dropdownElement.createDiv({ 
      cls: 'note-status-options-container' 
    });
    
    // Get all available statuses (excluding 'unknown')
    const allStatuses = this.statusService.getAllStatuses()
      .filter(status => status.name !== 'unknown');
    
    // Function to populate options with filtering
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
    setTimeout(() => searchInput.focus(), 50);
  }
  
  /**
   * Create the dropdown header
   */
  private createHeader(): void {
    if (!this.dropdownElement) return;
    
    const headerEl = this.dropdownElement.createDiv({ cls: 'note-status-popover-header' });
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
    
    const hasNoValidStatus = this.currentStatuses.length === 0 || 
      (this.currentStatuses.length === 1 && this.currentStatuses[0] === 'unknown');
      
    if (hasNoValidStatus) {
      chipsContainer.createDiv({ 
        cls: 'note-status-empty-indicator',
        text: 'No status assigned'
      });
    } else {
      this.createStatusChipElements(chipsContainer);
    }
  }
  
  /**
   * Create chips for all current statuses
   */
  private createStatusChipElements(container: HTMLElement): void {
    this.currentStatuses.forEach(status => {
      if (status === 'unknown') return;
      
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
    
    // Status icon and name
    chipEl.createSpan({ 
      text: statusObj.icon,
      cls: 'note-status-chip-icon'
    });
    
    chipEl.createSpan({ 
      text: statusObj.name,
      cls: 'note-status-chip-text' 
    });
    
    this.addRemoveButton(chipEl, status);
  }
  
  /**
   * Add a remove button to a status chip
   */
  private addRemoveButton(chipEl: HTMLElement, status: string): void {
    const statusObj = this.statusService.getAllStatuses().find(s => s.name === status);
    const tooltipValue = statusObj?.description ? `${status} - ${statusObj.description}`: status;
    
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
      
      chipEl.addClass('note-status-chip-removing');
      
      setTimeout(async () => {
        if (this.targetFile) {
          await this.removeStatus(status);
        } else {
          this.onStatusChange([status]);
        }
      }, 150);
    });
  }
  
  /**
   * Remove a status from the target file
   */
  private async removeStatus(status: string): Promise<void> {
    if (!this.targetFile) return;
    
    await this.statusService.handleStatusChange({
      files: this.targetFile,
      statuses: status,
      operation: 'remove',
      showNotice: false,
      afterChange: (updatedStatuses) => {
        this.currentStatuses = updatedStatuses;
        this.refreshDropdownContent();
        this.onStatusChange(updatedStatuses);
      }
    });
  }
  
  /**
   * Create the search filter input
   */
  private createSearchFilter(): HTMLInputElement {
    if (!this.dropdownElement) {
      throw new Error("Dropdown element not initialized");
    }
    
    const searchContainer = this.dropdownElement.createDiv({ cls: 'note-status-popover-search' });
    
    return searchContainer.createEl('input', {
      type: 'text',
      placeholder: 'Filter statuses...',
      cls: 'note-status-popover-search-input'
    });
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
    
    const filteredStatuses = filter ? 
      statuses.filter(status => 
        status.name.toLowerCase().includes(filter.toLowerCase()) ||
        status.icon.includes(filter)
      ) : 
      statuses;
    
    if (filteredStatuses.length === 0) {
      container.createDiv({
        cls: 'note-status-empty-options',
        text: filter ? `No statuses match "${filter}"` : 'No statuses found'
      });
      return;
    }
    
    filteredStatuses.forEach(status => {
      this.createStatusOption(container, status);
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
    
    // Status icon and name
    optionEl.createSpan({ 
      text: status.icon,
      cls: 'note-status-option-icon'
    });
    
    optionEl.createSpan({ 
      text: status.name,
      cls: 'note-status-option-text' 
    });
    
    // Add tooltip if description available
    if (status.description) {
      setTooltip(optionEl, `${status.name} - ${status.description}`);
    }
    
    // Check icon for selected status
    if (isSelected) {
      const checkIcon = optionEl.createDiv({ cls: 'note-status-option-check' });
      setIcon(checkIcon, 'check');
    }
    
    optionEl.addEventListener('click', () => this.handleStatusOptionClick(optionEl, status));
  }
  
  /**
   * Handle click on a status option
   */
  private handleStatusOptionClick(optionEl: HTMLElement, status: Status): void {
    optionEl.addClass('note-status-option-selecting');
    
    setTimeout(async () => {
      if (this.targetFile) {
        await this.statusService.handleStatusChange({
          files: this.targetFile,
          statuses: status.name,
          afterChange: (updatedStatuses) => {
            this.currentStatuses = updatedStatuses;
            this.onStatusChange(updatedStatuses);
            
            if (!this.settings.useMultipleStatuses) {
              this.close();
            }
          }
        });
      } else {
        this.onStatusChange([status.name]);
        
        if (!this.settings.useMultipleStatuses) {
          this.close();
        }
      }
    }, 150);
  }
  
  /**
   * Position the dropdown at specific coordinates
   */
  private positionAt(x: number, y: number): void {
    if (!this.dropdownElement) return;
    
    this.dropdownElement.addClass('note-status-popover-fixed');
    this.dropdownElement.style.setProperty('--pos-x-px', `${x}px`);
    this.dropdownElement.style.setProperty('--pos-y-px', `${y}px`);
    
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
    
    const maxHeight = window.innerHeight - rect.top - 20;
    this.dropdownElement.style.setProperty('--max-height-px', `${maxHeight}px`);
  }
  
  /**
   * Position the dropdown relative to a target element
   */
  private positionRelativeTo(targetEl: HTMLElement): void {
    if (!this.dropdownElement) return;
    
    this.dropdownElement.addClass('note-status-popover-fixed');
    
    const targetRect = targetEl.getBoundingClientRect();
    
    this.dropdownElement.style.setProperty('--pos-y-px', `${targetRect.bottom + 5}px`);
    this.dropdownElement.style.setProperty('--pos-x-px', `${targetRect.left}px`);
    
    setTimeout(() => this.adjustRelativePosition(targetRect), 0);
  }
  
  /**
   * Adjust position when positioned relative to an element
   */
  private adjustRelativePosition(targetRect: DOMRect): void {
    if (!this.dropdownElement) return;
    
    const rect = this.dropdownElement.getBoundingClientRect();
    
    if (rect.right > window.innerWidth) {
      this.dropdownElement.addClass('note-status-popover-right');
      this.dropdownElement.style.setProperty('--right-offset-px', `${window.innerWidth - targetRect.right}px`);
    } else {
      this.dropdownElement.removeClass('note-status-popover-right');
    }
    
    if (rect.bottom > window.innerHeight) {
      this.dropdownElement.addClass('note-status-popover-bottom');
      this.dropdownElement.style.setProperty('--bottom-offset-px', `${window.innerHeight - targetRect.top + 5}px`);
    } else {
      this.dropdownElement.removeClass('note-status-popover-bottom');
    }
    
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
  private handleEscapeKey = (e: KeyboardEvent): void => {
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