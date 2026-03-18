import { StatusTemplate } from "types/pluginSettings";
import academic from "../templates/academic.json";
import colorful from "../templates/colorful.json";
import creativeWriting from "../templates/creative-writing.json";
import minimal from "../templates/minimal.json";
import project from "../templates/project.json";

/**
 * Predefined status templates imported directly from the templates directory.
 * This file serves as an index for the marketplace.
 */
export const PREDEFINED_TEMPLATES: StatusTemplate[] = [
	academic as StatusTemplate,
	colorful as StatusTemplate,
	creativeWriting as StatusTemplate,
	minimal as StatusTemplate,
	project as StatusTemplate,
];
