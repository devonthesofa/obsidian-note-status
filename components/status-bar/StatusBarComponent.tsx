import React from "react";
import { setTooltip } from "obsidian";

interface StatusInfo {
	name: string;
	icon: string;
	tooltipText: string;
}

interface StatusBarComponentProps {
	statuses: StatusInfo[];
	isVisible: boolean;
	className?: string;
}

export const StatusBarComponent: React.FC<StatusBarComponentProps> = ({
	statuses,
	isVisible,
	className = "",
}) => {
	const containerRef = React.useRef<HTMLDivElement>(null);
	const statusRefs = React.useRef<(HTMLSpanElement | null)[]>([]);

	React.useEffect(() => {
		// Set tooltips after render
		statusRefs.current.forEach((ref, index) => {
			if (ref && statuses[index]) {
				setTooltip(ref, statuses[index].tooltipText);
			}
		});
	}, [statuses]);

	if (!isVisible) {
		return null;
	}

	const renderSingleStatus = (status: StatusInfo, index: number) => (
		<React.Fragment key={`single-${status.name}`}>
			<span
				ref={(el) => (statusRefs.current[index * 2] = el)}
				className={`note-status-${status.name}`}
			>
				Status: {status.name}
			</span>
			<span
				ref={(el) => (statusRefs.current[index * 2 + 1] = el)}
				className={`note-status-icon status-${status.name}`}
			>
				{status.icon}
			</span>
		</React.Fragment>
	);

	const renderMultipleStatuses = () => (
		<React.Fragment>
			<span className="note-status-label">Statuses: </span>
			<span className="note-status-badges">
				{statuses.map((status, index) => (
					<span
						key={status.name}
						ref={(el) => (statusRefs.current[index] = el)}
						className={`note-status-badge status-${status.name}`}
					>
						<span className="note-status-badge-icon">
							{status.icon}
						</span>
						<span className="note-status-badge-text">
							{status.name}
						</span>
					</span>
				))}
			</span>
		</React.Fragment>
	);

	return (
		<div
			ref={containerRef}
			className={`note-status-bar visible ${className}`}
		>
			{statuses.length === 1
				? renderSingleStatus(statuses[0], 0)
				: renderMultipleStatuses()}
		</div>
	);
};
