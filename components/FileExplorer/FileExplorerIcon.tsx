import { GroupedStatuses } from "@/types/noteStatus";
import React, { FC, memo } from "react";

type Props = {
	statuses: GroupedStatuses;
	onMouseEnter: (statuses: GroupedStatuses) => void;
	onMouseLeave: (statuses: GroupedStatuses) => void;
	hideUnknownStatus?: boolean;
	unknownStatusConfig?: {
		icon: string;
		color: string;
	};
};

export const FileExplorerIcon: FC<Props> = memo(
	({
		statuses,
		onMouseLeave,
		onMouseEnter,
		hideUnknownStatus,
		unknownStatusConfig,
	}) => {
		const statusEntries = Object.entries(statuses);
		const totalStatuses = statusEntries.reduce(
			(acc, [, list]) => acc + list.length,
			0,
		);

		if (totalStatuses === 0) {
			// If hideUnknownStatus is enabled, don't show anything for files without status
			if (hideUnknownStatus) return null;

			// Use config passed from integration, with fallbacks
			const icon = unknownStatusConfig?.icon || "❓";
			const color = unknownStatusConfig?.color || "#8b949e";

			return (
				<div className="status-wrapper">
					<div
						className="status-minimal status-minimal--no-status"
						onMouseEnter={() => onMouseEnter({})}
						onMouseLeave={() => onMouseLeave({})}
						style={
							{
								"--primary-color": color,
							} as React.CSSProperties
						}
					>
						<span className="status-icon">{icon}</span>
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
