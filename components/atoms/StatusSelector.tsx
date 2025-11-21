import React, { memo, useCallback } from "react";
import { NoteStatus } from "@/types/noteStatus";
import { SelectableListItem } from "./SelectableListItem";
import { getStatusTooltip, isStatusSelected } from "@/utils/statusUtils";
import { StatusIconPreview } from "./StatusIconPreview";
import { StatusIcon } from "./StatusIcon";

interface StatusOptionProps {
	status: NoteStatus;
	isSelected: boolean;
	isFocused: boolean;
	onSelect: () => void;
	iconFrameMode: "always" | "never";
	iconColorMode: "status" | "theme";
}

export const StatusModalOption: React.FC<StatusOptionProps> = memo(
	({
		status,
		isSelected,
		isFocused,
		onSelect,
		iconFrameMode,
		iconColorMode,
	}) => {
		const displayName = status.templateId
			? `${status.name} (${status.templateId})`
			: status.name;

		return (
			<SelectableListItem
				selected={isSelected}
				focused={isFocused}
				icon={
					<div className="note-status-option__icon-wrapper">
						<StatusIconPreview
							icon={
								<StatusIcon
									icon={status.icon}
									lucideIcon={status.lucideIcon}
									size={13}
								/>
							}
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
	iconFrameMode?: "always" | "never";
	iconColorMode?: "status" | "theme";
}

export const StatusSelector: React.FC<Props> = ({
	currentStatuses,
	availableStatuses,
	focusedIndex = -1,
	onToggleStatus,
	iconFrameMode = "never",
	iconColorMode = "status",
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
					key={`${status.templateId || "custom"}:${status.name}:${status.description}:${status.color}:${status.icon}:${status.lucideIcon ?? ""}`}
					status={status}
					isSelected={isStatusSelected(status, currentStatuses)}
					isFocused={index === focusedIndex}
					onSelect={() => handleSelectStatus(status)}
					iconFrameMode={iconFrameMode}
					iconColorMode={iconColorMode}
				/>
			))}
		</div>
	);
};
