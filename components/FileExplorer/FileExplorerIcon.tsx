import { StatusIconPreview } from "@/components/atoms/StatusIconPreview";
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
			if (hideUnknownStatus) return null;

			const icon = unknownStatusConfig?.icon || "❓";
			const color = useStatusColors
				? unknownStatusConfig?.color?.trim() || "#8b949e"
				: undefined;

			return (
				<StatusIconPreview
					icon={icon}
					color={color}
					iconColorMode={iconColorMode}
					iconFrameMode={iconFrameMode}
					onMouseEnter={() => onMouseEnter({})}
					onMouseLeave={() => onMouseLeave({})}
				/>
			);
		}

		const primaryStatus = statusEntries[0]?.[1]?.[0];
		if (!primaryStatus) return null;
		const iconColor = useStatusColors
			? getStatusColor(primaryStatus.color)
			: undefined;

		return (
			<StatusIconPreview
				icon={primaryStatus.icon}
				lucideIcon={primaryStatus.lucideIcon}
				color={iconColor}
				count={totalStatuses}
				iconFrameMode={iconFrameMode}
				iconColorMode={iconColorMode}
				onMouseEnter={() => onMouseEnter(statuses)}
				onMouseLeave={() => onMouseLeave(statuses)}
			/>
		);
	},
);
