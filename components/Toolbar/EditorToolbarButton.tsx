import React, { FC, memo, useEffect, useState } from "react";
import { GroupedStatuses } from "@/types/noteStatus";
interface EditorToolbarButtonProps {
	statuses: GroupedStatuses;
	onClick: () => void;
	unknownStatusConfig: {
		icon: string;
		color: string;
	};
}
export const EditorToolbarButton: FC<EditorToolbarButtonProps> = memo(
	({ statuses, onClick, unknownStatusConfig }) => {
		const [statusChanged, setStatusChanged] = useState(false);
		const statusEntries = Object.entries(statuses);
		const allStatuses = statusEntries.flatMap(
			([_, statusList]) => statusList,
		);
		const totalStatuses = allStatuses.length;
		// Animate when status changes
		useEffect(() => {
			setStatusChanged(true);
			const timer = setTimeout(() => setStatusChanged(false), 300);
			return () => clearTimeout(timer);
		}, [statusEntries.length, allStatuses.map((s) => s.name).join(",")]);

		const getTooltipText = () => {
			if (totalStatuses === 0) {
				return "No status assigned - click to set status";
			}
			if (totalStatuses === 1) {
				return `Status: ${allStatuses[0].name} - click to change`;
			}
			const statusNames = allStatuses.map((s) => s.name).join(", ");
			return `Statuses: ${statusNames} - click to change`;
		};

		const buttonClasses = [
			"editor-toolbar-btn",
			totalStatuses === 0
				? "editor-toolbar-btn--no-status"
				: "editor-toolbar-btn--has-status",
			statusChanged ? "editor-toolbar-btn--status-changed" : "",
		]
			.filter(Boolean)
			.join(" ");

		if (totalStatuses === 0) {
			return (
				<button
					className={buttonClasses}
					onClick={onClick}
					title={getTooltipText()}
					aria-label={getTooltipText()}
					style={
						{
							"--status-color": unknownStatusConfig.color,
						} as React.CSSProperties
					}
				>
					<span
						className="editor-toolbar-btn__icon"
						aria-hidden="true"
					>
						{unknownStatusConfig.icon}
					</span>
				</button>
			);
		}

		const primaryStatus = allStatuses[0];

		return (
			<button
				className={buttonClasses}
				onClick={onClick}
				title={getTooltipText()}
				aria-label={getTooltipText()}
				style={
					{
						"--status-color":
							primaryStatus.color || "var(--interactive-accent)",
					} as React.CSSProperties
				}
			>
				<span className="editor-toolbar-btn__icon" aria-hidden="true">
					{primaryStatus.icon || "📝"}
				</span>
				{totalStatuses > 1 && (
					<span
						className="editor-toolbar-btn__count"
						aria-label={`${totalStatuses} statuses`}
					>
						{totalStatuses}
					</span>
				)}
			</button>
		);
	},
);
