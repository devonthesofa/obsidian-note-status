import React, { CSSProperties, FC } from "react";
import { ObsidianIcon } from "./ObsidianIcon";
import { resolveLucideIconName } from "@/utils/iconUtils";

interface StatusIconProps {
	icon?: string;
	lucideIcon?: string;
	fallbackIcon?: string;
	className?: string;
	size?: number;
	style?: CSSProperties;
}

export const StatusIcon: FC<StatusIconProps> = ({
	icon,
	lucideIcon,
	fallbackIcon = "📝",
	className = "",
	size,
	style = {},
}) => {
	const lucideName = resolveLucideIconName(lucideIcon, icon);
	const resolvedSize = size ?? 16;
	const combinedClassName = ["status-icon", className]
		.filter(Boolean)
		.join(" ");

	const wrapperStyle: CSSProperties = {
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		lineHeight: 1,
		...style,
	};

	if (size) {
		wrapperStyle.fontSize = `${size}px`;
	}

	const fallbackValue =
		icon && icon.trim().length ? icon : (fallbackIcon ?? "");

	return (
		<span className={combinedClassName} style={wrapperStyle}>
			{lucideName ? (
				<ObsidianIcon name={lucideName} size={resolvedSize} />
			) : (
				fallbackValue
			)}
		</span>
	);
};
