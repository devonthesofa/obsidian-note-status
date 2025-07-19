import React, { ReactNode } from "react";

type SelectProps = {
	options: { value: string | number; display: ReactNode }[];
	onChange: (value: string) => void;
	defaultValue?: string;
};

export const Select: React.FC<SelectProps> = ({
	options,
	onChange,
	defaultValue,
}) => {
	return (
		<select
			defaultValue={defaultValue}
			onChange={(e) => onChange(e.target.value)}
		>
			{options.map((option) => (
				<option key={option.value} value={option.value}>
					{option.display}
				</option>
			))}
		</select>
	);
};
