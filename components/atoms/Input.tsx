import React from "react";

export type InputVariant = "text" | "color" | "search";

interface BaseInputProps {
	variant: InputVariant;
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	className?: string;
	style?: React.CSSProperties;
	onFocus?: () => void;
	onBlur?: () => void;
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

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
	(
		{
			variant,
			value,
			onChange,
			placeholder,
			className,
			style,
			onFocus,
			onBlur,
		},
		ref,
	) => {
		const inputType =
			variant === "color"
				? "color"
				: variant === "search"
					? "search"
					: "text";
		const classes = [
			"note-status-input",
			`note-status-input--${variant}`,
			variant === "search" ? "search-input" : "",
			className,
		]
			.filter(Boolean)
			.join(" ");

		return (
			<input
				ref={ref}
				type={inputType}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				className={classes}
				style={style}
				onFocus={onFocus}
				onBlur={onBlur}
			/>
		);
	},
);

Input.displayName = "Input";
