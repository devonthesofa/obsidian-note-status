import { NoteStatus } from "./noteStatus";

export interface StatusTemplate {
	id: string;
	name: string;
	description: string;
	statuses: NoteStatus[];
}

export type PluginSettings = {
	statusColors: Record<string, string>;
	showStatusBar: boolean;
	autoHideStatusBar: boolean;
	customStatuses: NoteStatus[];
	showStatusIconsInExplorer: boolean;
	hideUnknownStatusInExplorer: boolean;
	collapsedStatuses: Record<string, boolean>;
	compactView: boolean;
	enabledTemplates: string[]; // IDs of enabled templates
	useCustomStatusesOnly: boolean; // Whether to use only custom statuses or include templates
	useMultipleStatuses: boolean; // Whether to allow multiple statuses per note
	tagPrefix: string; // Prefix for the status tag (default: 'status')
	strictStatuses: boolean; // Whether to only show known statuses
	excludeUnknownStatus: boolean; // Whether to exclude files with unknown status from the status pane
	quickStatusCommands: string[];
	[key: string]: unknown;
};
