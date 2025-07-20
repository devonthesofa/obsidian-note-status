import React from "react";
import { GroupedStatuses, NoteStatus } from "@/types/noteStatus";
import {
	StatusSelectorGroup,
	Props as StatusSelectorGroupProps,
} from "./StatusSelectorGroup";

export interface Props {
	currentStatuses: GroupedStatuses;
	filesQuantity: number;
	availableStatuses: NoteStatus[];
	onRemoveStatus: (
		frontmatterTagName: string,
		status: NoteStatus,
	) => Promise<void>;
	onSelectStatus: (
		frontmatterTagName: string,
		status: NoteStatus,
	) => Promise<void>;
}

export const ChangeStatusModal: React.FC<Props> = ({
	currentStatuses: initialStatuses,
	filesQuantity,
	availableStatuses,
	onRemoveStatus,
	onSelectStatus,
}) => {
	const currentStatuses = Object.entries(initialStatuses);

	const handleSelectedState: StatusSelectorGroupProps["onSelectedState"] = (
		frontmatterTagName,
		status,
		action,
	) => {
		if (action === "select") {
			onSelectStatus(frontmatterTagName, status);
		} else {
			onRemoveStatus(frontmatterTagName, status);
		}
	};

	return (
		<>
			<h1>Change note status {filesQuantity}</h1>

			{currentStatuses.map(([frontmatterTagName, statusList]) => (
				<StatusSelectorGroup
					key={frontmatterTagName}
					frontmatterTagName={frontmatterTagName}
					availableStatuses={availableStatuses}
					currentStatuses={statusList}
					onSelectedState={handleSelectedState}
				/>
			))}
		</>
	);
};
