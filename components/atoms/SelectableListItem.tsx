import React, { ReactNode } from "react";
import { ObsidianIcon } from "./ObsidianIcon";

interface SelectableListItemProps {
	selected?: boolean;
	focused?: boolean;
	icon?: ReactNode;
	children: ReactNode;
	onClick?: (e: React.MouseEvent) => void;
	className?: string;
	title?: string;
}

export const SelectableListItem: React.FC<SelectableListItemProps> = ({
	selected = false,
	focused = false,
	icon,
	children,
	onClick,
	className = "",
	title,
}) => {
	const handleClick = (e: React.MouseEvent) => {
		if (onClick) {
			setTimeout(() => {
				onClick(e);
			}, 150);
		}
	};

	const composedClassName = ["selectable-list-item", className]
		.filter(Boolean)
		.join(" ");

	return (
		<div
			className={composedClassName}
			data-selected={selected}
			data-focused={focused}
			onClick={handleClick}
			title={title}
		>
			{icon && <span className="selectable-list-item-icon">{icon}</span>}
			<span className="selectable-list-item-content">{children}</span>
			{selected && (
				<ObsidianIcon
					name="check"
					className="selectable-list-item-check"
				/>
			)}
		</div>
	);
};
