import { NoteStatus } from "@/types/noteStatus";
import React from "react";
import { Input } from "@/components/atoms/Input";
import { StatusIcon } from "@/components/atoms/StatusIcon";
import { LucideIconPicker } from "./LucideIconPicker";

export type Props = {
	status: NoteStatus;
	index: number;
	onCustomStatusChange: (
		index: number,
		column: "name" | "icon" | "color" | "description" | "lucideIcon",
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
	return (
		<div className="custom-status-item">
			<div className="custom-status-item__row custom-status-item__row--icons">
				<div className="custom-status-item__field custom-status-item__field--icon">
					<label className="custom-status-item__label">
						Emoji icon
					</label>
					<Input
						variant="text"
						value={status.icon}
						onChange={(value) =>
							onCustomStatusChange(index, "icon", value || "")
						}
						placeholder="Example: ✅ or 🚧"
						className="custom-status-item__input custom-status-item__input--icon"
					/>
					<p className="custom-status-item__hint">
						This fallback icon is shown anywhere Lucide is not
						available.
					</p>
				</div>

				<div className="custom-status-item__field custom-status-item__field--lucide">
					<label className="custom-status-item__label">
						Lucide icon (optional)
					</label>
					<LucideIconPicker
						value={status.lucideIcon || ""}
						onChange={(value) =>
							onCustomStatusChange(index, "lucideIcon", value)
						}
						placeholder="Browse Lucide icons"
						allowClear
					/>
					<p className="custom-status-item__hint">
						Matches Obsidian&apos;s toolbar icons so your status
						button blends in.
					</p>
				</div>
			</div>

			{/* Simple horizontal layout with remaining inputs */}
			<div className="custom-status-item__row">
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
				<StatusIcon
					icon={status.icon}
					lucideIcon={status.lucideIcon}
					className="custom-status-item__preview-icon"
					size={18}
					style={{ color: status.color }}
				/>
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
