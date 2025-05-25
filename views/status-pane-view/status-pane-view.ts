import { TFile, setIcon } from "obsidian";
import { StatusService } from "../../services/status-service";

export type Options = {
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
};
export class StatusPaneView {
	constructor(private statusService: StatusService) {}

	createHeader(
		container: HTMLElement,
		isCompactView: boolean,
		callbacks: {
			onSearch: (query: string) => void;
			onToggleView: () => void;
			onRefresh: () => void;
		},
	): HTMLElement {
		const header = container.createDiv({ cls: "note-status-header" });

		// Search input
		const searchContainer = header.createDiv({
			cls: "note-status-search search-input-container",
		});
		const searchWrapper = searchContainer.createDiv({
			cls: "search-input-wrapper",
		});

		const searchIcon = searchWrapper.createEl("span", {
			cls: "search-input-icon",
		});
		setIcon(searchIcon, "search");

		const searchInput = searchWrapper.createEl("input", {
			type: "text",
			placeholder: "Search notes...",
			cls: "note-status-search-input search-input",
		});

		const clearBtn = searchWrapper.createEl("span", {
			cls: "search-input-clear-button",
		});
		setIcon(clearBtn, "x");

		searchInput.addEventListener("input", () => {
			callbacks.onSearch(searchInput.value.toLowerCase());
			clearBtn.toggleClass("is-visible", !!searchInput.value);
		});

		clearBtn.addEventListener("click", () => {
			searchInput.value = "";
			callbacks.onSearch("");
			clearBtn.toggleClass("is-visible", false);
		});

		// Action buttons
		const actions = header.createDiv({
			cls: "status-pane-actions-container",
		});

		const viewBtn = actions.createEl("button", {
			type: "button",
			title: isCompactView
				? "Switch to Standard View"
				: "Switch to Compact View",
			cls: "note-status-view-toggle clickable-icon",
		});
		setIcon(viewBtn, isCompactView ? "layout" : "table");
		viewBtn.addEventListener("click", callbacks.onToggleView);

		const refreshBtn = actions.createEl("button", {
			type: "button",
			title: "Refresh statuses",
			cls: "note-status-actions-refresh clickable-icon",
		});
		setIcon(refreshBtn, "refresh-cw");
		refreshBtn.addEventListener("click", callbacks.onRefresh);

		return header;
	}

	renderStatusGroups(
		container: HTMLElement,
		statusGroups: Record<string, TFile[]>,
		options: Options,
	): boolean {
		// Clear container first
		container.empty();

		let hasGroups = false;

		Object.entries(statusGroups).forEach(([status, files]) => {
			if (
				files.length > 0 &&
				!(status === "unknown" && options.excludeUnknown)
			) {
				this.renderGroup(container, status, files, options);
				hasGroups = true;
			}
		});

		if (!hasGroups) {
			return false;
		}

		return true;
	}

	private renderGroup(
		container: HTMLElement,
		status: string,
		files: TFile[],
		options: Options,
	): void {
		const groupEl = container.createDiv({
			cls: "note-status-group nav-folder",
		});
		const titleEl = groupEl.createDiv({ cls: "nav-folder-title" });
		const isCollapsed = options.collapsedStatuses[status] ?? false;

		// Collapse indicator
		const collapseIcon = titleEl.createDiv({
			cls: "note-status-collapse-indicator",
		});
		setIcon(collapseIcon, isCollapsed ? "chevron-right" : "chevron-down");

		// Title content
		const titleContent = titleEl.createDiv({
			cls: "nav-folder-title-content",
		});
		const statusIcon = this.statusService.getStatusIcon(status);
		titleContent.createSpan({
			text: `${status} ${statusIcon} (${files.length})`,
			cls: `status-${status}`,
		});

		// Set collapse state
		if (isCollapsed) {
			groupEl.addClass("note-status-is-collapsed");
		}

		// Toggle collapse on click
		titleEl.addEventListener("click", (e) => {
			e.preventDefault();
			const newCollapsed = !groupEl.hasClass("note-status-is-collapsed");
			groupEl.toggleClass("note-status-is-collapsed", newCollapsed);
			collapseIcon.empty();
			setIcon(
				collapseIcon,
				newCollapsed ? "chevron-right" : "chevron-down",
			);
			options.callbacks.onStatusToggle(status, newCollapsed);
		});

		// Render content
		const childrenEl = groupEl.createDiv({ cls: "nav-folder-children" });

		// Pagination
		const currentPage = options.pagination.currentPage[status] || 0;
		const itemsPerPage = options.pagination.itemsPerPage;
		const totalPages = Math.ceil(files.length / itemsPerPage);
		const startIndex = currentPage * itemsPerPage;
		const endIndex = Math.min(startIndex + itemsPerPage, files.length);

		// File items
		files.slice(startIndex, endIndex).forEach((file) => {
			this.renderFileItem(
				childrenEl,
				file,
				status,
				options.isCompactView,
				options.callbacks,
			);
		});

		// Add pagination if needed
		if (files.length > itemsPerPage) {
			this.addPagination(
				childrenEl,
				status,
				currentPage,
				totalPages,
				files.length,
				options.callbacks,
			);
		}
	}

