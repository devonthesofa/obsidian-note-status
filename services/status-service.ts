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
    // Start with custom statuses if not using templates exclusively
    this.allStatuses = [...this.settings.customStatuses];

    // Add statuses from enabled templates
    if (!this.settings.useCustomStatusesOnly) {
      const templateStatuses = this.getTemplateStatuses();
      
      // Add template statuses that don't have the same name as existing statuses
      for (const status of templateStatuses) {
        if (!this.allStatuses.some(s => s.name.toLowerCase() === status.name.toLowerCase())) {
          this.allStatuses.push(status);
        } else {
          this.updateExistingStatusColor(status);
        }
      }
    }
  }

  /**
   * Update color for an existing status if it comes from a template
   */
  private updateExistingStatusColor(status: Status): void {
    // Update status colors if they come from a template and have colors
    const existingStatusIndex = this.allStatuses.findIndex(
      s => s.name.toLowerCase() === status.name.toLowerCase()
    );
    
    if (existingStatusIndex !== -1 && status.color) {
      // Update color in settings if it doesn't exist
      if (!this.settings.statusColors[status.name]) {
        this.settings.statusColors[status.name] = status.color;
      }
    }
  }

  /**
   * Gets all statuses from enabled templates
   */
  public getTemplateStatuses(): Status[] {
    const statuses: Status[] = [];
    
    // Find templates that are enabled
    for (const templateId of this.settings.enabledTemplates) {
      const template = PREDEFINED_TEMPLATES.find(t => t.id === templateId);
      if (template) {
        statuses.push(...template.statuses);
      }
    }
    
    return statuses;
  }

  /**
   * Get all available statuses (combined from templates and custom)
   */
  public getAllStatuses(): Status[] {
    return this.allStatuses;
  }

  /**
   * Get the statuses of a file from its metadata
   * Returns an array of status names
   */
  public getFileStatuses(file: TFile): string[] {
    const cachedMetadata = this.app.metadataCache.getFileCache(file);
    const statuses: string[] = [];
  
    if (cachedMetadata?.frontmatter) {
      // Check for status using the configured tag prefix
      const frontmatterStatus = cachedMetadata.frontmatter[this.settings.tagPrefix];
      
      if (frontmatterStatus) {
        if (Array.isArray(frontmatterStatus)) {
          // Handle array format
          this.processStatusArray(frontmatterStatus, statuses);
        } else {
          // Handle single value format (string) - convert to array format internally
          this.processSingleStatus(frontmatterStatus.toString(), statuses);
        }
      }
    }

    // Return 'unknown' if no statuses found
    return statuses.length > 0 ? statuses : ['unknown'];
  }
  
  /**
   * Process an array of statuses from frontmatter
   */
  private processStatusArray(statusArray: any[], targetStatuses: string[]): void {
    for (const statusName of statusArray) {
      const normalizedStatus = statusName.toString().toLowerCase();
      const matchingStatus = this.allStatuses.find(s => 
        s.name.toLowerCase() === normalizedStatus);
      
      if (matchingStatus) {
        targetStatuses.push(matchingStatus.name);
      }
    }
  }
  
  /**
   * Process a single status string from frontmatter
   */
  private processSingleStatus(statusString: string, targetStatuses: string[]): void {
    const normalizedStatus = statusString.toLowerCase();
    const matchingStatus = this.allStatuses.find(s =>
      s.name.toLowerCase() === normalizedStatus);

    if (matchingStatus) targetStatuses.push(matchingStatus.name);
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
   * @param newStatuses Array of status names to set
   * @param file Optional file to update, otherwise uses active file
   */
  public async updateNoteStatuses(newStatuses: string[], file?: TFile): Promise<void> {
    const targetFile = file || this.app.workspace.getActiveFile();
    if (!targetFile || !(targetFile instanceof TFile) || targetFile.extension !== 'md') return;
  
    // Use processFrontMatter instead of manual read/modify
    await this.app.fileManager.processFrontMatter(targetFile, (frontmatter) => {
      frontmatter[this.settings.tagPrefix] = newStatuses;
    });
    
    // Dispatch events for UI update
    window.dispatchEvent(new CustomEvent('note-status:status-changed', {
      detail: { statuses: newStatuses, file: targetFile.path }
    }));
  }

  /**
   * Update frontmatter content with new statuses
   * This function properly handles different frontmatter formats
   */
  private updateFrontmatterWithStatus(content: string, newStatuses: string[]): string {
    // Check if frontmatter exists
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
    
    if (frontmatterMatch) {
      return this.updateExistingFrontmatter(content, frontmatterMatch, newStatuses);
    } else {
      return this.createNewFrontmatter(content, newStatuses);
    }
  }
  
  /**
   * Update existing frontmatter with new statuses
   */
  private updateExistingFrontmatter(
    content: string, 
    frontmatterMatch: RegExpMatchArray, 
    newStatuses: string[]
  ): string {
    // Extract frontmatter
    const fullFrontmatter = frontmatterMatch[0];
    const frontmatterContent = frontmatterMatch[1];
    
    // Format the new statuses as JSON array
    const formattedArray = JSON.stringify(newStatuses);
    
    // Create the new status line
    const statusLine = `${this.settings.tagPrefix}: ${formattedArray}`;
    
    // Create a regex to match the existing status tag and any following indented lines
    const escapedPrefix = this.settings.tagPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const statusLineRegex = new RegExp(
      `(^|\\n)${escapedPrefix}:.*?(\\n(?![ \\t]+[-])|$)`, 
      's'
    );
    
    // Check if the status tag already exists
    if (frontmatterContent.match(statusLineRegex)) {
      // Replace existing status tag
      const updatedFrontmatter = frontmatterContent.replace(
        statusLineRegex,
        `$1${statusLine}$2`
      );
      
      // Replace the entire frontmatter section
      return content.replace(
        fullFrontmatter,
        `---\n${updatedFrontmatter}\n---\n`
      );
    } else {
      // Add new status tag to existing frontmatter
      return content.replace(
        fullFrontmatter,
        `---\n${frontmatterContent}\n${statusLine}\n---\n`
      );
    }
  }
  
  /**
   * Create new frontmatter for a file that doesn't have any
   */
  private createNewFrontmatter(content: string, newStatuses: string[]): string {
    const formattedArray = JSON.stringify(newStatuses);
    return `---\n${this.settings.tagPrefix}: ${formattedArray}\n---\n\n${content.trim()}`;
  }

  /**
   * Legacy method to update a single status for backward compatibility
   */
  public async updateNoteStatus(newStatus: string, file?: TFile): Promise<void> {
    // Always store as an array even in single status mode
    await this.updateNoteStatuses([newStatus], file);
  }

  /**
   * Add a status to a note's existing statuses
   */
  public async addNoteStatus(statusToAdd: string, file?: TFile): Promise<void> {
    const targetFile = file || this.app.workspace.getActiveFile();
    if (!targetFile || !(targetFile instanceof TFile) || targetFile.extension !== 'md') return;
    
    const currentStatuses = this.getFileStatuses(targetFile);
    
    // Don't add if already exists
    if (currentStatuses.includes(statusToAdd)) return;
    
    // Filter out 'unknown' status when adding valid statuses
    const filteredStatuses = currentStatuses.filter(s => s !== 'unknown');
    const newStatuses = [...filteredStatuses, statusToAdd];
    
    await this.updateNoteStatuses(newStatuses, targetFile);
    
    // Trigger UI updates
    window.dispatchEvent(new CustomEvent('note-status:status-changed', {
      detail: { statuses: newStatuses }
    }));
  }

  /**
   * Remove a status from a note's existing statuses
   */
  public async removeNoteStatus(statusToRemove: string, file?: TFile): Promise<void> {
    const targetFile = file || this.app.workspace.getActiveFile();
    if (!targetFile || !(targetFile instanceof TFile) || targetFile.extension !== 'md') return;
    
    const currentStatuses = this.getFileStatuses(targetFile);
    const newStatuses = currentStatuses.filter(status => status !== statusToRemove);
    
    await this.updateNoteStatuses(newStatuses, targetFile);
    
    // Trigger UI updates
    window.dispatchEvent(new CustomEvent('note-status:status-changed', {
      detail: { statuses: newStatuses }
    }));
  }

  /**
   * Toggle a status on/off for a note
   */
  public async toggleNoteStatus(statusToToggle: string, file?: TFile): Promise<void> {
    const targetFile = file || this.app.workspace.getActiveFile();
    if (!targetFile || targetFile.extension !== 'md') return;
    
    const currentStatuses = this.getFileStatuses(targetFile);
    let newStatuses: string[];
    
    if (currentStatuses.includes(statusToToggle)) {
      newStatuses = currentStatuses.filter(status => status !== statusToToggle);
    } else {
      // Filter out 'unknown' status when adding valid statuses
      const filteredStatuses = currentStatuses.filter(s => s !== 'unknown');
      newStatuses = [...filteredStatuses, statusToToggle];
    }
    
    await this.updateNoteStatuses(newStatuses, targetFile);
    
    // Ensure UI updates
    window.dispatchEvent(new CustomEvent('note-status:status-changed', {
      detail: { statuses: newStatuses }
    }));
  }

  /**
   * Batch update multiple files' statuses
   * @param files Array of files to update
   * @param statusesToSet Array of statuses to set
   * @param mode 'replace' to replace all statuses, 'add' to add to existing
   * @param showNotice Whether to show a notification (default: true)
   */
  public async batchUpdateStatuses(
    files: TFile[], 
    statusesToSet: string[], 
    mode: 'replace' | 'add' = 'replace',
    showNotice = true
  ): Promise<void> {
    if (files.length === 0) {
      if (showNotice) {
        new Notice('No files selected');
      }
      return;
    }

    for (const file of files) {
      if (mode === 'replace') {
        await this.updateNoteStatuses(statusesToSet, file);
      } else {
        // Add each status
        for (const status of statusesToSet) {
          await this.addNoteStatus(status, file);
        }
      }
    }

    // Only show notice if explicitly requested and we're dealing with multiple files
    if (showNotice && files.length > 1) {
      const statusText = this.formatStatusText(statusesToSet);
      new Notice(`Updated ${files.length} files with ${statusText}`);
    }
  }
  
  /**
   * Format status text for notifications
   */
  private formatStatusText(statusesToSet: string[]): string {
    return statusesToSet.length === 1 
      ? statusesToSet[0] 
      : `${statusesToSet.length} statuses`;
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
    let updatedFrontMatter = frontMatter;

    // Check if status tag already exists in frontmatter
    const statusTagRegex = new RegExp(`${this.settings.tagPrefix}:\\s*\\[?[^\\]]*\\]?`, 'm');
    
    if (frontMatter.match(statusTagRegex)) {
      updatedFrontMatter = frontMatter.replace(statusTagRegex, statusMetadata);
    } else {
      updatedFrontMatter = `${frontMatter}\n${statusMetadata}`;
    }

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

    if (!searchQuery) {
      return files;
    }

    return files.filter(file =>
      file.basename.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  /**
   * Group files by their status
   */
  public groupFilesByStatus(searchQuery = ''): Record<string, TFile[]> {
    const statusGroups: Record<string, TFile[]> = {};

    // Initialize groups for all statuses
    this.allStatuses.forEach(status => {
      statusGroups[status.name] = [];
    });

    // Ensure 'unknown' status is included
    if (!statusGroups['unknown']) {
      statusGroups['unknown'] = [];
    }

    // Get all markdown files and filter by search query
    const files = this.getMarkdownFiles(searchQuery);

    for (const file of files) {
      const statuses = this.getFileStatuses(file);
      
      // Add file to each of its status groups
      for (const status of statuses) {
        if (statusGroups[status]) {
          statusGroups[status].push(file);
        }
      }
    }

    return statusGroups;
  }
}