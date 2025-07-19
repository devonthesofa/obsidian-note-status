import { NoteStatus } from "@/types/noteStatus";
import { FC, memo, useState } from "react";
import { getStatusTooltip } from "@/utils/statusUtils";

export type StatusDisplayVariant = "chip" | "badge" | "template";

interface StatusDisplayProps {
	status: NoteStatus;
	variant: StatusDisplayVariant;
	removable?: boolean;
	onRemove?: () => void;
	onClick?: () => void;
}

export const StatusDisplay: FC<StatusDisplayProps> = memo(
	({ status, variant, removable = false, onRemove, onClick }) => {
		const [isRemoving, setIsRemoving] = useState(false);

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
					<span className="note-status-chip-icon">{status.icon}</span>
					<span className="note-status-chip-text">{status.name}</span>
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
							<svg
								width="12"
								height="12"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<line x1="18" y1="6" x2="6" y2="18" />
								<line x1="6" y1="6" x2="18" y2="18" />
							</svg>
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
						<span className="status-badge-icon">{status.icon}</span>
						<span className="status-badge-text">{status.name}</span>
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
						{status.icon} {status.name}
					</span>
				</div>
			);
		}

		return null;
	},
);
