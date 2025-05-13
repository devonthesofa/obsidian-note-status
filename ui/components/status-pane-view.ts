import { TFile, WorkspaceLeaf, View, Menu, Notice, setIcon } from 'obsidian';
import { NoteStatusSettings } from '../../models/types';
import { StatusService } from '../../services/status-service';
import NoteStatus from 'main';

/**
 * Status Pane View for managing note statuses
 */
export class StatusPaneView extends View {
  plugin: NoteStatus;
  searchInput: HTMLInputElement | null = null;
  private settings: NoteStatusSettings;
  private statusService: StatusService;
  private paginationState = {
    itemsPerPage: 100,
    currentPage: {} as Record<string, number>
  };

  constructor(leaf: WorkspaceLeaf, plugin: NoteStatus) {
    super(leaf);
    this.plugin = plugin;
    this.settings = plugin.settings;
    this.statusService = plugin.statusService;
  }

  getViewType(): string {
    return 'status-pane';
  }

  getDisplayText(): string {
    return 'Status pane';
  }

  getIcon(): string {
    return 'status-pane';
  }

  async onOpen(): Promise<void> {
    await this.setupPane();
  }

  async setupPane(): Promise<void> {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass('note-status-pane', 'nav-files-container');

    this.createHeaderContainer();
    containerEl.toggleClass('note-status-compact-view', this.settings.compactView);

    const groupsContainer = containerEl.createDiv({ 
      cls: 'note-status-groups-container' 
    });
    
    const loadingIndicator = this.createLoadingIndicator(groupsContainer);
    
    // Use non-blocking render
    setTimeout(async () => {
      await this.renderGroups('');
      loadingIndicator.remove();
    }, 10);
  }

  /**
   * Create header container with search and actions
   */
  private createHeaderContainer(): HTMLElement {
    const headerContainer = this.containerEl.createDiv({ cls: 'note-status-header' });
    this.createSearchInput(headerContainer);
    this.createActionToolbar(headerContainer);
    return headerContainer;
  }
  
  /**
   * Create loading indicator
   */
  private createLoadingIndicator(container: HTMLElement): HTMLElement {
    const loadingIndicator = container.createDiv({ cls: 'note-status-loading' });
    loadingIndicator.innerHTML = '<span>Loading notes...</span>';
    return loadingIndicator;
  }

  private createSearchInput(container: HTMLElement): void {
    const searchContainer = container.createDiv({ cls: 'note-status-search search-input-container' });
    const searchWrapper = searchContainer.createDiv({ cls: 'search-input-wrapper' });

    // Search icon
    const searchIcon = searchWrapper.createEl('span', { cls: 'search-input-icon' });
    setIcon(searchIcon, 'search');

    // Create the search input
    this.searchInput = searchWrapper.createEl('input', {
      type: 'text',
      placeholder: 'Search notes...',
      cls: 'note-status-search-input search-input'
    });

    this.searchInput.addEventListener('input', () => {
      this.renderGroups(this.searchInput!.value.toLowerCase());
      this.toggleClearButton();
    });

    // Clear search button
    const clearSearchBtn = searchWrapper.createEl('span', { cls: 'search-input-clear-button' });
    setIcon(clearSearchBtn, 'x');

    clearSearchBtn.addEventListener('click', () => {
      if (this.searchInput) {
        this.searchInput.value = '';
        this.renderGroups('');
        this.toggleClearButton();
      }
    });
  }

  private toggleClearButton(): void {
    const clearBtn = this.containerEl.querySelector('.search-input-clear-button');
    if (clearBtn && this.searchInput) {
      clearBtn.toggleClass('is-visible', !!this.searchInput.value);
    }
  }

  private createActionToolbar(container: HTMLElement): void {
    const actionsContainer = container.createDiv({ cls: 'status-pane-actions-container' });
    
    // Toggle compact view button
    this.createViewToggleButton(actionsContainer);
    
    // Refresh button
    this.createRefreshButton(actionsContainer);
  }
  
  /**
   * Create view toggle button
   */
  private createViewToggleButton(container: HTMLElement): void {
    const viewToggleButton = container.createEl('button', {
      type: 'button',
      title: this.settings.compactView ? 'Switch to Standard View' : 'Switch to Compact View',
      cls: 'note-status-view-toggle clickable-icon'
    });
    
    setIcon(viewToggleButton, this.settings.compactView ? 'layout' : 'table');
    
    viewToggleButton.addEventListener('click', async () => {
      this.settings.compactView = !this.settings.compactView;
      viewToggleButton.title = this.settings.compactView ? 'Switch to Standard View' : 'Switch to Compact View';
      viewToggleButton.empty();
      setIcon(viewToggleButton, this.settings.compactView ? 'layout' : 'table');
    
      window.dispatchEvent(new CustomEvent('note-status:settings-changed'));
      this.containerEl.toggleClass('note-status-compact-view', this.settings.compactView);
      await this.renderGroups(this.searchInput?.value.toLowerCase() || '');
    });
  }
  
