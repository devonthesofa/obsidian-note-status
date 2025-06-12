import React, { useState } from "react";
import { TFile } from "obsidian";
import { StatusService } from "../../services/status-service";

interface StatusPaneProps {
	statusGroups: Record<string, TFile[]>;
	statusService: StatusService;
	isCompactView: boolean;
	excludeUnknown: boolean;
	collapsedStatuses: Record<string, boolean>;
	pagination: {
		itemsPerPage: number;
		currentPage: Record<string, number>;
	};
	onFileClick: (file: TFile) => void;
	onStatusToggle: (status: string, collapsed: boolean) => void;
	onContextMenu: (e: React.MouseEvent, file: TFile) => void;
	onPageChange: (status: string, page: number) => void;
	onSearch: (query: string) => void;
	onToggleView: () => void;
	onRefresh: () => void;
	onShowUnassigned: () => void;
}

export const StatusPaneComponent: React.FC<StatusPaneProps> = ({
	statusGroups,
	statusService,
	isCompactView,
	excludeUnknown,
	collapsedStatuses,
	pagination,
	onFileClick,
	onStatusToggle,
	onContextMenu,
	onPageChange,
	onSearch,
	onToggleView,
	onRefresh,
	onShowUnassigned,
}) => {
	const [searchQuery, setSearchQuery] = useState("");

	const handleSearch = (query: string) => {
		setSearchQuery(query);
		onSearch(query.toLowerCase());
	};

	const hasGroups = Object.entries(statusGroups).some(
		([status, files]) =>
			files.length > 0 && !(status === "unknown" && excludeUnknown),
	);

	return (
		<div className="status-pane-container">
			{/* Header */}
			<StatusPaneHeader
				isCompactView={isCompactView}
				searchQuery={searchQuery}
				onSearch={handleSearch}
				onToggleView={onToggleView}
				onRefresh={onRefresh}
			/>

			{/* Content */}
			{hasGroups ? (
				<div className="status-groups-container">
					{Object.entries(statusGroups).map(([status, files]) => {
						if (
							files.length === 0 ||
							(status === "unknown" && excludeUnknown)
						) {
							return null;
						}

						return (
							<StatusGroup
								key={status}
								status={status}
								files={files}
								statusService={statusService}
								isCompactView={isCompactView}
								isCollapsed={collapsedStatuses[status] ?? false}
								pagination={pagination}
								onFileClick={onFileClick}
								onStatusToggle={onStatusToggle}
								onContextMenu={onContextMenu}
								onPageChange={onPageChange}
							/>
						);
					})}
				</div>
			) : (
				<StatusPaneEmptyState
					searchQuery={searchQuery}
					excludeUnknown={excludeUnknown}
					onShowUnassigned={onShowUnassigned}
				/>
			)}
		</div>
	);
};

interface StatusPaneHeaderProps {
	isCompactView: boolean;
	searchQuery: string;
	onSearch: (query: string) => void;
	onToggleView: () => void;
	onRefresh: () => void;
}

const StatusPaneHeader: React.FC<StatusPaneHeaderProps> = ({
	isCompactView,
	searchQuery,
	onSearch,
	onToggleView,
	onRefresh,
}) => {
	const [showClearButton, setShowClearButton] = useState(false);

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		onSearch(value);
		setShowClearButton(!!value);
	};

	const handleClearSearch = () => {
		onSearch("");
		setShowClearButton(false);
	};

	return (
		<div className="note-status-header">
			<div className="note-status-search search-input-container">
				<div className="search-input-wrapper">
					<span className="search-input-icon">
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<circle cx="11" cy="11" r="8" />
							<path d="21 21l-4.35-4.35" />
						</svg>
					</span>
					<input
						type="text"
						placeholder="Search notes..."
						className="note-status-search-input search-input"
						value={searchQuery}
						onChange={handleSearchChange}
					/>
					{showClearButton && (
						<span
							className="search-input-clear-button is-visible"
							onClick={handleClearSearch}
						>
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
							>
								<line x1="18" y1="6" x2="6" y2="18" />
								<line x1="6" y1="6" x2="18" y2="18" />
							</svg>
						</span>
					)}
				</div>
			</div>

			<div className="status-pane-actions-container">
				<button
					type="button"
					title={
						isCompactView
							? "Switch to Standard View"
							: "Switch to Compact View"
					}
					className="note-status-view-toggle clickable-icon"
					onClick={onToggleView}
				>
					{isCompactView ? (
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<rect x="3" y="3" width="7" height="7" />
							<rect x="14" y="3" width="7" height="7" />
							<rect x="14" y="14" width="7" height="7" />
							<rect x="3" y="14" width="7" height="7" />
						</svg>
					) : (
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<line x1="8" y1="6" x2="21" y2="6" />
							<line x1="8" y1="12" x2="21" y2="12" />
							<line x1="8" y1="18" x2="21" y2="18" />
							<line x1="3" y1="6" x2="3.01" y2="6" />
							<line x1="3" y1="12" x2="3.01" y2="12" />
							<line x1="3" y1="18" x2="3.01" y2="18" />
						</svg>
					)}
				</button>

				<button
					type="button"
					title="Refresh statuses"
					className="note-status-actions-refresh clickable-icon"
					onClick={onRefresh}
				>
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<polyline points="23,4 23,10 17,10" />
						<polyline points="1,20 1,14 7,14" />
						<path d="M20.49,9A9,9,0,0,0,5.64,5.64L1,10" />
						<path d="M3.51,15a9,9,0,0,0,14.85,3.36L23,14" />
					</svg>
				</button>
			</div>
		</div>
	);
};

