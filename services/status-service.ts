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
   * Get the primary status of a file (first one, or 'unknown')
   */
  public getFilePrimaryStatus(file: TFile): string {
    const statuses = this.getFileStatuses(file);
    return statuses[0] || 'unknown';
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
   * Update the statuses of a note
   */
  public async updateNoteStatuses(newStatuses: string[], file?: TFile): Promise<void> {
    const targetFile = file || this.app.workspace.getActiveFile();
    if (!targetFile || targetFile.extension !== 'md') return;
  
    await this.app.fileManager.processFrontMatter(targetFile, (frontmatter) => {
      frontmatter[this.settings.tagPrefix] = newStatuses;
    });
    
    this.notifyStatusChanged(newStatuses, targetFile);
  }

  /**
   * Legacy method to update a single status for backward compatibility
   */
  public async updateNoteStatus(newStatus: string, file?: TFile): Promise<void> {
    await this.updateNoteStatuses([newStatus], file);
  }

  /**
   * Add a status to a note's existing statuses
   */
  public async addNoteStatus(statusToAdd: string, file?: TFile): Promise<void> {
    const targetFile = file || this.app.workspace.getActiveFile();
    if (!targetFile || targetFile.extension !== 'md') return;
    
    const currentStatuses = this.getFileStatuses(targetFile);
    if (currentStatuses.includes(statusToAdd)) return;
    
    // Filter out 'unknown' status when adding valid statuses
    const newStatuses = [...currentStatuses.filter(s => s !== 'unknown'), statusToAdd];
    await this.updateNoteStatuses(newStatuses, targetFile);
  }

  /**
   * Remove a status from a note's existing statuses
   */
  public async removeNoteStatus(statusToRemove: string, file?: TFile): Promise<void> {
    const targetFile = file || this.app.workspace.getActiveFile();
    if (!targetFile || targetFile.extension !== 'md') return;
    
    const currentStatuses = this.getFileStatuses(targetFile);
    const newStatuses = currentStatuses.filter(status => status !== statusToRemove);
    
    await this.updateNoteStatuses(newStatuses, targetFile);
  }

  /**
   * Toggle a status on/off for a note
   */
  public async toggleNoteStatus(statusToToggle: string, file?: TFile): Promise<void> {
    const targetFile = file || this.app.workspace.getActiveFile();
    if (!targetFile || targetFile.extension !== 'md') return;
    
    const currentStatuses = this.getFileStatuses(targetFile);
    
    const newStatuses = currentStatuses.includes(statusToToggle)
      ? currentStatuses.filter(status => status !== statusToToggle)
      : [...currentStatuses.filter(s => s !== 'unknown'), statusToToggle];
    
    await this.updateNoteStatuses(newStatuses, targetFile);
  }

  /**
   * Batch update multiple files' statuses
   */
  public async batchUpdateStatuses(
    files: TFile[], 
    statusesToSet: string[], 
    mode: 'replace' | 'add' = 'replace',
    showNotice = true
  ): Promise<void> {
    if (files.length === 0) {
      if (showNotice) new Notice('No files selected');
      return;
    }

    const updatePromises = files.map(async (file) => {
      if (mode === 'replace') {
        await this.updateNoteStatuses(statusesToSet, file);
      } else {
        for (const status of statusesToSet) {
          await this.addNoteStatus(status, file);
        }
      }
    });
    
    await Promise.all(updatePromises);

    if (showNotice && files.length > 1) {
      const statusText = statusesToSet.length === 1 
        ? statusesToSet[0] 
        : `${statusesToSet.length} statuses`;
      new Notice(`Updated ${files.length} files with ${statusText}`);
    }
    
    window.dispatchEvent(new CustomEvent('note-status:refresh-ui'));
  }
  
  /**
   * Dispatch status changed event
   */
  private notifyStatusChanged(statuses: string[], file: TFile): void {
    window.dispatchEvent(new CustomEvent('note-status:status-changed', {
      detail: { statuses, file: file.path }
    }));
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
}