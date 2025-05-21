import { App, TFile, Editor, Notice } from 'obsidian';
import { NoteStatusSettings, Status } from '../models/types';
import { PREDEFINED_TEMPLATES } from '../constants/status-templates';

/**
 * Service for handling note status operations
 */
export class StatusService {
  private app: App;
  private settings: NoteStatusSettings;
  private allStatuses: Status[] = [];

  constructor(app: App, settings: NoteStatusSettings) {
    this.app = app;
    this.settings = settings;
    this.updateAllStatuses();
  }

  /**
   * Updates the settings reference and recalculates all statuses
   */
  public updateSettings(settings: NoteStatusSettings): void {
    this.settings = settings;
    this.updateAllStatuses();
  }

  /**
   * Updates the combined list of all statuses (from templates and custom)
   */
  private updateAllStatuses(): void {
    // Start with custom statuses
    this.allStatuses = [...this.settings.customStatuses];

    // Add statuses from enabled templates if not using custom only
    if (!this.settings.useCustomStatusesOnly) {
      const templateStatuses = this.getTemplateStatuses();
      
      for (const status of templateStatuses) {
        const existingIndex = this.allStatuses.findIndex(s => 
          s.name.toLowerCase() === status.name.toLowerCase());
        
        if (existingIndex === -1) {
          // Add new status
          this.allStatuses.push(status);
        } else if (status.color) {
          // Update color in settings if it doesn't exist
          if (!this.settings.statusColors[status.name]) {
            this.settings.statusColors[status.name] = status.color;
          }
        }
      }
    }
  }

  /**
   * Gets all statuses from enabled templates
   */
  public getTemplateStatuses(): Status[] {
    return this.settings.enabledTemplates
      .map(id => PREDEFINED_TEMPLATES.find(t => t.id === id))
      .filter(Boolean)
      .flatMap(template => template ? template.statuses : []);
  }

  /**
   * Get all available statuses (combined from templates and custom)
   */
  public getAllStatuses(): Status[] {
    return this.allStatuses;
  }

  /**
   * Get the statuses of a file from its metadata
   */
  public getFileStatuses(file: TFile): string[] {
    const cachedMetadata = this.app.metadataCache.getFileCache(file);
    if (!cachedMetadata?.frontmatter) return ['unknown'];
  
    const frontmatterStatus = cachedMetadata.frontmatter[this.settings.tagPrefix];
    if (!frontmatterStatus) return ['unknown'];
    
    const statuses: string[] = [];
    
    if (Array.isArray(frontmatterStatus)) {
      for (const statusName of frontmatterStatus) {
        this.addValidStatus(statusName.toString(), statuses);
      }
    } else {
      this.addValidStatus(frontmatterStatus.toString(), statuses);
    }

    return statuses.length > 0 ? statuses : ['unknown'];
  }
  
  /**
   * Add a status to the list if it's valid
   */
  private addValidStatus(statusName: string, targetStatuses: string[]): void {
    const normalizedStatus = statusName.toLowerCase();
    const matchingStatus = this.allStatuses.find(s => 
      s.name.toLowerCase() === normalizedStatus);
    
    if (matchingStatus) {
      targetStatuses.push(matchingStatus.name);
    }
  }

  /**
   * Get the icon for a given status
   */
  public getStatusIcon(status: string): string {
    const customStatus = this.allStatuses.find(
      s => s.name.toLowerCase() === status.toLowerCase()
    );
    return customStatus ? customStatus.icon : '❓';
  }

  /**
   * Insert status metadata in the editor
   */
  public insertStatusMetadataInEditor(editor: Editor): void {
    const content = editor.getValue();
    const defaultStatuses = ['unknown'];
    const statusMetadata = `${this.settings.tagPrefix}: ${JSON.stringify(defaultStatuses)}`;

    // Check if frontmatter exists
    const frontMatterMatch = content.match(/^---\n([\s\S]+?)\n---/);

    if (frontMatterMatch) {
      this.insertIntoExistingFrontmatter(editor, content, frontMatterMatch, statusMetadata);
    } else {
      this.createFrontmatterWithStatus(editor, content, statusMetadata);
    }
  }
  
