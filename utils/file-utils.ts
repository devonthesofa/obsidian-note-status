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
 * If the value is a string, it will be stored as array [value]
 */
export function updateFrontmatterProperty(
	content: string,
	property: string,
	value: string | string[]
): string {
	const { hasFrontMatter, frontMatter, content: mainContent } = extractFrontmatter(content);
    
    // Ensure value is an array
    const valueArray = Array.isArray(value) ? value : [value];
    const jsonValue = JSON.stringify(valueArray);

	if (hasFrontMatter && frontMatter) {
		// Check if property already exists in frontmatter
		if (frontMatter.includes(`${property}:`)) {
			// Replace existing property
			const updatedFrontMatter = frontMatter.replace(
				new RegExp(`${property}:\\s*[^\\n]+`, 'm'),
				`${property}: ${jsonValue}`
			);
			return `---\n${updatedFrontMatter}\n---\n${mainContent}`;
		} else {
			// Add new property to existing frontmatter
			return `---\n${frontMatter}\n${property}: ${jsonValue}\n---\n${mainContent}`;
		}
	} else {
		// Create new frontmatter
		return `---\n${property}: ${jsonValue}\n---\n\n${content}`;
	}
}

/**
 * Reads frontmatter property from file
 * Always returns an array (even if the property is stored as a string)
 */
export function getFrontmatterProperty(
	app: App,
	file: TFile,
	property: string
): string[] | null {
	const cache = app.metadataCache.getFileCache(file);

	if (cache?.frontmatter && property in cache.frontmatter) {
		const value = cache.frontmatter[property];
		
		// Always return as array
		if (Array.isArray(value)) {
			return value;
		} else if (value !== null && value !== undefined) {
			return [value.toString()];
		}
	}

	return null;
}

/**
 * Safely updates a file's frontmatter
 * Always stores as array format
 */
export async function updateFileFrontmatter(
	app: App,
	file: TFile,
	property: string,
	value: string | string[]
): Promise<void> {
	if (!isMarkdownFile(file)) {
		return;
	}

	const content = await app.vault.read(file);
    
    // Ensure value is an array
    const valueArray = Array.isArray(value) ? value : [value];
	const newContent = updateFrontmatterProperty(content, property, valueArray);

	// Only write if content has changed
	if (newContent !== content) {
		await app.vault.modify(file, newContent);
	}
}