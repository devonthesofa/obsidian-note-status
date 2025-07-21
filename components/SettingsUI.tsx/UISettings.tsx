import { PluginSettings } from "@/types/pluginSettings";
import React from "react";
import { Input } from "../atoms/Input";
import { Select } from "../atoms/Select";
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
				name="Status icon in file explorer position"
				description="Choose icon position in file explorer"
			>
				<Select
					options={[
						{ display: "Filename left", value: "file-name-left" },
						{ display: "Filename right", value: "file-name-right" },
						{ display: "Absolute right", value: "absolute-right" },
					]}
					defaultValue={settings.fileExplorerIconPosition}
					onChange={(value) =>
						onChange("fileExplorerIconPosition", value)
					}
				/>
			</SettingItem>

			<SettingItem
				name="Hide unknown status in file explorer"
				description="Hide status icons for files with unknown status"
			>
				<input
					type="checkbox"
					checked={settings.hideUnknownStatusInExplorer || false}
					onChange={handleChange("hideUnknownStatusInExplorer")}
				/>
			</SettingItem>

			<h4>Unknown Status Customization</h4>

			<SettingItem
				name="Unknown status icon"
				description="Icon displayed for files with unknown status"
			>
				<Input
					variant="text"
					value={settings.unknownStatusIcon}
					onChange={(value) => onChange("unknownStatusIcon", value)}
					placeholder="❓"
					style={{ maxWidth: "150px" }}
				/>
			</SettingItem>

			<SettingItem
				name="Unknown status color"
				description="Hex color for unknown status (e.g., #8b949e)"
			>
				<Input
					variant="color"
					value={settings.unknownStatusColor || "#8b949e"}
					onChange={(value) => onChange("unknownStatusColor", value)}
					placeholder="No status"
				/>
			</SettingItem>

			<SettingItem
				name="Status bar 'no status' text"
				description="Text displayed in status bar when there is no status"
			>
				<Input
					variant="text"
					value={settings.statusBarNoStatusText}
					onChange={(value) =>
						onChange("statusBarNoStatusText", value)
					}
					style={{ maxWidth: "150px" }}
					placeholder="No status"
				/>
			</SettingItem>

			<SettingItem
				name="Show icon in status bar for 'no status'"
				description="Show unknown status icon in status bar alongside text"
			>
				<input
					type="checkbox"
					checked={settings.statusBarShowNoStatusIcon || false}
					onChange={handleChange("statusBarShowNoStatusIcon")}
				/>
			</SettingItem>

			<SettingItem
				name="Show text in status bar for 'no status'"
				description="Display the custom text in the status bar when there is no status"
			>
				<input
					type="checkbox"
					checked={settings.statusBarShowNoStatusText ?? true}
					onChange={handleChange("statusBarShowNoStatusText")}
				/>
			</SettingItem>
		</div>
	);
};
