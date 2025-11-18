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
	enabledTemplates: string[]; // IDs of enabled templates
	useCustomStatusesOnly: boolean; // Whether to use only custom statuses or include templates
	useMultipleStatuses: boolean; // Whether to allow multiple statuses per note
	tagPrefix: string; // Prefix for the status tag (default: 'status')
	strictStatuses: boolean; // Whether to only show known statuses
	quickStatusCommands: string[];
	// Unknown status customization
	unknownStatusIcon: string; // Custom icon for unknown status
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
