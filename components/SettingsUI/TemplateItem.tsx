import React from "react";
import { StatusTemplate } from "@/types/pluginSettings";
import { StatusDisplay } from "../atoms/StatusDisplay";
import { SelectableListItem } from "../atoms/SelectableListItem";
import { isCustomTemplate } from "@/utils/templateUtils";
import { ObsidianIcon } from "../atoms/ObsidianIcon";

interface TemplateItemProps {
	template: StatusTemplate;
	isEnabled: boolean;
	onToggle: (templateId: string, enabled: boolean) => void;
	onEdit?: (template: StatusTemplate) => void;
	onDelete?: (templateId: string) => void;
}

export const TemplateItem: React.FC<TemplateItemProps> = ({
	template,
	isEnabled,
	onToggle,
	onEdit,
	onDelete,
}) => {
	const handleClick = (e: React.MouseEvent) => {
		// Don't toggle if clicking action buttons
		if ((e.target as HTMLElement).closest(".template-item-actions")) {
			return;
		}
		onToggle(template.id, !isEnabled);
	};

	return (
		<div className={`template-item ${isEnabled ? "enabled" : ""}`}>
			<SelectableListItem
				selected={isEnabled}
				onClick={handleClick}
				className="template-item-content"
				icon={
					<input
						type="checkbox"
						className="template-checkbox"
						checked={isEnabled}
						readOnly
					/>
				}
			>
				<div className="template-item-main">
					<div className="template-header">
						<span className="setting-item-name">
							{template.name}
						</span>
						{isCustomTemplate(template.id) && (
							<span className="template-custom-badge">
								Custom
							</span>
						)}
					</div>
					<div className="setting-item-description">
						{template.description}:
					</div>
					<div className="template-statuses">
						{template.statuses.map((status, index) => (
							<StatusDisplay
								key={index}
								status={status}
								variant="template"
							/>
						))}
					</div>
				</div>
			</SelectableListItem>
			<div className="template-item-actions">
				{onEdit && (
					<button
						onClick={(e) => {
							e.stopPropagation();
							onEdit(template);
						}}
						title="Edit template"
					>
						<ObsidianIcon name="edit" size={16} />
					</button>
				)}
				{onDelete && (
					<button
						onClick={(e) => {
							e.stopPropagation();
							onDelete(template.id);
						}}
						title="Delete template"
					>
						<ObsidianIcon name="trash" size={16} />
					</button>
				)}
			</div>
		</div>
	);
};
