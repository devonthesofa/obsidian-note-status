import React, { useState } from "react";
import { NoteStatus } from "@/types/noteStatus";
import { SearchFilter } from "../atoms/SearchFilter";
import { StatusChip } from "../atoms/StatusChip";
import { StatusSelector } from "../atoms/StatusSelector";
import { SettingItem } from "../SettingsUI.tsx/SettingItem";

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
			<SearchFilter
				value={searchFilter}
				onFilterChange={(value) => setSearchFilter(value)}
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
						onToggleStatus={(status, selected) =>
							selected
								? handleSelectStatus(status)
								: handleRemoveStatus(status)
						}
					/>
				)}
			</SettingItem>

			<SettingItem name="Available statuses" vertical>
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
						<StatusChip
							key={s.name}
							status={s}
							onRemove={() => handleRemoveStatus(s)}
						/>
					))}
				</div>
			</SettingItem>
		</div>
	);
};
