import React from "react";
import { NoteStatus } from "@/types/noteStatus";
import { StatusDisplay } from "../atoms/StatusDisplay";
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
					<StatusDisplay
						key={`${status.templateId || "custom"}:${status.name}`}
						status={status}
						variant="chip"
						removable
						onRemove={() => onRemoveStatus(status)}
					/>
				))}
			</div>
		</SettingItem>
	);
};
