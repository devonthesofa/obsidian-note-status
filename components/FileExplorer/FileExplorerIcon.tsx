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
	iconFrameMode?: "always" | "never";
};

export const FileExplorerIcon: FC<Props> = memo(
	({
		statuses,
		onMouseLeave,
		onMouseEnter,
		hideUnknownStatus,
		unknownStatusConfig,
		iconFrameMode = "never",
	}) => {
		const statusEntries = Object.entries(statuses);
		const totalStatuses = statusEntries.reduce(
			(acc, [, list]) => acc + list.length,
			0,
		);

		const getStatusColor = (color?: string) =>
			(color && color.trim()) || "var(--text-accent)";

		if (totalStatuses === 0) {
			// If hideUnknownStatus is enabled, don't show anything for files without status
			if (hideUnknownStatus) return null;

			// Use config passed from integration, with fallbacks
			const icon = unknownStatusConfig?.icon || "❓";
			const color = unknownStatusConfig?.color?.trim() || "#8b949e";

			const shouldFrameUnknown = iconFrameMode === "always";

			const unknownStyles: React.CSSProperties = { color };
			if (shouldFrameUnknown) {
				unknownStyles.boxShadow = `0 0 0 1px ${color}`;
				unknownStyles.borderRadius = "var(--radius-s)";
			}

			return (
				<div className="status-wrapper">
					<div
						className="status-minimal status-minimal--no-status"
						onMouseEnter={() => onMouseEnter({})}
						onMouseLeave={() => onMouseLeave({})}
						style={unknownStyles}
					>
						<span className="status-minimal__icon">{icon}</span>
					</div>
				</div>
			);
		}

		const primaryStatus = statusEntries[0]?.[1]?.[0];
		if (!primaryStatus) return null;
		const iconColor = getStatusColor(primaryStatus.color);
		const shouldShowFrame = iconFrameMode === "always";
		const iconStyles: React.CSSProperties = { color: iconColor };
		if (shouldShowFrame) {
			iconStyles.boxShadow = `0 0 0 1px ${iconColor}`;
			iconStyles.borderRadius = "var(--radius-s)";
		}

		return (
			<div className="status-wrapper">
				<div
					className="status-minimal"
					onMouseEnter={() => onMouseEnter(statuses)}
					onMouseLeave={() => onMouseLeave(statuses)}
					style={iconStyles}
				>
					<span className="status-minimal__icon">
						{primaryStatus.icon}
					</span>
					{totalStatuses > 1 && (
						<span
							className="status-minimal__count"
							style={{ backgroundColor: iconColor }}
						>
							{totalStatuses}
						</span>
					)}
				</div>
			</div>
		);
	},
);
