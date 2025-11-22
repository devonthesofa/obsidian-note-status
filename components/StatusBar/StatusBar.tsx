import { GroupedStatuses } from "@/types/noteStatus";
import { CSSProperties, FC } from "react";
import {
	StatusBarProvider,
	Props as StatusBarContextProps,
} from "./StatusBarContext";
import { StatusBarGroup } from "./StatusBarGroup";
import { StatusIcon } from "@/components/atoms/StatusIcon";

export type Props = {
	statuses: GroupedStatuses;
	templates?: { [key: string]: { description: string } };
	hideIfNotStatuses?: boolean;
	onStatusClick: StatusBarContextProps["onStatusClick"];
	templateNameMode?: "always" | "never" | "auto";
	noStatusConfig?: {
		text: string;
		showIcon: boolean;
		showText: boolean;
		icon: string;
		lucideIcon?: string;
		color: string;
	};
};

export const StatusBar: FC<Props> = ({
	statuses,
	hideIfNotStatuses,
	onStatusClick,
	templateNameMode = "auto",
	noStatusConfig,
}) => {
	const statusEntries = Object.entries(statuses);
	const hasStatuses = statusEntries.flatMap((s) => s[1]).length > 0;

	if (!hasStatuses) {
		if (hideIfNotStatuses) return null;

		if (
			!noStatusConfig ||
			(!noStatusConfig.showIcon && !noStatusConfig.showText)
		) {
			return null;
		}

		return (
			<span
				className="status-bar-item status-bar-no-status mod-clickable"
				onClick={() => onStatusClick({ name: "", icon: "" })}
				style={
					noStatusConfig.color
						? ({
								"--status-empty-color": noStatusConfig.color,
							} as CSSProperties)
						: undefined
				}
			>
				{noStatusConfig.showIcon && (
					<StatusIcon
						icon={noStatusConfig.icon}
						lucideIcon={noStatusConfig.lucideIcon}
						size={14}
						className="status-bar-no-status__icon"
					/>
				)}
				{noStatusConfig.showText && (
					<span className="status-bar-no-status__label">
						{noStatusConfig.text}
					</span>
				)}
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
						templateNameMode={templateNameMode}
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