	private renderFileItem(
		container: HTMLElement,
		file: TFile,
		status: string,
		isCompactView: boolean,
		callbacks: Options["callbacks"],
	): void {
		const fileEl = container.createDiv({ cls: "nav-file" });
		const fileTitleEl = fileEl.createDiv({ cls: "nav-file-title" });

		if (!isCompactView) {
			const fileIcon = fileTitleEl.createDiv({ cls: "nav-file-icon" });
			setIcon(fileIcon, "file");
		}

		fileTitleEl.createSpan({
			text: file.basename,
			cls: "nav-file-title-content",
		});

		fileTitleEl.createSpan({
			cls: `note-status-icon nav-file-tag status-${status}`,
			text: this.statusService.getStatusIcon(status),
		});

		fileEl.addEventListener("click", (e) => {
			e.preventDefault();
			callbacks.onFileClick(file);
		});

		fileEl.addEventListener("contextmenu", (e) => {
			e.preventDefault();
			callbacks.onContextMenu(e, file);
		});
	}

	private addPagination(
		container: HTMLElement,
		status: string,
		currentPage: number,
		totalPages: number,
		totalItems: number,
		callbacks: Options["callbacks"],
	): void {
		const paginationEl = container.createDiv({
			cls: "note-status-pagination",
		});

		if (currentPage > 0) {
			const prevButton = paginationEl.createEl("button", {
				text: "Previous",
				cls: "note-status-pagination-button",
			});

			prevButton.addEventListener("click", (e) => {
				e.stopPropagation();
				callbacks.onPageChange(status, currentPage - 1);
			});
		}

		paginationEl.createSpan({
			text: `Page ${currentPage + 1} of ${totalPages} (${totalItems} notes)`,
			cls: "note-status-pagination-info",
		});

		if (currentPage < totalPages - 1) {
			const nextButton = paginationEl.createEl("button", {
				text: "Next",
				cls: "note-status-pagination-button",
			});

			nextButton.addEventListener("click", (e) => {
				e.stopPropagation();
				callbacks.onPageChange(status, currentPage + 1);
			});
		}
	}

	renderEmptyState(
		container: HTMLElement,
		searchQuery: string,
		excludeUnknown: boolean,
		onShowUnassigned: () => void,
	): void {
		const emptyMessage = container.createDiv({
			cls: "note-status-empty-indicator",
		});

		if (searchQuery) {
			emptyMessage.textContent = `No notes found matching "${searchQuery}"`;
			return;
		}

		if (excludeUnknown) {
			emptyMessage.createDiv({
				text: "No notes with status found. Unassigned notes are currently hidden.",
				cls: "note-status-empty-message",
			});

			const btnContainer = emptyMessage.createDiv({
				cls: "note-status-button-container",
			});

			const showUnknownBtn = btnContainer.createEl("button", {
				text: "Show unassigned notes",
				cls: "note-status-show-unassigned-button",
			});

			showUnknownBtn.addEventListener("click", onShowUnassigned);
		}
	}

	createLoadingIndicator(container: HTMLElement, text?: string): HTMLElement {
		const loadingIndicator = container.createDiv({
			cls: "note-status-loading",
		});
		loadingIndicator.innerHTML = `<span>${text || "Loading notes..."}</span>`;
		return loadingIndicator;
	}
}
