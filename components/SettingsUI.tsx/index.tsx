import { useState, useEffect } from "react";
import { PluginSettings } from "@/types/pluginSettings";
import { UISettings } from "./UISettings";
import { PREDEFINED_TEMPLATES } from "@/constants/defaultSettings";
import { TemplateSettings } from "./TemplateSettings";
import { BehaviourSettings } from "./BehaviourSettings";
import { CustomStatusSettings } from "./CustomStatusSettings";
import { QuickCommandsSettings } from "./QuickCommandsSettings";

export type Props = {
	settings: PluginSettings;
	onChange: (key: keyof PluginSettings, value: unknown) => void;
};

const SettingsUI: React.FC<Props> = ({ settings, onChange }) => {
	const [localSettings, setLocalSettings] = useState(settings);

	useEffect(() => {
		setLocalSettings(settings);
	}, [settings]);

	const handleChange = (key: keyof PluginSettings, value: unknown) => {
		setLocalSettings((prev) => ({ ...prev, [key]: value }));
		onChange(key, value);
	};

	return (
		<div className="note-status-settings">
			<TemplateSettings
				settings={settings}
				onChange={handleChange}
				templates={PREDEFINED_TEMPLATES}
			/>
			<UISettings settings={localSettings} onChange={handleChange} />
			<BehaviourSettings settings={settings} onChange={handleChange} />
			<CustomStatusSettings settings={settings} onChange={handleChange} />
			<QuickCommandsSettings
				settings={settings}
				onChange={handleChange}
				templates={PREDEFINED_TEMPLATES}
			/>
		</div>
	);
};
export default SettingsUI;
