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
			const timer = setTimeout(() => setStatusChanged(false), 600);
			return () => clearTimeout(timer);
		}, [statusEntries.length, allStatuses.map((s) => s.name).join(",")]);

		const handleMouseEnter = () => {
			StatusesInfoPopup.open(statuses);
		};

		const handleMouseLeave = () => {
			StatusesInfoPopup.close();
		};

		const getPrimaryStatus = () => allStatuses[0];

		const containerClasses = [
			"editor-toolbar-button",
			totalStatuses === 0
				? "editor-toolbar-button--no-status"
				: "editor-toolbar-button--has-status",
			totalStatuses > 1 ? "editor-toolbar-button--multiple" : "",
			statusChanged ? "editor-toolbar-button--status-changed" : "",
		]
			.filter(Boolean)
			.join(" ");

		// No status state
		if (totalStatuses === 0) {
			return (
				<button
					type="button"
					className={containerClasses}
					onClick={onClick}
					onMouseEnter={handleMouseEnter}
					onMouseLeave={handleMouseLeave}
					title="No status assigned - click to add"
					aria-label="Add status to note"
				>
					<span
						className="editor-toolbar-button__icon"
						style={{ color: unknownStatusConfig.color }}
					>
						{unknownStatusConfig.icon}
					</span>
					<span className="editor-toolbar-button__text">
						Add Status
					</span>
				</button>
			);
		}

		const primaryStatus = getPrimaryStatus();

		// Single status
		if (totalStatuses === 1) {
			return (
				<button
					type="button"
					className={containerClasses}
					onClick={onClick}
					onMouseEnter={handleMouseEnter}
					onMouseLeave={handleMouseLeave}
					title={`Status: ${primaryStatus.name} - click to change`}
					aria-label={`Current status: ${primaryStatus.name}. Click to change.`}
					style={
						{
							"--status-color":
								primaryStatus.color ||
								"var(--interactive-accent)",
						} as React.CSSProperties
					}
				>
					<span
						className="editor-toolbar-button__icon"
						style={{
							color:
								primaryStatus.color ||
								"var(--interactive-accent)",
						}}
					>
						{primaryStatus.icon || "📝"}
					</span>
					<span className="editor-toolbar-button__text">
						{primaryStatus.name}
					</span>
				</button>
			);
		}

		// Multiple statuses - show primary + counter
		return (
			<button
				type="button"
				className={containerClasses}
				onClick={onClick}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				title={`${totalStatuses} statuses: ${allStatuses.map((s) => s.name).join(", ")} - click to change`}
				aria-label={`${totalStatuses} statuses assigned. Click to change.`}
				style={
					{
						"--status-color":
							primaryStatus.color || "var(--interactive-accent)",
					} as React.CSSProperties
				}
			>
				<span className="editor-toolbar-button__icon-stack">
					<span
						className="editor-toolbar-button__icon"
						style={{
							color:
								primaryStatus.color ||
								"var(--interactive-accent)",
						}}
					>
						{primaryStatus.icon || "📝"}
					</span>
					<span className="editor-toolbar-button__counter">
						{totalStatuses}
					</span>
				</span>
				<span className="editor-toolbar-button__text">
					{totalStatuses} Status{totalStatuses === 1 ? "" : "es"}
				</span>
			</button>
		);
	},
);
