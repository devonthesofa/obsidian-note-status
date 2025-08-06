import React, { useState, useCallback } from "react";
import { StatusTemplate } from "@/types/pluginSettings";
import { NoteStatus } from "@/types/noteStatus";
import { Input } from "@/components/atoms/Input";
import { SettingItem } from "./SettingItem";
import { CustomStatusItem } from "./CustomStatusItem";

interface TemplateEditorModalProps {
	template?: StatusTemplate;
	onSave: (template: StatusTemplate) => void;
	onCancel: () => void;
}

export const TemplateEditorModal: React.FC<TemplateEditorModalProps> = ({
	template,
	onSave,
	onCancel,
}) => {
	const [name, setName] = useState(template?.name || "");
	const [description, setDescription] = useState(template?.description || "");
	const [statuses, setStatuses] = useState<NoteStatus[]>(
		template?.statuses || [
			{
				name: "",
				icon: "",
				color: "#888888",
				templateId: template?.id || "",
			},
		],
	);

	const isEditing = !!template;
	const isValid =
		name.trim().length > 0 &&
		description.trim().length > 0 &&
		statuses.some((s) => s.name.trim().length > 0);

	const handleSave = useCallback(() => {
		if (!isValid) return;

		const templateId = template?.id || `custom-${Date.now()}`;
		const validStatuses = statuses.filter((s) => s.name.trim().length > 0);

		// Update templateId for all statuses
		const statusesWithTemplateId = validStatuses.map((s) => ({
			...s,
			templateId,
		}));

		const savedTemplate: StatusTemplate = {
			id: templateId,
			name: name.trim(),
			description: description.trim(),
			statuses: statusesWithTemplateId,
			isCustom: true,
		};

		onSave(savedTemplate);
	}, [name, description, statuses, template, isValid, onSave]);

	const handleAddStatus = useCallback(() => {
		setStatuses((prev) => [
			...prev,
			{
				name: "",
				icon: "",
				color: "#888888",
				templateId: template?.id || "",
			},
		]);
	}, [template?.id]);

	const handleStatusChange = useCallback(
		(
			index: number,
			column: "name" | "icon" | "color" | "description",
			value: string,
		) => {
			setStatuses((prev) =>
				prev.map((status, i) =>
					i === index ? { ...status, [column]: value } : status,
				),
			);
		},
		[],
	);

	const handleStatusRemove = useCallback((index: number) => {
		setStatuses((prev) => prev.filter((_, i) => i !== index));
	}, []);

	const handleMoveUp = useCallback((index: number) => {
		if (index <= 0) return;
		setStatuses((prev) => {
			const newStatuses = [...prev];
			[newStatuses[index - 1], newStatuses[index]] = [
				newStatuses[index],
				newStatuses[index - 1],
			];
			return newStatuses;
		});
	}, []);

	const handleMoveDown = useCallback((index: number) => {
		setStatuses((prev) => {
			if (index >= prev.length - 1) return prev;
			const newStatuses = [...prev];
			[newStatuses[index], newStatuses[index + 1]] = [
				newStatuses[index + 1],
				newStatuses[index],
			];
			return newStatuses;
		});
	}, []);

	return (
		<div className="template-editor-modal">
			<div className="template-editor-modal__header">
				<h2>{isEditing ? "Edit Template" : "Create New Template"}</h2>
			</div>

			<div className="template-editor-modal__content">
				<SettingItem
					name="Template Name"
					description="A unique name for your template"
				>
					<Input
						variant="text"
						value={name}
						onChange={setName}
						placeholder="e.g. Project Workflow"
					/>
				</SettingItem>

				<SettingItem
					name="Description"
					description="Brief description of the template's purpose"
				>
					<Input
						variant="text"
						value={description}
						onChange={setDescription}
						placeholder="e.g. Status workflow for project management"
					/>
				</SettingItem>

				<SettingItem
					name="Statuses"
					description="Define the statuses included in this template"
					vertical
				>
					<div className="template-editor-statuses">
						{statuses.map((status, index) => (
							<CustomStatusItem
								key={index}
								status={status}
								index={index}
								onCustomStatusChange={handleStatusChange}
								onCustomStatusRemove={handleStatusRemove}
								onMoveUp={handleMoveUp}
								onMoveDown={handleMoveDown}
								canMoveUp={index > 0}
								canMoveDown={index < statuses.length - 1}
							/>
						))}

						<button
							className="mod-cta template-editor-add-status"
							onClick={handleAddStatus}
						>
							+ Add Status
						</button>
					</div>
				</SettingItem>
			</div>

			<div className="template-editor-modal__actions">
				<button
					className="mod-cta"
					onClick={handleSave}
					disabled={!isValid}
				>
					{isEditing ? "Save Changes" : "Create Template"}
				</button>
				<button onClick={onCancel}>Cancel</button>
			</div>
		</div>
	);
};
