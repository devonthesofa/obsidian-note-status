import { NoteStatus } from "@/types/noteStatus";
import React from "react";

interface StatusChipProps {
	status: NoteStatus;
}

export const TemplateStatusChip: React.FC<StatusChipProps> = ({ status }) => (
	<div className="template-status-chip">
		<span
			className="template-status-color-dot"
			style={{ "--dot-color": status.color } as React.CSSProperties}
		/>
		<span>
			{status.icon} {status.name}
		</span>
	</div>
);
