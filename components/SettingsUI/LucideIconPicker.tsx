import React, { useEffect, useMemo, useState } from "react";
import { IconName, getIconIds } from "obsidian";
import { Input } from "@/components/atoms/Input";
import { StatusIcon } from "@/components/atoms/StatusIcon";

export interface LucideIconPickerProps {
	value?: string;
	onChange: (value: string) => void;
	maxResults?: number;
}

const DEFAULT_MAX_RESULTS = 36;

export const LucideIconPicker: React.FC<LucideIconPickerProps> = ({
	value = "",
	onChange,
	maxResults = DEFAULT_MAX_RESULTS,
}) => {
	const [query, setQuery] = useState(value);

	useEffect(() => {
		setQuery(value || "");
	}, [value]);

	const iconIds = useMemo(() => {
		try {
			return getIconIds()
				.slice()
				.sort((a, b) => a.localeCompare(b));
		} catch (error) {
			console.error("Failed to load Lucide icon list", error);
			return [] as IconName[];
		}
	}, []);

	const filteredIcons = useMemo(() => {
		if (!iconIds.length) {
			return [];
		}

		const normalizedQuery = query.trim().toLowerCase();
		const source = normalizedQuery.length
			? iconIds.filter((name) =>
					name.toLowerCase().includes(normalizedQuery),
				)
			: iconIds;

		return source.slice(0, maxResults);
	}, [iconIds, query, maxResults]);

	const handleSelect = (iconName: IconName) => {
		onChange(iconName);
		setQuery(iconName);
	};

	const handleClear = () => {
		onChange("");
		setQuery("");
	};

	return (
		<div className="lucide-icon-picker">
			<div className="lucide-icon-picker__control">
				<Input
					variant="text"
					value={query}
					onChange={setQuery}
					placeholder="Search by name (e.g. check-circle)"
					className="lucide-icon-picker__input"
				/>
				{value && (
					<button
						type="button"
						className="lucide-icon-picker__clear"
						onClick={handleClear}
					>
						Clear
					</button>
				)}
			</div>

			<div className="lucide-icon-picker__selected">
				<span className="lucide-icon-picker__selected-preview">
					<StatusIcon
						icon={value}
						lucideIcon={value}
						size={18}
						className="lucide-icon-picker__selected-icon"
					/>
				</span>
				<span className="lucide-icon-picker__selected-label">
					{value || "No Lucide icon selected"}
				</span>
			</div>

			{!iconIds.length && (
				<div className="lucide-icon-picker__empty">
					Lucide icons are not available yet. Try reloading the
					plugin.
				</div>
			)}

			{iconIds.length > 0 && (
				<div className="lucide-icon-picker__grid">
					{filteredIcons.map((iconName) => {
						const isSelected = iconName === value;
						return (
							<button
								type="button"
								key={iconName}
								className={`lucide-icon-picker__option ${isSelected ? "lucide-icon-picker__option--selected" : ""}`}
								onClick={() => handleSelect(iconName)}
								title={iconName}
							>
								<StatusIcon
									icon={iconName}
									lucideIcon={iconName}
									size={16}
								/>
								<span>{iconName}</span>
							</button>
						);
					})}
					{filteredIcons.length === 0 && (
						<div className="lucide-icon-picker__empty">
							No icons match "{query.trim()}"
						</div>
					)}
				</div>
			)}
		</div>
	);
};
