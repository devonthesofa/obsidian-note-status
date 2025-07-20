import { PluginSettings } from "types/pluginSettings";
import { DEFAULT_ENABLED_TEMPLATES } from "./predefinedTemplates";

export const DEFAULT_PLUGIN_SETTINGS: PluginSettings = {
	fileExplorerIconPosition: "absolute-right",
	statusColors: {
		active: "var(--text-success)",
		onHold: "var(--text-warning)",
		completed: "var(--text-accent)",
		dropped: "var(--text-error)",
		unknown: "var(--text-muted)",
	},
	showStatusBar: true,
	autoHideStatusBar: false,
	customStatuses: [],
	showStatusIconsInExplorer: true,
	hideUnknownStatusInExplorer: true, // Default to hide unknown status
	enabledTemplates: DEFAULT_ENABLED_TEMPLATES,
	useCustomStatusesOnly: false,
	useMultipleStatuses: true,
	tagPrefix: "obsidian-note-status",
	strictStatuses: false, // Default to show all statuses from frontmatter
	excludeUnknownStatus: true, // Default to exclude unknown status files for better performance
	quickStatusCommands: ["active", "completed"], // Add default quick commands
};
