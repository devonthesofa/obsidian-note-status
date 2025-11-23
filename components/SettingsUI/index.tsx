import React, { useEffect, useState } from "react";
import { PluginSettings } from "@/types/pluginSettings";
import { TemplateSettings } from "./TemplateSettings";
import { BehaviourSettings } from "./BehaviourSettings";
import { CustomStatusSettings } from "./CustomStatusSettings";
import { QuickCommandsSettings } from "./QuickCommandsSettings";
import {
	EditorToolbarSettings,
	ExperimentalSettings,
	FileExplorerSettings,
	StatusBarSettings,
	UnknownStatusAppearanceSettings,
} from "./UISettings";

export type Props = {
	settings: PluginSettings;
	onChange: (key: keyof PluginSettings, value: unknown) => void;
};

type SectionId =
	| "templates-statuses"
	| "quick-actions"
	| "status-bar"
	| "editor-toolbar"
	| "file-explorer"
	| "unknown-appearance"
	| "behavior-storage"
	| "experimental-features";

type SectionDefinition = {
	id: SectionId;
	label: string;
	description: string;
	content: React.ReactNode;
};

const SettingsUI: React.FC<Props> = ({ settings, onChange }) => {
	const [localSettings, setLocalSettings] = useState(settings);
	const [expandedSections, setExpandedSections] = useState<
		Partial<Record<SectionId, boolean>>
	>({});

	useEffect(() => {
		setLocalSettings(settings);
	}, [settings]);

	const handleChange = (key: keyof PluginSettings, value: unknown) => {
		setLocalSettings((prev) => ({ ...prev, [key]: value }));
		onChange(key, value);
	};

	const sections: SectionDefinition[] = [
		{
			id: "templates-statuses",
			label: "Templates & Statuses",
			description:
				"Enable predefined workflows or define your own statuses.",
			content: (
				<div className="note-status-settings__stack">
					<TemplateSettings
						settings={localSettings}
						onChange={handleChange}
					/>
					<CustomStatusSettings
						settings={localSettings}
						onChange={handleChange}
					/>
				</div>
			),
		},
		{
			id: "quick-actions",
			label: "Quick Actions",
			description: "Choose statuses with command palette shortcuts.",
			content: (
				<QuickCommandsSettings
					settings={localSettings}
					onChange={handleChange}
				/>
			),
		},
		{
			id: "status-bar",
			label: "Status Bar",
			description:
				"Icon, popup, badge style/content, and no-status behavior.",
			content: (
				<StatusBarSettings
					settings={localSettings}
					onChange={handleChange}
				/>
			),
		},
		{
			id: "editor-toolbar",
			label: "Editor Toolbar",
			description: "Button placement and visibility across panes.",
			content: (
				<EditorToolbarSettings
					settings={localSettings}
					onChange={handleChange}
				/>
			),
		},
		{
			id: "file-explorer",
			label: "File Explorer",
			description:
				"Icon placement, hiding unknown, and visual styling options.",
			content: (
				<FileExplorerSettings
					settings={localSettings}
					onChange={handleChange}
				/>
			),
		},
		{
			id: "unknown-appearance",
			label: "Unknown / No-Status Appearance",
			description: "Fallback icon and color when a note lacks status.",
			content: (
				<UnknownStatusAppearanceSettings
					settings={localSettings}
					onChange={handleChange}
				/>
			),
		},
		{
			id: "behavior-storage",
			label: "Behavior & Storage",
			description:
				"Multi-status mode, tag key, mappings, and vault safeguards.",
			content: (
				<BehaviourSettings
					settings={localSettings}
					onChange={handleChange}
				/>
			),
		},
		{
			id: "experimental-features",
			label: "Experimental Features",
			description: "Opt into dashboard and grouped view previews.",
			content: (
				<ExperimentalSettings
					settings={localSettings}
					onChange={handleChange}
				/>
			),
		},
	];

	return (
		<div className="note-status-settings">
			{sections.map((section) => {
				const isOpen = expandedSections[section.id] ?? false;
				return (
					<div
						key={section.id}
						className={`note-status-section ${
							isOpen ? "is-open" : ""
						}`}
					>
						<button
							type="button"
							className="note-status-section__header"
							aria-expanded={isOpen}
							onClick={() =>
								setExpandedSections((prev) => ({
									...prev,
									[section.id]: !prev[section.id],
								}))
							}
						>
							<div className="note-status-section__title-block">
								<div className="setting-item-name">
									{section.label}
								</div>
								<div className="setting-item-description">
									{section.description}
								</div>
							</div>
							<span
								className="note-status-section__chevron"
								aria-hidden="true"
							>
								{isOpen ? "v" : ">"}
							</span>
						</button>
						{isOpen ? (
							<div className="note-status-section__content">
								{section.content}
							</div>
						) : null}
					</div>
				);
			})}
		</div>
	);
};
export default SettingsUI;
