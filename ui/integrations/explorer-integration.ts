import { App, TFile, debounce, setTooltip } from 'obsidian';
import { FileExplorerView, NoteStatusSettings } from '../../models/types';
import { StatusService } from '../../services/status-service';

/**
 * Enhanced file explorer integration for displaying status icons
 * Includes performance optimizations and error handling
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

    this.handleSettingsChange(previousShowIcons);
  }
  
  /**
   * Handle settings change and update UI accordingly
   */
  private handleSettingsChange(previousShowIcons: boolean): void {
    // Update icons based on new settings
    if (previousShowIcons !== this.settings.showStatusIconsInExplorer) {
      if (this.settings.showStatusIconsInExplorer) {
        this.updateAllFileExplorerIcons();
      } else {
        this.removeAllFileExplorerIcons();
      }
    } else if (this.settings.showStatusIconsInExplorer) {
      // If setting hasn't changed but is enabled, refresh the icons
      // This handles cases where custom statuses or colors changed
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
    
    // If that fails, try to find it by searching all leaves
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
      
      // Process files in the queue
      for (const filePath of this.iconUpdateQueue) {
        const file = this.app.vault.getFileByPath(filePath);
        if (file && file instanceof TFile) {
          this.updateSingleFileIcon(file, fileExplorerView);
        }
        this.iconUpdateQueue.delete(filePath);
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
      if (!fileItem) {
        console.debug(`Note Status: File item not found for ${file.path}`);
        return;
      }
      
      const titleEl = fileItem.titleEl || fileItem.selfEl;
      if (!titleEl) {
        console.debug(`Note Status: Title element not found for ${file.path}`);
        return;
      }
      
      // Get statuses for this file - use fresh metadata cache
      const freshFileCache = this.app.metadataCache.getFileCache(file);
      if (!freshFileCache) {
        console.debug(`Note Status: Metadata cache not found for ${file.path}`);
        return;
      }
      
      // Get statuses with fresh metadata
      const statuses = this.statusService.getFileStatuses(file);
      
      // Remove existing icons if present
      this.removeExistingIcons(titleEl);
  
      // Hide unknown status if setting is enabled
      if (this.shouldHideUnknownStatus(statuses)) {
        return;
      }
  
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
    const existingIcons = element.querySelectorAll('.note-status-icon, .note-status-icon-container');
    existingIcons.forEach(icon => icon.remove());
  }
  
  /**
   * Add status icons to a title element
   */
  private addStatusIcons(titleEl: HTMLElement, statuses: string[]): void {
    // Create container for multiple icons
    const iconContainer = titleEl.createEl('span', {
      cls: 'note-status-icon-container'
    });

    // Add all status icons
    if (this.settings.useMultipleStatuses && statuses.length > 0 && statuses[0] !== 'unknown') {
      // Add all icons if using multiple statuses
      this.addMultipleStatusIcons(iconContainer, statuses);
    } else {
      // Just show primary status
      this.addPrimaryStatusIcon(iconContainer, statuses);
    }
    
    // Remove container if empty (no icons added)
    if (iconContainer.childElementCount === 0) {
      iconContainer.remove();
    }
  }
  
  /**
   * Add multiple status icons to a container
   */
  private addMultipleStatusIcons(container: HTMLElement, statuses: string[]): void {
    statuses.forEach(status => {
      this.addSingleStatusIcon(container, status);
    });
  }
  
  /**
   * Add primary status icon to a container
   */
  private addPrimaryStatusIcon(container: HTMLElement, statuses: string[]): void {
    const primaryStatus = statuses[0] || 'unknown';
    if (primaryStatus !== 'unknown' || !this.settings.autoHideStatusBar) {
      this.addSingleStatusIcon(container, primaryStatus);
    }
  }
  
  /**
   * Add a single status icon
   */
  private addSingleStatusIcon(container: HTMLElement, status: string): void {
    const icon = this.statusService.getStatusIcon(status);
    const iconEl = container.createEl('span', {
      cls: `note-status-icon nav-file-tag status-${status}`,
      text: icon
    });
    
    // Add tooltip with status name
    const statusObj = this.statusService.getAllStatuses().find(s => s.name === status);
    const tooltipValue = statusObj?.description ? `${status} - ${statusObj.description}`: status;
    setTooltip(iconEl, tooltipValue);
  }

  /**
   * Update a single file's icon in the file explorer (public method)
   */
  public updateFileExplorerIcons(file: TFile): void {
    if (!this.settings.showStatusIconsInExplorer || file.extension !== 'md') return;
    
    // Add direct immediate update for critical files (like active file)
    const activeFile = this.app.workspace.getActiveFile();
    const isActiveFile = activeFile && activeFile.path === file.path;
    
    // For active file, update immediately and also queue
    if (isActiveFile) {
      this.updateSingleFileIconDirectly(file);
    }
    
    // Also queue update for normal processing
    this.queueFileUpdate(file);
  }

  /**
   * Update a single file icon directly (for immediate updates)
   */
  private updateSingleFileIconDirectly(file: TFile): void {
    try {
      const fileExplorer = this.app.workspace.getLeavesOfType('file-explorer')[0];
      if (!fileExplorer || !fileExplorer.view) return;
      
      const fileExplorerView = fileExplorer.view as FileExplorerView;
      if (!fileExplorerView.fileItems) return;
      
      const fileItem = fileExplorerView.fileItems[file.path];
      if (!fileItem) {
        // If file item not found in current view, try to refresh all
        setTimeout(() => this.updateAllFileExplorerIcons(), 50);
        return;
      }
      
      this.updateSingleFileIcon(file, fileExplorerView);
    } catch (error) {
      console.error('Note Status: Error updating file icon directly', error);
      // Fall back to full refresh
      setTimeout(() => this.updateAllFileExplorerIcons(), 100);
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

    // Queue all markdown files for update
    const files = this.app.vault.getMarkdownFiles();
    files.forEach(file => this.queueFileUpdate(file));
  }

  /**
   * Remove all status icons from the file explorer
   */
  public removeAllFileExplorerIcons(): void {
    const fileExplorer = this.app.workspace.getLeavesOfType('file-explorer')[0];
    if (!fileExplorer || !fileExplorer.view) return;
    
    const fileExplorerView = fileExplorer.view as FileExplorerView;
    if (!fileExplorerView.fileItems) return;
    
    Object.values(fileExplorerView.fileItems).forEach((fileItem) => {
      const titleEl = fileItem.titleEl || fileItem.selfEl;
      if (!titleEl) return;
      
      const existingIcons = titleEl.querySelectorAll('.note-status-icon, .note-status-icon-container');
      existingIcons.forEach(icon => icon.remove());
    });
    
    // Clear the update queue
    this.iconUpdateQueue.clear();
  }

  /**
   * Get selected files from the file explorer
   */
  public getSelectedFiles(): TFile[] {
    const fileExplorer = this.app.workspace.getLeavesOfType('file-explorer')[0];
    if (!fileExplorer || !fileExplorer.view) return [];
  
    const fileExplorerView = fileExplorer.view as FileExplorerView;
    if (!fileExplorerView.fileItems) return [];
  
    const selectedFiles: TFile[] = [];
    
    Object.entries(fileExplorerView.fileItems).forEach(([_, item]) => {
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