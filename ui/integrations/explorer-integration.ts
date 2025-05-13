import { App, TFile, debounce, setTooltip } from 'obsidian';
import { FileExplorerView, NoteStatusSettings } from '../../models/types';
import { StatusService } from '../../services/status-service';

/**
 * Enhanced file explorer integration for status icons
 */
export class ExplorerIntegration {
  private app: App;
  private settings: NoteStatusSettings;
  private statusService: StatusService;
  private iconUpdateQueue = new Set<string>();
  private isProcessingQueue = false;
  
  // Define with correct typing to match Obsidian's debounce return type
  private debouncedUpdateAll: {
    (): void;
    cancel: () => void;
  };

  constructor(app: App, settings: NoteStatusSettings, statusService: StatusService) {
    this.app = app;
    this.settings = settings;
    this.statusService = statusService;
    this.debouncedUpdateAll = debounce(
      () => this.processUpdateQueue(),
      100,
      true
    );
  }

  /**
   * Update settings and refresh UI as needed
   */
  public updateSettings(settings: NoteStatusSettings): void {
    const shouldRefreshIcons = 
      this.settings.showStatusIconsInExplorer !== settings.showStatusIconsInExplorer || 
      this.settings.hideUnknownStatusInExplorer !== settings.hideUnknownStatusInExplorer;
    
    this.settings = settings;

    if (shouldRefreshIcons) {
      this.removeAllFileExplorerIcons();
      
      if (settings.showStatusIconsInExplorer) {
        setTimeout(() => this.updateAllFileExplorerIcons(), 50);
      }
    } else if (settings.showStatusIconsInExplorer) {
      this.updateAllFileExplorerIcons();
    }
  }

  /**
   * Find the file explorer view
   */
  private findFileExplorerView(): FileExplorerView | null {
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
   * Queue a file for icon update
   */
  public queueFileUpdate(file: TFile): void {
    if (!this.settings.showStatusIconsInExplorer || file.extension !== 'md') return;
    
    this.iconUpdateQueue.add(file.path);
    this.debouncedUpdateAll();
  }

  /**
   * Process the queue of files that need icon updates
   */
  private async processUpdateQueue(): Promise<void> {
    if (this.isProcessingQueue || this.iconUpdateQueue.size === 0) return;
    
    this.isProcessingQueue = true;
    
    try {
      const fileExplorerView = this.findFileExplorerView();
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
  private async processBatch(paths: string[], fileExplorerView: FileExplorerView): Promise<void> {
    for (const path of paths) {
      const file = this.app.vault.getFileByPath(path);
      if (file instanceof TFile) {
        this.updateSingleFileIcon(file, fileExplorerView);
      }
      this.iconUpdateQueue.delete(path);
    }
  }

  /**
   * Update a single file's icon in the explorer
   */
  private updateSingleFileIcon(file: TFile, fileExplorerView: FileExplorerView): void {
    if (!this.settings.showStatusIconsInExplorer || file.extension !== 'md') return;
  
    try {
      const fileItem = fileExplorerView.fileItems[file.path];
      if (!fileItem) return;
      
      const titleEl = fileItem.titleEl || fileItem.selfEl;
      if (!titleEl) return;
      
      const statuses = this.statusService.getFileStatuses(file);
      
      this.removeExistingIcons(titleEl);
  
      if (this.shouldSkipIcon(statuses)) return;
  
      this.addStatusIcons(titleEl, statuses);
    } catch (error) {
      console.error(`Note Status: Error updating icon for ${file.path}`, error);
    }
  }
  
  /**
   * Check if icon should be skipped
   */
  private shouldSkipIcon(statuses: string[]): boolean {
    return this.settings.hideUnknownStatusInExplorer && 
           statuses.length === 1 && 
           statuses[0] === 'unknown';
  }
  
  /**
   * Remove existing status icons
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
   * Add status icons to an element
   */
  private addStatusIcons(titleEl: HTMLElement, statuses: string[]): void {
    const iconContainer = document.createElement('span');
    iconContainer.className = 'note-status-icon-container';

    if (this.settings.useMultipleStatuses && statuses.length > 0 && statuses[0] !== 'unknown') {
      statuses.forEach(status => this.addSingleStatusIcon(iconContainer, status));
    } else {
      const primaryStatus = statuses[0] || 'unknown';
      if (primaryStatus !== 'unknown' || !this.settings.hideUnknownStatusInExplorer) {
        this.addSingleStatusIcon(iconContainer, primaryStatus);
      }
    }
    
    if (iconContainer.childElementCount > 0) {
      titleEl.appendChild(iconContainer);
    }
  }
  
  /**
   * Add a single status icon
   */
  private addSingleStatusIcon(container: HTMLElement, status: string): void {
    const iconEl = document.createElement('span');
    iconEl.className = `note-status-icon nav-file-tag status-${status}`;
    iconEl.textContent = this.statusService.getStatusIcon(status);
    
    const statusObj = this.statusService.getAllStatuses().find(s => s.name === status);
    const tooltipValue = statusObj?.description ? `${status} - ${statusObj.description}`: status;
    setTooltip(iconEl, tooltipValue);
    
    container.appendChild(iconEl);
  }

  /**
   * Update file explorer icons for a file
   */
  public updateFileExplorerIcons(file: TFile): void {
    if (!file || !this.settings.showStatusIconsInExplorer || file.extension !== 'md') return;
    
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile?.path === file.path) {
      this.updateSingleFileIconDirectly(file);
    }
    
    this.queueFileUpdate(file);
  }

  /**
   * Update active file icon directly
   */
  private updateSingleFileIconDirectly(file: TFile): void {
    const fileExplorer = this.findFileExplorerView();
    if (fileExplorer) {
      this.updateSingleFileIcon(file, fileExplorer);
    }
  }

  /**
   * Update all file icons in explorer
   */
  public updateAllFileExplorerIcons(): void {
    if (!this.settings.showStatusIconsInExplorer) {
      this.removeAllFileExplorerIcons();
      return;
    }
    
    this.processFilesInBatches();
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
   * Remove all status icons
   */
  public removeAllFileExplorerIcons(): void {
    const fileExplorer = this.findFileExplorerView();
    if (!fileExplorer?.fileItems) return;
    
    Object.values(fileExplorer.fileItems).forEach(fileItem => {
      const titleEl = fileItem.titleEl || fileItem.selfEl;
      if (titleEl) this.removeExistingIcons(titleEl);
    });
    
    this.iconUpdateQueue.clear();
  }

  /**
   * Get selected files from explorer
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
   * Clean up on unload
   */
  public unload(): void {
    this.removeAllFileExplorerIcons();
    this.debouncedUpdateAll.cancel();
  }
}