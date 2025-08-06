import React, { useState, useCallback, useMemo } from "react";
import { NoteStatus } from "../../types/noteStatus";
import { StatusSelector } from "../atoms/StatusSelector";
import { SearchFilter } from "../atoms/SearchFilter";
import { CustomStatusItem } from "./CustomStatusItem";
import { CustomStatusIntegration } from "../../integrations/customStatus/customStatusIntegration";
import { TemplateIntegration } from "../../integrations/templates/templateIntegration";
import { PluginSettings } from "../../types/pluginSettings";

interface TemplateStatusSelectorProps {
	selectedStatuses: NoteStatus[];
	onStatusesChange: (statuses: NoteStatus[]) => void;
	templateId?: string;
	settings: PluginSettings;
}

export const TemplateStatusSelector: React.FC<TemplateStatusSelectorProps> = ({
	selectedStatuses,
	onStatusesChange,
	templateId = "",
	settings,
}) => {
	const [searchFilter, setSearchFilter] = useState("");
	const [isCreatingNew, setIsCreatingNew] = useState(false);
	const [newStatus, setNewStatus] = useState<NoteStatus>({
		name: "",
		icon: "",
		color: "#4CAF50",
		templateId: templateId,
	});

	// Get all available statuses (custom + from other templates)
	const availableStatuses = useMemo(() => {
		const customStatuses = CustomStatusIntegration.getCustomStatuses();
		const allTemplates = TemplateIntegration.getTemplates();
		const templateStatuses = allTemplates
			.filter((t) => t.id !== templateId) // Exclude current template
			.flatMap((t) => t.statuses);

		return [...customStatuses, ...templateStatuses];
	}, [templateId]);

	// Filter statuses based on search
	const filteredStatuses = useMemo(() => {
		if (!searchFilter) return availableStatuses;
		const filter = searchFilter.toLowerCase();
		return availableStatuses.filter(
			(status) =>
				status.name.toLowerCase().includes(filter) ||
				status.description?.toLowerCase().includes(filter) ||
				status.templateId?.toLowerCase().includes(filter),
		);
	}, [availableStatuses, searchFilter]);

	const handleToggleStatus = useCallback(
		(status: NoteStatus, selected: boolean) => {
			if (selected) {
				// Add status with current template ID
				const statusWithTemplateId = {
					...status,
					templateId: templateId,
				};
				onStatusesChange([...selectedStatuses, statusWithTemplateId]);
			} else {
				// Remove status
				const updatedStatuses = selectedStatuses.filter(
					(s) =>
						!(
							s.name === status.name &&
							s.templateId === status.templateId
						),
				);
				onStatusesChange(updatedStatuses);
			}
		},
		[selectedStatuses, onStatusesChange, templateId],
	);

	const handleCreateNew = useCallback(() => {
		setIsCreatingNew(true);
		setNewStatus({
			name: "",
			icon: "",
			color: "#4CAF50",
			templateId: templateId,
		});
	}, [templateId]);

	const handleSaveNewStatus = useCallback(() => {
		const errors = CustomStatusIntegration.validateStatus(newStatus);
		if (errors.length > 0) return;

		// Check if name is unique in selected statuses
		const isUniqueInTemplate = !selectedStatuses.some(
			(s) => s.name.toLowerCase() === newStatus.name.toLowerCase(),
		);

		if (!isUniqueInTemplate) {
			return; // Could show error message
		}

		// Add to selected statuses
		const statusWithTemplateId = {
			...newStatus,
			templateId: templateId,
		};
		onStatusesChange([...selectedStatuses, statusWithTemplateId]);

		setIsCreatingNew(false);
		setNewStatus({
			name: "",
			icon: "",
			color: "#4CAF50",
			templateId: templateId,
		});
	}, [newStatus, selectedStatuses, onStatusesChange, templateId]);

	const handleCancelNewStatus = useCallback(() => {
		setIsCreatingNew(false);
		setNewStatus({
			name: "",
			icon: "",
			color: "#4CAF50",
			templateId: templateId,
		});
	}, [templateId]);

	const handleNewStatusChange = useCallback(
		(column: "name" | "icon" | "color" | "description", value: string) => {
			setNewStatus((prev) => ({
				...prev,
				[column]: value,
			}));
		},
		[],
	);

	const handleRemoveSelectedStatus = useCallback(
		(index: number) => {
			const updatedStatuses = selectedStatuses.filter(
				(_, i) => i !== index,
			);
			onStatusesChange(updatedStatuses);
		},
		[selectedStatuses, onStatusesChange],
	);

	const handleEditSelectedStatus = useCallback(
		(
			index: number,
			column: "name" | "icon" | "color" | "description",
			value: string,
		) => {
			const updatedStatuses = [...selectedStatuses];
			updatedStatuses[index] = {
				...updatedStatuses[index],
				[column]: value,
			};
			onStatusesChange(updatedStatuses);
		},
		[selectedStatuses, onStatusesChange],
	);

	const handleMoveStatusUp = useCallback(
		(index: number) => {
			if (index <= 0) return;
			const updatedStatuses = [...selectedStatuses];
			[updatedStatuses[index - 1], updatedStatuses[index]] = [
				updatedStatuses[index],
				updatedStatuses[index - 1],
			];
			onStatusesChange(updatedStatuses);
		},
		[selectedStatuses, onStatusesChange],
	);

	const handleMoveStatusDown = useCallback(
		(index: number) => {
			if (index >= selectedStatuses.length - 1) return;
			const updatedStatuses = [...selectedStatuses];
			[updatedStatuses[index], updatedStatuses[index + 1]] = [
				updatedStatuses[index + 1],
				updatedStatuses[index],
			];
			onStatusesChange(updatedStatuses);
		},
		[selectedStatuses, onStatusesChange],
	);

	return (
		<div className="template-status-selector">
			<div className="template-status-selector__section">
				<h6 className="template-status-selector__title">
					Select from Existing Statuses
				</h6>
				<p className="template-status-selector__description">
					Choose from custom statuses or statuses from other templates
				</p>

				<SearchFilter
					value={searchFilter}
					onFilterChange={setSearchFilter}
				/>

				{filteredStatuses.length === 0 ? (
					<div className="template-status-selector__empty">
						{searchFilter
							? `No statuses match "${searchFilter}"`
							: "No existing statuses available"}
					</div>
				) : (
					<StatusSelector
						availableStatuses={filteredStatuses}
						currentStatuses={selectedStatuses}
						onToggleStatus={handleToggleStatus}
					/>
				)}
			</div>

			<div className="template-status-selector__divider">
				<span>OR</span>
			</div>

			<div className="template-status-selector__section">
				<div className="template-status-selector__new-header">
					<h6 className="template-status-selector__title">
						Create New Status
					</h6>
					{!isCreatingNew && (
						<button
							className="template-status-selector__create-btn"
							onClick={handleCreateNew}
						>
							+ Create New
						</button>
					)}
				</div>

				{isCreatingNew && (
					<div className="template-status-selector__new-form">
						<CustomStatusItem
							status={newStatus}
							index={0}
							settings={settings}
							onCustomStatusChange={(_, column, value) =>
								handleNewStatusChange(column, value)
							}
							onCustomStatusRemove={() => {}} // Not used
						/>
						<div className="template-status-selector__new-actions">
							<button
								className="mod-cta"
								onClick={handleSaveNewStatus}
								disabled={
									!newStatus.name.trim() ||
									!newStatus.icon.trim()
								}
							>
								Add Status
							</button>
							<button onClick={handleCancelNewStatus}>
								Cancel
							</button>
						</div>
					</div>
				)}
			</div>

			{selectedStatuses.length > 0 && (
				<div className="template-status-selector__section">
					<h6 className="template-status-selector__title">
						Selected Statuses
					</h6>
					<div className="template-status-selector__selected">
						{selectedStatuses.map((status, index) => (
							<CustomStatusItem
								key={`${status.name}-${index}`}
								status={status}
								index={index}
								settings={settings}
								onCustomStatusChange={handleEditSelectedStatus}
								onCustomStatusRemove={
									handleRemoveSelectedStatus
								}
								onMoveUp={handleMoveStatusUp}
								onMoveDown={handleMoveStatusDown}
								canMoveUp={index > 0}
								canMoveDown={
									index < selectedStatuses.length - 1
								}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
};
