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
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
							<path d="m18.5 2.5 4 4L13 16l-4-4L18.5 2.5z" />
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
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<polyline points="3,6 5,6 21,6" />
							<path d="M19,6l-2,14a2,2,0,0,1-2,2H9a2,2,0,0,1-2-2L5,6" />
							<path d="M10,11V17" />
							<path d="M14,11V17" />
							<path d="M9,6V4a2,2,0,0,1,2-2h2a2,2,0,0,1,2,2V6" />
						</svg>
					</button>
				)}
			</div>
		</div>
	);
};
