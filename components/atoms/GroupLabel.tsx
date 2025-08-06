import { FC } from "react";
import { ObsidianIcon } from "./ObsidianIcon";

export interface GroupLabelProps {
	name: string;
	isHighlighted?: boolean;
}

export const GroupLabel: FC<GroupLabelProps> = ({
	name,
	isHighlighted = false,
}) => {
	if (!name) return null;

	return (
		<span
			className="setting-item-name group-label-container"
			style={{
				color: isHighlighted
					? "var(--text-normal)"
					: "var(--text-muted)",
				display: "flex",
				alignItems: "center",
				gap: "0.5rem",
			}}
		>
			<ObsidianIcon name="folder" size={16} />
			{name}
		</span>
	);
};
