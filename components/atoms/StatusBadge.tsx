import { FC } from "react";
import { NoteStatus } from "@/types/noteStatus";

export interface StatusBadgeProps {
	status: NoteStatus;
	onClick?: () => void;
}

export const StatusBadge: FC<StatusBadgeProps> = ({ status, onClick }) => {
	return (
		<div
			className="status-badge-container"
			style={{
				backgroundColor: `${status.color}15`,
				border: `1px solid ${status.color}30`,
			}}
			onClick={onClick}
		>
			<div className="status-badge-item">
				<span className="status-badge-icon">{status.icon}</span>
				<span className="status-badge-text">{status.name}</span>
			</div>
		</div>
	);
};
