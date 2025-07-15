import { NoteStatus } from "@/types/noteStatus";
import { PluginSettings } from "@/types/pluginSettings";
import React from "react";

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
	return (
		<div className="custom-status-card">
			<div
				className="custom-status-preview"
				style={{ borderLeftColor: status.color || "var(--text-muted)" }}
			>
				<input
					className="custom-status-icon-input"
					type="text"
					placeholder="🔥"
					value={status.icon}
					onChange={(e) =>
						onCustomStatusChange(
							index,
							"icon",
							e.target.value || "❓",
						)
					}
				/>
				<div className="custom-status-text-inputs">
					<input
						className="custom-status-name-input"
						type="text"
						placeholder="Status name"
						value={status.name}
						onChange={(e) =>
							onCustomStatusChange(
								index,
								"name",
								e.target.value || "unnamed",
							)
						}
						style={{ color: status.color || "var(--text-normal)" }}
					/>
					<input
						className="custom-status-description-input"
						type="text"
						placeholder="Description (optional)"
						value={status.description || ""}
						onChange={(e) =>
							onCustomStatusChange(
								index,
								"description",
								e.target.value,
							)
						}
					/>
				</div>
				<div className="custom-status-controls">
					<input
						className="custom-status-color-input"
						type="color"
						value={status.color || "#ffffff"}
						onChange={(e) =>
							onCustomStatusChange(index, "color", e.target.value)
						}
					/>
					<button
						className="custom-status-remove-btn clickable-icon mod-warning"
						onClick={() => onCustomStatusRemove(index)}
						aria-label="Remove status"
					>
						🗑️
					</button>
				</div>
			</div>
		</div>
	);
};
