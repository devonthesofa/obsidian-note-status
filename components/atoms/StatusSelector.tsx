import React, { memo, useCallback } from "react";
import { NoteStatus } from "@/types/noteStatus";
import { SelectableListItem } from "./SelectableListItem";

interface StatusOptionProps {
	status: NoteStatus;
	isSelected: boolean;
	isFocused: boolean;
	onSelect: () => void;
}

export const StatusModalOption: React.FC<StatusOptionProps> = memo(
	({ status, isSelected, isFocused, onSelect }) => {
		return (
			<SelectableListItem
				selected={isSelected}
				focused={isFocused}
				icon={status.icon}
				onClick={onSelect}
				className="note-status-option"
				title={
					status.description
						? `${status.name} - ${status.description}`
						: undefined
				}
			>
				{status.name}
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
			const selected =
				currentStatuses.findIndex((s) => s.name === status.name) !== -1;
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
					key={`${status.name}${status.description}${status.color}${status.icon}`}
					status={status}
					isSelected={
						currentStatuses.findIndex(
							(s) => s.name === status.name,
						) !== -1
					}
					isFocused={index === focusedIndex}
					onSelect={() => handleSelectStatus(status)}
				/>
			))}
		</div>
	);
};
