import { useState, useCallback, useMemo } from "react";
import { FilterSection } from "./components/FilterSection";
import { TagSection } from "./components/TagSection";
import { LoadingSpinner } from "./components/LoadingSpinner";
import {
	GroupedDataProvider,
	useGroupedDataContext,
} from "./context/GroupedDataProvider";
import { NoteStatus } from "@/types/noteStatus";

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
	getAvailableStatusesWithTemplateInfo: () => NoteStatus[];
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
		getAvailableStatusesWithTemplateInfo,
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

	const statusMap = useMemo(() => {
		const map = new Map();
		const noteStatuses = getAvailableStatusesWithTemplateInfo();

		// Build map using scoped identifiers as keys
		noteStatuses.forEach((noteStatus) => {
			const statusItem: StatusItem = {
				name: noteStatus.name,
				color: noteStatus.color || "white",
				icon: noteStatus.icon,
			};

			const scopedIdentifier = noteStatus.templateId
				? `${noteStatus.templateId}:${noteStatus.name}`
				: noteStatus.name;
			map.set(scopedIdentifier, statusItem);
		});

		return map;
	}, [getAvailableStatusesWithTemplateInfo]);

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
	getAvailableStatusesWithTemplateInfo,
}: GroupedStatusViewProps) => {
	const [searchFilter, setSearchFilter] = useState("");
	const [noteNameFilter, setNoteNameFilter] = useState("");
	const [templateFilter, setTemplateFilter] = useState("");

	// Get available templates from the statuses
	const availableTemplates = useMemo(() => {
		const templates = new Set<string>();
		getAvailableStatusesWithTemplateInfo().forEach((status) => {
			if (status.templateId) {
				templates.add(status.templateId);
			}
		});
		return Array.from(templates).sort();
	}, [getAvailableStatusesWithTemplateInfo]);

	return (
		<GroupedDataProvider
			getAllFiles={getAllFiles}
			processFiles={processFiles}
			onFileClick={onFileClick}
			subscribeToEvents={subscribeToEvents}
			getAvailableStatuses={getAvailableStatuses}
			getAvailableStatusesWithTemplateInfo={
				getAvailableStatusesWithTemplateInfo
			}
			searchFilter={searchFilter}
			noteNameFilter={noteNameFilter}
			templateFilter={templateFilter}
		>
			<div className="">
				<FilterSection
					searchFilter={searchFilter}
					noteNameFilter={noteNameFilter}
					templateFilter={templateFilter}
					availableTemplates={availableTemplates}
					onSearchFilterChange={setSearchFilter}
					onNoteNameFilterChange={setNoteNameFilter}
					onTemplateFilterChange={setTemplateFilter}
				/>
				<GroupedStatusViewContent />
			</div>
		</GroupedDataProvider>
	);
};
