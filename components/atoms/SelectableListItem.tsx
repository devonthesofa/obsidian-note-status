import React, { ReactNode, useState } from "react";

interface SelectableListItemProps {
	selected?: boolean;
	focused?: boolean;
	icon?: ReactNode;
	children: ReactNode;
	onClick?: () => void;
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
	const [isHovered, setIsHovered] = useState(false);

	const handleClick = () => {
		if (onClick) {
			setTimeout(() => {
				onClick();
			}, 150);
		}
	};

	return (
		<div
			className={`selectable-list-item ${className}`}
			onClick={handleClick}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			title={title}
			style={{
				display: "flex",
				alignItems: "center",
				gap: "12px",
				padding: "8px 12px",
				cursor: onClick ? "pointer" : "default",
				borderBottom: "1px solid var(--background-modifier-border)",
				transition: "background-color 150ms ease",
				background:
					selected || isHovered || focused
						? "var(--background-modifier-hover)"
						: "",
				outline: focused
					? "2px solid var(--interactive-accent)"
					: "none",
				outlineOffset: "-2px",
			}}
		>
			{icon && (
				<span
					className="selectable-list-item-icon"
					style={{
						fontSize: "16px",
						minWidth: "20px",
					}}
				>
					{icon}
				</span>
			)}
			<span
				className="selectable-list-item-content"
				style={{
					flex: "1",
					fontSize: "var(--font-ui-small)",
				}}
			>
				{children}
			</span>
			{selected && (
				<div
					className="selectable-list-item-check"
					style={{
						color: "var(--interactive-accent)",
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
					>
						<polyline points="20,6 9,17 4,12" />
					</svg>
				</div>
			)}
		</div>
	);
};
