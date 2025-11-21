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
			lucideIcon: "",
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

	const moveCustomStatusUp = (index: number) => {
		if (index <= 0) return;
		const currentStatuses = [...settings.customStatuses];
		[currentStatuses[index - 1], currentStatuses[index]] = [
			currentStatuses[index],
			currentStatuses[index - 1],
		];
		onChange("customStatuses", currentStatuses);
	};

	const moveCustomStatusDown = (index: number) => {
		if (index >= settings.customStatuses.length - 1) return;
		const currentStatuses = [...settings.customStatuses];
		[currentStatuses[index], currentStatuses[index + 1]] = [
			currentStatuses[index + 1],
			currentStatuses[index],
		];
		onChange("customStatuses", currentStatuses);
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
				name="Custom statuses"
				description="Create custom statuses with emoji icons and optional Lucide icon names plus colors. All statuses require a name."
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
								onCustomStatusChange={updateCustomStatus}
								onCustomStatusRemove={removeCustomStatus}
								onMoveUp={moveCustomStatusUp}
								onMoveDown={moveCustomStatusDown}
								canMoveUp={index > 0}
								canMoveDown={
									index < settings.customStatuses.length - 1
								}
							/>
						))
					)}
				</div>
			</SettingItem>

			<SettingItem name="Add status" description="Create a new status">
				<button className="mod-cta" onClick={addNewCustomStatus}>
					+ Add Status
				</button>
			</SettingItem>
		</div>
	);
};
