import React, { useState, useEffect, useMemo, useCallback } from "react";
import { FilterSection } from "./components/FilterSection";
import { TagSection } from "./components/TagSection";

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

const ITEMS_PER_LOAD = 20;

export const GroupedStatusView = ({
	getAllFiles,
	processFiles,
	onFileClick,
	subscribeToEvents,
	getAvailableStatuses,
}: GroupedStatusViewProps) => {
	const [groupedData, setGroupedData] = useState<GroupedByStatus>({});
	const [searchFilter, setSearchFilter] = useState("");
	const [noteNameFilter, setNoteNameFilter] = useState("");
	const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
		new Set(),
	);
	const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
	const [loadedItems, setLoadedItems] = useState<Record<string, number>>({});
	const [isLoading, setIsLoading] = useState(true);

	const loadData = useCallback(async () => {
		setIsLoading(true);
		try {
			const files = getAllFiles();
			const processed = processFiles(files);
			setGroupedData(processed);
		} finally {
			setIsLoading(false);
		}
	}, [getAllFiles, processFiles]);

	useEffect(() => {
		loadData();

		const handleFileChange = () => {
			loadData();
		};

		const unsubscribe = subscribeToEvents(handleFileChange);

		return unsubscribe;
	}, [loadData, subscribeToEvents]);

	const filteredData = useMemo(() => {
		if (!searchFilter.trim() && !noteNameFilter.trim()) return groupedData;

		const filtered: GroupedByStatus = {};
		const searchLower = searchFilter.toLowerCase();
		const noteNameLower = noteNameFilter.toLowerCase();

		Object.entries(groupedData).forEach(([tag, statusGroups]) => {
			filtered[tag] = {};
			Object.entries(statusGroups).forEach(([statusName, files]) => {
				let matchingFiles = files;

				// Filter by status/tag if searchFilter is provided
				if (searchFilter.trim()) {
					matchingFiles = matchingFiles.filter(
						(file) =>
							statusName.toLowerCase().includes(searchLower) ||
							tag.toLowerCase().includes(searchLower),
					);
				}

				// Filter by note name if noteNameFilter is provided
				if (noteNameFilter.trim()) {
					matchingFiles = matchingFiles.filter(
						(file) =>
							file.name.toLowerCase().includes(noteNameLower) ||
							file.path.toLowerCase().includes(noteNameLower),
					);
				}

				if (matchingFiles.length > 0) {
					filtered[tag][statusName] = matchingFiles;
				}
			});
		});

		return filtered;
	}, [groupedData, searchFilter, noteNameFilter]);

	// Auto-expand groups when there's only one group
	useEffect(() => {
		const dataToCheck = filteredData;
		const groupKeys = Object.keys(dataToCheck);

		if (groupKeys.length === 1) {
			const singleGroupKey = `tag-${groupKeys[0]}`;
			setExpandedGroups((prev) => {
				const newSet = new Set(prev);
				newSet.add(singleGroupKey);
				return newSet;
			});

			// Also expand all status groups within the single tag group
			const statusGroups = dataToCheck[groupKeys[0]];
			const statusKeys = Object.keys(statusGroups).map(
				(statusName) => `${groupKeys[0]}-${statusName}`,
			);
			setExpandedFiles((prev) => {
				const newSet = new Set(prev);
				statusKeys.forEach((key) => newSet.add(key));
				return newSet;
			});
		}
	}, [filteredData]);

	const toggleGroup = useCallback((groupKey: string) => {
		setExpandedGroups((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(groupKey)) {
				newSet.delete(groupKey);
			} else {
				newSet.add(groupKey);
			}
			return newSet;
		});
	}, []);

	const toggleFiles = useCallback((groupKey: string) => {
		setExpandedFiles((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(groupKey)) {
				newSet.delete(groupKey);
			} else {
				newSet.add(groupKey);
			}
			return newSet;
		});
	}, []);

	const getLoadedCount = useCallback(
		(groupKey: string) => {
			return loadedItems[groupKey] || ITEMS_PER_LOAD;
		},
		[loadedItems],
	);

	const loadMoreItems = useCallback((groupKey: string) => {
		setLoadedItems((prev) => ({
			...prev,
			[groupKey]: (prev[groupKey] || ITEMS_PER_LOAD) + ITEMS_PER_LOAD,
		}));
	}, []);

	const handleScroll = useCallback(
		(
			e: React.UIEvent<HTMLDivElement>,
			groupKey: string,
			totalItems: number,
		) => {
			const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
			const loadedCount = getLoadedCount(groupKey);

			if (
				scrollHeight - scrollTop <= clientHeight + 100 &&
				loadedCount < totalItems
			) {
				loadMoreItems(groupKey);
			}
		},
		[getLoadedCount, loadMoreItems],
	);

	const handleFileClickCallback = useCallback(
		(file: FileItem) => {
			onFileClick(file);
		},
		[onFileClick],
	);

	const availableStatuses = getAvailableStatuses();
	const statusMap = new Map(availableStatuses.map((s) => [s.name, s]));

	if (isLoading) {
		return (
			<div className="">
				<div className="grouped-status-loading">
					Loading statuses...
				</div>
			</div>
		);
	}

	return (
		<div className="">
			<FilterSection
				searchFilter={searchFilter}
				noteNameFilter={noteNameFilter}
				onSearchFilterChange={setSearchFilter}
				onNoteNameFilterChange={setNoteNameFilter}
			/>

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
					<div className="grouped-status-empty">
						{searchFilter
							? "No files match your search."
							: "No statuses found."}
					</div>
				)}
			</div>
		</div>
	);
};
