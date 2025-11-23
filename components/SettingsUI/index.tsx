import React, { useEffect, useState } from "react";
import { PluginSettings } from "@/types/pluginSettings";
import { UISettings } from "./UISettings";
import { TemplateSettings } from "./TemplateSettings";
import { BehaviourSettings } from "./BehaviourSettings";
import { CustomStatusSettings } from "./CustomStatusSettings";
import { QuickCommandsSettings } from "./QuickCommandsSettings";

export type Props = {
	settings: PluginSettings;
	onChange: (key: keyof PluginSettings, value: unknown) => void;
};

type SectionId =
	| "templates"
	| "ui"
	| "behaviour"
	| "custom-statuses"
	| "quick-commands";

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
			id: "templates",
			label: "Templates",
			description: "Enable predefined flows or build your own.",
			content: (
				<TemplateSettings
					settings={localSettings}
					onChange={handleChange}
				/>
			),
		},
		{
			id: "ui",
			label: "UI & Explorer",
			description: "Status bar, editor, and file explorer visuals.",
			content: (
				<UISettings settings={localSettings} onChange={handleChange} />
			),
		},
		{
			id: "behaviour",
			label: "Behavior",
			description: "Frontmatter storage and validation rules.",
			content: (
				<BehaviourSettings
					settings={localSettings}
					onChange={handleChange}
				/>
			),
		},
		{
			id: "custom-statuses",
			label: "Custom Statuses",
			description: "Create and manage your own statuses.",
			content: (
				<CustomStatusSettings
					settings={localSettings}
					onChange={handleChange}
				/>
			),
		},
		{
			id: "quick-commands",
			label: "Quick Commands",
			description: "Choose statuses with command palette shortcuts.",
			content: (
				<QuickCommandsSettings
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
								{isOpen ? "▾" : "▸"}
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
