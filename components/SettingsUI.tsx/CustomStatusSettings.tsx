import { PluginSettings } from "@/types/pluginSettings";
import React from "react";
import {
	CustomStatusItem,
	Props as CustomStatusItemProps,
} from "./CustomStatusItem";
import { SettingItem } from "./SettingItem";

export type Props = {
	settings: PluginSettings;
	onChange: (key: keyof PluginSettings, value: unknown) => void;
};

export const CustomStatusSettings: React.FC<Props> = ({
	settings,
	onChange,
}) => {
	const addNewCustomStatus = () => {
		const currentStatuses = [...settings.customStatuses];
		currentStatuses.push({
			name: "",
			icon: "",
		});
		onChange("customStatuses", currentStatuses);
	};
	const removeCustomStatus: CustomStatusItemProps["onCustomStatusRemove"] = (
		index,
	) => {
		const currentStatuses = [...settings.customStatuses];
		currentStatuses.splice(index, 1);
		onChange("customStatuses", currentStatuses);
	};

	const updateCustomStatus: CustomStatusItemProps["onCustomStatusChange"] = (
		index,
		column,
		value,
	) => {
		const currentStatuses = [...settings.customStatuses];

		const target = currentStatuses[index];
		if (target) {
			target[column] = value;
			onChange("customStatuses", currentStatuses);
		}
	};

	return (
		<div>
			<h3>Custom Statuses</h3>

			<SettingItem
				name="Use only custom statuses"
				description="Hide default template statuses and use only your custom statuses"
			>
				<input
					type="checkbox"
					checked={settings.useCustomStatusesOnly || false}
					onChange={(e) =>
						onChange("useCustomStatusesOnly", e.target.checked)
					}
				/>
			</SettingItem>

			<SettingItem
				name="Your custom statuses"
				description="Create custom statuses with icons (emoji/text), names, and colors. Each status needs a name to be valid."
				vertical
			>
				<div className="custom-status-list">
					{settings.customStatuses.length === 0 ? (
						<div className="custom-status-list__empty">
							<p>
								No custom statuses yet. Click "Add Status" below
								to create your first one.
							</p>
						</div>
					) : (
						settings.customStatuses.map((status, index) => (
							<CustomStatusItem
								key={index}
								status={status}
								index={index}
								settings={settings}
								onCustomStatusChange={updateCustomStatus}
								onCustomStatusRemove={removeCustomStatus}
							/>
						))
					)}
				</div>
			</SettingItem>

			<SettingItem
				name="Add new status"
				description="Create a new custom status"
			>
				<button className="mod-cta" onClick={addNewCustomStatus}>
					+ Add Status
				</button>
			</SettingItem>
		</div>
	);
};
