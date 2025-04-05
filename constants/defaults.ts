import { NoteStatusSettings } from '../models/types';

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
	showStatusDropdown: true,
	showStatusBar: true,
	dropdownPosition: 'top',
	statusBarPosition: 'right',
	autoHideStatusBar: false,
	customStatuses: [
		{ name: 'active', icon: '▶️' },
		{ name: 'onHold', icon: '⏸️' },
		{ name: 'completed', icon: '✅' },
		{ name: 'dropped', icon: '❌' },
		{ name: 'unknown', icon: '❓' }
	],
	showStatusIconsInExplorer: true,
	collapsedStatuses: {},
	compactView: false
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
