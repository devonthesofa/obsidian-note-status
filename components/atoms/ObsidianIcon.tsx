import React, { useEffect, useRef } from "react";
import { setIcon } from "obsidian";

interface ObsidianIconProps {
	name: string;
	size?: number;
	className?: string;
}

export const ObsidianIcon: React.FC<ObsidianIconProps> = ({
	name,
	size = 16,
	className = "",
}) => {
	const iconRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (iconRef.current) {
			iconRef.current.innerHTML = "";
			setIcon(iconRef.current, name);
		}
	}, [name]);

	return (
		<div
			ref={iconRef}
			className={`obsidian-icon ${className}`}
			style={{ width: size, height: size }}
		/>
	);
};
