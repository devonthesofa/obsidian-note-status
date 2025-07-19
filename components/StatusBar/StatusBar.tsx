import { GroupedStatuses } from "@/types/noteStatus";
import { FC } from "react";
import {
	StatusBarProvider,
	Props as StatusBarContextProps,
} from "./StatusBarContext";
import { StatusBarGroup } from "./StatusBarGroup";

export type Props = {
	statuses: GroupedStatuses;
	templates?: { [key: string]: { description: string } };
	hideIfNotStatuses?: boolean;
	onStatusClick: StatusBarContextProps["onStatusClick"];
};

export const StatusBar: FC<Props> = ({
	statuses,
	hideIfNotStatuses,
	onStatusClick,
}) => {
	const statusEntries = Object.entries(statuses);
	const hasStatuses = statusEntries.flatMap((s) => s[1]).length > 0;

	if (!hasStatuses) {
		if (hideIfNotStatuses) return null;
		return (
			<span
				className="status-bar-item mod-clickable"
				onClick={() => onStatusClick({ name: "", icon: "" })}
				style={{ cursor: "pointer" }}
			>
				No status
			</span>
		);
	}

	return (
		<StatusBarProvider onStatusClick={onStatusClick}>
			<div className="status-bar-group-row">
				{statusEntries.map(([frontmatterTagName, statusList]) => (
					<StatusBarGroup
						key={frontmatterTagName}
						statuses={statusList}
						template={{
							description: "Note status",
							name: "",
							statuses: statusList,
							id: "inANearFutureBeWillGroupStatusesByTemplates",
						}}
					/>
				))}
			</div>
		</StatusBarProvider>
	);
};
