import React, { useCallback, useEffect, useMemo, useState } from "react";
import { NoteStatus } from "@/types/noteStatus";
import { SearchFilter } from "../atoms/SearchFilter";
import { StatusSelector } from "../atoms/StatusSelector";
import { SettingItem } from "../SettingsUI/SettingItem";
import { CurrentStatusChips } from "./CurrentStatusChips";
import { useKeyboardNavigation } from "./useKeyboardNavigation";
import { StatusTemplate } from "@/types/pluginSettings";

export interface Props {
	frontmatterTagName: string;
	currentStatuses: NoteStatus[];
	availableStatuses: NoteStatus[];
	templates: StatusTemplate[];
	iconFrameMode: "always" | "never";
	iconColorMode: "status" | "theme";
	onSelectedState: (
		frontmatterTagName: string,
		status: NoteStatus,
		action: "select" | "unselected",
	) => void;
}

export const StatusSelectorGroup: React.FC<Props> = ({
	currentStatuses,
	availableStatuses,
	templates,
	frontmatterTagName,
	iconFrameMode,
	iconColorMode,
	onSelectedState,
}) => {
	const TEMPLATE_ALL_VIEW = "__all__";
	const TEMPLATE_CUSTOM_VIEW = "__custom__";

	const handleRemoveStatus = useCallback(
		(status: NoteStatus) => {
			onSelectedState(frontmatterTagName, status, "unselected");
		},
		[onSelectedState, frontmatterTagName],
	);

	const handleSelectStatus = useCallback(
		(status: NoteStatus) => {
			onSelectedState(frontmatterTagName, status, "select");
		},
		[onSelectedState, frontmatterTagName],
	);

	type TemplateViewOption = {
		id: string;
		label: string;
		statuses: NoteStatus[];
	};

	const templateViewOptions = useMemo<TemplateViewOption[]>(() => {
		const statusesByTemplate = new Map<string, NoteStatus[]>();
		const customStatuses: NoteStatus[] = [];

		availableStatuses.forEach((status) => {
			if (status.templateId) {
				const bucket = statusesByTemplate.get(status.templateId) ?? [];
				bucket.push(status);
				statusesByTemplate.set(status.templateId, bucket);
			} else {
				customStatuses.push(status);
			}
		});

		const templateOrder = templates.map((template) => template.id);
		const templateNameMap = new Map(
			templates.map((template) => [template.id, template.name]),
		);

		const views: TemplateViewOption[] = [
			{
				id: TEMPLATE_ALL_VIEW,
				label: "All",
				statuses: availableStatuses,
			},
		];

		templateOrder.forEach((templateId) => {
			const statuses = statusesByTemplate.get(templateId);
			if (statuses?.length) {
				views.push({
					id: templateId,
					label: templateNameMap.get(templateId) ?? templateId,
					statuses,
				});
				statusesByTemplate.delete(templateId);
			}
		});

		// Include any template-defined statuses that aren't present in the settings order
		statusesByTemplate.forEach((statuses, templateId) => {
			if (statuses.length) {
				views.push({
					id: templateId,
					label: templateNameMap.get(templateId) ?? templateId,
					statuses,
				});
			}
		});

		if (customStatuses.length) {
			views.push({
				id: TEMPLATE_CUSTOM_VIEW,
				label: "Custom",
				statuses: customStatuses,
			});
		}

		return views;
	}, [availableStatuses, templates]);

	const [selectedTemplateId, setSelectedTemplateId] =
		useState<string>(TEMPLATE_ALL_VIEW);

	useEffect(() => {
		const exists = templateViewOptions.some(
			(option) => option.id === selectedTemplateId,
		);
		if (!exists) {
			setSelectedTemplateId(TEMPLATE_ALL_VIEW);
		}
	}, [templateViewOptions, selectedTemplateId]);

	const activeTemplate =
		templateViewOptions.find(
			(option) => option.id === selectedTemplateId,
		) ?? templateViewOptions[0];

	const statusesForView = activeTemplate?.statuses ?? [];

	const {
		focusedIndex,
		searchFilter,
		filteredStatuses,
		containerRef,
		searchRef,
		handleKeyDown,
		setSearchFilter,
	} = useKeyboardNavigation({
		availableStatuses: statusesForView,
		currentStatuses,
		onSelectStatus: handleSelectStatus,
		onRemoveStatus: handleRemoveStatus,
	});

	return (
		<div
			ref={containerRef}
			tabIndex={0}
			onKeyDown={handleKeyDown}
			style={{ outline: "none" }}
		>
			{templateViewOptions.length > 1 && (
				<div
					className="note-status-template-tabs"
					role="tablist"
					aria-label="Status templates"
				>
					{templateViewOptions.map((option) => (
						<button
							type="button"
							role="tab"
							key={option.id}
							className={`note-status-template-tab${
								option.id === selectedTemplateId
									? " is-active"
									: ""
							}`}
							onClick={() => setSelectedTemplateId(option.id)}
							aria-selected={option.id === selectedTemplateId}
						>
							{option.label}
						</button>
					))}
				</div>
			)}

			<SearchFilter
				ref={searchRef}
				value={searchFilter}
				onFilterChange={setSearchFilter}
			/>

			<SettingItem name="Current statuses" vertical>
				{filteredStatuses.length === 0 ? (
					<div
						style={{
							padding: "16px",
							textAlign: "center",
							color: "var(--text-muted)",
							fontStyle: "italic",
						}}
					>
						{searchFilter
							? `No statuses match "${searchFilter}"`
							: "No statuses found"}
					</div>
				) : (
					<StatusSelector
						availableStatuses={filteredStatuses}
						currentStatuses={currentStatuses}
						focusedIndex={focusedIndex}
						iconFrameMode={iconFrameMode}
						iconColorMode={iconColorMode}
						onToggleStatus={(status, selected) =>
							selected
								? handleSelectStatus(status)
								: handleRemoveStatus(status)
						}
					/>
				)}
			</SettingItem>

			<CurrentStatusChips
				currentStatuses={currentStatuses}
				onRemoveStatus={handleRemoveStatus}
			/>
		</div>
	);
};
