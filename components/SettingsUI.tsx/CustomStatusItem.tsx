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
	return (
		<div className="custom-status-card">
			<div
				className="custom-status-preview"
				style={{ borderLeftColor: status.color || "var(--text-muted)" }}
			>
				<Input
					variant="text"
					value={status.icon}
					onChange={(value) =>
						onCustomStatusChange(index, "icon", value || "❓")
					}
					placeholder="🔥"
					className="custom-status-icon-input"
				/>
				<div className="custom-status-text-inputs">
					<Input
						variant="text"
						value={status.name}
						onChange={(value) =>
							onCustomStatusChange(
								index,
								"name",
								value || "unnamed",
							)
						}
						placeholder="Status name"
						className="custom-status-name-input"
						style={{ color: status.color || "var(--text-normal)" }}
					/>
					<Input
						variant="text"
						value={status.description || ""}
						onChange={(value) =>
							onCustomStatusChange(index, "description", value)
						}
						placeholder="Description (optional)"
						className="custom-status-description-input"
					/>
				</div>
				<div className="custom-status-controls">
					<Input
						variant="color"
						value={status.color || "#ffffff"}
						onChange={(value) =>
							onCustomStatusChange(index, "color", value)
						}
						className="custom-status-color-input"
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
