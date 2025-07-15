import { PluginSettings } from "@/types/pluginSettings";
import React from "react";
import { SettingItem } from "./SettingItem";

export type Props = {
	settings: PluginSettings;
	onChange: (key: keyof PluginSettings, value: unknown) => void;
};

export const UISettings: React.FC<Props> = ({ settings, onChange }) => {
	const handleChange =
		(key: keyof PluginSettings) =>
		(e: React.ChangeEvent<HTMLInputElement>) => {
			onChange(key, e.target.checked);
		};

	return (
		<div className="ui-settings">
			<h3>User interface</h3>

			<SettingItem
				name="Show status bar"
				description="Display the status bar"
			>
				<input
					type="checkbox"
					checked={settings.showStatusBar}
					onChange={handleChange("showStatusBar")}
				/>
			</SettingItem>

			<SettingItem
				name="Auto-hide status bar"
				description="Hide the status bar when status is unknown"
			>
				<input
					type="checkbox"
					checked={settings.autoHideStatusBar}
					onChange={handleChange("autoHideStatusBar")}
				/>
			</SettingItem>

			<SettingItem
				name="Show status icons in file explorer"
				description="Display status icons in the file explorer"
			>
				<input
					type="checkbox"
					checked={settings.showStatusIconsInExplorer}
					onChange={handleChange("showStatusIconsInExplorer")}
				/>
			</SettingItem>

			<SettingItem
				name="Hide unknown status in file explorer"
				description="Hide status icons for files with unknown status in the file explorer"
			>
				<input
					type="checkbox"
					checked={settings.hideUnknownStatusInExplorer || false}
					onChange={handleChange("hideUnknownStatusInExplorer")}
				/>
			</SettingItem>

			<SettingItem
				name="Default to compact view"
				description="Start the status pane in compact view by default"
			>
				<input
					type="checkbox"
					checked={settings.compactView || false}
					onChange={handleChange("compactView")}
				/>
			</SettingItem>

			<SettingItem
				name="Exclude unassigned notes from status pane"
				description="Improves performance by excluding notes with no assigned status from the status pane. Recommended for large vaults."
			>
				<input
					type="checkbox"
					checked={settings.excludeUnknownStatus || false}
					onChange={handleChange("excludeUnknownStatus")}
				/>
			</SettingItem>
		</div>
	);
};
