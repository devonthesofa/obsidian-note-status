import { PluginSettings } from "types/pluginSettings";

export const DEFAULT_PLUGIN_SETTINGS: PluginSettings = {
	fileExplorerIconPosition: "absolute-right",
	fileExplorerIconFrame: "never",
	fileExplorerIconColorMode: "status",
	statusColors: {
		active: "var(--text-success)",
		onHold: "var(--text-warning)",
		completed: "var(--text-accent)",
		dropped: "var(--text-error)",
		unknown: "var(--text-muted)",
	},
	showStatusBar: true,
	autoHideStatusBar: false,
	enableStatusOverviewPopup: true,
	templates: [
		{
			id: "default-starter",
			name: "Starter Template",
			description:
				"A simplified set of essential workflow statuses to get you started.",
			authorGithub: "soler1212",
			statuses: [
				{
					name: "todo",
					icon: "📌",
					color: "#F44336",
					templateId: "default-starter",
				},
				{
					name: "inProgress",
					icon: "⚙️",
					color: "#2196F3",
					templateId: "default-starter",
				},
				{
					name: "review",
					icon: "👀",
					color: "#9C27B0",
					templateId: "default-starter",
				},
				{
					name: "done",
					icon: "✓",
					color: "#4CAF50",
					templateId: "default-starter",
				},
			],
		},
	],
	customStatuses: [],
	showStatusIconsInExplorer: true,
	hideUnknownStatusInExplorer: true, // Default to hide unknown status
	fileExplorerColorFileName: false,
	fileExplorerColorBlock: false,
	fileExplorerLeftBorder: false,
	fileExplorerStatusDot: false,
	fileExplorerUnderlineFileName: false,
	enableExperimentalFeatures: true,
	enableStatusDashboard: true,
	enableGroupedStatusView: true,
	enabledTemplates: ["default-starter"],
	useCustomStatusesOnly: false,
	useMultipleStatuses: true,
	singleStatusStorageMode: "list",
	statusBarShowTemplateName: "auto", // Default to show template names only when needed
	tagPrefix: "obsidian-note-status",
	strictStatuses: false, // Default to show all statuses from frontmatter
	quickStatusCommands: ["active", "completed"], // Add default quick commands
	// Unknown status customization
	unknownStatusIcon: "❓",
	unknownStatusLucideIcon: "",
	unknownStatusColor: "#8b949e",
	statusBarNoStatusText: "No status",
	statusBarShowNoStatusIcon: false,
	statusBarShowNoStatusText: true,
	statusBarBadgeStyle: "accent",
	statusBarBadgeContentMode: "icon-text",
	vaultSizeLimit: 15000, // Disable dashboard and grouped view for vaults with more notes than this limit
	// Editor toolbar button settings
	showEditorToolbarButton: true, // Default to show the toolbar button
	editorToolbarButtonPosition: "right", // Default position on the right
	editorToolbarButtonDisplay: "all-notes", // Default to show button in all notes
	applyStatusRecursivelyToSubfolders: false,
	statusFrontmatterMappings: [],
	writeMappedTagsToDefault: false,
	enableExternalStatusSync: false,
	externalStatusSyncPath: "_note-status-sync.json",
	syncGroups: [
		"templates",
		"customStatuses",
		"statusColors",
		"uiAppearance",
		"workflow",
		"storage",
		"features",
	],
	enableNonMarkdownSync: false,
	nonMarkdownSyncPath: "_note-status-data.json",
};
