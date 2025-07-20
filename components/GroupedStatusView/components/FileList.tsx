import React, { useCallback } from "react";
import { FileItem } from "../GroupedStatusView";
import { SelectableListItem } from "../../atoms/SelectableListItem";

interface FileListProps {
	files: FileItem[];
	groupKey: string;
	loadedCount: number;
	onFileClick: (file: FileItem) => void;
	onScroll: (
		e: React.UIEvent<HTMLDivElement>,
		groupKey: string,
		totalItems: number,
	) => void;
	onLoadMore: (groupKey: string) => void;
}

export const FileList = ({
	files,
	groupKey,
	loadedCount,
	onFileClick,
	onScroll,
	onLoadMore,
}: FileListProps) => {
	const visibleFiles = files.slice(0, loadedCount);
	const hasMoreItems = files.length > loadedCount;

	const handleFileClick = useCallback(
		(file: FileItem) => {
			onFileClick(file);
		},
		[onFileClick],
	);

	const handleLoadMore = useCallback(() => {
		onLoadMore(groupKey);
	}, [onLoadMore, groupKey]);

	const handleScroll = useCallback(
		(e: React.UIEvent<HTMLDivElement>) => {
			onScroll(e, groupKey, files.length);
		},
		[onScroll, groupKey, files.length],
	);

	return (
		<div className="grouped-status-files">
			<div className="grouped-status-files-list" onScroll={handleScroll}>
				{visibleFiles.map((file) => (
					<SelectableListItem
						key={file.id}
						onClick={() => handleFileClick(file)}
						className="grouped-status-file-item"
						title={file.path}
					>
						<div>
							<span className="grouped-status-file-name">
								{file.name}
							</span>
							<span className="grouped-status-file-path">
								{file.path}
							</span>
						</div>
					</SelectableListItem>
				))}

				{hasMoreItems && (
					<div className="grouped-status-load-more">
						<button
							className="grouped-status-load-btn"
							onClick={handleLoadMore}
						>
							Load more... ({files.length - loadedCount}{" "}
							remaining)
						</button>
					</div>
				)}
			</div>
		</div>
	);
};
