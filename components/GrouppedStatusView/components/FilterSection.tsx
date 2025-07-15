import React from "react";
import { SearchFilter } from "@/components/atoms/SearchFilter";

interface FilterSectionProps {
	searchFilter: string;
	noteNameFilter: string;
	onSearchFilterChange: (value: string) => void;
	onNoteNameFilterChange: (value: string) => void;
}

export const FilterSection = ({
	searchFilter,
	noteNameFilter,
	onSearchFilterChange,
	onNoteNameFilterChange,
}: FilterSectionProps) => {
	return (
		<div className="groupped-status-header">
			<h3 className="groupped-status-title">Status Groups</h3>
			<div className="groupped-status-filters">
				<SearchFilter
					value={searchFilter}
					onFilterChange={onSearchFilterChange}
				/>
				<div className="groupped-status-note-filter">
					<input
						type="text"
						placeholder="Filter by note name..."
						className="groupped-status-note-input"
						value={noteNameFilter}
						onChange={(e) => onNoteNameFilterChange(e.target.value)}
					/>
				</div>
			</div>
		</div>
	);
};
