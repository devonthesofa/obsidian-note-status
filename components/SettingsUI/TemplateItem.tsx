import React from "react";
import { StatusTemplate } from "@/types/pluginSettings";
import { StatusDisplay } from "../atoms/StatusDisplay";
import { SelectableListItem } from "../atoms/SelectableListItem";
import { isCustomTemplate } from "@/utils/templateUtils";

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
						className="template-action-btn template-action-btn--edit"
						onClick={(e) => {
							e.stopPropagation();
							onEdit(template);
						}}
						title="Edit template"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
							<path d="m15 5 4 4" />
						</svg>
					</button>
				)}
				{onDelete && (
					<button
						className="template-action-btn template-action-btn--delete"
						onClick={(e) => {
							e.stopPropagation();
							onDelete(template.id);
						}}
						title="Delete template"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M10 11v6" />
							<path d="M14 11v6" />
							<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
							<path d="M3 6h18" />
							<path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
						</svg>
					</button>
				)}
			</div>
		</div>
	);
};