  /**
   * Create refresh button
   */
  private createRefreshButton(container: HTMLElement): void {
    const refreshButton = container.createEl('button', {
      type: 'button',
      title: 'Refresh statuses',
      cls: 'note-status-actions-refresh clickable-icon'
    });
    
    setIcon(refreshButton, 'refresh-cw');
    
    refreshButton.addEventListener('click', async () => {
      await this.renderGroups(this.searchInput?.value.toLowerCase() || '');
      new Notice('Status pane refreshed');
    });
  }

  async renderGroups(searchQuery = ''): Promise<void> {
    const { containerEl } = this;
    const groupsContainerEl = containerEl.querySelector('.note-status-groups-container') as HTMLElement;
    if (!groupsContainerEl) return;

    if (searchQuery) {
      this.showSearchLoadingIndicator(groupsContainerEl, searchQuery);
      await this.waitForNextFrame();
    } else {
      groupsContainerEl.empty();
    }

    const statusGroups = this.getFilteredStatusGroups(searchQuery);
    this.removeLoadingIndicator(groupsContainerEl);
    this.renderStatusGroups(groupsContainerEl, statusGroups);
    
    // Check if no groups were rendered
    if (groupsContainerEl.childElementCount === 0) {
      this.showEmptyState(groupsContainerEl, searchQuery);
    }
  }
  
  /**
   * Show loading indicator for search
   */
  private showSearchLoadingIndicator(container: HTMLElement, query: string): void {
    container.empty();
    const loadingIndicator = container.createDiv({ cls: 'note-status-loading' });
    loadingIndicator.innerHTML = `<span>Searching for "${query}"...</span>`;
  }
  
