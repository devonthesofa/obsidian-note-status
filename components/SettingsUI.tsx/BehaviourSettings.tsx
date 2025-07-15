import { PluginSettings } from "@/types/pluginSettings";
import React from "react";
import { SettingItem } from "./SettingItem";

export type Props = {
	settings: PluginSettings;
	onChange: (key: keyof PluginSettings, value: unknown) => void;
};

export const BehaviourSettings: React.FC<Props> = ({ settings, onChange }) => {
	return (
		<div>
			<h3>Status tag</h3>

			<SettingItem
				name="Enable multiple statuses"
				description="Allow notes to have multiple statuses at the same time"
			>
				<input
					type="checkbox"
					checked={settings.useMultipleStatuses}
					onChange={(e) =>
						onChange("useMultipleStatuses", e.target.checked)
					}
				/>
			</SettingItem>

			<SettingItem
				name="Status tag prefix"
				description="The YAML frontmatter tag name used for status (default: obsidian-note-status)"
			>
				<input
					type="text"
					value={settings.tagPrefix}
					onChange={(e) => {
						if (e.target.value.trim()) {
							onChange("tagPrefix", e.target.value.trim());
						}
					}}
				/>
			</SettingItem>

			<SettingItem
				name="Strict status validation"
				description="Only show statuses that are defined in templates or custom statuses. ⚠️ WARNING: When enabled, any unknown statuses will be automatically removed when modifying file statuses."
			>
				<input
					type="checkbox"
					checked={settings.strictStatuses || false}
					onChange={(e) =>
						onChange("strictStatuses", e.target.checked)
					}
				/>
			</SettingItem>
		</div>
	);
};
