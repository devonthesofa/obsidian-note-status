import { NoteStatus } from "./noteStatus";

export interface StatusTemplate {
	id: string;
	name: string;
	description: string;
	statuses: NoteStatus[];
}

export type PluginSettings = {
	fileExplorerIconPosition:
		| "absolute-right"
		| "file-name-left"
		| "file-name-right";
	fileExplorerIconFrame: "always" | "never";
	fileExplorerIconColorMode: "status" | "theme";
	statusColors: Record<string, string>;
	showStatusBar: boolean;
	autoHideStatusBar: boolean;
	enableStatusOverviewPopup: boolean; // Whether to show popup with grouped statuses
	templates: StatusTemplate[];
	customStatuses: NoteStatus[];
	statusBarShowTemplateName: "always" | "never" | "auto"; // How to show template names in status bar
	showStatusIconsInExplorer: boolean;
	hideUnknownStatusInExplorer: boolean;
	fileExplorerColorFileName: boolean; // Whether to color the file explorer filename text using the current status color
	fileExplorerColorBlock: boolean; // Whether to tint the entire explorer list item background using the status color
	fileExplorerLeftBorder: boolean; // Whether to display a colored border on the explorer item
	fileExplorerStatusDot: boolean; // Whether to append a small colored dot next to the filename
	fileExplorerUnderlineFileName: boolean; // Whether to underline the filename using the status color
	enableExperimentalFeatures: boolean; // Gate for experimental features
	enableStatusDashboard: boolean; // Toggle for the status dashboard experiment
	enableGroupedStatusView: boolean; // Toggle for the grouped status view experiment
	enabledTemplates: string[]; // IDs of enabled templates
	useCustomStatusesOnly: boolean; // Whether to use only custom statuses or include templates
	useMultipleStatuses: boolean; // Whether to allow multiple statuses per note
	singleStatusStorageMode: "list" | "string"; // How to store single statuses when multiple statuses are disabled
	tagPrefix: string; // Prefix for the status tag (default: 'status')
	strictStatuses: boolean; // Whether to only show known statuses
	quickStatusCommands: string[];
	// Unknown status customization
	unknownStatusIcon: string; // Custom icon for unknown status
	unknownStatusLucideIcon?: string; // Optional Lucide icon for unknown status
	unknownStatusColor: string; // Custom hex color for unknown status
	statusBarNoStatusText: string; // Custom text for status bar when no status
	statusBarShowNoStatusIcon: boolean; // Whether to show icon in status bar for no status
	statusBarShowNoStatusText: boolean; // Whether to show text in status bar for no status
	vaultSizeLimit: number; // Disable dashboard and grouped view for vaults with more notes than this limit
	// Editor toolbar button settings
	showEditorToolbarButton: boolean; // Whether to show the toolbar button
	editorToolbarButtonPosition: "left" | "right" | "right-before"; // Position of the toolbar button
	editorToolbarButtonDisplay: "all-notes" | "active-only"; // Whether to show button in all notes or only active one
	applyStatusRecursivelyToSubfolders: boolean; // Whether to show recursive folder context option
	[key: string]: unknown;
};
