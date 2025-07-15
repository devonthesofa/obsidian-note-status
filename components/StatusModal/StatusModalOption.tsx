import { NoteStatus } from "@/types/noteStatus";
import { useState } from "react";

interface StatusOptionProps {
	status: NoteStatus;
	isSelected: boolean;
	onSelect: () => void;
}

export const StatusModalOption: React.FC<StatusOptionProps> = ({
	status,
	isSelected,
	onSelect,
}) => {
	const [isHovered, setIsHovered] = useState(false);

	const handleClick = () => {
		setTimeout(() => {
			onSelect();
		}, 150);
	};

	return (
		<div
			className="note-status-option"
			onClick={handleClick}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			title={
				status.description
					? `${status.name} - ${status.description}`
					: undefined
			}
			style={{
				display: "flex",
				alignItems: "center",
				gap: "12px",
				padding: "8px 12px",
				cursor: "pointer",
				borderBottom: "1px solid var(--background-modifier-border)",
				transition: "background-color 150ms ease",
				background:
					isSelected || isHovered
						? "var(--background-modifier-hover)"
						: "",
			}}
		>
			<span
				className="note-status-option-icon"
				style={{
					fontSize: "16px",
					minWidth: "20px",
				}}
			>
				{status.icon}
			</span>
			<span
				className="note-status-option-text"
				style={{
					flex: "1",
					fontSize: "var(--font-ui-small)",
				}}
			>
				{status.name}
			</span>
			{isSelected && (
				<div
					className="note-status-option-check"
					style={{
						color: "var(--interactive-accent)",
					}}
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<polyline points="20,6 9,17 4,12" />
					</svg>
				</div>
			)}
		</div>
	);
};
