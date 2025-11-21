import { PluginSettings } from "@/types/pluginSettings";
import React from "react";
import { SettingItem } from "./SettingItem";
import { FrontmatterMappingsSettings } from "./FrontmatterMappingsSettings";

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
				name="Single status format"
				description="Choose how the status frontmatter value is stored when multiple statuses are disabled. String format improves compatibility with plugins like TaskNotes."
			>
				<select
					disabled={settings.useMultipleStatuses}
					value={settings.singleStatusStorageMode || "list"}
					onChange={(e) =>
						onChange(
							"singleStatusStorageMode",
							e.target
								.value as PluginSettings["singleStatusStorageMode"],
						)
					}
				>
					<option value="list">List (status: [in-progress])</option>
					<option value="string">String (status: in-progress)</option>
				</select>
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
				name="Frontmatter mappings"
				description="Map templates or individual statuses to specific YAML keys. These mappings only apply to Markdown files with frontmatter."
				vertical
			>
				<FrontmatterMappingsSettings
					settings={settings}
					onChange={onChange}
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
