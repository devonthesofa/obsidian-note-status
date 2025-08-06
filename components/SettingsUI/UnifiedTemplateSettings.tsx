import React, { useState, useCallback } from "react";
import { PluginSettings, StatusTemplate } from "../../types/pluginSettings";
import { TemplateIntegration } from "../../integrations/templates/templateIntegration";
import { UnifiedTemplateItem } from "./UnifiedTemplateItem";
import { TemplateEditor } from "./TemplateEditor";

interface UnifiedTemplateSettingsProps {
	settings: PluginSettings;
	onChange: (key: keyof PluginSettings, value: unknown) => void;
}

export const UnifiedTemplateSettings: React.FC<
	UnifiedTemplateSettingsProps
> = ({ settings, onChange }) => {
	const [isCreating, setIsCreating] = useState(false);
	const [editingTemplate, setEditingTemplate] =
		useState<StatusTemplate | null>(null);

	const handleCreateTemplate = useCallback(() => {
		setIsCreating(true);
	}, []);

	const handleEditTemplate = useCallback((template: StatusTemplate) => {
		setEditingTemplate(template);
	}, []);

	const handleDeleteTemplate = useCallback(
		(templateId: string) => {
			const success = TemplateIntegration.deleteTemplate(templateId);
			if (success) {
				// Trigger settings refresh
				onChange("templates", TemplateIntegration.getTemplates());
			}
		},
		[onChange],
	);

	const handleResetTemplate = useCallback(
		(templateId: string) => {
			const success =
				TemplateIntegration.resetPredefinedTemplate(templateId);
			if (success) {
				// Trigger settings refresh
				onChange("templates", TemplateIntegration.getTemplates());
			}
		},
		[onChange],
	);

	const handleDuplicateTemplate = useCallback(
		(templateId: string) => {
			const newTemplate =
				TemplateIntegration.duplicateTemplate(templateId);
			if (newTemplate) {
				// Trigger settings refresh
				onChange("templates", TemplateIntegration.getTemplates());
			}
		},
		[onChange],
	);

	const handleToggleTemplate = useCallback(
		(templateId: string, isEnabled: boolean) => {
			TemplateIntegration.toggleTemplate(templateId, isEnabled);
			// Trigger settings refresh
			onChange("templates", TemplateIntegration.getTemplates());
		},
		[onChange],
	);

	const handleSaveTemplate = useCallback(
		(template: StatusTemplate) => {
			if (editingTemplate) {
				// Update existing template
				const success = TemplateIntegration.updateTemplate(
					editingTemplate.id,
					template,
				);
				if (success) {
					onChange("templates", TemplateIntegration.getTemplates());
				}
			} else {
				// Create new template
				TemplateIntegration.createTemplate(
					template.name,
					template.description,
					template.statuses,
				);
				onChange("templates", TemplateIntegration.getTemplates());
			}

			setIsCreating(false);
			setEditingTemplate(null);
		},
		[editingTemplate, onChange],
	);

	const handleCancel = useCallback(() => {
		setIsCreating(false);
		setEditingTemplate(null);
	}, []);

	const predefinedTemplates = TemplateIntegration.getPredefinedTemplates();
	const customTemplates = TemplateIntegration.getCustomTemplates();

	return (
		<div className="unified-template-settings">
			<div className="setting-item-info">
				<div className="setting-item-name">Template Management</div>
				<div className="setting-item-description">
					Manage predefined and custom status templates. You can edit,
					enable/disable, and reset predefined templates.
				</div>
			</div>

			{(isCreating || editingTemplate) && (
				<TemplateEditor
					template={editingTemplate}
					onSave={handleSaveTemplate}
					onCancel={handleCancel}
					existingTemplateNames={(settings.templates || [])
						.filter((t) => t.id !== editingTemplate?.id)
						.map((t) => t.name.toLowerCase())}
					settings={settings}
				/>
			)}

			{!isCreating && !editingTemplate && (
				<>
					<div className="template-actions-bar">
						<button
							className="mod-cta"
							onClick={handleCreateTemplate}
						>
							Create New Template
						</button>
					</div>

					{predefinedTemplates.length > 0 && (
						<div className="template-section">
							<h4 className="template-section__title">
								Predefined Templates
							</h4>
							<p className="template-section__description">
								Built-in templates that can be customized,
								enabled/disabled, or reset to defaults.
							</p>
							<div className="template-list">
								{predefinedTemplates.map((template) => (
									<UnifiedTemplateItem
										key={template.id}
										template={template}
										onToggle={handleToggleTemplate}
										onEdit={handleEditTemplate}
										onDelete={handleDeleteTemplate}
										onReset={handleResetTemplate}
										onDuplicate={handleDuplicateTemplate}
									/>
								))}
							</div>
						</div>
					)}

					{customTemplates.length > 0 && (
						<div className="template-section">
							<h4 className="template-section__title">
								Custom Templates
							</h4>
							<p className="template-section__description">
								Your custom templates that you've created.
							</p>
							<div className="template-list">
								{customTemplates.map((template) => (
									<UnifiedTemplateItem
										key={template.id}
										template={template}
										onToggle={handleToggleTemplate}
										onEdit={handleEditTemplate}
										onDelete={handleDeleteTemplate}
										onReset={handleResetTemplate}
										onDuplicate={handleDuplicateTemplate}
									/>
								))}
							</div>
						</div>
					)}

					{customTemplates.length === 0 && (
						<div className="template-section">
							<div className="template-list--empty">
								<p>No custom templates created yet.</p>
								<p>
									Click "Create New Template" to get started.
								</p>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	);
};