  /**
   * Insert status metadata into existing frontmatter
   */
  private insertIntoExistingFrontmatter(
    editor: Editor, 
    content: string, 
    frontMatterMatch: RegExpMatchArray, 
    statusMetadata: string
  ): void {
    const frontMatter = frontMatterMatch[1];
    const statusTagRegex = new RegExp(`${this.settings.tagPrefix}:\\s*\\[?[^\\]]*\\]?`, 'm');
    
    const updatedFrontMatter = frontMatter.match(statusTagRegex)
      ? frontMatter.replace(statusTagRegex, statusMetadata)
      : `${frontMatter}\n${statusMetadata}`;

    const updatedContent = content.replace(/^---\n([\s\S]+?)\n---/, `---\n${updatedFrontMatter}\n---`);
    editor.setValue(updatedContent);
  }
  
  /**
   * Create new frontmatter with status metadata
   */
  private createFrontmatterWithStatus(editor: Editor, content: string, statusMetadata: string): void {
    const newFrontMatter = `---\n${statusMetadata}\n---\n\n${content.trim()}`;
    editor.setValue(newFrontMatter);
  }

  /**
   * Get all markdown files with optional filtering
   */
  public getMarkdownFiles(searchQuery = ''): TFile[] {
    const files = this.app.vault.getMarkdownFiles();
    if (!searchQuery) return files;

    const lowerQuery = searchQuery.toLowerCase();
    return files.filter(file => 
      file.basename.toLowerCase().includes(lowerQuery));
  }

  /**
   * Group files by their status
   */
  public groupFilesByStatus(searchQuery = ''): Record<string, TFile[]> {
    const statusGroups: Record<string, TFile[]> = {};

    // Initialize groups for all statuses
    for (const status of this.allStatuses) {
      statusGroups[status.name] = [];
    }
    
    // Ensure 'unknown' status exists
    statusGroups['unknown'] = statusGroups['unknown'] || [];

    // Get and process all files matching the search query
    const files = this.getMarkdownFiles(searchQuery);
    for (const file of files) {
      const statuses = this.getFileStatuses(file);
      
      for (const status of statuses) {
        if (statusGroups[status]) {
          statusGroups[status].push(file);
        }
      }
    }

    return statusGroups;
  }

