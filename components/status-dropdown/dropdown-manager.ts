import { MarkdownView, Editor, Notice, TFile, App } from 'obsidian';
import { DropdownUI } from './dropdown-ui';
import { DropdownOptions, DropdownDependencies } from './types';
import { createDummyTarget } from './dropdown-position';
import { StatusService } from 'services/status-service';
import { NoteStatusSettings } from 'models/types';

/**
 * High-level manager for status dropdown interactions
 */
export class DropdownManager {
  private app: App;
  private settings: NoteStatusSettings;
  private statusService: StatusService;
  private currentStatuses: string[] = ['unknown'];
  private toolbarButton?: HTMLElement;
  private dropdownUI: DropdownUI;  
  
  constructor(app: App, settings: NoteStatusSettings, statusService: StatusService) {
    this.app = app;
    this.settings = settings;
    this.statusService = statusService;
    
    const deps: DropdownDependencies = { app, settings, statusService };
    this.dropdownUI = new DropdownUI(deps);
    this.setupDropdownCallbacks();
  }

  /**
   * Set up dropdown callbacks
   */
  private setupDropdownCallbacks(): void {

    this.dropdownUI.setOnRemoveStatusHandler(async (status, targetFile) => {
      if (!targetFile) return;
      
      const isMultiple = Array.isArray(targetFile);
      
      await this.statusService.handleStatusChange({
        files: targetFile,
        statuses: status,
        operation: 'remove',
        showNotice: isMultiple
      });
    });
    
    this.dropdownUI.setOnSelectStatusHandler(async (status, targetFile) => {
      // Check if handling multiple files
      const isMultipleFiles = Array.isArray(targetFile) && targetFile.length > 1;
      
      if (isMultipleFiles) {
        const files = targetFile as TFile[];
        // Count how many files already have this status
        const filesWithStatus = files.filter(file => 
          this.statusService.getFileStatuses(file).includes(status)
        );
        
        // If ALL have the status, remove it. Otherwise, add it
        const operation = filesWithStatus.length === files.length ? 'remove' : (!this.settings.useMultipleStatuses) ? 'set':'add';
        
        await this.statusService.handleStatusChange({
          files: targetFile,
          statuses: status,
          isMultipleSelection: true,
          operation: operation
        });
      } else {
        // For individual files, maintain default behavior
        await this.statusService.handleStatusChange({
          files: targetFile,
          statuses: status
        });
      }
    });
  }

  /**
   * Updates the dropdown UI based on current statuses
   */
  public update(currentStatuses: string[] | string, _file?: TFile): void {
    this.currentStatuses = Array.isArray(currentStatuses) ? 
      [...currentStatuses] : [currentStatuses];
    
    this.dropdownUI.updateStatuses(this.currentStatuses);
  }

  /**
   * Updates settings reference
   */
  public updateSettings(settings: NoteStatusSettings): void {
    this.settings = settings;
    this.dropdownUI.updateSettings(settings);
  }

  /**
   * Get position from cursor or fallback
   */
  private getCursorPosition(editor: Editor, view: MarkdownView): { x: number, y: number } {
    try {
      const cursor = editor.getCursor('head');
      const lineElement = view.contentEl.querySelector(`.cm-line:nth-child(${cursor.line + 1})`);

      if (lineElement) {
        const rect = lineElement.getBoundingClientRect();
        return { x: rect.left + 20, y: rect.bottom + 5 };
      }

      const editorEl = view.contentEl.querySelector('.cm-editor');
      if (editorEl) {
        const rect = editorEl.getBoundingClientRect();
        return { x: rect.left + 100, y: rect.top + 100 };
      }
    } catch (error) {
      console.error('Error getting position for dropdown:', error);
    }

    return { x: window.innerWidth / 2, y: window.innerHeight / 3 };
  }


  /**
   * Universal function to open the status dropdown
   */
  public openStatusDropdown(options: DropdownOptions): void {
    const activeFile = this.app.workspace.getActiveFile();
    const files = options.files || (activeFile ? [activeFile] : []);
    if (!files.length) {
      new Notice('No files selected');
      return;
    }
    if (!files.length || !files[0]) {
      new Notice('No files selected');
      return;
    }

    if (this.dropdownUI.isOpen) {
      this.resetDropdown();
      return
    }
    
    const isSingleFile = files.length === 1;
    
    // Set up target files appropriately
    if (isSingleFile) {
      const targetFile = files[0];
      this.dropdownUI.setTargetFile(targetFile);
      const currentStatuses = this.statusService.getFileStatuses(targetFile);
      this.dropdownUI.updateStatuses(currentStatuses);
    } else {
      // For multiple files, set the whole collection
      this.dropdownUI.setTargetFiles(files);
      const commonStatuses = this.findCommonStatuses(files);
      this.dropdownUI.updateStatuses(commonStatuses);
    }
    
    this.positionAndOpenDropdown(options);
  }

  
  /**
   * Reset dropdown state before opening
   */
  public resetDropdown(): void {
    this.dropdownUI.close();
    this.dropdownUI.setTargetFile(null);
  }

  /**
   * Position and open the dropdown
   */
  private positionAndOpenDropdown(options: {
    target?: HTMLElement;
    position?: { x: number, y: number };
    editor?: Editor;
    view?: MarkdownView;
  }): void {
    if (options.editor && options.view) {
      const position = this.getCursorPosition(options.editor, options.view);
      this.openWithPosition(position);
      return;
    }

    if (options.target) {
      if (options.position) {
        this.dropdownUI.open(options.target, options.position);
      } else {
        const rect = options.target.getBoundingClientRect();
        this.dropdownUI.open(options.target, {
          x: rect.left,
          y: rect.bottom + 5
        });
      }
      return;
    }

    if (options.position) {
      this.openWithPosition(options.position);
      return;
    }

    this.openWithPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 3
    });
  }
  
  /**
   * Open dropdown at a specific position using dummy target
   */
  private openWithPosition(position: { x: number, y: number }): void {
    const dummyTarget = createDummyTarget(position);
    this.dropdownUI.open(dummyTarget, position);
    
    setTimeout(() => {
      if (dummyTarget.parentNode) {
        dummyTarget.parentNode.removeChild(dummyTarget);
      }
    }, 100);
  }

  /**
   * Find common statuses across multiple files
   */
  private findCommonStatuses(files: TFile[]): string[] {
    if (files.length === 0) return ['unknown'];
    
    const firstFileStatuses = this.statusService.getFileStatuses(files[0]);
    
    return firstFileStatuses.filter(status => 
      status !== 'unknown' && 
      files.every(file => this.statusService.getFileStatuses(file).includes(status))
    );
  }

  
  /**
   * Render method (kept for compatibility)
   */
  public render(): void {
    // No-op - dropdown component handles rendering internally
  }

  /**
   * Remove dropdown when plugin is unloaded
   */
  public unload(): void {
    this.dropdownUI.dispose();
    
    if (this.toolbarButton) {
      this.toolbarButton.remove();
      this.toolbarButton = undefined;
    }
  }

}
