import React, { memo, useCallback } from "react";
import { NoteStatus } from "@/types/noteStatus";
import { SelectableListItem } from "./SelectableListItem";
import { getStatusTooltip, isStatusSelected } from "@/utils/statusUtils";
import { StatusIconPreview } from "./StatusIconPreview";
import settingsService from "@/core/settingsService";

interface StatusOptionProps {
	status: NoteStatus;
	isSelected: boolean;
	isFocused: boolean;
	onSelect: () => void;
}

export const StatusModalOption: React.FC<StatusOptionProps> = memo(
	({ status, isSelected, isFocused, onSelect }) => {
		const displayName = status.templateId
			? `${status.name} (${status.templateId})`
			: status.name;
		const { fileExplorerIconFrame, fileExplorerIconColorMode } =
			settingsService.settings;
		const iconFrameMode = fileExplorerIconFrame || "never";
		const iconColorMode = fileExplorerIconColorMode || "status";

		return (
			<SelectableListItem
				selected={isSelected}
				focused={isFocused}
				icon={
					<div className="note-status-option__icon-wrapper">
						<StatusIconPreview
							icon={status.icon}
							color={status.color}
							iconFrameMode={iconFrameMode}
							iconColorMode={iconColorMode}
							withWrapper={false}
							compact
						/>
					</div>
				}
				onClick={onSelect}
				className="note-status-option"
				title={
					status.description ? getStatusTooltip(status) : undefined
				}
			>
				<div className="note-status-option__text">
					<span className="note-status-option__name">
						{displayName}
					</span>
					{status.description && (
						<span className="note-status-option__description">
							{status.description}
						</span>
					)}
				</div>
			</SelectableListItem>
		);
	},
);

export interface Props {
	currentStatuses: NoteStatus[];
	availableStatuses: NoteStatus[];
	focusedIndex?: number;
	onToggleStatus: (status: NoteStatus, selected: boolean) => void;
}

export const StatusSelector: React.FC<Props> = ({
	currentStatuses,
	availableStatuses,
	focusedIndex = -1,
	onToggleStatus,
}) => {
	const handleSelectStatus = useCallback(
		async (status: NoteStatus) => {
			const selected = isStatusSelected(status, currentStatuses);
			onToggleStatus(status, !selected);
		},
		[currentStatuses, onToggleStatus],
	);

	return (
		<div
			className="note-status-options"
			style={{
				maxHeight: "300px",
				overflowY: "auto",
				border: "1px solid var(--background-modifier-border)",
				borderRadius: "var(--radius-s)",
				background: "var(--background-primary)",
			}}
		>
			{availableStatuses.map((status, index) => (
				<StatusModalOption
					key={`${status.templateId || "custom"}:${status.name}:${status.description}:${status.color}:${status.icon}`}
					status={status}
					isSelected={isStatusSelected(status, currentStatuses)}
					isFocused={index === focusedIndex}
					onSelect={() => handleSelectStatus(status)}
				/>
			))}
		</div>
	);
};
