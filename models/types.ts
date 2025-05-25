import { TFile, View } from "obsidian";

declare module "obsidian" {
	interface WorkspaceLeaf {
		// TODO: Is deprecated, fix me
		id: string;
	}

	interface Commands {
		removeCommand(id: string): void;
	}

	interface App {
		clipboard?: unknown;
		internalPlugins: InternalPlugins;
		commands: Commands;
	}

	interface GlobalSearchPlugin {
		openGlobalSearch(query: string): void;
	}

	interface InternalPlugins {
		getPluginById(
			id: "global-search",
		): { instance: GlobalSearchPlugin } | undefined;
	}
}

/**
 * Defines a status with name, icon and color
 */
export interface Status {
	name: string;
	icon: string;
	color?: string; // Optional color property
	description?: string; // Optional description property
	[key: string]: unknown;
}

/**
 * Plugin settings interface
 */
export interface NoteStatusSettings {
	statusColors: Record<string, string>;
	showStatusBar: boolean;
	autoHideStatusBar: boolean;
	customStatuses: Status[];
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
}

/**
 * Extended interface for file explorer view
 */
export interface FileExplorerView extends View {
	fileItems: Record<
		string,
		{
			el?: HTMLElement;
			file?: TFile;
			titleEl?: HTMLElement;
			selfEl?: HTMLElement;
		}
	>;
}
