import React, { useCallback } from "react";
import { NoteStatus } from "@/types/noteStatus";
import { SearchFilter } from "../atoms/SearchFilter";
import { StatusSelector } from "../atoms/StatusSelector";
import { SettingItem } from "../SettingsUI/SettingItem";
import { CurrentStatusChips } from "./CurrentStatusChips";
import { useKeyboardNavigation } from "./useKeyboardNavigation";

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

export const StatusSelectorGroup: React.FC<Props> = ({
	currentStatuses,
	availableStatuses,
	frontmatterTagName,
	onSelectedState,
}) => {
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

	const {
		focusedIndex,
		searchFilter,
		filteredStatuses,
		containerRef,
		searchRef,
		handleKeyDown,
		setSearchFilter,
	} = useKeyboardNavigation({
		availableStatuses,
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
