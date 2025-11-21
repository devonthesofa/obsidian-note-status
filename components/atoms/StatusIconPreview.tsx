import React, { CSSProperties, FC, memo } from "react";
import { StatusIcon } from "./StatusIcon";

type IconFrameMode = "always" | "never";
type IconColorMode = "status" | "theme";

export interface StatusIconPreviewProps {
	icon?: string;
	lucideIcon?: string;
	color?: string;
	count?: number;
	iconFrameMode?: IconFrameMode;
	iconColorMode?: IconColorMode;
	withWrapper?: boolean;
	compact?: boolean;
	iconClassName?: string;
	wrapperClassName?: string;
	style?: CSSProperties;
	iconSize?: number;
	onMouseEnter?: (event: React.MouseEvent<HTMLDivElement>) => void;
	onMouseLeave?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

export const StatusIconPreview: FC<StatusIconPreviewProps> = memo(
	({
		icon,
		lucideIcon,
		color,
		count,
		iconFrameMode = "never",
		iconColorMode = "status",
		withWrapper = true,
		compact = false,
		iconClassName = "",
		wrapperClassName = "",
		style,
		iconSize,
		onMouseEnter,
		onMouseLeave,
	}) => {
		const useStatusColor = iconColorMode === "status";
		const appliedColor = useStatusColor && color ? color.trim() : undefined;

		const iconStyles: CSSProperties = {
			...style,
		};

		if (appliedColor) {
			iconStyles.color = appliedColor;
		}

		if (iconFrameMode === "always") {
			const frameColor = appliedColor || "currentColor";
			iconStyles.boxShadow = `0 0 0 1px ${frameColor}`;
			iconStyles.borderRadius = "var(--radius-s)";
		}

		const iconContent = (
			<div
				className={`status-minimal${compact ? " status-minimal--compact" : ""}${iconClassName ? ` ${iconClassName}` : ""}`}
				style={iconStyles}
				onMouseEnter={onMouseEnter}
				onMouseLeave={onMouseLeave}
			>
				<StatusIcon
					icon={icon}
					lucideIcon={lucideIcon}
					size={iconSize ?? (compact ? 13 : 16)}
					className="status-minimal__icon"
				/>
				{count && count > 1 && (
					<span
						className="status-minimal__count"
						style={
							appliedColor
								? {
										backgroundColor: appliedColor,
									}
								: undefined
						}
					>
						{count}
					</span>
				)}
			</div>
		);

		if (!withWrapper) {
			return iconContent;
		}

		return (
			<div
				className={`status-wrapper${wrapperClassName ? ` ${wrapperClassName}` : ""}`}
			>
				{iconContent}
			</div>
		);
	},
);
