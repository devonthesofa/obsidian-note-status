import React from "react";
import { SearchFilter } from "@/components/atoms/SearchFilter";
import { Input } from "@/components/atoms/Input";

interface FilterSectionProps {
	searchFilter: string;
	noteNameFilter: string;
	templateFilter: string;
	availableTemplates: string[];
	onSearchFilterChange: (value: string) => void;
	onNoteNameFilterChange: (value: string) => void;
	onTemplateFilterChange: (value: string) => void;
}

export const FilterSection = ({
	searchFilter,
	noteNameFilter,
	templateFilter,
	availableTemplates,
	onSearchFilterChange,
	onNoteNameFilterChange,
	onTemplateFilterChange,
}: FilterSectionProps) => {
	return (
		<div className="grouped-status-header">
			<h3 className="grouped-status-title">Status Groups</h3>
			<div className="grouped-status-filters">
				<SearchFilter
					value={searchFilter}
					onFilterChange={onSearchFilterChange}
				/>
				<div className="grouped-status-filters__note">
					<Input
						variant="text"
						value={noteNameFilter}
						onChange={onNoteNameFilterChange}
						placeholder="Filter by note name..."
						className="grouped-status-filters__note-input"
					/>
				</div>
				<div className="grouped-status-filters__template">
					<select
						value={templateFilter}
						onChange={(e) => onTemplateFilterChange(e.target.value)}
						className="grouped-status-filters__template-select"
					>
						<option value="">All templates</option>
						{availableTemplates.map((template) => (
							<option key={template} value={template}>
								{template}
							</option>
						))}
					</select>
				</div>
			</div>
		</div>
	);
};
