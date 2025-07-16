import { NoteStatus } from "@/types/noteStatus";
import { FC, memo, useState } from "react";

interface Props {
	status: NoteStatus;
	onRemove: () => void;
}

export const StatusChip: FC<Props> = memo(({ status, onRemove }) => {
	const [isRemoving, setIsRemoving] = useState(false);

	const handleRemove = (e: React.MouseEvent) => {
		e.stopPropagation();
		setIsRemoving(true);
		setTimeout(() => {
			onRemove();
		}, 150);
	};

	return (
		<div
			className="note-status-chip"
			title={
				status.description
					? `${status.name} - ${status.description}`
					: status.name
			}
			style={{
				display: "inline-flex",
				alignItems: "center",
				gap: "6px",
				padding: "4px 8px",
				background: "var(--interactive-accent)",
				color: "var(--text-on-accent)",
				borderRadius: "var(--radius-s)",
				fontSize: "var(--font-ui-smaller)",
				cursor: "pointer",
				transition: "all 150ms ease",
				opacity: isRemoving ? "0.5" : "1",
			}}
		>
			<span className="note-status-chip-icon">{status.icon}</span>
			<span className="note-status-chip-text">{status.name}</span>
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
		</div>
	);
});
