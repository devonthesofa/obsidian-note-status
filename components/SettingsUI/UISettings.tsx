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
			<h3>Status Bar</h3>

			<SettingItem
				name="Show status icon in status bar"
				description="Display a status icon in the status bar with the current note status."
			>
				<input
					type="checkbox"
					checked={settings.showStatusBar}
					onChange={handleChange("showStatusBar")}
				/>
			</SettingItem>

			<SettingItem
				name="Hide icon when note has no status"
				description="Automatically hide the status icon whenever the current note does not have a status."
			>
				<input
					type="checkbox"
					checked={settings.autoHideStatusBar}
					onChange={handleChange("autoHideStatusBar")}
				/>
			</SettingItem>

			<SettingItem
				name="Show status overview popup"
				description="Show a popup listing statuses when hovering or interacting with the status icon."
			>
				<input
					type="checkbox"
					checked={settings.enableStatusOverviewPopup ?? true}
					onChange={handleChange("enableStatusOverviewPopup")}
				/>
			</SettingItem>

			<SettingItem
				name="Show template names next to status"
				description="Control how the template name is shown alongside the current status."
			>
				<Select
					options={[
						{
							value: "never",
							display: "Never show template names",
						},
						{
							value: "auto",
							display: "Show only when status names conflict",
						},
						{
							value: "always",
							display: "Always show template names",
						},
					]}
					defaultValue={settings.statusBarShowTemplateName || "auto"}
					onChange={(value) =>
						onChange("statusBarShowTemplateName", value)
					}
				/>
			</SettingItem>

			<h4>No Status Display</h4>

			<SettingItem
				name="Custom text when note has no status"
				description="Pick what text should be shown in the status bar when a note does not have a status."
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
				name="Show icon when note has no status"
				description="Display the unknown status icon in the status bar next to the custom text."
			>
				<input
					type="checkbox"
					checked={settings.statusBarShowNoStatusIcon || false}
					onChange={handleChange("statusBarShowNoStatusIcon")}
				/>
			</SettingItem>

			<SettingItem
				name="Show text when note has no status"
				description="Display the custom text in the status bar whenever no status is set."
			>
				<input
					type="checkbox"
					checked={settings.statusBarShowNoStatusText ?? true}
					onChange={handleChange("statusBarShowNoStatusText")}
				/>
			</SettingItem>

			<h3>Editor</h3>

			<SettingItem
				name="Show editor toolbar button"
				description="Add a button to the editor toolbar to change the note status."
			>
				<input
					type="checkbox"
					checked={settings.showEditorToolbarButton ?? true}
					onChange={handleChange("showEditorToolbarButton")}
				/>
			</SettingItem>

			<SettingItem
				name="Editor toolbar button position"
				description="Choose where the status button should appear in the editor toolbar."
			>
				<Select
					options={[
						{
							value: "left",
							display: "Left side of toolbar",
						},
						{
							value: "right",
							display: "Right side (after all buttons)",
						},
						{
							value: "right-before",
							display: "Right side (before action buttons)",
						},
					]}
					defaultValue={
						settings.editorToolbarButtonPosition || "right"
					}
					onChange={(value) =>
						onChange("editorToolbarButtonPosition", value)
					}
				/>
			</SettingItem>

			<SettingItem
				name="Show toolbar button for"
				description="Control which editors should display the toolbar button."
			>
				<Select
					options={[
						{
							value: "all-notes",
							display: "All open notes",
						},
						{
							value: "active-only",
							display: "Active note only",
						},
					]}
					defaultValue={
						settings.editorToolbarButtonDisplay || "all-notes"
					}
					onChange={(value) =>
						onChange("editorToolbarButtonDisplay", value)
					}
				/>
			</SettingItem>

			<h3>File Explorer</h3>

			<SettingItem
				name="Show status icons in file explorer"
				description="Display a status icon for each file inside the file explorer."
			>
				<input
					type="checkbox"
					checked={settings.showStatusIconsInExplorer}
					onChange={handleChange("showStatusIconsInExplorer")}
				/>
			</SettingItem>

			<SettingItem
				name="Status icon position in file explorer"
				description="Choose where the icon should be rendered next to the file name."
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
				name="Hide icon when file status is unknown"
				description="Do not render a status icon in the explorer when a note status cannot be determined."
			>
				<input
					type="checkbox"
					checked={settings.hideUnknownStatusInExplorer || false}
					onChange={handleChange("hideUnknownStatusInExplorer")}
				/>
			</SettingItem>

			<SettingItem
				name="Status icon frame"
				description="Choose whether to display a frame around the status icon inside the file explorer."
			>
				<Select
					options={[
						{ value: "never", display: "Never show a frame" },
						{ value: "always", display: "Always show a frame" },
					]}
					defaultValue={settings.fileExplorerIconFrame || "never"}
					onChange={(value) =>
						onChange("fileExplorerIconFrame", value)
					}
				/>
			</SettingItem>

			<SettingItem
				name="Status icon color"
				description="Decide whether icons use their configured status colors or inherit the theme default."
			>
				<Select
					options={[
						{
							value: "status",
							display: "Use custom status colors",
						},
						{
							value: "theme",
							display: "Use theme default colors",
						},
					]}
					defaultValue={
						settings.fileExplorerIconColorMode || "status"
					}
					onChange={(value) =>
						onChange("fileExplorerIconColorMode", value)
					}
				/>
			</SettingItem>

			<h3>Behavior & Other</h3>

			<SettingItem
				name="Icon for unknown status"
				description="Emoji or Lucide icon name displayed whenever a note does not have a status."
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
				name="Color for unknown status"
				description="Hex color used for unknown statuses (e.g., #8b949e)."
			>
				<Input
					variant="color"
					value={settings.unknownStatusColor || "#8b949e"}
					onChange={(value) => onChange("unknownStatusColor", value)}
					placeholder="No status"
				/>
			</SettingItem>
		</div>
	);
};
