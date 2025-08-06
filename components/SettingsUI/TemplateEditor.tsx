import React, { useState, useEffect } from "react";
import { StatusTemplate, PluginSettings } from "../../types/pluginSettings";
import { NoteStatus } from "../../types/noteStatus";
import { Input } from "../atoms/Input";
import { TemplateStatusSelector } from "./TemplateStatusSelector";

interface TemplateEditorProps {
	template: StatusTemplate | null;
	onSave: (template: StatusTemplate) => void | Promise<void>;
	onCancel: () => void;
	existingTemplateNames: string[];
	settings: PluginSettings;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
	template,
	onSave,
	onCancel,
	existingTemplateNames,
	settings,
}) => {
	const [templateName, setTemplateName] = useState(template?.name || "");
	const [templateDescription, setTemplateDescription] = useState(
		template?.description || "",
	);
	const [statuses, setStatuses] = useState<NoteStatus[]>(
		template?.statuses || [],
	);
	const [errors, setErrors] = useState<string[]>([]);

	useEffect(() => {
		if (template) {
			setTemplateName(template.name);
			setTemplateDescription(template.description);
			setStatuses(template.statuses);
		}
	}, [template]);

	const validateForm = (): boolean => {
		const newErrors: string[] = [];

		if (!templateName.trim()) {
			newErrors.push("Template name is required");
		} else if (
			existingTemplateNames.includes(templateName.trim().toLowerCase())
		) {
			newErrors.push("Template name must be unique");
		}

		if (!templateDescription.trim()) {
			newErrors.push("Template description is required");
		}

		if (statuses.length === 0) {
			newErrors.push("At least one status is required");
		}

		const statusNames = statuses.map((s) => s.name.toLowerCase());
		const duplicateNames = statusNames.filter(
			(name, index) => statusNames.indexOf(name) !== index,
		);
		if (duplicateNames.length > 0) {
			newErrors.push("Status names must be unique within template");
		}

		setErrors(newErrors);
		return newErrors.length === 0;
	};

	const handleSave = () => {
		if (!validateForm()) return;

		const templateToSave: StatusTemplate = {
			id: template?.id || "", // Will be generated in integration
			name: templateName.trim(),
			description: templateDescription.trim(),
			statuses: statuses,
		};

		onSave(templateToSave);
	};

	const handleStatusesChange = (newStatuses: NoteStatus[]) => {
		setStatuses(newStatuses);
	};

	return (
		<div className="template-editor">
			<div className="template-editor__header">
				<h4>{template ? "Edit Template" : "Create New Template"}</h4>
			</div>

			{errors.length > 0 && (
				<div className="template-editor__errors">
					{errors.map((error, index) => (
						<div key={index} className="template-editor__error">
							{error}
						</div>
					))}
				</div>
			)}

			<div className="template-editor__basic-info">
				<div className="template-editor__field">
					<label className="template-editor__label">
						Template Name
					</label>
					<Input
						variant="text"
						value={templateName}
						onChange={setTemplateName}
						placeholder="Enter template name"
						className="template-editor__input"
					/>
				</div>

				<div className="template-editor__field">
					<label className="template-editor__label">
						Description
					</label>
					<textarea
						value={templateDescription}
						onChange={(e) => setTemplateDescription(e.target.value)}
						placeholder="Describe this template's purpose"
						className="template-editor__textarea"
						rows={2}
					/>
				</div>
			</div>

			<div className="template-editor__statuses-section">
				<h5 className="template-editor__section-title">
					Template Statuses
				</h5>
				<p className="template-editor__section-description">
					Select existing statuses or create new ones for this
					template
				</p>

				<TemplateStatusSelector
					selectedStatuses={statuses}
					onStatusesChange={handleStatusesChange}
					templateId={template?.id}
					settings={settings}
				/>
			</div>

			<div className="template-editor__actions">
				<button onClick={handleSave} className="mod-cta">
					{template ? "Update Template" : "Create Template"}
				</button>
				<button onClick={onCancel}>Cancel</button>
			</div>
		</div>
	);
};
