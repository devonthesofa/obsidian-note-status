import React, { useState, useCallback, useRef, useEffect } from "react";
import { TFile, setIcon } from "obsidian";
import { StatusService } from "../../services/status-service";

export interface StatusPaneOptions {
	excludeUnknown: boolean;
	isCompactView: boolean;
	collapsedStatuses: Record<string, boolean>;
	pagination: {
		itemsPerPage: number;
		currentPage: Record<string, number>;
	};
	callbacks: {
		onFileClick: (file: TFile) => void;
		onStatusToggle: (status: string, collapsed: boolean) => void;
		onContextMenu: (e: MouseEvent, file: TFile) => void;
		onPageChange: (status: string, page: number) => void;
	};
}

interface StatusPaneHeaderProps {
	isCompactView: boolean;
	onSearch: (query: string) => void;
	onToggleView: () => void;
	onRefresh: () => void;
}

const StatusPaneHeader: React.FC<StatusPaneHeaderProps> = ({
	isCompactView,
	onSearch,
	onToggleView,
	onRefresh,
}) => {
	const [searchValue, setSearchValue] = useState("");
	const searchIconRef = useRef<HTMLSpanElement>(null);
	const clearBtnRef = useRef<HTMLSpanElement>(null);
	const viewBtnRef = useRef<HTMLButtonElement>(null);
	const refreshBtnRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (searchIconRef.current) {
			setIcon(searchIconRef.current, "search");
		}
		if (clearBtnRef.current) {
			setIcon(clearBtnRef.current, "x");
		}
		if (viewBtnRef.current) {
			setIcon(viewBtnRef.current, isCompactView ? "layout" : "table");
		}
		if (refreshBtnRef.current) {
			setIcon(refreshBtnRef.current, "refresh-cw");
		}
	}, [isCompactView]);

	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			setSearchValue(value);
			onSearch(value.toLowerCase());
		},
		[onSearch],
	);

	const handleClearSearch = useCallback(() => {
		setSearchValue("");
		onSearch("");
	}, [onSearch]);

	return (
		<div className="note-status-header">
			<div className="note-status-search search-input-container">
				<div className="search-input-wrapper">
					<span ref={searchIconRef} className="search-input-icon" />
					<input
						type="text"
						placeholder="Search notes..."
						className="note-status-search-input search-input"
						value={searchValue}
						onChange={handleSearchChange}
					/>
					<span
						ref={clearBtnRef}
						className={`search-input-clear-button ${
							searchValue ? "is-visible" : ""
						}`}
						onClick={handleClearSearch}
					/>
				</div>
			</div>
			<div className="status-pane-actions-container">
				<button
					ref={viewBtnRef}
					type="button"
					title={
						isCompactView
							? "Switch to Standard View"
							: "Switch to Compact View"
					}
					className="note-status-view-toggle clickable-icon"
					onClick={onToggleView}
				/>
				<button
					ref={refreshBtnRef}
					type="button"
					title="Refresh statuses"
					className="note-status-actions-refresh clickable-icon"
					onClick={onRefresh}
				/>
			</div>
		</div>
	);
};

interface FileItemProps {
	file: TFile;
	status: string;
	isCompactView: boolean;
	statusService: StatusService;
	onFileClick: (file: TFile) => void;
	onContextMenu: (e: MouseEvent, file: TFile) => void;
}

const FileItem: React.FC<FileItemProps> = ({
	file,
	status,
	isCompactView,
	statusService,
	onFileClick,
	onContextMenu,
}) => {
	const fileIconRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isCompactView && fileIconRef.current) {
			setIcon(fileIconRef.current, "file");
		}
	}, [isCompactView]);

	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			onFileClick(file);
		},
		[file, onFileClick],
	);

	const handleContextMenu = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			onContextMenu(e.nativeEvent as MouseEvent, file);
		},
		[file, onContextMenu],
	);

	return (
		<div
			className="nav-file"
			onClick={handleClick}
			onContextMenu={handleContextMenu}
		>
			<div className="nav-file-title">
				{!isCompactView && (
					<div ref={fileIconRef} className="nav-file-icon" />
				)}
				<span className="nav-file-title-content">{file.basename}</span>
				<span
					className={`note-status-icon nav-file-tag status-${status}`}
				>
					{statusService.getStatusIcon(status)}
				</span>
			</div>
		</div>
	);
};

interface PaginationProps {
	status: string;
	currentPage: number;
	totalPages: number;
	totalItems: number;
	onPageChange: (status: string, page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
	status,
	currentPage,
	totalPages,
	totalItems,
	onPageChange,
}) => {
	const handlePrevious = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			onPageChange(status, currentPage - 1);
		},
		[status, currentPage, onPageChange],
	);

	const handleNext = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			onPageChange(status, currentPage + 1);
		},
		[status, currentPage, onPageChange],
	);

	return (
		<div className="note-status-pagination">
			{currentPage > 0 && (
				<button
					className="note-status-pagination-button"
					onClick={handlePrevious}
				>
					Previous
				</button>
			)}
			<span className="note-status-pagination-info">
				Page {currentPage + 1} of {totalPages} ({totalItems} notes)
			</span>
			{currentPage < totalPages - 1 && (
				<button
					className="note-status-pagination-button"
					onClick={handleNext}
				>
					Next
				</button>
			)}
		</div>
	);
};

interface StatusGroupProps {
	status: string;
	files: TFile[];
	options: StatusPaneOptions;
	statusService: StatusService;
}

