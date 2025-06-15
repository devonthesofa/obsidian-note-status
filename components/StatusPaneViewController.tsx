import React, { useState, useCallback, useEffect } from "react";
import { TFile, Notice, App } from "obsidian";
import { NoteStatusSettings } from "../models/types";
import { StatusService } from "../services/status-service";
import {
	StatusPaneView,
	StatusPaneOptions,
} from "../views/status-pane-view/StatusPaneView";

interface StatusPaneViewControllerProps {
	app: App;
	settings: NoteStatusSettings;
	statusService: StatusService;
	onSettingsChange?: (settings: NoteStatusSettings) => void;
}

interface PaginationState {
	itemsPerPage: number;
	currentPage: Record<string, number>;
}

export const StatusPaneViewController: React.FC<
	StatusPaneViewControllerProps
> = ({ app, settings, statusService, onSettingsChange }) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [paginationState, setPaginationState] = useState<PaginationState>({
		itemsPerPage: 100,
		currentPage: {},
	});
	const [collapsedStatuses, setCollapsedStatuses] = useState<
		Record<string, boolean>
	>({});
	const [statusGroups, setStatusGroups] = useState<Record<string, TFile[]>>(
		{},
	);
	const [isLoading, setIsLoading] = useState(false);

	const updateStatusGroups = useCallback(async () => {
		setIsLoading(true);
		try {
			const groups = statusService.groupFilesByStatus(searchQuery);
			setStatusGroups(groups);
		} finally {
			setIsLoading(false);
		}
	}, [statusService, searchQuery]);

	useEffect(() => {
		updateStatusGroups();
	}, [updateStatusGroups]);

	const handleSearch = useCallback((query: string) => {
		setPaginationState({
			itemsPerPage: 100,
			currentPage: {},
		});
		setSearchQuery(query);
	}, []);

	const handleToggleView = useCallback(() => {
		if (onSettingsChange) {
			const newSettings = {
				...settings,
				compactView: !settings.compactView,
			};
			onSettingsChange(newSettings);

			window.dispatchEvent(
				new CustomEvent("note-status:settings-changed"),
			);
		}
	}, [settings, onSettingsChange]);

	const handleRefresh = useCallback(async () => {
		await updateStatusGroups();
		new Notice("Status pane refreshed");
	}, [updateStatusGroups]);

	const handleFileClick = useCallback(
		(file: TFile) => {
			app.workspace.getLeaf().openFile(file);
		},
		[app],
	);

	const handleStatusToggle = useCallback(
		(status: string, collapsed: boolean) => {
			setCollapsedStatuses((prev) => ({
				...prev,
				[status]: collapsed,
			}));
		},
		[],
	);

	const handleContextMenu = useCallback((e: MouseEvent, file: TFile) => {
		console.log("Context menu for file:", file.path);
	}, []);

	const handlePageChange = useCallback((status: string, page: number) => {
		setPaginationState((prev) => ({
			...prev,
			currentPage: {
				...prev.currentPage,
				[status]: page,
			},
		}));
	}, []);

	const handleShowUnassigned = useCallback(() => {
		if (onSettingsChange) {
			const newSettings = {
				...settings,
				excludeUnknownStatus: false,
			};
			onSettingsChange(newSettings);
		}
	}, [settings, onSettingsChange]);

	const options: StatusPaneOptions = {
		excludeUnknown: settings.excludeUnknownStatus || false,
		isCompactView: settings.compactView || false,
		collapsedStatuses,
		pagination: paginationState,
		callbacks: {
			onFileClick: handleFileClick,
			onStatusToggle: handleStatusToggle,
			onContextMenu: handleContextMenu,
			onPageChange: handlePageChange,
		},
	};

	const headerCallbacks = {
		onSearch: handleSearch,
		onToggleView: handleToggleView,
		onRefresh: handleRefresh,
	};

	return (
		<StatusPaneView
			statusGroups={statusGroups}
			options={options}
			statusService={statusService}
			searchQuery={searchQuery}
			isLoading={isLoading}
			headerCallbacks={headerCallbacks}
			onShowUnassigned={handleShowUnassigned}
		/>
	);
};

export default StatusPaneViewController;
