import { FC } from "react";

export interface CollapsibleCounterProps {
	count: number;
	isCollapsed: boolean;
	onToggle: React.MouseEventHandler<HTMLSpanElement>;
}

export const CollapsibleCounter: FC<CollapsibleCounterProps> = ({
	count,
	isCollapsed,
	onToggle,
}) => {
	if (count <= 0) return null;

	return (
		<span
			className="mod-clickable collapsible-counter-container"
			onClick={onToggle}
		>
			{isCollapsed ? "+" : "-"}
			{count}
		</span>
	);
};
