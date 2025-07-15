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
			<h3>Custom statuses</h3>

			<SettingItem
				name="Use only custom statuses"
				description="Ignore template statuses and use only the custom statuses defined below"
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
				name="Custom statuses"
				description="Manage the custom statuses"
				vertical
			>
				<div>
					{settings.customStatuses.map((status, index) => (
						<CustomStatusItem
							key={index}
							status={status}
							index={index}
							settings={settings}
							onCustomStatusChange={updateCustomStatus}
							onCustomStatusRemove={removeCustomStatus}
						/>
					))}
				</div>
			</SettingItem>

			<SettingItem
				name="Add new status"
				description="Add an empty custom status to be modified"
			>
				<button className="mod-cta" onClick={addNewCustomStatus}>
					Add Status
				</button>
			</SettingItem>
		</div>
	);
};
