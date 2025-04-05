import { TFile, View } from 'obsidian';

/**
 * Defines a status with name and icon
 */
export interface Status {
	name: string;
	icon: string;
}

/**
 * Plugin settings interface
 */
export interface NoteStatusSettings {
	statusColors: Record<string, string>;
	showStatusDropdown: boolean;
	showStatusBar: boolean;
	dropdownPosition: 'top' | 'bottom';
	statusBarPosition: 'left' | 'right';
	autoHideStatusBar: boolean;
	customStatuses: Status[];
	showStatusIconsInExplorer: boolean;
	collapsedStatuses: Record<string, boolean>;
	compactView: boolean;
}

/**
 * Extended interface for file explorer view
 */
export interface FileExplorerView extends View {
	fileItems: Record<string, {
		el?: HTMLElement;
		file?: TFile;
		titleEl?: HTMLElement;
		selfEl?: HTMLElement;
	}>;
}
