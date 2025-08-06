import { NoteStatus } from "@/types/noteStatus";
import { FC, memo, useState } from "react";
import { getStatusTooltip } from "@/utils/statusUtils";
import { ObsidianIcon } from "./ObsidianIcon";

export type StatusDisplayVariant = "chip" | "badge" | "template";

interface StatusDisplayProps {
	status: NoteStatus;
	variant: StatusDisplayVariant;
	removable?: boolean;
	hasNameConflicts?: boolean;
	templateNameMode?: "always" | "never" | "auto";
	onRemove?: () => void;
	onClick?: () => void;
}

export const StatusDisplay: FC<StatusDisplayProps> = memo(
	({
		status,
		variant,
		removable = false,
		hasNameConflicts = false,
		templateNameMode = "auto",
		onRemove,
		onClick,
	}) => {
		const [isRemoving, setIsRemoving] = useState(false);

		const getDisplayName = () => {
			const shouldShowTemplate = (() => {
				switch (templateNameMode) {
					case "always":
						return true;
					case "never":
						return false;
					case "auto":
						return hasNameConflicts && status.templateId;
					default:
						return false;
				}
			})();

			return shouldShowTemplate && status.templateId
				? `${status.name} (${status.templateId})`
				: status.name;
		};

		const handleRemove = (e: React.MouseEvent) => {
			e.stopPropagation();
			if (onRemove) {
				setIsRemoving(true);
				setTimeout(() => {
					onRemove();
				}, 150);
			}
		};

		const handleClick = () => {
			if (onClick) {
				onClick();
			}
		};

		if (variant === "chip") {
			return (
				<div
					className="note-status-chip"
					title={getStatusTooltip(status)}
					style={{
						display: "inline-flex",
						alignItems: "center",
						gap: "6px",
						padding: "4px 8px",
						background: "var(--interactive-accent)",
						color: "var(--text-on-accent)",
						borderRadius: "var(--radius-s)",
						fontSize: "var(--font-ui-smaller)",
						cursor: onClick ? "pointer" : "default",
						transition: "all 150ms ease",
						opacity: isRemoving ? "0.5" : "1",
					}}
					onClick={handleClick}
				>
					<span className="note-status-chip-icon">
						{status.icon ? status.icon : "📝"}
					</span>
					<span className="note-status-chip-text">
						{getDisplayName()}
					</span>
					{removable && (
						<div
							className="note-status-chip-remove"
							onClick={handleRemove}
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								width: "16px",
								height: "16px",
								borderRadius: "50%",
								background: "rgba(255, 255, 255, 0.2)",
								cursor: "pointer",
							}}
						>
							<ObsidianIcon name="thrash" size={12} />
						</div>
					)}
				</div>
			);
		}

		if (variant === "badge") {
			return (
				<div
					className="status-badge-container"
					style={{
						backgroundColor: `${status.color}15`,
						border: `1px solid ${status.color}30`,
					}}
					onClick={handleClick}
				>
					<div className="status-badge-item">
						<span className="status-badge-icon">
							{status.icon ? status.icon : "📝"}
						</span>
						<span className="status-badge-text">
							{getDisplayName()}
						</span>
					</div>
				</div>
			);
		}

		if (variant === "template") {
			return (
				<div className="template-status-chip" onClick={handleClick}>
					<span
						className="template-status-color-dot"
						style={
							{
								"--dot-color": status.color,
							} as React.CSSProperties
						}
					/>
					<span>
						{status.icon ? status.icon : "📝"} {getDisplayName()}
					</span>
				</div>
			);
		}

		return null;
	},
);
