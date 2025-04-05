import { App, TFile } from 'obsidian';

/**
 * Utility functions for file operations
 */

/**
 * Checks if a file is a markdown file
 */
export function isMarkdownFile(file: TFile): boolean {
	return file && file.extension === 'md';
}

/**
 * Gets the frontmatter from file content
 */
export function extractFrontmatter(content: string): {
	hasFrontMatter: boolean;
	frontMatter?: string;
	content: string;
} {
	const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n?/);

	if (frontmatterMatch) {
		return {
			hasFrontMatter: true,
			frontMatter: frontmatterMatch[1],
			content: content.slice(frontmatterMatch[0].length)
		};
	}

	return {
		hasFrontMatter: false,
		content
	};
}

/**
 * Updates a property in frontmatter
 */
export function updateFrontmatterProperty(
	content: string,
	property: string,
	value: string
): string {
	const { hasFrontMatter, frontMatter, content: mainContent } = extractFrontmatter(content);

	if (hasFrontMatter && frontMatter) {
		// Check if property already exists in frontmatter
		if (frontMatter.includes(`${property}:`)) {
			// Replace existing property
			const updatedFrontMatter = frontMatter.replace(
				new RegExp(`${property}:\\s*[^\\n]+`, 'm'),
				`${property}: ${value}`
			);
			return `---\n${updatedFrontMatter}\n---\n${mainContent}`;
		} else {
			// Add new property to existing frontmatter
			return `---\n${frontMatter}\n${property}: ${value}\n---\n${mainContent}`;
		}
	} else {
		// Create new frontmatter
		return `---\n${property}: ${value}\n---\n\n${content}`;
	}
}

/**
 * Reads frontmatter property from file
 */
export async function getFrontmatterProperty(
	app: App,
	file: TFile,
	property: string
): Promise<string | null> {
	const cache = app.metadataCache.getFileCache(file);

	if (cache?.frontmatter && property in cache.frontmatter) {
		return cache.frontmatter[property];
	}

	return null;
}

/**
 * Safely updates a file's frontmatter
 */
export async function updateFileFrontmatter(
	app: App,
	file: TFile,
	property: string,
	value: string
): Promise<void> {
	if (!isMarkdownFile(file)) {
		return;
	}

	const content = await app.vault.read(file);
	const newContent = updateFrontmatterProperty(content, property, value);

	// Only write if content has changed
	if (newContent !== content) {
		await app.vault.modify(file, newContent);
	}
}
