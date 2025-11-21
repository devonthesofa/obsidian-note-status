import { StatusIconPreview } from "@/components/atoms/StatusIconPreview";
import { GroupedStatuses } from "@/types/noteStatus";
import React, { FC, memo } from "react";
import { StatusIcon } from "@/components/atoms/StatusIcon";
import {
	getPrimaryStatus,
	getUnknownStatusColor,
	resolveStatusColor,
} from "@/utils/statusColor";

type Props = {
	statuses: GroupedStatuses;
	defaultTagName: string;
	onMouseEnter: (payload: {
		statuses: GroupedStatuses;
		defaultTagName: string;
	}) => void;
	onMouseLeave: () => void;
	hideUnknownStatus?: boolean;
	unknownStatusConfig?: {
		icon: string;
		lucideIcon?: string;
		color: string;
	};
	iconFrameMode?: "always" | "never";
	iconColorMode?: "status" | "theme";
};

export const FileExplorerIcon: FC<Props> = memo(
	({
		statuses,
		defaultTagName,
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

		if (totalStatuses === 0) {
			if (hideUnknownStatus) return null;

			const icon = unknownStatusConfig?.icon || "❓";
			const color = useStatusColors
				? unknownStatusConfig?.color?.trim() || getUnknownStatusColor()
				: undefined;

			return (
				<StatusIconPreview
					icon={
						<StatusIcon
							icon={icon}
							lucideIcon={unknownStatusConfig?.lucideIcon}
							size={16}
						/>
					}
					color={color}
					iconColorMode={iconColorMode}
					iconFrameMode={iconFrameMode}
					onMouseEnter={() =>
						onMouseEnter({ statuses: {}, defaultTagName })
					}
					onMouseLeave={onMouseLeave}
				/>
			);
		}

		const primaryStatus = getPrimaryStatus(statuses);
		if (!primaryStatus) return null;
		const iconColor = useStatusColors
			? resolveStatusColor(primaryStatus)
			: undefined;

		return (
			<StatusIconPreview
				icon={
					<StatusIcon
						icon={primaryStatus.icon}
						lucideIcon={primaryStatus.lucideIcon}
						size={16}
					/>
				}
				color={iconColor}
				count={totalStatuses}
				iconFrameMode={iconFrameMode}
				iconColorMode={iconColorMode}
				onMouseEnter={() => onMouseEnter({ statuses, defaultTagName })}
				onMouseLeave={onMouseLeave}
			/>
		);
	},
);
