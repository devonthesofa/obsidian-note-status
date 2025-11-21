import React from "react";
import { PluginSettings } from "@/types/pluginSettings";
import { StatusIcon } from "@/components/atoms/StatusIcon";

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

				const isSelected =
					currentQuickCommands.includes(scopedStatusName);

				return (
					<label
						key={`${status.templateId || "custom"}:${status.name}`}
						className={`status-selector ${isSelected ? "status-selector--selected" : ""}`}
					>
						<div className="status-selector__content">
							<div className="status-selector__status">
								<StatusIcon
									icon={status.icon}
									lucideIcon={status.lucideIcon}
									className="status-selector__icon"
									size={16}
								/>
								<span className="status-selector__name">
									{status.name}
								</span>
							</div>
							{status.description && (
								<div className="status-selector__description">
									{status.description}
								</div>
							)}
						</div>
						<input
							type="checkbox"
							className="status-selector__checkbox"
							checked={isSelected}
							onChange={(e) =>
								onToggle(scopedStatusName, e.target.checked)
							}
						/>
					</label>
				);
			})}
		</div>
	</div>
);
