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
	statusColors: Record<string, string>;
	showStatusBar: boolean;
	autoHideStatusBar: boolean;
	customStatuses: NoteStatus[];
	showStatusIconsInExplorer: boolean;
	hideUnknownStatusInExplorer: boolean;
	enabledTemplates: string[]; // IDs of enabled templates
	useCustomStatusesOnly: boolean; // Whether to use only custom statuses or include templates
	useMultipleStatuses: boolean; // Whether to allow multiple statuses per note
	tagPrefix: string; // Prefix for the status tag (default: 'status')
	strictStatuses: boolean; // Whether to only show known statuses
	excludeUnknownStatus: boolean; // Whether to exclude files with unknown status from the status pane
	quickStatusCommands: string[];
	// Unknown status customization
	unknownStatusIcon: string; // Custom icon for unknown status
	unknownStatusColor: string; // Custom hex color for unknown status
	statusBarNoStatusText: string; // Custom text for status bar when no status
	statusBarShowNoStatusIcon: boolean; // Whether to show icon in status bar for no status
	statusBarShowNoStatusText: boolean; // Whether to show text in status bar for no status
	[key: string]: unknown;
};
