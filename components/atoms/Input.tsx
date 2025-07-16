import React from "react";

export type InputVariant = "text" | "color" | "search";

interface BaseInputProps {
	variant: InputVariant;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
	style?: React.CSSProperties;
}

interface TextInputProps extends BaseInputProps {
	variant: "text";
}

interface ColorInputProps extends BaseInputProps {
	variant: "color";
}

interface SearchInputProps extends BaseInputProps {
	variant: "search";
}

export type InputProps = TextInputProps | ColorInputProps | SearchInputProps;

const getInputStyles = (variant: InputVariant): React.CSSProperties => {
	const baseStyles: React.CSSProperties = {
		border: "1px solid var(--background-modifier-border)",
		borderRadius: "4px",
		backgroundColor: "var(--background-primary)",
		color: "var(--text-normal)",
		fontSize: "14px",
		outline: "none",
	};

	switch (variant) {
		case "text":
		case "search":
			return {
				...baseStyles,
				width: "100%",
				padding: "8px 12px",
			};
		case "color":
			return {
				...baseStyles,
				width: "32px",
				height: "32px",
				padding: "2px",
				cursor: "pointer",
			};
		default:
			return baseStyles;
	}
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
	({ variant, value, onChange, placeholder, className, style }, ref) => {
		const inputStyles = getInputStyles(variant);
		const combinedStyles = { ...inputStyles, ...style };

		return (
			<input
				ref={ref}
				type={variant === "color" ? "color" : "text"}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className={className}
				style={combinedStyles}
			/>
		);
	},
);

Input.displayName = "Input";
