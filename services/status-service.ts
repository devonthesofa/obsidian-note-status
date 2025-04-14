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
			}
		}
	}

	/**
	 * Gets all statuses from enabled templates
	 */
	private getTemplateStatuses(): Status[] {
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
			
			if (frontmatterStatus !== undefined) {
				if (Array.isArray(frontmatterStatus)) {
					// Handle array format
					for (const statusName of frontmatterStatus) {
						const normalizedStatus = statusName.toString().toLowerCase();
						const matchingStatus = this.allStatuses.find(s => 
							s.name.toLowerCase() === normalizedStatus);
						
						if (matchingStatus) {
							statuses.push(matchingStatus.name);
						}
					}
				} else {
					// Handle single value format
					const normalizedStatus = frontmatterStatus.toString().toLowerCase();
					const matchingStatus = this.allStatuses.find(s =>
						s.name.toLowerCase() === normalizedStatus);

					if (matchingStatus) statuses.push(matchingStatus.name);
				}
			}
		}

		// Return 'unknown' if no statuses found
		return statuses.length > 0 ? statuses : ['unknown'];
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
		if (!targetFile || targetFile.extension !== 'md') return;

		const content = await this.app.vault.read(targetFile);
		let newContent = content;

		// Handle frontmatter update
		const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n?/);
		if (frontmatterMatch) {
			const frontmatter = frontmatterMatch[1];
			
			// Escape special regex characters in the tag prefix
			const escapedTagPrefix = this.settings.tagPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			
			// Regex to match the status tag line
			const statusTagRegex = new RegExp(`${escapedTagPrefix}:.*(?:\n|$)`, 'm');
			
			if (frontmatter.match(statusTagRegex)) {
				// Format array for YAML (with proper indentation)
				const formattedArray = JSON.stringify(newStatuses);
				newContent = content.replace(
					frontmatterMatch[0],
					`---\n${frontmatter.replace(
						statusTagRegex,
						`${this.settings.tagPrefix}: ${formattedArray}\n`
					)}---\n`
				);
			} else {
				// Add new status tag to existing frontmatter
				const formattedArray = JSON.stringify(newStatuses);
				newContent = content.replace(
					/^---\n([\s\S]*?)\n---\n?/,
					`---\n$1\n${this.settings.tagPrefix}: ${formattedArray}\n---\n`
				);
			}
		} else {
			// Create new frontmatter with status tag
			const formattedArray = JSON.stringify(newStatuses);
			newContent = `---\n${this.settings.tagPrefix}: ${formattedArray}\n---\n\n${content.trim()}`;
		}

		// Clean up excess newlines
		newContent = newContent.replace(/\n{3,}/g, '\n\n');

		// Update the file
		await this.app.vault.modify(targetFile, newContent);
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
		
		// Don't add if already exists
		if (currentStatuses.includes(statusToAdd)) return;
		
		// Filter out 'unknown' status when adding valid statuses
		const filteredStatuses = currentStatuses.filter(s => s !== 'unknown');
		const newStatuses = [...filteredStatuses, statusToAdd];
		
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
		
		// If all statuses were removed, set to 'unknown'
		if (newStatuses.length === 0) {
			newStatuses.push('unknown');
		}
		
		await this.updateNoteStatuses(newStatuses, targetFile);
	}

	/**
	 * Toggle a status on/off for a note
	 */
	public async toggleNoteStatus(statusToToggle: string, file?: TFile): Promise<void> {
		const targetFile = file || this.app.workspace.getActiveFile();
		if (!targetFile || targetFile.extension !== 'md') return;
		
		const currentStatuses = this.getFileStatuses(targetFile);
		
		if (currentStatuses.includes(statusToToggle)) {
			await this.removeNoteStatus(statusToToggle, targetFile);
		} else {
			await this.addNoteStatus(statusToToggle, targetFile);
		}
	}

	/**
	* Batch update multiple files' statuses
	* @param files Array of files to update
	* @param statusesToSet Array of statuses to set
	* @param mode 'replace' to replace all statuses, 'add' to add to existing
	*/
	public async batchUpdateStatuses(
		files: TFile[], 
		statusesToSet: string[], 
		mode: 'replace' | 'add' = 'replace'
	): Promise<void> {
		if (files.length === 0) {
			new Notice('No files selected');
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

		const statusText = statusesToSet.length === 1 
			? statusesToSet[0] 
			: `${statusesToSet.length} statuses`;
			
		new Notice(`Updated ${files.length} file${files.length === 1 ? '' : 's'} with ${statusText}`);
	}

	/**
	 * Legacy batch update for a single status
	 */
	public async batchUpdateStatus(files: TFile[], newStatus: string): Promise<void> {
		await this.batchUpdateStatuses(files, [newStatus], 'replace');
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
		} else {
			// Create new frontmatter if it doesn't exist
			const newFrontMatter = `---\n${statusMetadata}\n---\n${content}`;
			editor.setValue(newFrontMatter);
		}
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