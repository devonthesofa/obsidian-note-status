import { App, TFile, debounce, setTooltip } from 'obsidian';
import { FileExplorerView, NoteStatusSettings } from '../../models/types';
import { StatusService } from '../../services/status-service';

/**
 * Enhanced file explorer integration for displaying status icons
 */
export class ExplorerIntegration {
  private app: App;
  private settings: NoteStatusSettings;
  private statusService: StatusService;
  private iconUpdateQueue: Set<string> = new Set();
  private isProcessingQueue = false;
  
  // Debounced update function for better performance
  private debouncedUpdateAll = debounce(
    () => this.processUpdateQueue(),
    100,
    true
  );

  constructor(app: App, settings: NoteStatusSettings, statusService: StatusService) {
    this.app = app;
    this.settings = settings;
    this.statusService = statusService;
  }

  /**
   * Update settings reference and refresh icons
   */
  public updateSettings(settings: NoteStatusSettings): void {
    const previousShowIcons = this.settings.showStatusIconsInExplorer;
    this.settings = settings;

    if (previousShowIcons !== this.settings.showStatusIconsInExplorer) {
      if (this.settings.showStatusIconsInExplorer) {
        this.updateAllFileExplorerIcons();
      } else {
        this.removeAllFileExplorerIcons();
      }
    } else if (this.settings.showStatusIconsInExplorer) {
      // If setting hasn't changed but is enabled, refresh the icons
      this.updateAllFileExplorerIcons();
    }
  }

  /**
   * Find the file explorer view
   */
  private findFileExplorerView(): FileExplorerView | null {
    // Try the standard method first
    const leaf = this.app.workspace.getLeavesOfType('file-explorer')[0];
    if (leaf && leaf.view) {
      return leaf.view as FileExplorerView;
    }
    
    // Fallback to searching all leaves
    for (const leaf of this.app.workspace.getLeavesOfType('')) {
      if (leaf.view && 'fileItems' in leaf.view) {
        return leaf.view as FileExplorerView;
      }
    }
    
    return null;
  }

  /**
   * Add a file to the update queue
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
      if (!fileExplorerView || !fileExplorerView.fileItems) {
        // Schedule retry if view not found
        setTimeout(() => this.debouncedUpdateAll(), 200);
        return;
      }
      
      // Process files in the queue in batches
      const batchSize = 50;
      const allPaths = Array.from(this.iconUpdateQueue);
      
      for (let i = 0; i < allPaths.length; i += batchSize) {
        const batch = allPaths.slice(i, i + batchSize);
        
        // Process this batch
        for (const filePath of batch) {
          const file = this.app.vault.getFileByPath(filePath);
          if (file && file instanceof TFile) {
            this.updateSingleFileIcon(file, fileExplorerView);
          }
          this.iconUpdateQueue.delete(filePath);
        }
        
        // Let the UI breathe between batches
        if (i + batchSize < allPaths.length) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
    } catch (error) {
      console.error('Note Status: Error processing file update queue', error);
    } finally {
      this.isProcessingQueue = false;
      
      // If more files were added while processing, process them too
      if (this.iconUpdateQueue.size > 0) {
        this.debouncedUpdateAll();
      }
    }
  }

  /**
   * Update a single file's icon in the file explorer
   */
  private updateSingleFileIcon(file: TFile, fileExplorerView: FileExplorerView): void {
    if (!this.settings.showStatusIconsInExplorer || file.extension !== 'md') return;
  
    try {
      const fileItem = fileExplorerView.fileItems[file.path];
      if (!fileItem) return; // File not in explorer view
      
      const titleEl = fileItem.titleEl || fileItem.selfEl;
      if (!titleEl) return; // No title element found
      
      // Get statuses for this file
      const statuses = this.statusService.getFileStatuses(file);
      
      // Remove existing status icons if present
      this.removeExistingIcons(titleEl);
  
      // Hide unknown status if setting is enabled
      if (this.shouldHideUnknownStatus(statuses)) return;
  
      // Add status icons
      this.addStatusIcons(titleEl, statuses);
    } catch (error) {
      console.error(`Note Status: Error updating icon for ${file.path}`, error);
    }
  }
  
  /**
   * Check if unknown status should be hidden
   */
  private shouldHideUnknownStatus(statuses: string[]): boolean {
    return this.settings.hideUnknownStatusInExplorer && 
           statuses.length === 1 && 
           statuses[0] === 'unknown';
  }
  
  /**
   * Remove existing status icons from an element
   */
  private removeExistingIcons(element: HTMLElement): void {
    // Only select our specific status icon elements
    const existingIcons = element.querySelectorAll('.note-status-icon, .note-status-icon-container');
    
    existingIcons.forEach(icon => {
      // Only remove elements with our classes
      if (icon.classList.contains('note-status-icon') || 
          icon.classList.contains('note-status-icon-container')) {
        icon.remove();
      }
    });
  }
  
