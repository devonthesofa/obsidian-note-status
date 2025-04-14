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
	 * Get the status of a file from its metadata
	 */
	public getFileStatus(file: TFile): string {
		const cachedMetadata = this.app.metadataCache.getFileCache(file);
		let status = 'unknown';

		if (cachedMetadata?.frontmatter?.status) {
			const frontmatterStatus = cachedMetadata.frontmatter.status.toLowerCase();
			const matchingStatus = this.allStatuses.find(s =>
				s.name.toLowerCase() === frontmatterStatus);

			if (matchingStatus) status = matchingStatus.name;
		}

		return status;
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
	 * Update the status of a note
	 */
	public async updateNoteStatus(newStatus: string, file?: TFile): Promise<void> {
		const targetFile = file || this.app.workspace.getActiveFile();
		if (!targetFile || targetFile.extension !== 'md') return;

		const content = await this.app.vault.read(targetFile);
		let newContent = content;

		// Handle frontmatter update
		const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n?/);
		if (frontmatterMatch) {
			const frontmatter = frontmatterMatch[1];
			if (frontmatter.includes('status:')) {
				newContent = content.replace(
					/^---\n([\s\S]*?)status:\s*[^\n]+([\s\S]*?)\n---\n?/,
					`---\n$1status: ${newStatus}$2\n---\n`
				);
			} else {
				newContent = content.replace(
					/^---\n([\s\S]*?)\n---\n?/,
					`---\n$1\nstatus: ${newStatus}\n---\n`
				);
			}
		} else {
			newContent = `---\nstatus: ${newStatus}\n---\n${content.trim()}`;
		}

		// Clean up excess newlines
		newContent = newContent.replace(/\n{3,}/g, '\n\n');

		// Update the file
		await this.app.vault.modify(targetFile, newContent);
	}

	/**
	 * Batch update multiple files' statuses
	 */
	public async batchUpdateStatus(files: TFile[], newStatus: string): Promise<void> {
		if (files.length === 0) {
			new Notice('No files selected');
			return;
		}

		for (const file of files) {
			await this.updateNoteStatus(newStatus, file);
		}

		new Notice(`Updated status of ${files.length} file${files.length === 1 ? '' : 's'} to ${newStatus}`);
	}

	/**
	 * Insert status metadata in the editor
	 */
	public insertStatusMetadataInEditor(editor: Editor): void {
		const content = editor.getValue();
		const statusMetadata = 'status: unknown';

		// Check if frontmatter exists
		const frontMatterMatch = content.match(/^---\n([\s\S]+?)\n---/);

		if (frontMatterMatch) {
			const frontMatter = frontMatterMatch[1];
			let updatedFrontMatter = frontMatter;

			// Check if status already exists in frontmatter
			if (/^status:/.test(frontMatter)) {
				updatedFrontMatter = frontMatter.replace(/^status: .*/m, statusMetadata);
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
			const status = this.getFileStatus(file);
			statusGroups[status].push(file);
		}

		return statusGroups;
	}
}