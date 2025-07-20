import React from "react";
import { Input } from "./Input";

interface Props {
	value: string;
	onFilterChange: (value: string) => void;
	placeholder?: string;
}

export const SearchFilter = React.forwardRef<HTMLInputElement, Props>(
	({ value, onFilterChange, placeholder = "Search..." }, ref) => {
		return (
			<Input
				ref={ref}
				variant="search"
				value={value}
				onChange={onFilterChange}
				placeholder={placeholder}
			/>
		);
	},
);

SearchFilter.displayName = "SearchFilter";
