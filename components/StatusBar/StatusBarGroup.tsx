import { FC, useState } from "react";
import { NoteStatus } from "@/types/noteStatus";
import { StatusTemplate } from "@/types/pluginSettings";
import { GroupLabel } from "../atoms/GroupLabel";
import { CollapsibleCounter } from "../atoms/CollapsibleCounter";
import { StatusDisplay } from "../atoms/StatusDisplay";
import { useStatusBarContext } from "./StatusBarContext";
import settingsService from "@/core/settingsService";

export interface StatusBarGroupProps {
	statuses: NoteStatus[];
	template: StatusTemplate;
	maxVisible?: number;
}

export const StatusBarGroup: FC<StatusBarGroupProps> = ({
	statuses,
	template,
	maxVisible = 3,
}) => {
	const [isUncollapsed, setIsUncollapsed] = useState(false);
	const visibleStatuses = isUncollapsed
		? statuses
		: statuses.slice(0, maxVisible);
	const hiddenCount = Math.max(0, statuses.length - maxVisible);

	const statusNames = statuses.map((s) => s.name);
	const hasConflicts = statusNames.some(
		(name, index) => statusNames.indexOf(name) !== index,
	);
	const { onStatusClick } = useStatusBarContext();

	return (
		<>
			<GroupLabel name={template.name} isHighlighted={isUncollapsed} />
			<div className="status-bar-group-container">
				{visibleStatuses.map((status, i) => (
					<div
						key={i}
						style={{
							animation:
								isUncollapsed && i >= maxVisible
									? `status-slide-in var(--anim-duration-fast) ease-out ${i * 0.05}s both`
									: "none",
						}}
						title={status.description}
					>
						<StatusDisplay
							status={status}
							variant="badge"
							templateNameMode={
								settingsService.settings
									.statusBarShowTemplateName
							}
							hasNameConflicts={hasConflicts}
							onClick={() => {
								onStatusClick(status);
							}}
						/>
					</div>
				))}
				{hiddenCount > 0 && (
					<CollapsibleCounter
						count={hiddenCount}
						isCollapsed={!isUncollapsed}
						onToggle={() => setIsUncollapsed(!isUncollapsed)}
					/>
				)}
			</div>
		</>
	);
};
