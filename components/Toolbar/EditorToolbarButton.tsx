import React, { FC, memo, useEffect, useState } from "react";
import { GroupedStatuses } from "@/types/noteStatus";
import { StatusesInfoPopup } from "@/integrations/popups/statusesInfoPopupIntegration";

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

		const handleMouseEnter = () => {
			StatusesInfoPopup.open(statuses);
		};

		const handleMouseLeave = () => {
			StatusesInfoPopup.close();
		};

		const getDisplayText = () => {
			if (totalStatuses === 0) return "No Status";
			if (totalStatuses === 1) return allStatuses[0].name;
			return `${totalStatuses} Statuses`;
		};

		const getPrimaryColor = () => {
			if (totalStatuses === 0) return unknownStatusConfig.color;
			return allStatuses[0]?.color || "var(--interactive-accent)";
		};

		const badgeClasses = [
			"editor-toolbar-badge",
			totalStatuses === 0
				? "editor-toolbar-badge--no-status"
				: "editor-toolbar-badge--has-status",
			statusChanged ? "editor-toolbar-badge--status-changed" : "",
		]
			.filter(Boolean)
			.join(" ");

		return (
			<div
				className={badgeClasses}
				onClick={onClick}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				style={
					{
						"--status-color": getPrimaryColor(),
					} as React.CSSProperties
				}
			>
				<span className="editor-toolbar-badge__text">
					{getDisplayText()}
				</span>
			</div>
		);
	},
);
