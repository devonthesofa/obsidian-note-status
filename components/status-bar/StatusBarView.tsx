import React, { useEffect, useRef } from "react";
import { setTooltip } from "obsidian";

interface StatusBarStatus {
	name: string;
	icon: string;
	tooltipText: string;
}

interface StatusBarViewProps {
	statuses: StatusBarStatus[];
	isVisible: boolean;
	className?: string;
}

interface StatusBadgeProps {
	status: StatusBarStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
	const badgeRef = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		if (badgeRef.current) {
			setTooltip(badgeRef.current, status.tooltipText);
		}
	}, [status.tooltipText]);

	return (
		<span
			ref={badgeRef}
			className={`note-status-badge status-${status.name}`}
		>
			<span className="note-status-badge-icon">{status.icon}</span>
			<span className="note-status-badge-text">{status.name}</span>
		</span>
	);
};

interface SingleStatusProps {
	status: StatusBarStatus;
}

const SingleStatus: React.FC<SingleStatusProps> = ({ status }) => {
	const statusTextRef = useRef<HTMLSpanElement>(null);
	const statusIconRef = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		if (statusTextRef.current) {
			setTooltip(statusTextRef.current, status.tooltipText);
		}
		if (statusIconRef.current) {
			setTooltip(statusIconRef.current, status.tooltipText);
		}
	}, [status.tooltipText]);

	return (
		<>
			<span ref={statusTextRef} className={`note-status-${status.name}`}>
				Status: {status.name}
			</span>
			<span
				ref={statusIconRef}
				className={`note-status-icon status-${status.name}`}
			>
				{status.icon}
			</span>
		</>
	);
};

interface MultipleStatusesProps {
	statuses: StatusBarStatus[];
}

const MultipleStatuses: React.FC<MultipleStatusesProps> = ({ statuses }) => {
	return (
		<>
			<span className="note-status-label">Statuses: </span>
			<span className="note-status-badges">
				{statuses.map((status, index) => (
					<StatusBadge
						key={`${status.name}-${index}`}
						status={status}
					/>
				))}
			</span>
		</>
	);
};

export const StatusBarView: React.FC<StatusBarViewProps> = ({
	statuses,
	isVisible,
	className = "",
}) => {
	const containerRef = useRef<HTMLDivElement>(null);

	const baseClasses = "note-status-bar";
	const visibilityClasses = isVisible ? "visible" : "hidden";
	const finalClassName =
		`${baseClasses} ${visibilityClasses} ${className}`.trim();

	if (!isVisible) {
		return <div className={finalClassName} ref={containerRef} />;
	}

	return (
		<div className={finalClassName} ref={containerRef}>
			{statuses.length === 1 ? (
				<SingleStatus status={statuses[0]} />
			) : (
				<MultipleStatuses statuses={statuses} />
			)}
		</div>
	);
};

export default StatusBarView;
