import React, { CSSProperties, FC, memo } from "react";

type IconFrameMode = "always" | "never";
type IconColorMode = "status" | "theme";

export interface StatusIconPreviewProps {
	icon?: string;
	color?: string;
	count?: number;
	iconFrameMode?: IconFrameMode;
	iconColorMode?: IconColorMode;
	withWrapper?: boolean;
	compact?: boolean;
	iconClassName?: string;
	wrapperClassName?: string;
	style?: CSSProperties;
	onMouseEnter?: (event: React.MouseEvent<HTMLDivElement>) => void;
	onMouseLeave?: (event: React.MouseEvent<HTMLDivElement>) => void;
}

export const StatusIconPreview: FC<StatusIconPreviewProps> = memo(
	({
		icon,
		color,
		count,
		iconFrameMode = "never",
		iconColorMode = "status",
		withWrapper = true,
		compact = false,
		iconClassName = "",
		wrapperClassName = "",
		style,
		onMouseEnter,
		onMouseLeave,
	}) => {
		const iconDisplay = icon?.trim().length ? icon : "📝";
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
				<span className="status-minimal__icon">{iconDisplay}</span>
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
