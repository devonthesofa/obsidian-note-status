import { NoteStatus } from "@/types/noteStatus";
import { PluginSettings } from "@/types/pluginSettings";
import React, { useState } from "react";
import { Input } from "@/components/atoms/Input";

export type Props = {
	status: NoteStatus;
	index: number;
	settings: PluginSettings;
	onCustomStatusChange: (
		index: number,
		column: "name" | "icon" | "color" | "description",
		value: string,
	) => void;
	onCustomStatusRemove: (index: number) => void;
};

export const CustomStatusItem: React.FC<Props> = ({
	status,
	index,
	onCustomStatusChange,
	onCustomStatusRemove,
}) => {
	const [isHovered, setIsHovered] = useState(false);
	const [focusedField, setFocusedField] = useState<string | null>(null);

	const isValid = status.name.trim().length > 0;
	const hasIcon = status.icon.trim().length > 0;

	return (
		<div
			className={`custom-status-card ${
				isValid
					? "custom-status-card--valid"
					: "custom-status-card--invalid"
			}`}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			{/* Status Preview Bar */}
			<div
				className={`custom-status-preview-bar ${
					isValid
						? "custom-status-preview-bar--valid"
						: "custom-status-preview-bar--invalid"
				}`}
				style={{
					background: status.color || "var(--text-muted)",
				}}
			/>

			<div className="custom-status-main-content">
				{/* Icon Input with Preview Circle */}
				<div className="custom-status-icon-section">
					<div
						className={`custom-status-icon-preview ${
							focusedField === "icon"
								? "custom-status-icon-preview--focused"
								: ""
						} ${
							hasIcon
								? "custom-status-icon-preview--has-icon"
								: "custom-status-icon-preview--placeholder"
						}`}
						style={{
							background: status.color
								? `${status.color}20`
								: "var(--background-modifier-border)",
							borderColor:
								status.color ||
								"var(--background-modifier-border)",
						}}
					>
						{hasIcon ? status.icon : "📝"}
					</div>
					<Input
						variant="text"
						value={status.icon}
						onChange={(value) =>
							onCustomStatusChange(index, "icon", value || "")
						}
						placeholder="🔥"
						onFocus={() => setFocusedField("icon")}
						onBlur={() => setFocusedField(null)}
						className="custom-status-icon-input"
					/>
				</div>

				{/* Text Inputs */}
				<div className="custom-status-text-section">
					<Input
						variant="text"
						value={status.name}
						onChange={(value) =>
							onCustomStatusChange(index, "name", value || "")
						}
						placeholder="Status name"
						onFocus={() => setFocusedField("name")}
						onBlur={() => setFocusedField(null)}
						className={`custom-status-input custom-status-input--name ${
							focusedField === "name"
								? "custom-status-input--focused"
								: ""
						} ${!isValid ? "custom-status-input--invalid" : ""}`}
						style={{
							color: status.color || "var(--text-normal)",
						}}
					/>
					<Input
						variant="text"
						value={status.description || ""}
						onChange={(value) =>
							onCustomStatusChange(index, "description", value)
						}
						placeholder="Description (optional)"
						onFocus={() => setFocusedField("description")}
						onBlur={() => setFocusedField(null)}
						className={`custom-status-input custom-status-input--description ${
							focusedField === "description"
								? "custom-status-input--focused"
								: ""
						}`}
					/>
				</div>

				{/* Controls */}
				<div className="custom-status-controls">
					{/* Color Picker */}
					<div className="custom-status-color-picker">
						<Input
							variant="color"
							value={status.color || "#ffffff"}
							onChange={(value) =>
								onCustomStatusChange(index, "color", value)
							}
							onFocus={() => setFocusedField("color")}
							onBlur={() => setFocusedField(null)}
							className={`custom-status-color-input ${
								focusedField === "color"
									? "custom-status-color-input--focused"
									: ""
							}`}
						/>
					</div>

					{/* Remove Button */}
					<button
						onClick={() => onCustomStatusRemove(index)}
						aria-label="Remove status"
						className="custom-status-remove-btn"
					>
						{isHovered ? "×" : "🗑️"}
					</button>
				</div>
			</div>

			{/* Validation Message */}
			{!isValid && (
				<div className="custom-status-validation-message">
					Status name is required
				</div>
			)}
		</div>
	);
};
