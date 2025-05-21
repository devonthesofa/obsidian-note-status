import { App, TFile, setTooltip, debounce } from 'obsidian';
import { NoteStatusSettings, FileExplorerView } from '../../models/types';
import { StatusService } from 'services/status-service';


/**
 * Manages the logic for file explorer status integration
 */
export class ExplorerIntegration {
  private app: App;
  private settings: NoteStatusSettings;
  private statusService: StatusService;
  private ui: ExplorerIntegrationUI;
  private iconUpdateQueue = new Set<string>();
  private isProcessingQueue = false;
  private debouncedUpdateAll: ReturnType<typeof debounce>;

  constructor(app: App, settings: NoteStatusSettings, statusService: StatusService) {
    this.app = app;
    this.settings = settings;
    this.statusService = statusService;
    this.ui = new ExplorerIntegrationUI(app, settings, statusService);
    this.debouncedUpdateAll = debounce(this.processUpdateQueue.bind(this), 100, true);
  }

  /**
   * Updates settings and refreshes UI if necessary
   */
  public updateSettings(settings: NoteStatusSettings): void {
    const shouldRefreshIcons = 
      this.settings.showStatusIconsInExplorer !== settings.showStatusIconsInExplorer || 
      this.settings.hideUnknownStatusInExplorer !== settings.hideUnknownStatusInExplorer;
    
    this.settings = settings;
    this.ui.updateSettings(settings);

    if (shouldRefreshIcons) {
      this.ui.removeAllFileExplorerIcons();
      
      if (settings.showStatusIconsInExplorer) {
        setTimeout(() => this.updateAllFileExplorerIcons(), 50);
      }
    } else if (settings.showStatusIconsInExplorer) {
      this.updateAllFileExplorerIcons();
    }
  }

  /**
   * Updates icons for a specific file
   */
  public updateFileExplorerIcons(file: TFile): void {
    if (!file || !this.settings.showStatusIconsInExplorer || file.extension !== 'md') return;
    
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile?.path === file.path) {
      this.ui.updateSingleFileIconDirectly(file, this.statusService);
    }
    
