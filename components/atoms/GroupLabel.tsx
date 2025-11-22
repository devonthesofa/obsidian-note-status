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

	const className = [
		"setting-item-name",
		"group-label-container",
		isHighlighted ? "group-label-container--highlighted" : "",
	]
		.filter(Boolean)
		.join(" ");

	return (
		<span className={className}>
			<ObsidianIcon name="folder" size={16} />
			{name}
		</span>
	);
};
