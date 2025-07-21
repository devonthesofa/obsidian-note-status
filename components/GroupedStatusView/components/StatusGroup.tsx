import React, { useCallback } from "react";
import { StatusDisplay } from "@/components/atoms/StatusDisplay";
import { CollapsibleCounter } from "@/components/atoms/CollapsibleCounter";
import { FileItem, StatusItem } from "../GroupedStatusView";
import { FileList } from "./FileList";
import { NoteStatus } from "@/types/noteStatus";

interface StatusGroupProps {
	statusName: string;
	status: StatusItem;
	files: FileItem[];
	tag: string;
	isExpanded: boolean;
	loadedCount: number;
	onToggle: () => void;
	onFileClick: (file: FileItem) => void;
	onScroll: (
		e: React.UIEvent<HTMLDivElement>,
		groupKey: string,
		totalItems: number,
	) => void;
	onLoadMore: (groupKey: string) => void;
}

export const StatusGroup = ({
	statusName,
	status,
	files,
	tag,
	isExpanded,
	loadedCount,
	onToggle,
	onFileClick,
	onScroll,
	onLoadMore,
}: StatusGroupProps) => {
	const groupKey = `${tag}-${statusName}`;

	// Extract template ID from scoped identifier
	const templateId = statusName.includes(":")
		? statusName.split(":", 2)[0]
		: null;

	const handleToggle = useCallback(() => {
		onToggle();
	}, [onToggle]);

	return (
		<div className="grouped-status-group">
			<div
				className="grouped-status-group__header"
				onClick={handleToggle}
			>
				<div className="grouped-status-group__status">
					<StatusDisplay
						status={
							{ ...status, icon: status.icon || "" } as NoteStatus
						}
						variant="badge"
					/>
					{templateId && (
						<span className="grouped-status-group__template-badge">
							{templateId}
						</span>
					)}
				</div>
				<div className="grouped-status-group__info">
					<CollapsibleCounter
						count={files.length}
						isCollapsed={!isExpanded}
						onToggle={handleToggle}
					/>
				</div>
			</div>

			{isExpanded && (
				<FileList
					files={files}
					groupKey={groupKey}
					loadedCount={loadedCount}
					onFileClick={onFileClick}
					onScroll={onScroll}
					onLoadMore={onLoadMore}
				/>
			)}
		</div>
	);
};
