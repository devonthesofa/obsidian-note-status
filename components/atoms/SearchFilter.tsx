import { FC, useEffect, useRef, useState } from "react";

export type Props = {
	value: string;
	onFilterChange: (value: string) => void;
};
export const SearchFilter: FC<Props> = ({ value, onFilterChange }) => {
	const [searchFilter, setSearchFilter] = useState(value);
	const searchInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		// TODO:: Focus on render?
		// if (searchInputRef.current) {
		// 	setTimeout(() => searchInputRef.current?.focus(), 100);
		// }
		//
		setSearchFilter(value);
	}, [value]);

	// TODO: Move the style to its css file
	return (
		<div className="setting-item">
			<div className="setting-item-info">
				<div className="setting-item-name">Filter statuses</div>
			</div>
			<div className="setting-item-control">
				<input
					ref={searchInputRef}
					type="text"
					placeholder="Search statuses..."
					className="note-status-search-input"
					value={searchFilter}
					onChange={(e) => onFilterChange(e.target.value)}
					style={{
						width: "200px",
						padding: "6px 12px",
						border: "1px solid var(--background-modifier-border)",
						borderRadius: "var(--radius-s)",
						background: "var(--background-primary)",
						color: "var(--text-normal)",
					}}
				/>
			</div>
		</div>
	);
};
