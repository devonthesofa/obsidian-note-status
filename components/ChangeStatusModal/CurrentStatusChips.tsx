import React from "react";
import { NoteStatus } from "@/types/noteStatus";
import { StatusChip } from "../atoms/StatusChip";
import { SettingItem } from "../SettingsUI.tsx/SettingItem";

interface Props {
	currentStatuses: NoteStatus[];
	onRemoveStatus: (status: NoteStatus) => void;
}

export const CurrentStatusChips: React.FC<Props> = ({
	currentStatuses,
	onRemoveStatus,
}) => {
	return (
		<SettingItem name="Available statuses" vertical>
			<div
				className="note-status-chips"
				style={{
					display: "flex",
					flexWrap: "wrap",
					gap: "6px",
					minHeight: "32px",
					alignItems: "center",
				}}
			>
				{currentStatuses.map((status) => (
					<StatusChip
						key={status.name}
						status={status}
						onRemove={() => onRemoveStatus(status)}
					/>
				))}
			</div>
		</SettingItem>
	);
};
