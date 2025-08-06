import React, { useCallback, useState } from "react";
import { PluginSettings, StatusTemplate } from "@/types/pluginSettings";
import { TemplateItem } from "./TemplateItem";
import { TemplateEditorModal } from "./TemplateEditorModal";
import {
	generateTemplateId,
	isTemplateNameUnique,
} from "@/utils/templateUtils";

interface TemplateSettingsProps {
	settings: PluginSettings;
	onChange: (key: keyof PluginSettings, value: unknown) => void;
	templates: StatusTemplate[];
}

export const TemplateSettings: React.FC<TemplateSettingsProps> = ({
	settings,
	onChange,
}) => {
	const [showEditor, setShowEditor] = useState(false);
	const [editingTemplate, setEditingTemplate] = useState<
		StatusTemplate | undefined
	>();

	const handleTemplateToggle = useCallback(
		(templateId: string, enabled: boolean) => {
			let newEnabledTemplates = [...settings.enabledTemplates];
			if (enabled) {
				if (!newEnabledTemplates.includes(templateId)) {
					newEnabledTemplates.push(templateId);
				}
			} else {
				newEnabledTemplates = newEnabledTemplates.filter(
					(id: string) => id !== templateId,
				);
			}
			onChange("enabledTemplates", newEnabledTemplates);
		},
		[onChange, settings.enabledTemplates],
	);

	const handleCreateTemplate = useCallback(() => {
		setEditingTemplate(undefined);
		setShowEditor(true);
	}, []);

	const handleEditTemplate = useCallback((template: StatusTemplate) => {
		setEditingTemplate(template);
		setShowEditor(true);
	}, []);

	const handleSaveTemplate = useCallback(
		(template: StatusTemplate) => {
			// Validate name uniqueness
			if (!isTemplateNameUnique(template.name, editingTemplate?.id)) {
				alert(
					"A template with this name already exists. Please choose a different name.",
				);
				return;
			}

			let finalTemplate = template;

			if (editingTemplate) {
				// Update existing template - keep same ID
				finalTemplate = { ...template, id: editingTemplate.id };
				const updatedTemplates = settings.templates.map((t) =>
					t.id === editingTemplate.id ? finalTemplate : t,
				);
				onChange("templates", updatedTemplates);
			} else {
				// Add new template - generate unique ID
				const uniqueId = generateTemplateId(template.name);
				finalTemplate = { ...template, id: uniqueId };

				// Update statuses with the final template ID
				finalTemplate.statuses = finalTemplate.statuses.map(
					(status) => ({
						...status,
						templateId: uniqueId,
					}),
				);

				onChange("templates", [...settings.templates, finalTemplate]);
				// Auto-enable new templates
				handleTemplateToggle(uniqueId, true);
			}

			setShowEditor(false);
			setEditingTemplate(undefined);
		},
		[editingTemplate, settings, onChange, handleTemplateToggle],
	);

	const handleDeleteTemplate = useCallback(
		(templateId: string) => {
			// Show confirmation
			const confirmed = confirm(
				"Are you sure you want to delete this template? This action cannot be undone.",
			);
			if (!confirmed) return;

			// Remove from custom templates
			const updatedTemplates = (settings.templates || []).filter(
				(t) => t.id !== templateId,
			);
			onChange("templates", updatedTemplates);

			// Remove from enabled templates
			const updatedEnabled = settings.enabledTemplates.filter(
				(id) => id !== templateId,
			);
			onChange("enabledTemplates", updatedEnabled);
		},
		[settings.templates, settings.enabledTemplates, onChange],
	);

	const handleResetToDefaults = useCallback(() => {
		const confirmed = confirm(
			"Reset to default templates? This will:\n" +
				"• Remove all custom templates\n" +
				"• Reset enabled templates to defaults\n" +
				"This action cannot be undone.",
		);
		if (!confirmed) return;

		onChange("templates", []);
		onChange("enabledTemplates", ["colorful"]);
	}, [onChange]);

	const handleCancelEditor = useCallback(() => {
		setShowEditor(false);
		setEditingTemplate(undefined);
	}, []);

	if (showEditor) {
		return (
			<div>
				<h3>Status templates</h3>
				<TemplateEditorModal
					template={editingTemplate}
					onSave={handleSaveTemplate}
					onCancel={handleCancelEditor}
				/>
			</div>
		);
	}

	return (
		<div>
			<h3>Status templates</h3>
			<p>
				Enable predefined templates to quickly add common status
				workflows, or create your own custom templates.
			</p>

			<div className="template-settings-actions">
				<button
					className="mod-cta template-create-btn"
					onClick={handleCreateTemplate}
				>
					+ Create Template
				</button>
				<button
					className="template-reset-btn"
					onClick={handleResetToDefaults}
				>
					🔄 Reset to Defaults
				</button>
			</div>

			{/* Custom Templates Section */}
			<div className="template-section">
				<h4 className="template-section-title">
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
					>
						<path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34" />
						<polygon points="18,2 22,6 12,16 8,16 8,12 18,2" />
					</svg>
					Custom Templates
				</h4>
				<div className="template-list">
					{settings.templates.map((template) => (
						<TemplateItem
							key={template.id}
							template={template}
							isEnabled={settings.enabledTemplates.includes(
								template.id,
							)}
							onToggle={handleTemplateToggle}
							onEdit={handleEditTemplate}
							onDelete={handleDeleteTemplate}
						/>
					))}
				</div>
			</div>
		</div>
	);
};
