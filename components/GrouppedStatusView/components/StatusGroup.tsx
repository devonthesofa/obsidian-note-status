import React, { useCallback } from "react";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { CollapsibleCounter } from "@/components/atoms/CollapsibleCounter";
import { FileItem, StatusItem } from "../GrouppedStatusView";
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

	const handleToggle = useCallback(() => {
		onToggle();
	}, [onToggle]);

	return (
		<div className="groupped-status-group">
			<div
				className="groupped-status-group-header"
				onClick={handleToggle}
			>
				<StatusBadge
					status={
						{ ...status, icon: status.icon || "" } as NoteStatus
					}
				/>
				<div className="groupped-status-group-info">
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
