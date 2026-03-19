import React, { useState, useCallback, useMemo } from "react";
import { StatusTemplate } from "@/types/pluginSettings";
import { NoteStatus } from "@/types/noteStatus";
import { Input } from "@/components/atoms/Input";
import { SettingItem } from "./SettingItem";
import { CustomStatusItem } from "./CustomStatusItem";
import { isCustomTemplate } from "@/utils/templateUtils";
import settingsService from "@/core/settingsService";

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
	const isCustom = useMemo(
		() => (template ? isCustomTemplate(template) : true),
		[template],
	);
	const [name, setName] = useState(template?.name || "");
	const [id, setId] = useState(template?.id || "");
	const [isIdTouched, setIsIdTouched] = useState(!!template?.id);
	const [isIdUnlocked, setIsIdUnlocked] = useState(false);
	const [isAuthorUnlocked, setIsAuthorUnlocked] = useState(false);
	const [description, setDescription] = useState(template?.description || "");
	const [authorGithub, setAuthorGithub] = useState(
		template?.authorGithub || "",
	);
	const [statuses, setStatuses] = useState<NoteStatus[]>(
		template?.statuses || [
			{
				name: "",
				icon: "",
				lucideIcon: "",
				color: "#888888",
				templateId: template?.id || "",
			},
		],
	);

	const isEditing = !!template;
	const isIdUnique =
		isEditing && id === template?.id
			? true
			: !settingsService.settings.templates.some(
					(t) => t.id === id.trim(),
				);

	const isValid =
		name.trim().length > 0 &&
		id.trim().length > 0 &&
		isIdUnique &&
		description.trim().length > 0 &&
		statuses.some((s) => s.name.trim().length > 0);

	const handleSave = useCallback(() => {
		if (!isValid) return;

		const templateId = id.trim();
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
			authorGithub: authorGithub.trim() || undefined,
			statuses: statusesWithTemplateId,
		};

		onSave(savedTemplate);
	}, [id, name, description, authorGithub, statuses, isValid, onSave]);

	const handleNameChange = useCallback(
		(val: string) => {
			setName(val);
			if (!isIdTouched && !isEditing) {
				setId(val.toLowerCase().replace(/[^a-z0-9]/g, "-"));
			}
		},
		[isIdTouched, isEditing],
	);

	const handleIdChange = useCallback((val: string) => {
		setId(val.toLowerCase().replace(/[^a-z0-9-]/g, ""));
		setIsIdTouched(true);
	}, []);

	const handleAddStatus = useCallback(() => {
		setStatuses((prev) => [
			...prev,
			{
				name: "",
				icon: "",
				lucideIcon: "",
				color: "#888888",
				templateId: template?.id || "",
			},
		]);
	}, [template?.id]);

	const handleStatusChange = useCallback(
		(
			index: number,
			column: "name" | "icon" | "color" | "description" | "lucideIcon",
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
						onChange={handleNameChange}
						placeholder="e.g. Project Workflow"
					/>
				</SettingItem>

				<SettingItem
					name="Template ID"
					description={
						"A unique identifier for your template (used in the frontmatter settings). Cannot contain spaces." +
						(!isIdUnique && id.trim().length > 0
							? " (This ID is already taken!)"
							: "") +
						(isEditing && !isIdUnlocked
							? " Warning: Changing this ID will detach it from existing notes using it."
							: "")
					}
				>
					<div
						style={{
							display: "flex",
							gap: "8px",
							alignItems: "center",
							width: "100%",
						}}
					>
						<Input
							variant="text"
							value={id}
							onChange={handleIdChange}
							placeholder="e.g. project-workflow"
							disabled={isEditing && !isIdUnlocked}
						/>
						{isEditing && !isIdUnlocked && (
							<button onClick={() => setIsIdUnlocked(true)}>
								Unlock
							</button>
						)}
					</div>
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
					name="Author GitHub Username (Optional)"
					description={
						isCustom
							? "Your GitHub username for attribution"
							: "Original author of the marketplace template"
					}
				>
					<div
						style={{
							display: "flex",
							gap: "8px",
							alignItems: "center",
							width: "100%",
						}}
					>
						<Input
							variant="text"
							value={authorGithub}
							onChange={setAuthorGithub}
							placeholder="e.g. janedoe"
							disabled={!isCustom && !isAuthorUnlocked}
						/>
						{!isCustom && !isAuthorUnlocked && (
							<button onClick={() => setIsAuthorUnlocked(true)}>
								Unlock
							</button>
						)}
					</div>
				</SettingItem>

				<SettingItem
					name="Statuses"
					description="Define the statuses included in this template, including emojis and optional Lucide icons"
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
