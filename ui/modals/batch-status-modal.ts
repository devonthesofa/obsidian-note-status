import { App, Modal, TFile, Notice, setIcon } from 'obsidian';
import { NoteStatusSettings } from '../../models/types';
import { StatusService } from '../../services/status-service';

/**
 * Enhanced modal for batch updating statuses with improved UX
 */
export class BatchStatusModal extends Modal {
  settings: NoteStatusSettings;
  statusService: StatusService;
  app: App;
  selectedFiles: TFile[] = [];
  selectedStatuses: string[] = [];
  updateMode: 'replace' | 'add' = 'replace';
  searchTerm = '';
  private fileSelect: HTMLSelectElement | null = null;
  private statusSelect: HTMLSelectElement | null = null;

  constructor(app: App, settings: NoteStatusSettings, statusService: StatusService) {
    super(app);
    this.app = app;
    this.settings = settings;
    this.statusService = statusService;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('note-status-batch-modal');

    // Create the modal layout
    this.createModalLayout(contentEl);

    // Focus search input
    setTimeout(() => {
      const searchInput = contentEl.querySelector('.note-status-modal-search-input');
      if (searchInput instanceof HTMLInputElement) {
        searchInput.focus();
      }
    }, 10);
  }

  /**
   * Creates the main modal layout
   */
  private createModalLayout(containerEl: HTMLElement): void {
    // Header with icon and title
    this.createModalHeader(containerEl);

    // Create file selection with search filter
    this.createFileSelectionSection(containerEl);

    // Create status selection section
    this.createStatusSelectionSection(containerEl);

    // Add action buttons
    this.createActionButtons(containerEl);

    // Initial file population
    this.populateFiles();
  }

  /**
   * Creates the modal header
   */
  private createModalHeader(containerEl: HTMLElement): void {
    const headerEl = containerEl.createDiv({ cls: 'note-status-modal-header' });
    const headerIcon = headerEl.createDiv({ cls: 'note-status-modal-icon' });
    setIcon(headerIcon, 'tag');
    headerEl.createEl('h2', { text: 'Batch Update Note Status', cls: 'note-status-modal-title' });
  }

  /**
   * Creates the file selection section with search
   */
  private createFileSelectionSection(containerEl: HTMLElement): void {
    const fileSection = containerEl.createDiv({ cls: 'note-status-modal-section' });
    
    // Section header
    const fileSectionHeader = fileSection.createDiv({ cls: 'note-status-section-header' });
    fileSectionHeader.createEl('h3', { text: 'Select Files', cls: 'note-status-section-title' });
    
    // File count indicator
    const fileCountEl = fileSectionHeader.createSpan({ 
      cls: 'note-status-file-count',
      text: '0 selected' 
    });

    // Search container with icon
    this.createSearchContainer(fileSection, fileCountEl);

    // File selection container with scrollable area
    const fileSelectContainer = fileSection.createDiv({ cls: 'note-status-file-select-container' });
    this.fileSelect = fileSelectContainer.createEl('select', {
      cls: 'note-status-file-select',
      attr: { multiple: 'true', size: '8' }
    });

    // Update selection count when files are selected
    this.fileSelect.addEventListener('change', () => {
      this.updateFileSelectionCount(fileCountEl);
    });
  }

