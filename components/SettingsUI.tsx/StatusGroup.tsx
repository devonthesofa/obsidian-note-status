import React from "react";
import { PluginSettings } from "@/types/pluginSettings";
import { SettingItem } from "./SettingItem";

export type StatusGroupProps = {
	statuses: PluginSettings["customStatuses"];
	title: string;
	description?: string;
	currentQuickCommands: string[];
	onToggle: (statusName: string, enabled: boolean) => void;
};

export const StatusGroup: React.FC<StatusGroupProps> = ({
	statuses,
	title,
	description,
	currentQuickCommands,
	onToggle,
}) => (
	<div className="status-group">
		<div className="status-group__header">
			<div className="status-group__title">{title}</div>
			{description && (
				<div className="status-group__description">{description}</div>
			)}
		</div>
		<div className="status-group__items">
			{statuses.map((status) => {
				const scopedStatusName = status.templateId
					? `${status.templateId}:${status.name}`
					: status.name;

				return (
					<SettingItem
						key={`${status.templateId || "custom"}:${status.name}`}
						name={`${status.icon} ${status.name}`}
						description={status.description || ""}
					>
						<input
							type="checkbox"
							checked={currentQuickCommands.includes(
								scopedStatusName,
							)}
							onChange={(e) =>
								onToggle(scopedStatusName, e.target.checked)
							}
						/>
					</SettingItem>
				);
			})}
		</div>
	</div>
);
