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
				name="Apply status recursively to subfolders"
				description="Show a folder context menu option that also processes notes inside nested folders."
			>
				<input
					type="checkbox"
					checked={
						settings.applyStatusRecursivelyToSubfolders || false
					}
					onChange={(e) =>
						onChange(
							"applyStatusRecursivelyToSubfolders",
							e.target.checked,
						)
					}
				/>
			</SettingItem>

			<SettingItem
				name="Status tag prefix"
				description="YAML frontmatter tag name for status (default: obsidian-note-status)"
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

			<SettingItem
				name="Vault size limit"
				description="Disable dashboard and grouped view for vaults with more notes than this limit to improve performance. Set to 0 to disable this feature."
			>
				<input
					type="number"
					min="0"
					value={settings.vaultSizeLimit || 15000}
					onChange={(e) => {
						const value = parseInt(e.target.value) || 15000;
						onChange("vaultSizeLimit", value);
					}}
				/>
			</SettingItem>
		</div>
	);
};
