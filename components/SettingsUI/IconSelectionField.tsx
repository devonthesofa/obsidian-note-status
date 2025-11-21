import React from "react";
import { Input } from "@/components/atoms/Input";
import { LucideIconPicker } from "./LucideIconPicker";

export interface IconSelectionFieldProps {
	className?: string;
	emojiValue: string;
	onEmojiChange: (value: string) => void;
	emojiLabel?: string;
	emojiPlaceholder?: string;
	emojiHint?: string;
	lucideValue?: string;
	onLucideChange?: (value: string) => void;
	lucideLabel?: string;
	lucidePlaceholder?: string;
	lucideHint?: string;
	lucideAllowClear?: boolean;
}

export const IconSelectionField: React.FC<IconSelectionFieldProps> = ({
	className = "",
	emojiValue,
	onEmojiChange,
	emojiLabel = "Emoji fallback",
	emojiPlaceholder = "Example: ✅",
	emojiHint,
	lucideValue,
	onLucideChange,
	lucideLabel = "Lucide icon",
	lucidePlaceholder = "Choose Lucide icon",
	lucideHint,
	lucideAllowClear = true,
}) => {
	const containerClass = ["icon-selection-field", className]
		.filter(Boolean)
		.join(" ");

	return (
		<div className={containerClass}>
			<div className="icon-selection-field__column">
				<label className="icon-selection-field__label">
					{emojiLabel}
				</label>
				<Input
					variant="text"
					value={emojiValue}
					onChange={onEmojiChange}
					placeholder={emojiPlaceholder}
					className="icon-selection-field__emoji-input"
				/>
				{emojiHint && (
					<p className="icon-selection-field__hint">{emojiHint}</p>
				)}
			</div>
			{onLucideChange && (
				<div className="icon-selection-field__column">
					<label className="icon-selection-field__label">
						{lucideLabel}
					</label>
					<LucideIconPicker
						value={lucideValue}
						onChange={onLucideChange}
						placeholder={lucidePlaceholder}
						allowClear={lucideAllowClear}
					/>
					{lucideHint && (
						<p className="icon-selection-field__hint">
							{lucideHint}
						</p>
					)}
				</div>
			)}
		</div>
	);
};
