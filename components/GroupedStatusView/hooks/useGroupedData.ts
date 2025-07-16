import { useState, useEffect, useMemo, useCallback } from "react";
import { FileItem, GroupedByStatus } from "../GroupedStatusView";

export type UseGroupedDataProps = {
	getAllFiles: () => FileItem[];
	processFiles: (files: FileItem[]) => GroupedByStatus;
	subscribeToEvents: (onDataChange: () => void) => () => void;
	searchFilter: string;
	noteNameFilter: string;
};

export const useGroupedData = ({
	getAllFiles,
	processFiles,
	subscribeToEvents,
	searchFilter,
	noteNameFilter,
}: UseGroupedDataProps) => {
	const [groupedData, setGroupedData] = useState<GroupedByStatus>({});
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

	return {
		groupedData,
		filteredData,
		isLoading,
		loadData,
	};
};
