import { App, TFile, debounce, setTooltip } from 'obsidian';
import { FileExplorerView, NoteStatusSettings } from '../../models/types';
import { StatusService } from 'services/status-service';

/**
 * Gestiona la integración de iconos en el explorador de archivos
 */
export class ExplorerIntegration {
  private app: App;
  private settings: NoteStatusSettings;
  private statusService: StatusService;
  private iconUpdateQueue = new Set<string>();
  private isProcessingQueue = false;
  private debouncedUpdateAll: ReturnType<typeof debounce>;

  constructor(app: App, settings: NoteStatusSettings, statusService: StatusService) {
    this.app = app;
    this.settings = settings;
    this.statusService = statusService;
    this.debouncedUpdateAll = debounce(this.processUpdateQueue.bind(this), 100, true);
  }

  /**
   * Actualiza la configuración y refresca la UI si es necesario
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
   * Encuentra la vista del explorador de archivos
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
   * Actualiza los iconos para un archivo específico
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
   * Actualiza todos los iconos en el explorador
   */
  public updateAllFileExplorerIcons(): void {
    if (!this.settings.showStatusIconsInExplorer) {
      this.removeAllFileExplorerIcons();
      return;
    }
    
    this.processFilesInBatches();
  }

  /**
   * Elimina todos los iconos de estado
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
   * Obtiene los archivos seleccionados del explorador
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

  // Métodos para procesamiento por lotes
  
  private queueFileUpdate(file: TFile): void {
    if (!this.settings.showStatusIconsInExplorer || file.extension !== 'md') return;
    
    this.iconUpdateQueue.add(file.path);
    this.debouncedUpdateAll();
  }

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
  
  private async processBatch(paths: string[], fileExplorerView: FileExplorerView): Promise<void> {
    for (const path of paths) {
      const file = this.app.vault.getFileByPath(path);
      if (file instanceof TFile) {
        this.updateSingleFileIcon(file, fileExplorerView);
      }
      this.iconUpdateQueue.delete(path);
    }
  }

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

  // Métodos para manipular iconos
  
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
  
  private updateSingleFileIconDirectly(file: TFile): void {
    const fileExplorer = this.findFileExplorerView();
    if (fileExplorer) {
      this.updateSingleFileIcon(file, fileExplorer);
    }
  }
  
  private shouldSkipIcon(statuses: string[]): boolean {
    return this.settings.hideUnknownStatusInExplorer && 
           statuses.length === 1 && 
           statuses[0] === 'unknown';
  }
  
  private removeExistingIcons(element: HTMLElement): void {
    const iconSelectors = '.note-status-icon, .note-status-icon-container';
    element.querySelectorAll(iconSelectors).forEach(icon => {
      if (icon.classList.contains('note-status-icon') || 
          icon.classList.contains('note-status-icon-container')) {
        icon.remove();
      }
    });
  }
  
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
   * Limpieza al descargar el plugin
   */
  public unload(): void {
    this.removeAllFileExplorerIcons();
    this.debouncedUpdateAll.cancel();
  }
}