interface StatusGroupProps {
	status: string;
	files: TFile[];
	statusService: StatusService;
	isCompactView: boolean;
	isCollapsed: boolean;
	pagination: {
		itemsPerPage: number;
		currentPage: Record<string, number>;
	};
	onFileClick: (file: TFile) => void;
	onStatusToggle: (status: string, collapsed: boolean) => void;
	onContextMenu: (e: React.MouseEvent, file: TFile) => void;
	onPageChange: (status: string, page: number) => void;
}

const StatusGroup: React.FC<StatusGroupProps> = ({
	status,
	files,
	statusService,
	isCompactView,
	isCollapsed,
	pagination,
	onFileClick,
	onStatusToggle,
	onContextMenu,
	onPageChange,
}) => {
	const currentPage = pagination.currentPage[status] || 0;
	const itemsPerPage = pagination.itemsPerPage;
	const totalPages = Math.ceil(files.length / itemsPerPage);
	const startIndex = currentPage * itemsPerPage;
	const endIndex = Math.min(startIndex + itemsPerPage, files.length);
	const paginatedFiles = files.slice(startIndex, endIndex);

	const handleToggleCollapse = () => {
		onStatusToggle(status, !isCollapsed);
	};

	const statusIcon = statusService.getStatusIcon(status);

	return (
		<div
			className={`note-status-group nav-folder ${
				isCollapsed ? "note-status-is-collapsed" : ""
			}`}
		>
			<div className="nav-folder-title" onClick={handleToggleCollapse}>
				<div className="note-status-collapse-indicator">
					{isCollapsed ? (
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<polyline points="9,18 15,12 9,6" />
						</svg>
					) : (
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<polyline points="6,9 12,15 18,9" />
						</svg>
					)}
				</div>
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
						statusIcon={statusIcon}
						isCompactView={isCompactView}
						onFileClick={onFileClick}
						onContextMenu={onContextMenu}
					/>
				))}

				{files.length > itemsPerPage && (
					<StatusGroupPagination
						status={status}
						currentPage={currentPage}
						totalPages={totalPages}
						totalItems={files.length}
						onPageChange={onPageChange}
					/>
				)}
			</div>
		</div>
	);
};

interface FileItemProps {
	file: TFile;
	status: string;
	statusIcon: string;
	isCompactView: boolean;
	onFileClick: (file: TFile) => void;
	onContextMenu: (e: React.MouseEvent, file: TFile) => void;
}

const FileItem: React.FC<FileItemProps> = ({
	file,
	status,
	statusIcon,
	isCompactView,
	onFileClick,
	onContextMenu,
}) => {
	const handleClick = (e: React.MouseEvent) => {
		e.preventDefault();
		onFileClick(file);
	};

	const handleContextMenu = (e: React.MouseEvent) => {
		e.preventDefault();
		onContextMenu(e, file);
	};

	return (
		<div className="nav-file">
			<div
				className="nav-file-title"
				onClick={handleClick}
				onContextMenu={handleContextMenu}
			>
				{!isCompactView && (
					<div className="nav-file-icon">
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M14,2H6A2,2,0,0,0,4,4V20a2,2,0,0,0,2,2H18a2,2,0,0,0,2-2V8Z" />
							<polyline points="14,2 14,8 20,8" />
						</svg>
					</div>
				)}
				<span className="nav-file-title-content">{file.basename}</span>
				<span
					className={`note-status-icon nav-file-tag status-${status}`}
				>
					{statusIcon}
				</span>
			</div>
		</div>
	);
};

interface StatusGroupPaginationProps {
	status: string;
	currentPage: number;
	totalPages: number;
	totalItems: number;
	onPageChange: (status: string, page: number) => void;
}

const StatusGroupPagination: React.FC<StatusGroupPaginationProps> = ({
	status,
	currentPage,
	totalPages,
	totalItems,
	onPageChange,
}) => {
	const handlePrevious = (e: React.MouseEvent) => {
		e.stopPropagation();
		onPageChange(status, currentPage - 1);
	};

	const handleNext = (e: React.MouseEvent) => {
		e.stopPropagation();
		onPageChange(status, currentPage + 1);
	};

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

interface StatusPaneEmptyStateProps {
	searchQuery: string;
	excludeUnknown: boolean;
	onShowUnassigned: () => void;
}

const StatusPaneEmptyState: React.FC<StatusPaneEmptyStateProps> = ({
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
