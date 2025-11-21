import React, { FC, memo } from "react";
import { GroupedStatuses } from "@/types/noteStatus";
import { StatusesInfoPopup } from "@/integrations/popups/statusesInfoPopupIntegration";
import { StatusIcon } from "@/components/atoms/StatusIcon";

interface EditorToolbarButtonProps {
	statuses: GroupedStatuses;
	onClick: () => void;
	unknownStatusConfig: {
		icon: string;
		lucideIcon?: string;
		color: string;
	};
}

export const EditorToolbarButton: FC<EditorToolbarButtonProps> = memo(
	({ statuses, onClick, unknownStatusConfig }) => {
		const statusEntries = Object.entries(statuses);
		const allStatuses = statusEntries.flatMap(
			([_, statusList]) => statusList,
		);
		const totalStatuses = allStatuses.length;

		const handleMouseEnter = () => {
			StatusesInfoPopup.open(statuses);
		};

		const handleMouseLeave = () => {
			StatusesInfoPopup.close();
		};

		const getPrimaryStatus = () => allStatuses[0];

		// No status state
		if (totalStatuses === 0) {
			return (
				<button
					type="button"
					className="clickable-icon"
					onClick={onClick}
					onMouseEnter={handleMouseEnter}
					onMouseLeave={handleMouseLeave}
					aria-label="Add status to note"
				>
					<StatusIcon
						icon={unknownStatusConfig.icon}
						lucideIcon={unknownStatusConfig.lucideIcon}
						size={16}
						className="editor-toolbar-button__icon"
						style={{ color: unknownStatusConfig.color }}
					/>
				</button>
			);
		}

		const primaryStatus = getPrimaryStatus();

		// Single status
		if (totalStatuses === 1) {
			return (
				<button
					type="button"
					className="clickable-icon"
					onClick={onClick}
					onMouseEnter={handleMouseEnter}
					onMouseLeave={handleMouseLeave}
					aria-label={`Current status: ${primaryStatus.name}. Click to change.`}
				>
					<StatusIcon
						icon={primaryStatus.icon}
						lucideIcon={primaryStatus.lucideIcon}
						size={16}
						className="editor-toolbar-button__icon editor-toolbar-button__icon--has-status"
						style={{
							color:
								primaryStatus.color ||
								"var(--interactive-accent)",
						}}
					/>
				</button>
			);
		}

		// Multiple statuses - show primary + counter
		return (
			<button
				type="button"
				className="clickable-icon"
				onClick={onClick}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				aria-label={`${totalStatuses} statuses assigned. Click to change.`}
			>
				<div className="editor-toolbar-button__icon-container">
					<StatusIcon
						icon={primaryStatus.icon}
						lucideIcon={primaryStatus.lucideIcon}
						size={16}
						className="editor-toolbar-button__icon editor-toolbar-button__icon--has-status"
						style={{
							color:
								primaryStatus.color ||
								"var(--interactive-accent)",
						}}
					/>
					<span className="editor-toolbar-button__counter">
						{totalStatuses}
					</span>
				</div>
			</button>
		);
	},
);
