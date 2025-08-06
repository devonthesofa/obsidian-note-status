import { NoteStatus } from "@/types/noteStatus";
import React from "react";
import { Input } from "@/components/atoms/Input";

export type Props = {
	status: NoteStatus;
	index: number;
	onCustomStatusChange: (
		index: number,
		column: "name" | "icon" | "color" | "description",
		value: string,
	) => void;
	onCustomStatusRemove: (index: number) => void;
	onMoveUp?: (index: number) => void;
	onMoveDown?: (index: number) => void;
	canMoveUp?: boolean;
	canMoveDown?: boolean;
};

export const CustomStatusItem: React.FC<Props> = ({
	status,
	index,
	onCustomStatusChange,
	onCustomStatusRemove,
	onMoveUp,
	onMoveDown,
	canMoveUp = false,
	canMoveDown = false,
}) => {
	const isValid = status.name.trim().length > 0;
	const displayIcon = status.icon.trim() || "📝";

	return (
		<div className="custom-status-item">
			{/* Simple horizontal layout with all inputs in a row */}
			<div className="custom-status-item__row">
				{/* Icon field - simple text input */}
				<div className="custom-status-item__field">
					<label className="custom-status-item__label">Icon</label>
					<Input
						variant="text"
						value={status.icon}
						onChange={(value) =>
							onCustomStatusChange(index, "icon", value || "")
						}
						placeholder="📝"
						className="custom-status-item__input custom-status-item__input--icon"
					/>
				</div>

				{/* Name field */}
				<div className="custom-status-item__field custom-status-item__field--name">
					<label className="custom-status-item__label">
						Name{" "}
						<span className="custom-status-item__label--required">
							*
						</span>
					</label>
					<Input
						variant="text"
						value={status.name}
						onChange={(value) =>
							onCustomStatusChange(index, "name", value || "")
						}
						placeholder="e.g. In Progress"
						className={`custom-status-item__input custom-status-item__input--name ${
							!isValid ? "custom-status-item__input--invalid" : ""
						}`}
					/>
				</div>

				{/* Description field */}
				<div className="custom-status-item__field custom-status-item__field--description">
					<label className="custom-status-item__label">
						Description
					</label>
					<Input
						variant="text"
						value={status.description || ""}
						onChange={(value) =>
							onCustomStatusChange(index, "description", value)
						}
						placeholder="Optional description"
						className="custom-status-item__input custom-status-item__input--description"
					/>
				</div>

				{/* Color picker */}
				<div className="custom-status-item__field custom-status-item__field--color">
					<label className="custom-status-item__label">Color</label>
					<Input
						variant="color"
						value={status.color || "#888888"}
						onChange={(value) =>
							onCustomStatusChange(index, "color", value)
						}
						className="custom-status-item__input custom-status-item__input--color"
					/>
				</div>

				{/* Reorder buttons */}
				{(onMoveUp || onMoveDown) && (
					<div className="custom-status-item__field custom-status-item__field--reorder">
						<div className="custom-status-item__reorder-buttons">
							<button
								onClick={() => onMoveUp && onMoveUp(index)}
								aria-label="Move status up"
								className="custom-status-item__reorder-btn"
								title="Move status up"
								disabled={!canMoveUp}
							>
								↑
							</button>
							<button
								onClick={() => onMoveDown && onMoveDown(index)}
								aria-label="Move status down"
								className="custom-status-item__reorder-btn"
								title="Move status down"
								disabled={!canMoveDown}
							>
								↓
							</button>
						</div>
					</div>
				)}

				{/* Remove button */}
				<div className="custom-status-item__field custom-status-item__field--actions">
					<button
						onClick={() => onCustomStatusRemove(index)}
						aria-label="Remove status"
						className="custom-status-item__remove-btn"
						title="Remove status"
					>
						×
					</button>
				</div>
			</div>

			{/* Preview row - shows how the status will look */}
			<div className="custom-status-item__preview">
				<span
					className="custom-status-item__preview-icon"
					style={{ color: status.color }}
				>
					{displayIcon}
				</span>
				<span
					className="custom-status-item__preview-text"
					style={{ color: status.color }}
				>
					{status.name || "Status name"}
				</span>
				{status.description && (
					<span className="custom-status-item__preview-desc">
						{status.description}
					</span>
				)}
			</div>

			{/* Validation message */}
			{!isValid && (
				<div className="custom-status-item__error">
					Please enter a status name
				</div>
			)}
		</div>
	);
};
