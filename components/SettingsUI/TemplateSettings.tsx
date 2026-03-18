import React, { useCallback, useState } from "react";
import { PluginSettings, StatusTemplate } from "@/types/pluginSettings";
import { TemplateItem } from "./TemplateItem";
import { TemplateEditorModal } from "./TemplateEditorModal";
import { MarketplaceShareModal } from "./MarketplaceShareModal";
import { MarketplaceBrowseModal } from "./MarketplaceBrowseModal";
import { ObsidianIcon } from "../atoms/ObsidianIcon";
import {
	generateTemplateId,
	isTemplateNameUnique,
} from "@/utils/templateUtils";

interface TemplateSettingsProps {
	settings: PluginSettings;
	onChange: (key: keyof PluginSettings, value: unknown) => void;
}

export const TemplateSettings: React.FC<TemplateSettingsProps> = ({
	settings,
	onChange,
}) => {
	const [showEditor, setShowEditor] = useState(false);
	const [showShare, setShowShare] = useState(false);
	const [showMarketplace, setShowMarketplace] = useState(false);
	const [editingTemplate, setEditingTemplate] = useState<
		StatusTemplate | undefined
	>();
	const [sharingTemplate, setSharingTemplate] = useState<
		StatusTemplate | undefined
	>();

	const handleTemplateToggle = useCallback(
		(templateId: string, enabled: boolean) => {
			let newEnabledTemplates = [...(settings.enabledTemplates || [])];
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

	const handleShareTemplate = useCallback((template: StatusTemplate) => {
		setSharingTemplate(template);
		setShowShare(true);
	}, []);

	const handleInstallTemplate = useCallback(
		(template: StatusTemplate) => {
			if (!isTemplateNameUnique(template.name, undefined)) {
				alert(
					`A template with the name "${template.name}" is already installed.`,
				);
				return;
			}
			const newId = generateTemplateId(template.name, settings.templates);
			const installedTemplate: StatusTemplate = {
				...template,
				id: newId,
				statuses: template.statuses.map((s) => ({
					...s,
					templateId: newId,
				})),
			};

			onChange("templates", [...settings.templates, installedTemplate]);
			handleTemplateToggle(newId, true);
		},
		[settings.templates, onChange, handleTemplateToggle],
	);

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
				const uniqueId = generateTemplateId(
					template.name,
					settings.templates,
				);
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

	const handleCancelEditor = useCallback(() => {
		setShowEditor(false);
		setEditingTemplate(undefined);
	}, []);

	const handleCancelShare = useCallback(() => {
		setShowShare(false);
		setSharingTemplate(undefined);
	}, []);

	const handleOpenMarketplace = useCallback(() => {
		setShowMarketplace(true);
	}, []);

	const handleCloseMarketplace = useCallback(() => {
		setShowMarketplace(false);
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

	if (showShare && sharingTemplate) {
		return (
			<div>
				<h3>Status templates</h3>
				<MarketplaceShareModal
					template={sharingTemplate}
					onClose={handleCancelShare}
				/>
			</div>
		);
	}

	if (showMarketplace) {
		return (
			<div>
				<h3>Status templates</h3>
				<MarketplaceBrowseModal
					installedTemplates={settings.templates}
					onInstall={handleInstallTemplate}
					onClose={handleCloseMarketplace}
				/>
			</div>
		);
	}

	return (
		<div>
			<h3>Status templates</h3>
			<p>
				Browse the marketplace to find common status workflows or create
				your own custom templates.
			</p>

			{/* Custom Templates Section */}
			<div className="template-section">
				<div className="template-settings-actions">
					<button
						className="mod-cta marketplace-browse-btn"
						onClick={handleOpenMarketplace}
					>
						<ObsidianIcon name="globe" size={16} />
						Browse Marketplace
					</button>
					<button
						className="template-create-btn"
						onClick={handleCreateTemplate}
					>
						+ Create Template
					</button>
				</div>
				<div className="template-list">
					{(settings.templates || []).map((template) => (
						<TemplateItem
							key={template.id}
							template={template}
							isEnabled={(
								settings.enabledTemplates || []
							).includes(template.id)}
							onToggle={handleTemplateToggle}
							onEdit={handleEditTemplate}
							onDelete={handleDeleteTemplate}
							onShare={handleShareTemplate}
						/>
					))}
				</div>
			</div>
		</div>
	);
};
