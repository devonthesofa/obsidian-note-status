import React, { useCallback } from "react";
import { PluginSettings, StatusTemplate } from "@/types/pluginSettings";
import { TemplateItem } from "./TemplateItem";

interface TemplateSettingsProps {
	settings: PluginSettings;
	onChange: (key: keyof PluginSettings, value: unknown) => void;
	templates: StatusTemplate[];
}

export const TemplateSettings: React.FC<TemplateSettingsProps> = ({
	settings,
	onChange,
	templates,
}) => {
	const handleTemplateToggle = useCallback(
		(templateId: string, enabled: boolean) => {
			let newEnabledTemplated = [...settings.enabledTemplates];
			if (enabled) {
				if (!newEnabledTemplated.includes(templateId)) {
					newEnabledTemplated.push(templateId);
				}
			} else {
				newEnabledTemplated = newEnabledTemplated.filter(
					(id: string) => id !== templateId,
				);
			}
			onChange("enabledTemplates", newEnabledTemplated);
		},
		[onChange, settings.enabledTemplates],
	);

	return (
		<div>
			<h3>Status templates</h3>
			<p>
				Enable predefined templates to quickly add common status
				workflows
			</p>
			<div>
				{templates.map((template) => (
					<TemplateItem
						key={template.id}
						template={template}
						isEnabled={settings.enabledTemplates.includes(
							template.id,
						)}
						onToggle={handleTemplateToggle}
					/>
				))}
			</div>
		</div>
	);
};