const StatusGroup: React.FC<StatusGroupProps> = ({
	status,
	files,
	options,
	statusService,
}) => {
	const collapseIconRef = useRef<HTMLDivElement>(null);
	const isCollapsed = options.collapsedStatuses[status] ?? false;
	const [collapsed, setCollapsed] = useState(isCollapsed);

	useEffect(() => {
		if (collapseIconRef.current) {
			setIcon(
				collapseIconRef.current,
				collapsed ? "chevron-right" : "chevron-down",
			);
		}
	}, [collapsed]);

	const handleToggle = useCallback(
		(e: React.MouseEvent) => {
			e.preventDefault();
			const newCollapsed = !collapsed;
			setCollapsed(newCollapsed);
			options.callbacks.onStatusToggle(status, newCollapsed);
		},
		[collapsed, status, options.callbacks],
	);

	// Pagination
	const currentPage = options.pagination.currentPage[status] || 0;
	const itemsPerPage = options.pagination.itemsPerPage;
	const totalPages = Math.ceil(files.length / itemsPerPage);
	const startIndex = currentPage * itemsPerPage;
	const endIndex = Math.min(startIndex + itemsPerPage, files.length);
	const paginatedFiles = files.slice(startIndex, endIndex);

	const statusIcon = statusService.getStatusIcon(status);

	return (
		<div
			className={`note-status-group nav-folder ${collapsed ? "note-status-is-collapsed" : ""}`}
		>
			<div className="nav-folder-title" onClick={handleToggle}>
				<div
					ref={collapseIconRef}
					className="note-status-collapse-indicator"
				/>
				<div className="nav-folder-title-content">
					<span className={`status-${status}`}>
						{status} {statusIcon} ({files.length})
					</span>
				</div>
			</div>
			<div className="nav-folder-children">
				{paginatedFiles.map((file) => (
					<FileItem
						key={file.path}
						file={file}
						status={status}
						isCompactView={options.isCompactView}
						statusService={statusService}
						onFileClick={options.callbacks.onFileClick}
						onContextMenu={options.callbacks.onContextMenu}
					/>
				))}
				{files.length > itemsPerPage && (
					<Pagination
						status={status}
						currentPage={currentPage}
						totalPages={totalPages}
						totalItems={files.length}
						onPageChange={options.callbacks.onPageChange}
					/>
				)}
			</div>
		</div>
	);
};

interface EmptyStateProps {
	searchQuery: string;
	excludeUnknown: boolean;
	onShowUnassigned: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({
	searchQuery,
	excludeUnknown,
	onShowUnassigned,
}) => {
	if (searchQuery) {
		return (
			<div className="note-status-empty-indicator">
				No notes found matching "{searchQuery}"
			</div>
		);
	}

	if (excludeUnknown) {
		return (
			<div className="note-status-empty-indicator">
				<div className="note-status-empty-message">
					No notes with status found. Unassigned notes are currently
					hidden.
				</div>
				<div className="note-status-button-container">
					<button
						className="note-status-show-unassigned-button"
						onClick={onShowUnassigned}
					>
						Show unassigned notes
					</button>
				</div>
			</div>
		);
	}

	return null;
};

interface LoadingIndicatorProps {
	text?: string;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
	text = "Loading notes...",
}) => {
	return (
		<div className="note-status-loading">
			<span>{text}</span>
		</div>
	);
};

interface StatusPaneViewProps {
	statusGroups: Record<string, TFile[]>;
	options: StatusPaneOptions;
	statusService: StatusService;
	searchQuery: string;
	isLoading?: boolean;
	loadingText?: string;
	headerCallbacks: {
		onSearch: (query: string) => void;
		onToggleView: () => void;
		onRefresh: () => void;
	};
	onShowUnassigned: () => void;
}

export const StatusPaneView: React.FC<StatusPaneViewProps> = ({
	statusGroups,
	options,
	statusService,
	searchQuery,
	isLoading = false,
	loadingText,
	headerCallbacks,
	onShowUnassigned,
}) => {
	const hasGroups = Object.entries(statusGroups).some(
		([status, files]) =>
			files.length > 0 &&
			!(status === "unknown" && options.excludeUnknown),
	);

	return (
		<div className="status-pane-view">
			<StatusPaneHeader
				isCompactView={options.isCompactView}
				onSearch={headerCallbacks.onSearch}
				onToggleView={headerCallbacks.onToggleView}
				onRefresh={headerCallbacks.onRefresh}
			/>

			<div className="status-pane-content">
				{isLoading ? (
					<LoadingIndicator text={loadingText} />
				) : !hasGroups ? (
					<EmptyState
						searchQuery={searchQuery}
						excludeUnknown={options.excludeUnknown}
						onShowUnassigned={onShowUnassigned}
					/>
				) : (
					Object.entries(statusGroups).map(([status, files]) => {
						if (
							files.length === 0 ||
							(status === "unknown" && options.excludeUnknown)
						) {
							return null;
						}

						return (
							<StatusGroup
								key={status}
								status={status}
								files={files}
								options={options}
								statusService={statusService}
							/>
						);
					})
				)}
			</div>
		</div>
	);
};

export class StatusPaneViewManager {
	constructor(private statusService: StatusService) {}

	createLoadingIndicator(container: HTMLElement, text?: string): HTMLElement {
		const loadingIndicator = container.createDiv({
			cls: "note-status-loading",
		});
		loadingIndicator.innerHTML = `<span>${text || "Loading notes..."}</span>`;
		return loadingIndicator;
	}
}

export default StatusPaneView;
