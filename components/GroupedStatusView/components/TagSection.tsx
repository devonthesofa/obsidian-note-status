import React, { useCallback } from "react";
import { GroupLabel } from "@/components/atoms/GroupLabel";
import { CollapsibleCounter } from "@/components/atoms/CollapsibleCounter";
import { FilesByStatus, FileItem, StatusItem } from "../GroupedStatusView";
import { StatusGroup } from "./StatusGroup";

interface TagSectionProps {
	tag: string;
	statusGroups: FilesByStatus;
	isExpanded: boolean;
	statusMap: Map<string, StatusItem>;
	expandedFiles: Set<string>;
	getLoadedCount: (groupKey: string) => number;
	onToggle: () => void;
	onToggleFiles: (groupKey: string) => void;
	onFileClick: (file: FileItem) => void;
	onScroll: (
		e: React.UIEvent<HTMLDivElement>,
		groupKey: string,
		totalItems: number,
	) => void;
	onLoadMore: (groupKey: string) => void;
}

export const TagSection = ({
	tag,
	statusGroups,
	isExpanded,
	statusMap,
	expandedFiles,
	getLoadedCount,
	onToggle,
	onToggleFiles,
	onFileClick,
	onScroll,
	onLoadMore,
}: TagSectionProps) => {
	const totalFilesInTag = Object.values(statusGroups).reduce(
		(total, files) => total + files.length,
		0,
	);

	const handleToggle = useCallback(() => {
		onToggle();
	}, [onToggle]);

	const handleToggleFiles = useCallback(
		(groupKey: string) => {
			onToggleFiles(groupKey);
		},
		[onToggleFiles],
	);

	return (
		<div className="grouped-status-tag-section">
			<div className="grouped-status-tag-header" onClick={handleToggle}>
				<GroupLabel name={tag} />
				<CollapsibleCounter
					count={totalFilesInTag}
					isCollapsed={!isExpanded}
					onToggle={handleToggle}
				/>
			</div>

			{isExpanded && (
				<div className="grouped-status-tag-content">
					{Object.entries(statusGroups).map(([statusName, files]) => {
						if (files.length === 0) return null;

						const status = statusMap.get(statusName);
						if (!status) return null;

						const groupKey = `${tag}-${statusName}`;
						const filesExpanded = expandedFiles.has(groupKey);
						const loadedCount = getLoadedCount(groupKey);

						return (
							<StatusGroup
								key={statusName}
								statusName={statusName}
								status={status}
								files={files}
								tag={tag}
								isExpanded={filesExpanded}
								loadedCount={loadedCount}
								onToggle={() => handleToggleFiles(groupKey)}
								onFileClick={onFileClick}
								onScroll={onScroll}
								onLoadMore={onLoadMore}
							/>
						);
					})}
				</div>
			)}
		</div>
	);
};