    this.queueFileUpdate(file);
  }

  /**
   * Updates all icons in the explorer
   */
  public updateAllFileExplorerIcons(): void {
    if (!this.settings.showStatusIconsInExplorer) {
      this.ui.removeAllFileExplorerIcons();
      return;
    }
    
    this.processFilesInBatches();
  }

  /**
   * Gets selected files from the explorer
   */
  public getSelectedFiles(): TFile[] {
    return this.ui.getSelectedFiles();
  }

  /**
   * Queue a file for icon update
   */
  private queueFileUpdate(file: TFile): void {
    if (!this.settings.showStatusIconsInExplorer || file.extension !== 'md') return;
    
    this.iconUpdateQueue.add(file.path);
    this.debouncedUpdateAll();
  }

  /**
   * Process the update queue
   */
  private async processUpdateQueue(): Promise<void> {
    if (this.isProcessingQueue || this.iconUpdateQueue.size === 0) return;
    
    this.isProcessingQueue = true;
    
    try {
      const fileExplorerView = this.ui.findFileExplorerView();
      if (!fileExplorerView) {
        setTimeout(() => this.debouncedUpdateAll(), 200);
        return;
      }
      
      const allPaths = Array.from(this.iconUpdateQueue);
      const batchSize = 50;
      
      for (let i = 0; i < allPaths.length; i += batchSize) {
        await this.processBatch(allPaths.slice(i, i + batchSize), fileExplorerView);
        
        if (i + batchSize < allPaths.length) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    } catch (error) {
      console.error('Note Status: Error processing file update queue', error);
    } finally {
      this.isProcessingQueue = false;
      
      if (this.iconUpdateQueue.size > 0) {
        this.debouncedUpdateAll();
      }
    }
  }
  
  /**
   * Process a batch of files
   */
  private async processBatch(paths: string[], fileExplorerView: any): Promise<void> {
    for (const path of paths) {
      const file = this.app.vault.getFileByPath(path);
      if (file instanceof TFile) {
        this.ui.updateSingleFileIcon(file, fileExplorerView, this.statusService);
      }
      this.iconUpdateQueue.delete(path);
    }
  }

  /**
   * Process files in batches
   */
  private async processFilesInBatches(): Promise<void> {
    const files = this.app.vault.getMarkdownFiles();
    const batchSize = 100;
    
    for (let i = 0; i < files.length; i += batchSize) {
      files.slice(i, i + batchSize).forEach(file => this.queueFileUpdate(file));
      
      if (i + batchSize < files.length) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  }

  /**
   * Cleanup when unloading the plugin
   */
  public unload(): void {
    this.ui.removeAllFileExplorerIcons();
    this.debouncedUpdateAll.cancel();
  }
}

/**
 * Manages UI operations for file explorer icons
 */
export class ExplorerIntegrationUI {
  private app: App;
  private settings: NoteStatusSettings;

  constructor(app: App, settings: NoteStatusSettings, statusService: StatusService) {
    this.app = app;
    this.settings = settings;
  }

  /**
   * Updates the settings
   */
  public updateSettings(settings: NoteStatusSettings): void {
    this.settings = settings;
  }

  /**
   * Finds the file explorer view
   */
  public findFileExplorerView(): FileExplorerView | null {
    const leaf = this.app.workspace.getLeavesOfType('file-explorer')[0];
    if (leaf?.view) return leaf.view as FileExplorerView;
    
    for (const leaf of this.app.workspace.getLeavesOfType('')) {
      if (leaf.view && 'fileItems' in leaf.view) {
        return leaf.view as FileExplorerView;
      }
    }
    
    return null;
  }

  /**
   * Updates a single file icon
   */
  public updateSingleFileIcon(file: TFile, fileExplorerView: FileExplorerView, statusService: StatusService): void {
    if (!this.settings.showStatusIconsInExplorer || file.extension !== 'md') return;
  
    try {
      const fileItem = fileExplorerView.fileItems[file.path];
      if (!fileItem) return;
      
      const titleEl = fileItem.titleEl || fileItem.selfEl;
      if (!titleEl) return;
      
      const statuses = statusService.getFileStatuses(file);
      
      this.removeExistingIcons(titleEl);
  
      if (this.shouldSkipIcon(statuses)) return;
  
      this.addStatusIcons(titleEl, statuses, statusService);
    } catch (error) {
      console.error(`Note Status: Error updating icon for ${file.path}`, error);
    }
  }
  
  /**
   * Updates the icon for the active file directly
   */
  public updateSingleFileIconDirectly(file: TFile, statusService: StatusService): void {
    const fileExplorer = this.findFileExplorerView();
    if (fileExplorer) {
      this.updateSingleFileIcon(file, fileExplorer, statusService);
    }
  }

  /**
   * Removes all file explorer icons
   */
  public removeAllFileExplorerIcons(): void {
    const fileExplorer = this.findFileExplorerView();
    if (!fileExplorer?.fileItems) return;
    
    Object.values(fileExplorer.fileItems).forEach(fileItem => {
      const titleEl = fileItem.titleEl || fileItem.selfEl;
      if (titleEl) this.removeExistingIcons(titleEl);
    });
  }

  /**
   * Gets the currently selected files
   */
  public getSelectedFiles(): TFile[] {
    const fileExplorer = this.findFileExplorerView();
    if (!fileExplorer?.fileItems) return [];
  
    return Object.values(fileExplorer.fileItems)
      .filter(item => 
        item.el?.classList.contains('is-selected') && 
        item.file instanceof TFile && 
        item.file.extension === 'md')
      .map(item => item.file as TFile);
  }

  /**
   * Checks if the icon should be skipped based on status
   */
  private shouldSkipIcon(statuses: string[]): boolean {
    return this.settings.hideUnknownStatusInExplorer && 
           statuses.length === 1 && 
           statuses[0] === 'unknown';
  }
  
  /**
   * Removes existing status icons
   */
  private removeExistingIcons(element: HTMLElement): void {
    const iconSelectors = '.note-status-icon, .note-status-icon-container';
    element.querySelectorAll(iconSelectors).forEach(icon => {
      if (icon.classList.contains('note-status-icon') || 
          icon.classList.contains('note-status-icon-container')) {
        icon.remove();
      }
    });
  }
  
  /**
   * Adds status icons to an element
   */
  private addStatusIcons(titleEl: HTMLElement, statuses: string[], statusService: StatusService): void {
    const iconContainer = document.createElement('span');
    iconContainer.className = 'note-status-icon-container';

    if (this.settings.useMultipleStatuses && statuses.length > 0 && statuses[0] !== 'unknown') {
      statuses.forEach(status => this.addSingleStatusIcon(iconContainer, status, statusService));
    } else {
      const primaryStatus = statuses[0] || 'unknown';
      if (primaryStatus !== 'unknown' || !this.settings.hideUnknownStatusInExplorer) {
        this.addSingleStatusIcon(iconContainer, primaryStatus, statusService);
      }
    }
    
    if (iconContainer.childElementCount > 0) {
      titleEl.appendChild(iconContainer);
    }
  }
  
  /**
   * Adds a single status icon
   */
  private addSingleStatusIcon(container: HTMLElement, status: string, statusService: StatusService): void {
    const iconEl = document.createElement('span');
    iconEl.className = `note-status-icon nav-file-tag status-${status}`;
    iconEl.textContent = statusService.getStatusIcon(status);
    
    const statusObj = statusService.getAllStatuses().find(s => s.name === status);
    const tooltipValue = statusObj?.description ? `${status} - ${statusObj.description}`: status;
    setTooltip(iconEl, tooltipValue);
    
    container.appendChild(iconEl);
  }
}