  /**
   * Wait for next animation frame
   */
  private async waitForNextFrame(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 0));
  }
  
  /**
   * Remove loading indicator if it exists
   */
  private removeLoadingIndicator(container: HTMLElement): void {
    const loadingIndicator = container.querySelector('.note-status-loading');
    if (loadingIndicator) loadingIndicator.remove();
  }
  
  /**
   * Render all status groups
   */
  private renderStatusGroups(container: HTMLElement, statusGroups: Record<string, TFile[]>): void {
    Object.entries(statusGroups).forEach(([status, files]) => {
      if (files.length > 0) {
        // Skip unknown status if setting enabled
        if (status === 'unknown' && this.settings.excludeUnknownStatus) return;
        this.renderStatusGroup(container, status, files);
      }
    });
  }
  
  /**
   * Show empty state message
   */
  private showEmptyState(container: HTMLElement, searchQuery: string): void {
    const emptyMessage = container.createDiv({ cls: 'note-status-empty-indicator' });
    
    if (searchQuery) {
      emptyMessage.textContent = `No notes found matching "${searchQuery}"`;
    } else if (this.settings.excludeUnknownStatus) {
      emptyMessage.empty();
      
      emptyMessage.createDiv({
        text: 'No notes with status found. Unassigned notes are currently hidden.',
        cls: 'note-status-empty-message'
      });
      
      const btnContainer = emptyMessage.createDiv({
        cls: 'note-status-button-container'
      });
      
      const showUnknownBtn = btnContainer.createEl('button', {
        text: 'Show unassigned notes',
        cls: 'note-status-show-unassigned-button'
      });
      
      showUnknownBtn.addEventListener('click', async () => {
        this.settings.excludeUnknownStatus = false;
        await this.plugin.saveSettings();
        this.renderGroups(searchQuery);
      });
    }
  }
  
  /**
   * Get status groups with filtering
   */
  private getFilteredStatusGroups(searchQuery = ''): Record<string, TFile[]> {
    const rawGroups = this.statusService.groupFilesByStatus(searchQuery);
    const filteredGroups: Record<string, TFile[]> = {};
    
    Object.entries(rawGroups).forEach(([status, files]) => {
      if (files.length > 0 && !(status === 'unknown' && this.settings.excludeUnknownStatus)) {
        filteredGroups[status] = files;
      }
    });
    
    return filteredGroups;
  }

  private renderStatusGroup(container: HTMLElement, status: string, files: TFile[]): void {
    const groupEl = container.createDiv({ cls: 'note-status-group nav-folder' });
    const titleEl = groupEl.createDiv({ cls: 'nav-folder-title' });

    const collapseContainer = titleEl.createDiv({ cls: 'note-status-collapse-indicator' });
    setIcon(collapseContainer, 'chevron-down');

    const titleContentContainer = titleEl.createDiv({ cls: 'nav-folder-title-content' });

    const statusIcon = this.statusService.getStatusIcon(status);
    titleContentContainer.createSpan({
      text: `${status} ${statusIcon} (${files.length})`,
      cls: `status-${status}`
    });

    this.setupGroupCollapsible(groupEl, collapseContainer, status);
    this.renderGroupContent(groupEl, files, status);
  }
  
  /**
   * Set up collapsible behavior for a group
   */
  private setupGroupCollapsible(
    groupEl: HTMLElement, 
    collapseContainer: HTMLElement, 
    status: string
  ): void {
    const isCollapsed = this.settings.collapsedStatuses[status] ?? false;

    if (isCollapsed) {
      groupEl.addClass('note-status-is-collapsed');
      collapseContainer.empty();
      setIcon(collapseContainer, 'chevron-right');
    }

    const titleEl = groupEl.querySelector('.nav-folder-title') as HTMLElement;
    if (titleEl) {
      titleEl.addEventListener('click', (e) => {
        e.preventDefault();
        const isCurrentlyCollapsed = groupEl.hasClass('note-status-is-collapsed');

        groupEl.toggleClass('note-status-is-collapsed', !isCurrentlyCollapsed);
        collapseContainer.empty();
        setIcon(collapseContainer, isCurrentlyCollapsed ? 'chevron-down' : 'chevron-right');

        this.settings.collapsedStatuses[status] = !isCurrentlyCollapsed;
        window.dispatchEvent(new CustomEvent('note-status:settings-changed'));
      });
    }
  }
  
  /**
   * Render the content of a status group
   */
  private renderGroupContent(groupEl: HTMLElement, files: TFile[], status: string): void {
    const childrenEl = groupEl.createDiv({ cls: 'nav-folder-children' });

    // Sort files by name
    files.sort((a, b) => a.basename.localeCompare(b.basename));
    
    // Initialize pagination
    if (!this.paginationState.currentPage[status]) {
      this.paginationState.currentPage[status] = 0;
    }
    
    const currentPage = this.paginationState.currentPage[status];
    const itemsPerPage = this.paginationState.itemsPerPage;
    const totalPages = Math.ceil(files.length / itemsPerPage);
    const startIndex = currentPage * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, files.length);
    
    // Create file list items for current page
    files.slice(startIndex, endIndex).forEach(file => {
      this.createFileListItem(childrenEl, file, status);
    });
    
    // Add pagination if needed
    if (files.length > itemsPerPage) {
      this.addPaginationControls(childrenEl, status, currentPage, totalPages, files.length);
    }
  }
  
  /**
   * Add pagination controls to a group
   */
  private addPaginationControls(
    container: HTMLElement, 
    status: string, 
    currentPage: number, 
    totalPages: number,
    totalItems: number
  ): void {
    const paginationEl = container.createDiv({ cls: 'note-status-pagination' });
    
    // Add previous page button if not on first page
    if (currentPage > 0) {
      const prevButton = paginationEl.createEl('button', {
        text: 'Previous',
        cls: 'note-status-pagination-button'
      });
      
      prevButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.paginationState.currentPage[status] = currentPage - 1;
        this.renderGroups(this.searchInput?.value.toLowerCase() || '');
      });
    }
    
    // Add page indicator
    paginationEl.createSpan({
      text: `Page ${currentPage + 1} of ${totalPages} (${totalItems} notes)`,
      cls: 'note-status-pagination-info'
    });
    
    // Add next page button if not on last page
    if (currentPage < totalPages - 1) {
      const nextButton = paginationEl.createEl('button', {
        text: 'Next',
        cls: 'note-status-pagination-button'
      });
      
      nextButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this.paginationState.currentPage[status] = currentPage + 1;
        this.renderGroups(this.searchInput?.value.toLowerCase() || '');
      });
    }
  }

  private createFileListItem(container: HTMLElement, file: TFile, status: string): void {
    if (!file || !(file instanceof TFile)) return;
    
    const fileEl = container.createDiv({ cls: 'nav-file' });
    const fileTitleEl = fileEl.createDiv({ cls: 'nav-file-title' });

    // Add file icon if in standard view
    if (!this.settings.compactView) {
      const fileIcon = fileTitleEl.createDiv({ cls: 'nav-file-icon' });
      setIcon(fileIcon, 'file');
    }

    // Add file name
    fileTitleEl.createSpan({
      text: file.basename,
      cls: 'nav-file-title-content'
    });

    // Add status indicator
    fileTitleEl.createSpan({
      cls: `note-status-icon nav-file-tag status-${status}`,
      text: this.statusService.getStatusIcon(status)
    });

    // Add click handler to open the file
    fileEl.addEventListener('click', (e) => {
      e.preventDefault();
      this.app.workspace.openLinkText(file.path, file.path, true);
    });

    // Add context menu
    fileEl.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showFileContextMenu(e, file);
    });
  }

  private showFileContextMenu(e: MouseEvent, file: TFile): void {
    const menu = new Menu();
  
    menu.addItem((item) =>
      item.setTitle('Change status')
        .setIcon('tag')
        .onClick(() => {
          this.plugin.statusContextMenu.showForFile(file, e);
        })
    );
  
    menu.addItem((item) =>
      item.setTitle('Open in new tab')
        .setIcon('lucide-external-link')
        .onClick(() => {
          this.app.workspace.openLinkText(file.path, file.path, 'tab');
        })
    );
  
    menu.showAtMouseEvent(e);
  }

  onClose(): Promise<void> {
    this.containerEl.empty();
    return Promise.resolve();
  }

  /**
   * Update view when settings change
   */
  updateSettings(settings: NoteStatusSettings): void {
    this.settings = settings;
    this.containerEl.toggleClass('note-status-compact-view', settings.compactView);
    this.renderGroups(this.searchInput?.value.toLowerCase() || '');
  }
}