  /**
   * Creates search container with input and clear button
   */
  private createSearchContainer(containerEl: HTMLElement, fileCountEl: HTMLElement): void {
    const searchContainer = containerEl.createDiv({ cls: 'note-status-modal-search' });
    const searchWrapper = searchContainer.createDiv({ cls: 'note-status-search-wrapper' });
    
    // Search icon
    const searchIcon = searchWrapper.createDiv({ cls: 'note-status-search-icon' });
    setIcon(searchIcon, 'search');
    
    // Search input
    const searchInput = searchWrapper.createEl('input', {
      type: 'text',
      placeholder: 'Filter files...',
      cls: 'note-status-modal-search-input'
    });

    // Clear search button
    const clearSearchBtn = searchWrapper.createDiv({ 
      cls: 'note-status-search-clear-button'
    });
    setIcon(clearSearchBtn, 'x');
    clearSearchBtn.style.display = 'none';

    // Search functionality
    searchInput.addEventListener('input', () => {
      this.searchTerm = searchInput.value;
      this.populateFiles();
      clearSearchBtn.style.display = this.searchTerm ? 'flex' : 'none';
    });

    // Clear search
    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      this.searchTerm = '';
      this.populateFiles();
      clearSearchBtn.style.display = 'none';
      searchInput.focus();
    });
  }

  /**
   * Update the file selection count display
   */
  private updateFileSelectionCount(fileCountEl: HTMLElement): void {
    this.selectedFiles = Array.from(this.fileSelect?.selectedOptions || [])
      .map(opt => this.app.vault.getMarkdownFiles().find(f => f.path === opt.value))
      .filter((file): file is TFile => file instanceof TFile);
      
    fileCountEl.setText(`${this.selectedFiles.length} selected`);
    if (this.selectedFiles.length > 0) {
      fileCountEl.addClass('has-selection');
    } else {
      fileCountEl.removeClass('has-selection');
    }
  }

  /**
   * Creates the status selection section
   */
  private createStatusSelectionSection(containerEl: HTMLElement): void {
    const statusSection = containerEl.createDiv({ cls: 'note-status-modal-section' });
    
    // Section header
    const statusSectionHeader = statusSection.createDiv({ cls: 'note-status-section-header' });
    statusSectionHeader.createEl('h3', { text: 'Select Statuses', cls: 'note-status-section-title' });
    
    // Status count indicator
    const statusCountEl = statusSectionHeader.createSpan({ 
      cls: 'note-status-status-count',
      text: '0 selected' 
    });

    // Add mode selection if multiple statuses are allowed
    if (this.settings.useMultipleStatuses) {
      this.createModeSelectionContainer(statusSection);
    }
    
    // Status selection container
    const statusSelectContainer = statusSection.createDiv({ cls: 'note-status-status-select-container' });
    
    // Create status list with custom styling
    this.createStatusSelect(statusSelectContainer, statusCountEl);
  }

  /**
   * Creates the mode selection container (replace vs add)
   */
  private createModeSelectionContainer(containerEl: HTMLElement): void {
    const modeContainer = containerEl.createDiv({ cls: 'note-status-mode-container' });
    
    // Create radio button group with modern styling
    const replaceOption = this.createModeRadioOption(
      modeContainer, 
      'mode-replace', 
      'Replace existing statuses', 
      'replace',
      true
    );
    
    const addOption = this.createModeRadioOption(
      modeContainer, 
      'mode-add', 
      'Add to existing statuses', 
      'add',
      false
    );
    
    // Add change event listeners
    replaceOption.addEventListener('change', () => {
      if (replaceOption.checked) this.updateMode = 'replace';
    });
    
    addOption.addEventListener('change', () => {
      if (addOption.checked) this.updateMode = 'add';
    });
  }

  /**
   * Creates the status select dropdown/list
   */
  private createStatusSelect(containerEl: HTMLElement, statusCountEl: HTMLElement): void {
    if (this.settings.useMultipleStatuses) {
      // Create multi-select status list
      this.statusSelect = containerEl.createEl('select', { 
        cls: 'note-status-status-select',
        attr: { 
          multiple: 'true',
          size: '5'
        }
      });
    } else {
      // Single-select dropdown
      this.statusSelect = containerEl.createEl('select', { 
        cls: 'note-status-status-select'
      });
    }

    // Get all available statuses
    const allStatuses = this.statusService.getAllStatuses();

    // Add status options (excluding 'unknown')
    allStatuses
      .filter(status => status.name !== 'unknown')
      .forEach(status => {
        const option = this.statusSelect?.createEl('option', {
          text: `${status.icon} ${status.name}`,
          value: status.name
        });
        if (option) {
          option.classList.add(`status-${status.name}`);
        }
      });
      
    // Update selection count when statuses are selected
    this.statusSelect?.addEventListener('change', () => {
      this.updateStatusSelectionCount(statusCountEl);
    });
  }

  /**
   * Updates the status selection count display
   */
  private updateStatusSelectionCount(statusCountEl: HTMLElement): void {
    this.selectedStatuses = Array.from(this.statusSelect?.selectedOptions || [])
      .map(opt => opt.value);
      
    statusCountEl.setText(`${this.selectedStatuses.length} selected`);
    if (this.selectedStatuses.length > 0) {
      statusCountEl.addClass('has-selection');
    } else {
      statusCountEl.removeClass('has-selection');
    }
  }

  /**
   * Creates a radio button option for update mode
   */
  private createModeRadioOption(
    container: HTMLElement, 
    id: string, 
    labelText: string, 
    value: 'replace' | 'add',
    checked: boolean
  ): HTMLInputElement {
    const optionWrapper = container.createDiv({ cls: 'note-status-mode-option' });
    
    const radio = optionWrapper.createEl('input', {
      type: 'radio',
      attr: { 
        name: 'status-update-mode',
        id: id,
        value: value
      },
      cls: 'note-status-mode-radio'
    });
    
    radio.checked = checked;
    
    optionWrapper.createEl('label', {
      text: labelText,
      attr: { for: id },
      cls: 'note-status-mode-label'
    });
    
    // Make the whole option clickable
    optionWrapper.addEventListener('click', () => {
      radio.checked = true;
      this.updateMode = value;
      
      // Update UI to show active state
      container.querySelectorAll('.note-status-mode-option').forEach(el => 
        el.removeClass('is-active'));
      optionWrapper.addClass('is-active');
    });
    
    // Set initial active state
    if (checked) {
      optionWrapper.addClass('is-active');
    }
    
    return radio;
  }

  /**
   * Creates action buttons
   */
  private createActionButtons(containerEl: HTMLElement): void {
    const buttonContainer = containerEl.createDiv({ cls: 'note-status-modal-buttons' });

    // Select all files button
    const selectAllButton = buttonContainer.createEl('button', {
      text: 'Select All Files',
      cls: 'note-status-select-all'
    });

    selectAllButton.addEventListener('click', () => {
      this.selectAllFiles();
    });

    // Apply button
    const applyButton = buttonContainer.createEl('button', {
      text: 'Apply Changes',
      cls: 'mod-cta note-status-apply-button'
    });

    applyButton.addEventListener('click', async () => {
      await this.applyChanges(applyButton);
    });
  }

  /**
   * Select all files in the list
   */
  private selectAllFiles(): void {
    if (this.fileSelect) {
      for (const option of Array.from(this.fileSelect.options)) {
        option.selected = true;
      }
      
      // Trigger change event to update selection count
      this.fileSelect.dispatchEvent(new Event('change'));
    }
  }

  /**
   * Apply the selected status changes
   */
  private async applyChanges(applyButton: HTMLButtonElement): Promise<void> {
    if (this.selectedFiles.length === 0) {
      new Notice('No files selected');
      return;
    }

    if (this.selectedStatuses.length === 0) {
      new Notice('No statuses selected');
      return;
    }

    try {
      // Show loading state
      applyButton.disabled = true;
      applyButton.setText('Applying...');
      
      // Apply changes
      await this.statusService.batchUpdateStatuses(
        this.selectedFiles, 
        this.selectedStatuses, 
        this.updateMode
      );
      
      this.close();
      
      // Show success notification
      const statusText = this.selectedStatuses.length === 1 
        ? this.selectedStatuses[0] 
        : `${this.selectedStatuses.length} statuses`;
      
      new Notice(`Updated2 ${this.selectedFiles.length} file${this.selectedFiles.length === 1 ? '' : 's'} with ${statusText}`);
    } catch (error) {
      console.error('Error applying status changes:', error);
      new Notice('Error applying changes');
      
      // Reset button state
      applyButton.disabled = false;
      applyButton.setText('Apply Changes');
    }
  }

  /**
   * Populates file list with filtering
   */
  private populateFiles(): void {
    if (!this.fileSelect) return;
    
    this.fileSelect.empty();
    const mdFiles = this.app.vault.getMarkdownFiles();
    
    // Filter by search term if provided
    const filteredFiles = this.searchTerm 
      ? mdFiles.filter(file => file.path.toLowerCase().includes(this.searchTerm.toLowerCase()))
      : mdFiles;
    
    // Sort files by path
    filteredFiles.sort((a, b) => a.path.localeCompare(b.path));
    
    // Create options
    filteredFiles.forEach(file => this.createFileOption(file));
    
    // Update empty state message
    if (filteredFiles.length === 0) {
      this.createEmptyFileOption();
    }
  }
  
  /**
   * Create an option element for a file
   */
  private createFileOption(file: TFile): void {
    const statuses = this.statusService.getFileStatuses(file);
    const statusIcons = statuses.map(s => this.statusService.getStatusIcon(s)).join(' ');
    
    const option = this.fileSelect?.createEl('option', {
      value: file.path
    });
    
    if (option) {
      // Create structured option content
      const fileName = file.basename;
      const filePath = file.parent ? file.parent.path : '';
      
      // Set display text with path info
      option.setText(`${fileName} ${statusIcons}`);
      if (filePath) {
        option.setAttribute('title', `${filePath}/${fileName}`);
      }
      
      // Add status class for styling
      if (statuses.length > 0) {
        option.classList.add(`status-${statuses[0]}`);
      }
    }
  }
  
  /**
   * Create an empty state option when no files match
   */
  private createEmptyFileOption(): void {
    if (!this.fileSelect) return;
    
    const emptyOption = this.fileSelect.createEl('option', {
      text: this.searchTerm 
        ? `No files match "${this.searchTerm}"` 
        : 'No markdown files found',
      attr: { disabled: 'true' }
    });
    emptyOption.classList.add('note-status-empty-option');
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}