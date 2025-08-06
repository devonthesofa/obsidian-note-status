import React from "react";
import { StatusTemplate } from "../../types/pluginSettings";
import { StatusDisplay } from "../atoms/StatusDisplay";

interface UnifiedTemplateItemProps {
	template: StatusTemplate;
	onToggle: (templateId: string, enabled: boolean) => void;
	onEdit: (template: StatusTemplate) => void;
	onDelete: (templateId: string) => void;
	onReset: (templateId: string) => void;
	onDuplicate: (templateId: string) => void;
}

export const UnifiedTemplateItem: React.FC<UnifiedTemplateItemProps> = ({
	template,
	onToggle,
	onEdit,
	onDelete,
	onReset,
	onDuplicate,
}) => {
	const handleToggle = () => {
		onToggle(template.id, !template.isEnabled);
	};

	const handleEdit = () => {
		onEdit(template);
	};

	const handleDelete = () => {
		if (
			confirm(
				`Are you sure you want to delete the template "${template.name}"?`,
			)
		) {
			onDelete(template.id);
		}
	};

	const handleReset = () => {
		if (
			confirm(
				`Reset "${template.name}" to its original state? This will lose any customizations.`,
			)
		) {
			onReset(template.id);
		}
	};

	const handleDuplicate = () => {
		onDuplicate(template.id);
	};

	return (
		<div
			className={`unified-template-item ${template.isEnabled ? "unified-template-item--enabled" : ""}`}
		>
			<div className="unified-template-item__main" onClick={handleToggle}>
				<div className="unified-template-item__checkbox-container">
					<input
						type="checkbox"
						className="unified-template-item__checkbox"
						checked={template.isEnabled || false}
						readOnly
					/>
				</div>

				<div className="unified-template-item__content">
					<div className="unified-template-item__header">
						<span className="unified-template-item__name">
							{template.name}
						</span>
						{template.isPredefined && (
							<span className="unified-template-item__badge">
								Predefined
							</span>
						)}
					</div>

					<div className="unified-template-item__description">
						{template.description}
					</div>

					<div className="unified-template-item__statuses">
						{template.statuses.map((status, index) => (
							<StatusDisplay
								key={index}
								status={status}
								variant="template"
							/>
						))}
					</div>
				</div>
			</div>

			<div className="unified-template-item__actions">
				<button
					className="unified-template-item__action-btn unified-template-item__action-btn--edit"
					onClick={handleEdit}
					aria-label="Edit template"
					title="Edit template"
				>
					✏️
				</button>

				<button
					className="unified-template-item__action-btn unified-template-item__action-btn--duplicate"
					onClick={handleDuplicate}
					aria-label="Duplicate template"
					title="Duplicate template"
				>
					📋
				</button>

				{template.isPredefined && (
					<button
						className="unified-template-item__action-btn unified-template-item__action-btn--reset"
						onClick={handleReset}
						aria-label="Reset to default"
						title="Reset to default"
					>
						🔄
					</button>
				)}

				{!template.isPredefined && (
					<button
						className="unified-template-item__action-btn unified-template-item__action-btn--delete"
						onClick={handleDelete}
						aria-label="Delete template"
						title="Delete template"
					>
						🗑️
					</button>
				)}
			</div>
		</div>
	);
};
