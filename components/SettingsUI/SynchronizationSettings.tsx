import { PluginSettings } from "@/types/pluginSettings";
import React from "react";
import { SettingItem } from "./SettingItem";
import settingsService from "@/core/settingsService";

export type Props = {
	settings: PluginSettings;
	onChange: (key: keyof PluginSettings, value: unknown) => void;
};

export const SynchronizationSettings: React.FC<Props> = ({
	settings,
	onChange,
}) => {
	const handleExport = async () => {
		await settingsService.syncToExternalFile(true);
		alert("Plugin settings exported successfully.");
	};

	const handleImport = async () => {
		await settingsService.loadFromExternalFile(true);
		alert("Plugin settings imported successfully.");
	};

	return (
		<div>
			<h3>Multi-device Synchronization</h3>
			<p>
				Keep all your plugin settings (statuses, templates, UI
				preferences, etc.) in sync across devices using a file in your
				vault.
			</p>

			<SettingItem
				name="Enable external synchronization"
				description="Automatically save and load all plugin settings from a file in your vault."
			>
				<input
					type="checkbox"
					checked={settings.enableExternalStatusSync || false}
					onChange={(e) =>
						onChange("enableExternalStatusSync", e.target.checked)
					}
				/>
			</SettingItem>

			<SettingItem
				name="Sync file path"
				description="Path to the JSON file where settings will be stored (relative to vault root)."
			>
				<input
					type="text"
					value={
						settings.externalStatusSyncPath ||
						"_note-status-sync.json"
					}
					onChange={(e) =>
						onChange("externalStatusSyncPath", e.target.value)
					}
					placeholder="_note-status-sync.json"
				/>
			</SettingItem>

			<div
				className="note-status-settings__actions"
				style={{ marginTop: "1em", display: "flex", gap: "10px" }}
			>
				<button onClick={handleExport}>📤 Export to file now</button>
				<button onClick={handleImport}>📥 Import from file now</button>
			</div>
		</div>
	);
};
