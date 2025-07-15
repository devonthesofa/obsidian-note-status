import React from "react";

interface SettingItemProps {
	name: string;
	description: string;
	vertical?: boolean;
	children: React.ReactNode;
}

export const SettingItem: React.FC<SettingItemProps> = ({
	name,
	description,
	children,
	vertical,
}) => (
	<div className={`setting-item ${vertical && "setting-item-vertical"}`}>
		<div className="setting-item-info">
			<div className="setting-item-name">{name}</div>
			<div className="setting-item-description">{description}</div>
		</div>
		<div
			className={vertical ? "setting-item-full" : "setting-item-control"}
		>
			{children}
		</div>
	</div>
);
