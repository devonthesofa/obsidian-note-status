import { setIcon, TFile, setTooltip } from 'obsidian';
import { StatusRemoveHandler, StatusSelectHandler } from './types';
import { NoteStatusSettings, Status } from 'models/types';
import { StatusService } from 'services/status-service';

/**
 * Render the dropdown content
 */
export function renderDropdownContent(options: {
  dropdownElement: HTMLElement,
  settings: NoteStatusSettings,
  statusService: StatusService,
  currentStatuses: string[],
  targetFile: TFile | null,
  targetFiles: TFile[],
  onRemoveStatus: StatusRemoveHandler,
  onSelectStatus: StatusSelectHandler
}): void {
  const { 
    dropdownElement, 
    settings, 
    statusService, 
    currentStatuses,
    targetFile,
    targetFiles, 
    onRemoveStatus, 
    onSelectStatus 
  } = options;
  
  dropdownElement.empty();
  
  // Create UI sections
  createHeader(dropdownElement, targetFiles);
  createStatusChips(dropdownElement, currentStatuses, statusService, targetFile, onRemoveStatus);
  const searchInput = createSearchFilter(dropdownElement);
  
  // Create status options container
  const statusOptionsContainer = dropdownElement.createDiv({ 
    cls: 'note-status-options-container' 
  });
  
  // Get all available statuses (excluding 'unknown')
  const allStatuses = statusService.getAllStatuses()
    .filter(status => status.name !== 'unknown');
  
  // Function to populate options with filtering
  const populateOptions = (filter = '') => {
    populateStatusOptions({
      container: statusOptionsContainer, 
      statuses: allStatuses, 
      currentStatuses,
      settings,
      targetFiles,
      onSelectStatus,
      filter
    });
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
function createHeader(dropdownElement: HTMLElement, targetFiles: TFile[]): void {
  const headerEl = dropdownElement.createDiv({ cls: 'note-status-popover-header' });
  const titleEl = headerEl.createDiv({ cls: 'note-status-popover-title' });
  
  const iconContainer = titleEl.createDiv({ cls: 'note-status-popover-icon' });
  setIcon(iconContainer, 'tag');
  
  titleEl.createSpan({ text: 'Note status', cls: 'note-status-popover-label' });
  
  // If multiple files are selected, show count
  if (targetFiles.length > 1) {
    titleEl.createSpan({ 
      text: ` (${targetFiles.length} files)`, 
      cls: 'note-status-popover-count'
    });
  }
}

/**
 * Create the status chips section
 */
function createStatusChips(
  dropdownElement: HTMLElement, 
  currentStatuses: string[], 
  statusService: StatusService,
  targetFile: TFile | null,
  onRemoveStatus: StatusRemoveHandler
): void {
  const chipsContainer = dropdownElement.createDiv({ cls: 'note-status-popover-chips' });
  
  const hasNoValidStatus = currentStatuses.length === 0 || 
    (currentStatuses.length === 1 && currentStatuses[0] === 'unknown');
    
  if (hasNoValidStatus) {
    chipsContainer.createDiv({ 
      cls: 'note-status-empty-indicator',
      text: 'No status assigned'
    });
  } else {
    createStatusChipElements(chipsContainer, currentStatuses, statusService, targetFile, onRemoveStatus);
  }
}

/**
 * Create chips for all current statuses
 */
function createStatusChipElements(
  container: HTMLElement, 
  currentStatuses: string[], 
  statusService: StatusService,
  targetFile: TFile | null,
  onRemoveStatus: StatusRemoveHandler
): void {
  currentStatuses.forEach(status => {
    if (status === 'unknown') return;
    
    const statusObj = statusService.getAllStatuses().find(s => s.name === status);
    if (!statusObj) return;
    
    createSingleStatusChip(container, status, statusObj, targetFile, onRemoveStatus);
  });
}

/**
 * Create a single status chip
 */
function createSingleStatusChip(
  container: HTMLElement, 
  status: string, 
  statusObj: Status,
  targetFile: TFile | null,
  onRemoveStatus: StatusRemoveHandler
): void {
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
  
  addRemoveButton(chipEl, status, statusObj, targetFile, onRemoveStatus);
}

/**
 * Add a remove button to a status chip
 */
function addRemoveButton(
  chipEl: HTMLElement, 
  status: string, 
  statusObj: Status, 
  targetFile: TFile | null,
  onRemoveStatus: StatusRemoveHandler
): void {
  const tooltipValue = statusObj.description ? `${status} - ${statusObj.description}`: status;
  
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
      if (targetFile) {
        await onRemoveStatus(status, targetFile);
      } 
    }, 150);
  });
}

/**
 * Create the search filter input
 */
function createSearchFilter(dropdownElement: HTMLElement): HTMLInputElement {
  const searchContainer = dropdownElement.createDiv({ cls: 'note-status-popover-search' });
  
  return searchContainer.createEl('input', {
    type: 'text',
    placeholder: 'Filter statuses...',
    cls: 'note-status-popover-search-input'
  });
}

/**
 * Populate status options with optional filtering
 */
function populateStatusOptions(options: {
  container: HTMLElement, 
  statuses: Status[], 
  currentStatuses: string[],
  settings: NoteStatusSettings,
  targetFiles: TFile[],
  onSelectStatus: StatusSelectHandler,
  filter?: string
}): void {
  const { 
    container, 
    statuses, 
    currentStatuses, 
    settings,
    targetFiles,
    onSelectStatus,
    filter = '' 
  } = options;
  
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
    createStatusOption({ 
      container, 
      status, 
      isSelected: currentStatuses.includes(status.name),
      settings,
      targetFiles,
      onSelectStatus
    });
  });
}

/**
 * Create a single status option element
 */
function createStatusOption(options: {
  container: HTMLElement, 
  status: Status, 
  isSelected: boolean,
  settings: NoteStatusSettings,
  targetFiles: TFile[],
  onSelectStatus: StatusSelectHandler
}): void {
  const { container, status, isSelected, settings, targetFiles, onSelectStatus } = options;
  
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
  
  optionEl.addEventListener('click', () => {
    optionEl.addClass('note-status-option-selecting');
    setTimeout(async () => {
      if (targetFiles.length > 0) {
        await onSelectStatus(status.name, targetFiles);
        
        if (!settings.useMultipleStatuses) {
          // Close signal - The manager component will handle this
          window.dispatchEvent(new CustomEvent('note-status:dropdown-close'));
        }
      }
    }, 150);
  });
}