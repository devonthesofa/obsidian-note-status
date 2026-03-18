import { StatusTemplate } from "@/types/pluginSettings";
import settingsService from "@/core/settingsService";
import { PREDEFINED_TEMPLATES } from "@/constants/predefinedTemplates";

/**
 * Check if a template is a custom user template (not from marketplace)
 */
export const isCustomTemplate = (template: StatusTemplate): boolean => {
	// Either matches an original marketplace template ID
	const matchesPredefined = PREDEFINED_TEMPLATES.some(
		(pt) =>
			pt.id === template.id ||
			pt.name.toLowerCase() === template.name.toLowerCase(),
	);
	if (matchesPredefined) return false;

	// Or has metadata from marketplace
	const hasMetadata = !!(template.author || template.github);
	if (hasMetadata) return false;

	return true;
};

/**
 * Check if a marketplace template has been modified by the user
 */
export const isTemplateModified = (template: StatusTemplate): boolean => {
	const original = PREDEFINED_TEMPLATES.find(
		(pt) =>
			pt.id === template.id ||
			pt.name.toLowerCase() === template.name.toLowerCase(),
	);

	if (!original) return false;

	// Compare relevant fields to see if anything changed
	// We stringify for a deep comparison of statuses
	const originalData = JSON.stringify({
		name: original.name,
		description: original.description,
		statuses: original.statuses.map((s) => ({
			name: s.name,
			icon: s.icon,
			lucideIcon: s.lucideIcon,
			color: s.color,
		})),
	});

	const currentData = JSON.stringify({
		name: template.name,
		description: template.description,
		statuses: template.statuses.map((s) => ({
			name: s.name,
			icon: s.icon,
			lucideIcon: s.lucideIcon,
			color: s.color,
		})),
	});

	return originalData !== currentData;
};

/**
 * Get template by ID
 */
export const getTemplateById = (id: string): StatusTemplate | undefined => {
	const allTemplates = settingsService.settings.templates;
	return allTemplates.find((template) => template.id === id);
};

/**
 * Validate template name uniqueness
 */
export const isTemplateNameUnique = (
	name: string,
	excludeId?: string,
): boolean => {
	const allTemplates = settingsService.settings.templates;
	return !allTemplates.some(
		(template) =>
			template.name.toLowerCase() === name.toLowerCase() &&
			template.id !== excludeId,
	);
};

/**
 * Generate unique template ID
 */
export const generateTemplateId = (
	name: string,
	existingTemplates?: StatusTemplate[],
): string => {
	const baseId = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
	const allTemplates =
		existingTemplates || settingsService.settings.templates;

	let counter = 1;
	let id = `custom-${baseId}`;

	while (allTemplates.some((template) => template.id === id)) {
		id = `custom-${baseId}-${counter}`;
		counter++;
	}

	return id;
};

