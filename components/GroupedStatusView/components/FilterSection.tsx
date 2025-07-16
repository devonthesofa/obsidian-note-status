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
		<div className="grouped-status-header">
			<h3 className="grouped-status-title">Status Groups</h3>
			<div className="grouped-status-filters">
				<SearchFilter
					value={searchFilter}
					onFilterChange={onSearchFilterChange}
				/>
				<div className="grouped-status-note-filter">
					<input
						type="text"
						placeholder="Filter by note name..."
						className="grouped-status-note-input"
						value={noteNameFilter}
						onChange={(e) => onNoteNameFilterChange(e.target.value)}
					/>
				</div>
			</div>
		</div>
	);
};
