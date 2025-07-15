import React from "react";
import { GroupedStatuses, NoteStatus } from "@/types/noteStatus";
import { StatusModalHeader } from "./StatusModalHeader";
import {
	StatusSelectorGroupedByTag,
	Props as SSGByTagProps,
} from "./StatusSelectorGroupedByTag";

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

export const StatusModal: React.FC<Props> = ({
	currentStatuses: initialStatuses,
	filesQuantity,
	availableStatuses,
	onRemoveStatus,
	onSelectStatus,
}) => {
	const currentStatuses = Object.entries(initialStatuses);

	const handleSelectedState: SSGByTagProps["onSelectedState"] = (
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
		<div className="note-status-modal-content">
			<StatusModalHeader filesQuantity={filesQuantity} />
			{currentStatuses.map(([frontmatterTagName, statusList]) => (
				<StatusSelectorGroupedByTag
					key={frontmatterTagName}
					frontmatterTagName={frontmatterTagName}
					availableStatuses={availableStatuses}
					currentStatuses={statusList}
					onSelectedState={handleSelectedState}
				/>
			))}
		</div>
	);
};
