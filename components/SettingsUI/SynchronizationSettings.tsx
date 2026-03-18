import { PluginSettings, SyncGroup } from "@/types/pluginSettings";
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

	const toggleGroup = (group: SyncGroup) => {
		const currentGroups = [...settings.syncGroups];
		const index = currentGroups.indexOf(group);
		if (index === -1) {
			currentGroups.push(group);
		} else {
			currentGroups.splice(index, 1);
		}
		onChange("syncGroups", currentGroups);
	};

	const syncGroups: { id: SyncGroup; label: string; description: string }[] =
		[
			{
				id: "statuses",
				label: "Statuses & Templates",
				description: "Custom statuses, templates, and workflow rules.",
			},
			{
				id: "appearance",
				label: "Appearance",
				description: "Colors, icons, and UI element styles.",
			},
			{
				id: "behavior",
				label: "Behavior & Storage",
				description: "Frontmatter keys, mappings, and general logic.",
			},
			{
				id: "features",
				label: "Commands & Features",
				description: "Quick commands and experimental feature toggles.",
			},
		];

	return (
		<div>
			<h3>Multi-device Synchronization</h3>
			<p>
				Keep your plugin settings in sync across devices using a file in
				your vault.
			</p>

			<SettingItem
				name="Enable external synchronization"
				description="Automatically save and load selected plugin settings from a file in your vault."
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

			<div className="sync-groups-container" style={{ margin: "20px 0" }}>
				<h4>Selective Synchronization</h4>
				<p className="setting-item-description">
					Choose which groups of settings should be included in the
					synchronization.
				</p>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "1fr 1fr",
						gap: "10px",
						marginTop: "10px",
					}}
				>
					{syncGroups.map((group) => (
						<div
							key={group.id}
							className={`selectable-group-item ${
								settings.syncGroups.includes(group.id)
									? "is-selected"
									: ""
							}`}
							style={{
								padding: "10px",
								border: "1px solid var(--background-modifier-border)",
								borderRadius: "4px",
								cursor: "pointer",
								backgroundColor: settings.syncGroups.includes(
									group.id,
								)
									? "var(--background-modifier-hover)"
									: "transparent",
							}}
							onClick={() => toggleGroup(group.id)}
						>
							<div style={{ fontWeight: "bold" }}>
								<input
									type="checkbox"
									checked={settings.syncGroups.includes(
										group.id,
									)}
									onChange={() => {}} // Handled by parent div onClick
									style={{ marginRight: "8px" }}
								/>
								{group.label}
							</div>
							<div
								className="setting-item-description"
								style={{ marginTop: "4px", fontSize: "0.85em" }}
							>
								{group.description}
							</div>
						</div>
					))}
				</div>
			</div>

			<div
				className="note-status-settings__actions"
				style={{ marginTop: "1em", display: "flex", gap: "10px" }}
			>
				<button onClick={handleExport}>📤 Export selected now</button>
				<button onClick={handleImport}>📥 Import selected now</button>
			</div>
		</div>
	);
};
