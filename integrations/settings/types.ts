import { NoteStatusSettings, Status } from "../../models/types";

/**
 * Callbacks interface for settings UI interactions
 */
export interface SettingsUICallbacks {
	/** Handle template enable/disable toggle */
	onTemplateToggle: (templateId: string, enabled: boolean) => Promise<void>;
	/** Handle general setting changes */
	onSettingChange: (
		key: keyof NoteStatusSettings,
		value: boolean | string | string[],
	) => Promise<void>;
	/** Handle custom status field changes */
	onCustomStatusChange: (
		index: number,
		field: keyof Status,
		value: string,
	) => Promise<void>;
	/** Handle custom status removal */
	onCustomStatusRemove: (index: number) => Promise<void>;
	/** Handle adding new custom status */
	onCustomStatusAdd: () => Promise<void>;
}
