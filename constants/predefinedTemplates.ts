import { StatusTemplate } from "types/pluginSettings";

/**
 * Predefined status templates generated from the templates directory
 */
export const PREDEFINED_TEMPLATES: StatusTemplate[] = [
	{
		id: "academic",
		name: "Academic research",
		description: "Status workflow for academic research and writing",
		author: "Obsidian Note Status",
		github: "https://github.com/devonthesofa/obsidian-note-status",
		statuses: [
			{
				name: "research",
				icon: "🔍",
				color: "#2196F3",
				templateId: "academic",
			},
			{
				name: "outline",
				icon: "📑",
				color: "#9E9E9E",
				templateId: "academic",
			},
			{
				name: "draft",
				icon: "✏️",
				color: "#FFC107",
				templateId: "academic",
			},
			{
				name: "review",
				icon: "🔬",
				color: "#9C27B0",
				templateId: "academic",
			},
			{
				name: "revision",
				icon: "📝",
				color: "#FF5722",
				templateId: "academic",
			},
			{
				name: "final",
				icon: "📚",
				color: "#4CAF50",
				templateId: "academic",
			},
			{
				name: "published",
				icon: "🎓",
				color: "#795548",
				templateId: "academic",
			},
		],
	},
	{
		id: "colorful",
		name: "Colorful workflow",
		description:
			"A colorful set of workflow statuses with descriptive icons",
		author: "Obsidian Note Status",
		github: "https://github.com/devonthesofa/obsidian-note-status",
		statuses: [
			{
				name: "idea",
				icon: "💡",
				color: "#FFEB3B",
				templateId: "colorful",
			},
			{
				name: "draft",
				icon: "📝",
				color: "#E0E0E0",
				templateId: "colorful",
			},
			{
				name: "inProgress",
				icon: "🔧",
				color: "#FFC107",
				templateId: "colorful",
			},
			{
				name: "editing",
				icon: "🖊️",
				color: "#2196F3",
				templateId: "colorful",
			},
			{
				name: "pending",
				icon: "⏳",
				color: "#9C27B0",
				templateId: "colorful",
			},
			{
				name: "onHold",
				icon: "⏸",
				color: "#9E9E9E",
				templateId: "colorful",
			},
			{
				name: "needsUpdate",
				icon: "🔄",
				color: "#FF5722",
				templateId: "colorful",
			},
			{
				name: "completed",
				icon: "✅",
				color: "#4CAF50",
				templateId: "colorful",
			},
			{
				name: "archived",
				icon: "📦",
				color: "#795548",
				templateId: "colorful",
			},
		],
	},
	{
		id: "creative-writing",
		name: "Creative Writing",
		description: "Workflow for novelists and creative writers",
		author: "Obsidian Community",
		github: "https://github.com/obsidian-community",
		statuses: [
			{
				name: "idea",
				icon: "🧠",
				color: "#FFD700",
				templateId: "creative-writing",
			},
			{
				name: "outline",
				icon: "🗺️",
				color: "#87CEEB",
				templateId: "creative-writing",
			},
			{
				name: "first-draft",
				icon: "✍️",
				color: "#FFA07A",
				templateId: "creative-writing",
			},
			{
				name: "revision",
				icon: "🔍",
				color: "#DA70D6",
				templateId: "creative-writing",
			},
			{
				name: "final-polish",
				icon: "✨",
				color: "#32CD32",
				templateId: "creative-writing",
			},
		],
	},
	{
		id: "minimal",
		name: "Minimal workflow",
		description: "A simplified set of essential workflow statuses",
		author: "Obsidian Note Status",
		github: "https://github.com/devonthesofa/obsidian-note-status",
		statuses: [
			{
				name: "todo",
				icon: "📌",
				color: "#F44336",
				templateId: "minimal",
			},
			{
				name: "inProgress",
				icon: "⚙️",
				color: "#2196F3",
				templateId: "minimal",
			},
			{
				name: "review",
				icon: "👀",
				color: "#9C27B0",
				templateId: "minimal",
			},
			{
				name: "done",
				icon: "✓",
				color: "#4CAF50",
				templateId: "minimal",
			},
		],
	},
	{
		id: "project",
		name: "Project management",
		description: "Status workflow for project management and tracking",
		author: "Obsidian Note Status",
		github: "https://github.com/devonthesofa/obsidian-note-status",
		statuses: [
			{
				name: "planning",
				icon: "🗓️",
				color: "#9E9E9E",
				templateId: "project",
			},
			{
				name: "backlog",
				icon: "📋",
				color: "#E0E0E0",
				templateId: "project",
			},
			{
				name: "ready",
				icon: "🚦",
				color: "#8BC34A",
				templateId: "project",
			},
			{
				name: "inDevelopment",
				icon: "👨‍💻",
				color: "#2196F3",
				templateId: "project",
			},
			{
				name: "testing",
				icon: "🧪",
				color: "#9C27B0",
				templateId: "project",
			},
			{
				name: "review",
				icon: "👁️",
				color: "#FFC107",
				templateId: "project",
			},
			{
				name: "approved",
				icon: "👍",
				color: "#4CAF50",
				templateId: "project",
			},
			{
				name: "live",
				icon: "🚀",
				color: "#3F51B5",
				templateId: "project",
			},
		],
	},
];

/**
 * Default template IDs that should be enabled by default
 */
export const DEFAULT_ENABLED_TEMPLATES = ["colorful"];
