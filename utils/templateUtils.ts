import { StatusTemplate } from "@/types/pluginSettings";
import settingsService from "@/core/settingsService";
import { PREDEFINED_TEMPLATES } from "@/constants/predefinedTemplates";

/**
 * Get all enabled templates
 */
export const isCustomTemplate = (templateId: string): boolean => {
	const i = PREDEFINED_TEMPLATES.findIndex((t) => t.id === templateId);
	return i === -1;
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
export const generateTemplateId = (name: string): string => {
	const baseId = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
	const allTemplates = settingsService.settings.templates;

	let counter = 1;
	let id = `custom-${baseId}`;

	while (allTemplates.some((template) => template.id === id)) {
		id = `custom-${baseId}-${counter}`;
		counter++;
	}

	return id;
};
