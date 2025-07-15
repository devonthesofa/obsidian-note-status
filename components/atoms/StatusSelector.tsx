import React, { useState } from "react";
import { NoteStatus } from "@/types/noteStatus";
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

export interface Props {
	currentStatuses: NoteStatus[];
	availableStatuses: NoteStatus[];
	onToggleStatus: (status: NoteStatus, selected: boolean) => void;
}

export const StatusSelector: React.FC<Props> = ({
	currentStatuses,
	availableStatuses,
	onToggleStatus,
}) => {
	const handleSelectStatus = async (status: NoteStatus) => {
		const selected =
			currentStatuses.findIndex((s) => s.name === status.name) !== -1;
		onToggleStatus(status, !selected);
	};

	// TODO: The StatusSelector must be splitted by its template
	return (
		<div
			className="note-status-options"
			style={{
				maxHeight: "300px",
				overflowY: "auto",
				border: "1px solid var(--background-modifier-border)",
				borderRadius: "var(--radius-s)",
				background: "var(--background-primary)",
			}}
		>
			{availableStatuses.map((status) => (
				<StatusModalOption
					key={`${status.name}${status.description}${status.color}${status.icon}`}
					status={status}
					isSelected={
						currentStatuses.findIndex(
							(s) => s.name === status.name,
						) !== -1
					}
					onSelect={() => handleSelectStatus(status)}
				/>
			))}
		</div>
	);
};