  /**
   * Centralizes all status modification operations
   */
  private async modifyNoteStatus(options: {
    files: TFile | TFile[];
    statuses: string | string[];
    operation: 'set' | 'add' | 'remove' | 'toggle';
    showNotice?: boolean;
  }): Promise<void> {
    const { operation, showNotice = true } = options;
    const targetFiles = Array.isArray(options.files) ? options.files : [options.files];
    const targetStatuses = Array.isArray(options.statuses) ? options.statuses : [options.statuses];
    
    if (targetFiles.length === 0) {
      if (showNotice) new Notice('No files selected');
      return;
    }

    // Process each file
    const updatePromises = targetFiles.map(async (file) => {
      if (!file || file.extension !== 'md') return;
      
      // Get current statuses for the file
      const currentStatuses = this.getFileStatuses(file);
      let newStatuses: string[] = [];
      
      switch (operation) {
        case 'set':
          // Replace all statuses with the new ones
          newStatuses = [...targetStatuses];
          break;
          
        case 'add':
          // Add new statuses without duplicates
          newStatuses = [...new Set([
            ...currentStatuses.filter(s => s !== 'unknown'),
            ...targetStatuses
          ])];
          break;
          
        case 'remove':
          // Remove specified statuses
          newStatuses = currentStatuses.filter(
            status => !targetStatuses.includes(status)
          );
          break;
          
        case 'toggle':
          // Toggle each status (add if not present, remove if present)
          newStatuses = [...currentStatuses];
          for (const status of targetStatuses) {
            if (currentStatuses.includes(status)) {
              newStatuses = newStatuses.filter(s => s !== status);
            } else {
              newStatuses = [...newStatuses.filter(s => s !== 'unknown'), status];
            }
          }
          break;
      }
      
      // Handle empty result (should revert to unknown)
      if (newStatuses.length === 0) {
        newStatuses = ['unknown'];
      }
      
      // Apply updates to frontmatter
      await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
        frontmatter[this.settings.tagPrefix] = newStatuses;
      });
      
    });
    
    await Promise.all(updatePromises);
    
    // Show notification for batch operations
    if (showNotice && targetFiles.length > 1) {
      const statusText = targetStatuses.length === 1 
        ? targetStatuses[0] 
        : `${targetStatuses.length} statuses`;
      const operationText = operation === 'set' ? 'updated' : 
                            operation === 'add' ? 'added to' : 
                            operation === 'remove' ? 'removed from' : 'toggled on';
      
      new Notice(`${statusText} ${operationText} ${targetFiles.length} files`);
    }
  }

  /**
   * Handles UI-triggered status changes with appropriate logic based on context
   * This is the central function that all UI components should call for status changes
   */
  public async handleStatusChange(options: {
      files: TFile | TFile[];
      statuses: string | string[];
      isMultipleSelection?: boolean;
      allowMultipleStatuses?: boolean;
      operation?: 'set' | 'add' | 'remove' | 'toggle';
      showNotice?: boolean;
      afterChange?: (updatedStatuses: string[]) => void;
  }): Promise<void> {
    const { 
      files, 
      statuses, 
      isMultipleSelection = false,
      allowMultipleStatuses = this.settings.useMultipleStatuses,
      operation: explicitOperation,
      showNotice = isMultipleSelection,
      afterChange
    } = options;
    
    const targetFiles = Array.isArray(files) ? files : [files];
    const targetStatuses = Array.isArray(statuses) ? statuses : [statuses];
    
    // Determine operation based on context if not explicitly specified
    let operation: 'set' | 'add' | 'remove' | 'toggle';
    
    if (explicitOperation) {
      operation = explicitOperation;
    } else if (isMultipleSelection) {
      // For multiple files, we need to check if we should add or remove
      const firstStatus = targetStatuses[0]; // Use first status for multi-file operations
      const filesWithStatus = targetFiles.filter(file => 
        this.getFileStatuses(file).includes(firstStatus)
      );
      
      operation = filesWithStatus.length > targetFiles.length / 2 ? 'remove' : 'add';
    } else {
      // For single file operations
      if (allowMultipleStatuses) {
        operation = 'toggle';
      } else {
        operation = 'set';
      }
    }
    
    // Apply the changes
    await this.modifyNoteStatus({
      files: targetFiles,
      statuses: targetStatuses,
      operation,
      showNotice
    });
    
    // Optional callback with updated statuses
    if (afterChange && targetFiles.length === 1 && !Array.isArray(files)) {
      const updatedStatuses = this.getFileStatuses(files as TFile);
      afterChange(updatedStatuses);
    }
    
    // Ensure comprehensive UI updates
    this.refreshUI(targetFiles);
  }
  
  /**
   * Dispatch status changed event
   */
  public notifyStatusChanged(statuses: string[], file?: TFile): void {
    // Dispatch the specific status change event
    window.dispatchEvent(new CustomEvent('note-status:status-changed', {
      detail: { 
        statuses,
        file: file?.path
      }
    }));
  }

  /**
   * Centralizes UI refresh after status changes
   */
  public refreshUI(files: TFile[]): void {
    // General UI refresh
    window.dispatchEvent(new CustomEvent('note-status:refresh-ui'));
    
    // Notify status changes for each modified file
    for (const file of files) {
      const statuses = this.getFileStatuses(file);
      this.notifyStatusChanged(statuses, file);
    }
  }

}