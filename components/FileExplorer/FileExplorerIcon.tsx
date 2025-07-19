import { GroupedStatuses } from "@/types/noteStatus";
import React, { FC, memo } from "react";

type Props = {
	statuses: GroupedStatuses;
	onMouseEnter: (statuses: GroupedStatuses) => void;
	onMouseLeave: (statuses: GroupedStatuses) => void;
	showNoStatusIcon?: boolean;
};

export const FileExplorerIcon: FC<Props> = memo(
	({ statuses, onMouseLeave, onMouseEnter, showNoStatusIcon }) => {
		const statusEntries = Object.entries(statuses);
		const totalStatuses = statusEntries.reduce(
			(acc, [, list]) => acc + list.length,
			0,
		);

		if (totalStatuses === 0) {
			if (!showNoStatusIcon) return null;

			// Show "no status" icon
			return (
				<div className="status-wrapper">
					<div
						className="status-minimal status-minimal--no-status"
						onMouseEnter={() => onMouseEnter({})}
						onMouseLeave={() => onMouseLeave({})}
						style={
							{
								"--primary-color": "var(--text-muted)",
							} as React.CSSProperties
						}
					>
						<span className="status-icon">❓</span>
					</div>
				</div>
			);
		}

		const primaryStatus = statusEntries[0]?.[1]?.[0];
		if (!primaryStatus) return null;

		return (
			<div className="status-wrapper">
				<div
					className="status-minimal"
					onMouseEnter={() => onMouseEnter(statuses)}
					onMouseLeave={() => onMouseLeave(statuses)}
					style={
						{
							"--primary-color":
								primaryStatus.color || "var(--text-accent)",
						} as React.CSSProperties
					}
				>
					<span className="status-icon">{primaryStatus.icon}</span>
					{totalStatuses > 1 && (
						<span className="status-count">{totalStatuses}</span>
					)}
				</div>
			</div>
		);
	},
);
