import { App, TFile, Editor, Notice } from 'obsidian';
import { NoteStatusSettings } from '../models/types';

/**
 * Service for handling note status operations
 */
export class StatusService {
	private app: App;
	private settings: NoteStatusSettings;

	constructor(app: App, settings: NoteStatusSettings) {
		this.app = app;
		this.settings = settings;
	}

	/**
	 * Updates the settings reference
	 */
	public updateSettings(settings: NoteStatusSettings): void {
		this.settings = settings;
	}

	/**
	 * Get the status of a file from its metadata
	 */
	public getFileStatus(file: TFile): string {
		const cachedMetadata = this.app.metadataCache.getFileCache(file);
		let status = 'unknown';

		if (cachedMetadata?.frontmatter?.status) {
			const frontmatterStatus = cachedMetadata.frontmatter.status.toLowerCase();
			const matchingStatus = this.settings.customStatuses.find(s =>
				s.name.toLowerCase() === frontmatterStatus);

			if (matchingStatus) status = matchingStatus.name;
		}

		return status;
	}

	/**
	 * Get the icon for a given status
	 */
	public getStatusIcon(status: string): string {
		const customStatus = this.settings.customStatuses.find(
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

		// Initialize groups for each status
		this.settings.customStatuses.forEach(status => {
			statusGroups[status.name] = [];
		});

		// Get all markdown files and filter by search query
		const files = this.getMarkdownFiles(searchQuery);

		for (const file of files) {
			const status = this.getFileStatus(file);
			statusGroups[status].push(file);
		}

		return statusGroups;
	}
}
