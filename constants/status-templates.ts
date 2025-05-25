import { Status } from "../models/types";

/**
 * Status Template interface
 */
export interface StatusTemplate {
	id: string;
	name: string;
	description: string;
	statuses: Status[];
}

/**
 * Predefined status templates
 */
export const PREDEFINED_TEMPLATES: StatusTemplate[] = [
	{
		id: "colorful",
		name: "Colorful workflow",
		description:
			"A colorful set of workflow statuses with descriptive icons",
		statuses: [
			{ name: "idea", icon: "💡", color: "#FFEB3B" },
			{ name: "draft", icon: "📝", color: "#E0E0E0" },
			{ name: "inProgress", icon: "🔧", color: "#FFC107" },
			{ name: "editing", icon: "🖊️", color: "#2196F3" },
			{ name: "pending", icon: "⏳", color: "#9C27B0" },
			{ name: "onHold", icon: "⏸", color: "#9E9E9E" },
			{ name: "needsUpdate", icon: "🔄", color: "#FF5722" },
			{ name: "completed", icon: "✅", color: "#4CAF50" },
			{ name: "archived", icon: "📦", color: "#795548" },
		],
	},
	{
		id: "minimal",
		name: "Minimal workflow",
		description: "A simplified set of essential workflow statuses",
		statuses: [
			{ name: "todo", icon: "📌", color: "#F44336" },
			{ name: "inProgress", icon: "⚙️", color: "#2196F3" },
			{ name: "review", icon: "👀", color: "#9C27B0" },
			{ name: "done", icon: "✓", color: "#4CAF50" },
		],
	},
	{
		id: "academic",
		name: "Academic research",
		description: "Status workflow for academic research and writing",
		statuses: [
			{ name: "research", icon: "🔍", color: "#2196F3" },
			{ name: "outline", icon: "📑", color: "#9E9E9E" },
			{ name: "draft", icon: "✏️", color: "#FFC107" },
			{ name: "review", icon: "🔬", color: "#9C27B0" },
			{ name: "revision", icon: "📝", color: "#FF5722" },
			{ name: "final", icon: "📚", color: "#4CAF50" },
			{ name: "published", icon: "🎓", color: "#795548" },
		],
	},
	{
		id: "project",
		name: "Project management",
		description: "Status workflow for project management and tracking",
		statuses: [
			{ name: "planning", icon: "🗓️", color: "#9E9E9E" },
			{ name: "backlog", icon: "📋", color: "#E0E0E0" },
			{ name: "ready", icon: "🚦", color: "#8BC34A" },
			{ name: "inDevelopment", icon: "👨‍💻", color: "#2196F3" },
			{ name: "testing", icon: "🧪", color: "#9C27B0" },
			{ name: "review", icon: "👁️", color: "#FFC107" },
			{ name: "approved", icon: "👍", color: "#4CAF50" },
			{ name: "live", icon: "🚀", color: "#3F51B5" },
		],
	},
];

/**
 * Default template IDs that should be enabled by default
 */
export const DEFAULT_ENABLED_TEMPLATES = ["colorful"];