  /**
   * Add status icons to a title element
   */
  private addStatusIcons(titleEl: HTMLElement, statuses: string[]): void {
    // Create container for multiple icons
    const iconContainer = document.createElement('span');
    iconContainer.className = 'note-status-icon-container';

    // Add all status icons based on settings
    if (this.settings.useMultipleStatuses && statuses.length > 0 && statuses[0] !== 'unknown') {
      // Add all icons if using multiple statuses
      statuses.forEach(status => {
        this.addSingleStatusIcon(iconContainer, status);
      });
    } else {
      // Just show primary status
      const primaryStatus = statuses[0] || 'unknown';
      if (primaryStatus !== 'unknown' || !this.settings.autoHideStatusBar) {
        this.addSingleStatusIcon(iconContainer, primaryStatus);
      }
    }
    
    // Only append if we added icons
    if (iconContainer.childElementCount > 0) {
      // Use appendChild to add to the end
      titleEl.appendChild(iconContainer);
    }
  }
  
  /**
   * Add a single status icon
   */
  private addSingleStatusIcon(container: HTMLElement, status: string): void {
    // Create icon element
    const iconEl = document.createElement('span');
    iconEl.className = `note-status-icon nav-file-tag status-${status}`;
    iconEl.textContent = this.statusService.getStatusIcon(status);
    
    // Add tooltip with status name
    const statusObj = this.statusService.getAllStatuses().find(s => s.name === status);
    const tooltipValue = statusObj?.description ? `${status} - ${statusObj.description}`: status;
    setTooltip(iconEl, tooltipValue);
    
    // Append to container
    container.appendChild(iconEl);
  }

  /**
   * Update a file's icon (public method)
   */
  public updateFileExplorerIcons(file: TFile): void {
    if (!file || !this.settings.showStatusIconsInExplorer || file.extension !== 'md') return;
    
    // Handle active file with higher priority
    const activeFile = this.app.workspace.getActiveFile();
    const isActiveFile = activeFile && activeFile.path === file.path;
    
    if (isActiveFile) {
      this.updateSingleFileIconDirectly(file);
    }
    
    // Also queue for normal processing
    this.queueFileUpdate(file);
  }

  /**
   * Update a single file icon directly
   */
  private updateSingleFileIconDirectly(file: TFile): void {
    try {
      const fileExplorer = this.findFileExplorerView();
      if (!fileExplorer) return;
      
      this.updateSingleFileIcon(file, fileExplorer);
    } catch (error) {
      console.error('Note Status: Error updating file icon directly', error);
    }
  }

  /**
   * Update all file icons in the explorer
   */
  public updateAllFileExplorerIcons(): void {
    // Remove all icons if setting is turned off
    if (!this.settings.showStatusIconsInExplorer) {
      this.removeAllFileExplorerIcons();
      return;
    }
    
    // Process files in batches
    this.processFilesInBatches();
  }
  
  /**
   * Process files in batches to update icons
   */
  private async processFilesInBatches(): Promise<void> {
    const files = this.app.vault.getMarkdownFiles();
    const batchSize = 100; // Process 100 files at a time
    
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      batch.forEach(file => this.queueFileUpdate(file));
      
      // Let the UI breathe between batches
      if (i + batchSize < files.length) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
  }

  /**
   * Remove all status icons from the file explorer
   */
  public removeAllFileExplorerIcons(): void {
    const fileExplorer = this.findFileExplorerView();
    if (!fileExplorer || !fileExplorer.fileItems) return;
    
    // Use Object.values to avoid issues with concurrent modification
    Object.values(fileExplorer.fileItems).forEach((fileItem) => {
      const titleEl = fileItem.titleEl || fileItem.selfEl;
      if (!titleEl) return;
      
      this.removeExistingIcons(titleEl);
    });
    
    // Clear the update queue
    this.iconUpdateQueue.clear();
  }

  /**
   * Get selected files from the file explorer
   */
  public getSelectedFiles(): TFile[] {
    const fileExplorer = this.findFileExplorerView();
    if (!fileExplorer || !fileExplorer.fileItems) return [];
  
    const selectedFiles: TFile[] = [];
    
    Object.entries(fileExplorer.fileItems).forEach(([_, item]) => {
      if (item.el?.classList.contains('is-selected') && 
          item.file && item.file instanceof TFile && 
          item.file.extension === 'md') {
        selectedFiles.push(item.file);
      }
    });
  
    return selectedFiles;
  }

  /**
   * Clean up when plugin is unloaded
   */
  public unload(): void {
    this.removeAllFileExplorerIcons();
    this.debouncedUpdateAll.cancel();
  }
}