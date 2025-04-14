import { TFile, View } from 'obsidian';

/**
 * Defines a status with name, icon and color
 */
export interface Status {
    name: string;
    icon: string;
    color?: string; // Optional color property
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
    enabledTemplates: string[];  // IDs of enabled templates
    useCustomStatusesOnly: boolean; // Whether to use only custom statuses or include templates
    useMultipleStatuses: boolean; // Whether to allow multiple statuses per note
    tagPrefix: string; // Prefix for the status tag (default: 'status')
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