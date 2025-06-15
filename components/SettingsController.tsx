import React, { useCallback } from "react";
import { App } from "obsidian";
import { Status, NoteStatusSettings } from "../models/types";
import { SettingsUI } from "../integrations/settings/SettingsUI";
import { SettingsUICallbacks } from "../integrations/settings/types";

interface SettingsControllerProps {
	app: App;
	settings: NoteStatusSettings;
	onSettingsChange: (settings: NoteStatusSettings) => Promise<void>;
}

export const SettingsController: React.FC<SettingsControllerProps> = ({
	app,
	settings,
	onSettingsChange,
}) => {
	const callbacks: SettingsUICallbacks = {
		onTemplateToggle: useCallback(
			async (templateId: string, enabled: boolean) => {
				const newSettings = { ...settings };

				if (enabled) {
					if (!newSettings.enabledTemplates.includes(templateId)) {
						newSettings.enabledTemplates.push(templateId);
					}
				} else {
					newSettings.enabledTemplates =
						newSettings.enabledTemplates.filter(
							(id: string) => id !== templateId,
						);
				}

				await onSettingsChange(newSettings);
			},
			[settings, onSettingsChange],
		),

		onSettingChange: useCallback(
			async (key: keyof NoteStatusSettings, value) => {
				console.log("etnra?", key, value);
				const newSettings = { ...settings };
				newSettings[key] = value;
				await onSettingsChange(newSettings);
			},
			[settings, onSettingsChange],
		),

		onCustomStatusChange: useCallback(
			async (
				index: number,
				field: keyof Status | "color",
				value: string,
			) => {
				const newSettings = { ...settings };
				const status = newSettings.customStatuses[index];
				if (!status) return;

				if (field === "name") {
					const oldName = status.name;
					status.name = value;

					if (oldName !== status.name) {
						newSettings.statusColors[status.name] =
							newSettings.statusColors[oldName];
						delete newSettings.statusColors[oldName];
					}
				} else if (field === "color") {
					newSettings.statusColors[status.name] = value;
				} else {
					status[field] = value;
				}

				await onSettingsChange(newSettings);
			},
			[settings, onSettingsChange],
		),

		onCustomStatusRemove: useCallback(
			async (index: number) => {
				const newSettings = { ...settings };
				const status = newSettings.customStatuses[index];
				if (!status) return;

				newSettings.customStatuses.splice(index, 1);
				delete newSettings.statusColors[status.name];

				await onSettingsChange(newSettings);
			},
			[settings, onSettingsChange],
		),

		onCustomStatusAdd: useCallback(async () => {
			const newSettings = { ...settings };
			const newStatus: Status = {
				name: `status${newSettings.customStatuses.length + 1}`,
				icon: "⭐",
			};

			newSettings.customStatuses.push(newStatus);
			newSettings.statusColors[newStatus.name] = "#ffffff";

			await onSettingsChange(newSettings);
		}, [settings, onSettingsChange]),
	};

	return <SettingsUI settings={settings} callbacks={callbacks} />;
};

export default SettingsController;
