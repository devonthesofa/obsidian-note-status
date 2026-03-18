import { PluginSettings, SyncGroup } from "@/types/pluginSettings";
import React from "react";
import { SettingItem } from "./SettingItem";
import settingsService from "@/core/settingsService";
import statusStoreManager from "@/core/statusStoreManager";

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

	const handleDataExport = async () => {
		try {
			await statusStoreManager.getNonMarkdownStore().exportToVault();
			alert("Non-Markdown status data exported to vault.");
		} catch (e) {
			alert(`Export failed: ${e.message}`);
		}
	};

	const handleDataImport = async () => {
		try {
			await statusStoreManager.getNonMarkdownStore().importFromVault();
			alert("Non-Markdown status data imported from vault.");
		} catch (e) {
			alert(`Import failed: ${e.message}`);
		}
	};

	const toggleGroup = (group: SyncGroup) => {
		const currentGroups = [...(settings.syncGroups || [])];
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
				id: "templates",
				label: "Templates",
				description: "Status templates and their enabled status.",
			},
			{
				id: "customStatuses",
				label: "Custom Statuses",
				description: "Standalone custom statuses.",
			},
			{
				id: "statusColors",
				label: "Status Colors",
				description: "Custom colors for all statuses.",
			},
			{
				id: "uiAppearance",
				label: "UI & Appearance",
				description: "Icons, frames, status bar, and toolbar styles.",
			},
			{
				id: "workflow",
				label: "Workflow Rules",
				description: "Multi-status, strict mode, and overview popups.",
			},
			{
				id: "storage",
				label: "Storage & Tagging",
				description: "Frontmatter keys, mappings, and tag prefix.",
			},
			{
				id: "features",
				label: "Features & Limits",
				description: "Quick commands, experiments, and vault limits.",
			},
		];

	return (
		<div>
			<h3>Multi-device Synchronization</h3>
			<p>
				Keep your plugin settings and data in sync across devices using
				files in your vault.
			</p>

			<div className="sync-section" style={{ marginBottom: "30px" }}>
				<h4>Settings Synchronization</h4>
				<p className="setting-item-description">
					Save plugin configuration to a JSON file.
				</p>

				<SettingItem
					name="Enable settings synchronization"
					description="Automatically save and load selected plugin settings from a file in your vault."
				>
					<input
						type="checkbox"
						checked={settings.enableExternalStatusSync || false}
						onChange={(e) =>
							onChange(
								"enableExternalStatusSync",
								e.target.checked,
							)
						}
					/>
				</SettingItem>

				<SettingItem
					name="Settings sync file path"
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
					className="sync-groups-container"
					style={{ margin: "20px 0" }}
				>
					<h5>Selective Synchronization</h5>
					<p className="setting-item-description">
						Choose which groups of settings should be included in
						the synchronization.
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
									(settings.syncGroups || []).includes(
										group.id,
									)
										? "is-selected"
										: ""
								}`}
								style={{
									padding: "10px",
									border: "1px solid var(--background-modifier-border)",
									borderRadius: "4px",
									cursor: "pointer",
									backgroundColor: (
										settings.syncGroups || []
									).includes(group.id)
										? "var(--background-modifier-hover)"
										: "transparent",
								}}
								onClick={() => toggleGroup(group.id)}
							>
								<div style={{ fontWeight: "bold" }}>
									<input
										type="checkbox"
										checked={(
											settings.syncGroups || []
										).includes(group.id)}
										onChange={() => {}} // Handled by parent div onClick
										style={{ marginRight: "8px" }}
									/>
									{group.label}
								</div>
								<div
									className="setting-item-description"
									style={{
										marginTop: "4px",
										fontSize: "0.85em",
									}}
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
					<button onClick={handleExport}>
						📤 Export selected now
					</button>
					<button onClick={handleImport}>
						📥 Import selected now
					</button>
				</div>
			</div>

			<div className="sync-section">
				<h4>Non-Markdown Data Synchronization</h4>
				<p className="setting-item-description">
					Statuses for non-Markdown files (PDFs, images, etc.) are
					stored in a special data file. Enable this to keep them in
					sync across devices.
				</p>

				<SettingItem
					name="Sync non-Markdown statuses"
					description="Store non-Markdown status data in a vault file instead of the internal plugin folder."
				>
					<input
						type="checkbox"
						checked={settings.enableNonMarkdownSync || false}
						onChange={(e) =>
							onChange("enableNonMarkdownSync", e.target.checked)
						}
					/>
				</SettingItem>

				<SettingItem
					name="Data sync file path"
					description="Path to the JSON file where non-Markdown statuses will be stored."
				>
					<input
						type="text"
						value={
							settings.nonMarkdownSyncPath ||
							"_note-status-data.json"
						}
						onChange={(e) =>
							onChange("nonMarkdownSyncPath", e.target.value)
						}
						placeholder="_note-status-data.json"
					/>
				</SettingItem>

				<div
					className="note-status-settings__actions"
					style={{ marginTop: "1em", display: "flex", gap: "10px" }}
				>
					<button onClick={handleDataExport}>
						📤 Export internal data to vault
					</button>
					<button onClick={handleDataImport}>
						📥 Import data from vault
					</button>
				</div>
			</div>
		</div>
	);
};
