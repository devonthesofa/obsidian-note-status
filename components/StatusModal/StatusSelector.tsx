import React from "react";
import { NoteStatus } from "@/types/noteStatus";
import { StatusModalOption } from "./StatusModalOption";

export interface Props {
	currentStatuses: NoteStatus[];
	availableStatuses: NoteStatus[];
	onToggleStatus: (status: NoteStatus, selected: boolean) => void;
}

export const StatusSelector: React.FC<Props> = ({
	currentStatuses,
	availableStatuses,
	onToggleStatus,
}) => {
	const handleSelectStatus = async (status: NoteStatus) => {
		const selected =
			currentStatuses.findIndex((s) => s.name === status.name) !== -1;
		onToggleStatus(status, !selected);
	};

	// TODO: The StatusSelector must be splitted by its template
	// FIXME: fix line 21
	return (
		<div className="setting-item">
			<div className="setting-item-info">
				<div className="setting-item-name">Available statuses</div>
			</div>
			<div className="setting-item-control">
				<div
					className="note-status-options"
					style={{
						maxHeight: "300px",
						overflowY: "auto",
						border: "1px solid var(--background-modifier-border)",
						borderRadius: "var(--radius-s)",
						background: "var(--background-primary)",
						width: "300px",
					}}
				>
					{availableStatuses.map((status) => (
						<StatusModalOption
							key={`${status.name}${status.description}${status.color}${status.icon}`}
							status={status}
							isSelected={
								currentStatuses.findIndex(
									(s) => s.name === status.name,
								) !== -1
							}
							onSelect={() => handleSelectStatus(status)}
						/>
					))}
				</div>
			</div>
		</div>
	);
};
