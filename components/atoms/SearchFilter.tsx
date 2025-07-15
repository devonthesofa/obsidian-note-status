import React from "react";

interface Props {
	value: string;
	onFilterChange: (value: string) => void;
	placeholder?: string;
}

export const SearchFilter = React.forwardRef<HTMLInputElement, Props>(
	({ value, onFilterChange, placeholder = "Search..." }, ref) => {
		return (
			<input
				ref={ref}
				type="text"
				value={value}
				onChange={(e) => onFilterChange(e.target.value)}
				placeholder={placeholder}
				style={{
					width: "100%",
					padding: "8px 12px",
					border: "1px solid var(--background-modifier-border)",
					borderRadius: "4px",
					backgroundColor: "var(--background-primary)",
					color: "var(--text-normal)",
					fontSize: "14px",
				}}
			/>
		);
	},
);

SearchFilter.displayName = "SearchFilter";
