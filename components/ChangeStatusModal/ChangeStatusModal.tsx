import React from "react";
import { GroupedStatuses, NoteStatus } from "@/types/noteStatus";
import {
	StatusSelectorGroup,
	Props as StatusSelectorGroupProps,
} from "./StatusSelectorGroup";
import { StatusTemplate } from "@/types/pluginSettings";

export interface Props {
	currentStatuses: GroupedStatuses;
	filesQuantity: number;
	availableStatuses: NoteStatus[];
	templates: StatusTemplate[];
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
	templates,
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
			<h1>
				Change note status ({filesQuantity} file
				{filesQuantity !== 1 ? "s" : ""})
			</h1>

			{currentStatuses.map(([frontmatterTagName, statusList]) => (
				<StatusSelectorGroup
					key={frontmatterTagName}
					frontmatterTagName={frontmatterTagName}
					availableStatuses={availableStatuses}
					currentStatuses={statusList}
					templates={templates}
					onSelectedState={handleSelectedState}
				/>
			))}
		</>
	);
};
