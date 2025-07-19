import { NoteStatus } from "@/types/noteStatus";
import { PluginSettings } from "@/types/pluginSettings";
import React from "react";
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
	const isValid = status.name.trim().length > 0;
	const displayIcon = status.icon.trim() || "📝";

	return (
		<div className="custom-status-item">
			{/* Simple horizontal layout with all inputs in a row */}
			<div className="custom-status-row">
				{/* Icon field - simple text input */}
				<div className="custom-status-field">
					<label className="custom-status-label">Icon</label>
					<Input
						variant="text"
						value={status.icon}
						onChange={(value) =>
							onCustomStatusChange(index, "icon", value || "")
						}
						placeholder="📝"
						className="custom-status-icon-input"
					/>
				</div>

				{/* Name field */}
				<div className="custom-status-field custom-status-field--name">
					<label className="custom-status-label">
						Name <span className="custom-status-required">*</span>
					</label>
					<Input
						variant="text"
						value={status.name}
						onChange={(value) =>
							onCustomStatusChange(index, "name", value || "")
						}
						placeholder="e.g. In Progress"
						className={`custom-status-name-input ${
							!isValid ? "custom-status-input--invalid" : ""
						}`}
					/>
				</div>

				{/* Description field */}
				<div className="custom-status-field custom-status-field--description">
					<label className="custom-status-label">Description</label>
					<Input
						variant="text"
						value={status.description || ""}
						onChange={(value) =>
							onCustomStatusChange(index, "description", value)
						}
						placeholder="Optional description"
						className="custom-status-description-input"
					/>
				</div>

				{/* Color picker */}
				<div className="custom-status-field custom-status-field--color">
					<label className="custom-status-label">Color</label>
					<Input
						variant="color"
						value={status.color || "#888888"}
						onChange={(value) =>
							onCustomStatusChange(index, "color", value)
						}
						className="custom-status-color-input"
					/>
				</div>

				{/* Remove button */}
				<div className="custom-status-field custom-status-field--actions">
					<button
						onClick={() => onCustomStatusRemove(index)}
						aria-label="Remove status"
						className="custom-status-remove-btn"
						title="Remove this status"
					>
						×
					</button>
				</div>
			</div>

			{/* Preview row - shows how the status will look */}
			<div className="custom-status-preview">
				<span
					className="custom-status-preview-icon"
					style={{ color: status.color }}
				>
					{displayIcon}
				</span>
				<span
					className="custom-status-preview-text"
					style={{ color: status.color }}
				>
					{status.name || "Status name"}
				</span>
				{status.description && (
					<span className="custom-status-preview-desc">
						{status.description}
					</span>
				)}
			</div>

			{/* Validation message */}
			{!isValid && (
				<div className="custom-status-error">
					Please enter a status name
				</div>
			)}
		</div>
	);
};
