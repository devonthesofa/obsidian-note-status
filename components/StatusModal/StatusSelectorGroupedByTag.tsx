import React, { useState } from "react";
import { NoteStatus } from "@/types/noteStatus";
import { StatusModalChip } from "./StatusModalChip";
import { SearchFilter } from "../atoms/SearchFilter";
import { StatusSelector } from "./StatusSelector";

export interface Props {
	frontmatterTagName: string;
	currentStatuses: NoteStatus[];
	availableStatuses: NoteStatus[];
	onSelectedState: (
		frontmatterTagName: string,
		status: NoteStatus,
		action: "select" | "unselected",
	) => void;
}

export const StatusSelectorGroupedByTag: React.FC<Props> = ({
	currentStatuses,
	availableStatuses,
	frontmatterTagName,
	onSelectedState,
}) => {
	const [searchFilter, setSearchFilter] = useState("");

	const filteredStatuses = searchFilter
		? availableStatuses.filter((status) =>
				status.name.toLowerCase().includes(searchFilter.toLowerCase()),
			)
		: availableStatuses;

	const handleRemoveStatus = async (status: NoteStatus) => {
		onSelectedState(frontmatterTagName, status, "unselected");
	};

	const handleSelectStatus = async (status: NoteStatus) => {
		onSelectedState(frontmatterTagName, status, "select");
	};

	return (
		<div>
			<div className="setting-item">
				<div className="setting-item-info">
					<div className="setting-item-name">Current statuses</div>
				</div>
				<div className="setting-item-control">
					<div
						className="note-status-chips"
						style={{
							display: "flex",
							flexWrap: "wrap",
							gap: "6px",
							minHeight: "32px",
							alignItems: "center",
						}}
					>
						{currentStatuses.map((s) => (
							<StatusModalChip
								key={s.name}
								status={s}
								onRemove={() => handleRemoveStatus(s)}
							/>
						))}
					</div>
				</div>
			</div>
			<SearchFilter
				value={searchFilter}
				onFilterChange={(value) => setSearchFilter(value)}
			/>
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
					onToggleStatus={(status, selected) =>
						selected
							? handleSelectStatus(status)
							: handleRemoveStatus(status)
					}
				/>
			)}
		</div>
	);
};
