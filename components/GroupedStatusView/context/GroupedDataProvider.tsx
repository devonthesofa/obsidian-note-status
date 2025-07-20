import React, { createContext, useContext, ReactNode } from "react";
import { FileItem, GroupedByStatus, StatusItem } from "../GroupedStatusView";
import { NoteStatus } from "@/types/noteStatus";
import { useGroupedData } from "../hooks/useGroupedData";
import { usePagination } from "../hooks/usePagination";
import { useExpandedState } from "../hooks/useExpandedState";

type GroupedDataContextType = {
	// Data
	groupedData: GroupedByStatus;
	filteredData: GroupedByStatus;
	isLoading: boolean;
	loadData: () => void;

	// Pagination
	getLoadedCount: (groupKey: string) => number;
	loadMoreItems: (groupKey: string) => void;
	handleScroll: (
		e: React.UIEvent<HTMLDivElement>,
		groupKey: string,
		totalItems: number,
	) => void;

	// Expanded state
	expandedGroups: Set<string>;
	expandedFiles: Set<string>;
	toggleGroup: (groupKey: string) => void;
	toggleFiles: (groupKey: string) => void;

	// Props
	onFileClick: (file: FileItem) => void;
	getAvailableStatuses: () => StatusItem[];
	getAvailableStatusesWithTemplateInfo: () => NoteStatus[];
};

const GroupedDataContext = createContext<GroupedDataContextType | undefined>(
	undefined,
);

export const useGroupedDataContext = () => {
	const context = useContext(GroupedDataContext);
	if (!context) {
		throw new Error(
			"useGroupedDataContext must be used within GroupedDataProvider",
		);
	}
	return context;
};

type GroupedDataProviderProps = {
	children: ReactNode;
	getAllFiles: () => FileItem[];
	processFiles: (files: FileItem[]) => GroupedByStatus;
	onFileClick: (file: FileItem) => void;
	subscribeToEvents: (onDataChange: () => void) => () => void;
	getAvailableStatuses: () => StatusItem[];
	getAvailableStatusesWithTemplateInfo: () => NoteStatus[];
	searchFilter: string;
	noteNameFilter: string;
	templateFilter: string;
};

export const GroupedDataProvider = ({
	children,
	getAllFiles,
	processFiles,
	onFileClick,
	subscribeToEvents,
	getAvailableStatuses,
	getAvailableStatusesWithTemplateInfo,
	searchFilter,
	noteNameFilter,
	templateFilter,
}: GroupedDataProviderProps) => {
	const { groupedData, filteredData, isLoading, loadData } = useGroupedData({
		getAllFiles,
		processFiles,
		subscribeToEvents,
		searchFilter,
		noteNameFilter,
		templateFilter,
	});

	const { getLoadedCount, loadMoreItems, handleScroll } = usePagination();

	const { expandedGroups, expandedFiles, toggleGroup, toggleFiles } =
		useExpandedState(filteredData);

	const value: GroupedDataContextType = {
		groupedData,
		filteredData,
		isLoading,
		loadData,
		getLoadedCount,
		loadMoreItems,
		handleScroll,
		expandedGroups,
		expandedFiles,
		toggleGroup,
		toggleFiles,
		onFileClick,
		getAvailableStatuses,
		getAvailableStatusesWithTemplateInfo,
	};

	return (
		<GroupedDataContext.Provider value={value}>
			{children}
		</GroupedDataContext.Provider>
	);
};
