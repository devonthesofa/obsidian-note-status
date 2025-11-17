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
	iconColorMode?: "status" | "theme";
};

export const FileExplorerIcon: FC<Props> = memo(
	({
		statuses,
		onMouseLeave,
		onMouseEnter,
		hideUnknownStatus,
		unknownStatusConfig,
		iconFrameMode = "never",
		iconColorMode = "status",
	}) => {
		const statusEntries = Object.entries(statuses);
		const totalStatuses = statusEntries.reduce(
			(acc, [, list]) => acc + list.length,
			0,
		);

		const useStatusColors = iconColorMode === "status";

		const getStatusColor = (color?: string) =>
			(color && color.trim()) || "var(--text-accent)";

		if (totalStatuses === 0) {
			// If hideUnknownStatus is enabled, don't show anything for files without status
			if (hideUnknownStatus) return null;

			// Use config passed from integration, with fallbacks
			const icon = unknownStatusConfig?.icon || "❓";
			const color = useStatusColors
				? unknownStatusConfig?.color?.trim() || "#8b949e"
				: undefined;

			const shouldFrameUnknown = iconFrameMode === "always";

			const unknownStyles: React.CSSProperties = {};
			if (color) {
				unknownStyles.color = color;
			}
			if (shouldFrameUnknown) {
				const frameColor = color || "currentColor";
				unknownStyles.boxShadow = `0 0 0 1px ${frameColor}`;
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
		const iconColor = useStatusColors
			? getStatusColor(primaryStatus.color)
			: undefined;
		const shouldShowFrame = iconFrameMode === "always";
		const iconStyles: React.CSSProperties = {};
		if (iconColor) {
			iconStyles.color = iconColor;
		}
		if (shouldShowFrame) {
			const frameColor = iconColor || "currentColor";
			iconStyles.boxShadow = `0 0 0 1px ${frameColor}`;
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
							style={
								iconColor
									? { backgroundColor: iconColor }
									: undefined
							}
						>
							{totalStatuses}
						</span>
					)}
				</div>
			</div>
		);
	},
);
