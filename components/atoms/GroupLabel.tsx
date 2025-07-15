import { FC } from "react";

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
			<svg
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				className="lucide lucide-folder"
			>
				<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
			</svg>
			{name}
		</span>
	);
};
