import { NoteStatusSettings } from '../models/types';
import { DEFAULT_ENABLED_TEMPLATES } from '../constants/status-templates';

/**
 * Default plugin settings
 */
export const DEFAULT_SETTINGS: NoteStatusSettings = {
	statusColors: {
		active: 'var(--text-success)',
		onHold: 'var(--text-warning)',
		completed: 'var(--text-accent)',
		dropped: 'var(--text-error)',
		unknown: 'var(--text-muted)'
	},
	showStatusBar: true,
	autoHideStatusBar: false,
    customStatuses: [],
	showStatusIconsInExplorer: true,
	hideUnknownStatusInExplorer: false, // Default to show unknown status
	collapsedStatuses: {},
	compactView: false,
	enabledTemplates: DEFAULT_ENABLED_TEMPLATES,
	useCustomStatusesOnly: false,
	useMultipleStatuses: true,
	tagPrefix: 'obsidian-note-status',
	excludeUnknownStatus: true, // Default to exclude unknown status files for better performance
};

/**
 * Default colors in hexadecimal format for backup and reset
 */
export const DEFAULT_COLORS: Record<string, string> = {
	active: '#00ff00',    // Green for success
	onHold: '#ffaa00',    // Orange for warning
	completed: '#00aaff', // Blue for accent
	dropped: '#ff0000',   // Red for error
	unknown: '#888888'    // Gray for muted
};