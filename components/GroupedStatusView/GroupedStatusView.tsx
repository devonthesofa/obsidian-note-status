import { useState, useCallback, useMemo } from "react";
import { FilterSection } from "./components/FilterSection";
import { TagSection } from "./components/TagSection";
import { LoadingSpinner } from "./components/LoadingSpinner";
import {
	GroupedDataProvider,
	useGroupedDataContext,
} from "./context/GroupedDataProvider";

export type FileItem = {
	id: string;
	name: string;
	path: string;
};

export type StatusItem = {
	name: string;
	color: string;
	icon?: string;
};

export type FilesByStatus = {
	[statusName: string]: FileItem[];
};

export type GroupedByStatus = {
	[frontmatterTag: string]: FilesByStatus;
};

export type GroupedStatusViewProps = {
	getAllFiles: () => FileItem[];
	processFiles: (files: FileItem[]) => GroupedByStatus;
	onFileClick: (file: FileItem) => void;
	subscribeToEvents: (onDataChange: () => void) => () => void;
	getAvailableStatuses: () => StatusItem[];
};

const GroupedStatusViewContent = () => {
	const {
		filteredData,
		isLoading,
		expandedGroups,
		expandedFiles,
		toggleGroup,
		toggleFiles,
		onFileClick,
		getAvailableStatuses,
		getLoadedCount,
		loadMoreItems,
		handleScroll,
	} = useGroupedDataContext();

	const handleFileClickCallback = useCallback(
		(file: FileItem) => {
			onFileClick(file);
		},
		[onFileClick],
	);

	const availableStatuses = useMemo(
		() => getAvailableStatuses(),
		[getAvailableStatuses],
	);
	const statusMap = useMemo(
		() => new Map(availableStatuses.map((s) => [s.name, s])),
		[availableStatuses],
	);

	if (isLoading) {
		return <LoadingSpinner />;
	}

	return (
		<div className="grouped-status-content">
			{Object.entries(filteredData).map(([tag, statusGroups]) => {
				const tagKey = `tag-${tag}`;
				const isTagExpanded = expandedGroups.has(tagKey);

				return (
					<TagSection
						key={tag}
						tag={tag}
						statusGroups={statusGroups}
						isExpanded={isTagExpanded}
						statusMap={statusMap}
						expandedFiles={expandedFiles}
						getLoadedCount={getLoadedCount}
						onToggle={() => toggleGroup(tagKey)}
						onToggleFiles={toggleFiles}
						onFileClick={handleFileClickCallback}
						onScroll={handleScroll}
						onLoadMore={loadMoreItems}
					/>
				);
			})}

			{Object.keys(filteredData).length === 0 && (
				<div className="grouped-status-empty">No statuses found.</div>
			)}
		</div>
	);
};

export const GroupedStatusView = ({
	getAllFiles,
	processFiles,
	onFileClick,
	subscribeToEvents,
	getAvailableStatuses,
}: GroupedStatusViewProps) => {
	const [searchFilter, setSearchFilter] = useState("");
	const [noteNameFilter, setNoteNameFilter] = useState("");

	return (
		<GroupedDataProvider
			getAllFiles={getAllFiles}
			processFiles={processFiles}
			onFileClick={onFileClick}
			subscribeToEvents={subscribeToEvents}
			getAvailableStatuses={getAvailableStatuses}
			searchFilter={searchFilter}
			noteNameFilter={noteNameFilter}
		>
			<div className="">
				<FilterSection
					searchFilter={searchFilter}
					noteNameFilter={noteNameFilter}
					onSearchFilterChange={setSearchFilter}
					onNoteNameFilterChange={setNoteNameFilter}
				/>
				<GroupedStatusViewContent />
			</div>
		</GroupedDataProvider>
	);
};
