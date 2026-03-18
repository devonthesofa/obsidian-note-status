import React, { useMemo } from "react";
import { StatusTemplate } from "@/types/pluginSettings";
import { StatusDisplay } from "../atoms/StatusDisplay";
import { SelectableListItem } from "../atoms/SelectableListItem";
import { isCustomTemplate, isTemplateModified } from "@/utils/templateUtils";
import { ObsidianIcon } from "../atoms/ObsidianIcon";

interface TemplateItemProps {
	template: StatusTemplate;
	isEnabled: boolean;
	onToggle: (templateId: string, enabled: boolean) => void;
	onEdit?: (template: StatusTemplate) => void;
	onDelete?: (templateId: string) => void;
	onShare?: (template: StatusTemplate) => void;
}

export const TemplateItem: React.FC<TemplateItemProps> = ({
	template,
	isEnabled,
	onToggle,
	onEdit,
	onDelete,
	onShare,
}) => {
	const isCustom = useMemo(() => isCustomTemplate(template), [template]);
	const isModified = useMemo(
		() => !isCustom && isTemplateModified(template),
		[isCustom, template],
	);

	const handleClick = (e: React.MouseEvent) => {
		// Don't toggle if clicking action buttons
		if ((e.target as HTMLElement).closest(".template-item-actions")) {
			return;
		}
		onToggle(template.id, !isEnabled);
	};

	return (
		<div className={`template-item ${isEnabled ? "enabled" : "disabled"}`}>
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
						<div className="template-badges">
							{isEnabled ? (
								<span className="template-badge badge-success">
									Active
								</span>
							) : (
								<span className="template-badge badge-muted">
									Inactive
								</span>
							)}
							{isCustom ? (
								<span className="template-badge badge-accent">
									Custom
								</span>
							) : (
								<span className="template-badge badge-info">
									Marketplace
								</span>
							)}
							{isModified && (
								<span className="template-badge badge-warning">
									Modified
								</span>
							)}
						</div>
					</div>
					<div className="setting-item-description">
						{template.description}
						{template.authorGithub && (
							<div className="template-author-info">
								By{" "}
								<a
									href={`https://github.com/${template.authorGithub}`}
									target="_blank"
									rel="noopener noreferrer"
									onClick={(e) => e.stopPropagation()}
								>
									@{template.authorGithub}
								</a>
							</div>
						)}
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
				{isCustom && onShare && (
					<button
						onClick={(e) => {
							e.stopPropagation();
							onShare(template);
						}}
						title="Submit to Marketplace"
						className="template-marketplace-btn"
					>
						<ObsidianIcon name="share" size={16} />
					</button>
				)}
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
