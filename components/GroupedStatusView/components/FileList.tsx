import React, { useCallback } from "react";
import { FileItem } from "../GroupedStatusView";
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
					<div
						key={file.id}
						className="tree-item nav-file grouped-status-file-item"
						onClick={() => handleFileClick(file)}
						title={file.path}
					>
						<div className="tree-item-self is-clickable nav-file-title">
							<div className="tree-item-inner nav-file-title-content grouped-status-file-content">
								<div className="grouped-status-file-name">
									{file.name}
								</div>
								<div className="grouped-status-file-path">
									{file.path}
								</div>
							</div>
						</div>
					</div>
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
