import fs from 'fs';
import path from 'path';

const templatesDir = './templates';
const outputFile = './constants/predefinedTemplates.ts';

const files = fs.readdirSync(templatesDir);
const templates = [];

files.forEach(file => {
    if (file.endsWith('.json')) {
        const filePath = path.join(templatesDir, file);
        const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        templates.push(content);
    }
});

const content = `import { StatusTemplate } from "types/pluginSettings";

/**
 * Predefined status templates generated from the templates directory
 */
export const PREDEFINED_TEMPLATES: StatusTemplate[] = ${JSON.stringify(templates, null, '\t')};

/**
 * Default template IDs that should be enabled by default
 */
export const DEFAULT_ENABLED_TEMPLATES = ["colorful"];
`;

fs.writeFileSync(outputFile, content);
console.log(`Generated ${outputFile} with ${templates.length} templates.`);
