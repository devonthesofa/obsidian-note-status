import React from "react";
import { MarkdownView, Editor, Notice, TFile, App } from "obsidian";
import { StatusDropdownComponent } from "./StatusDropdownComponent";
import { DropdownOptions } from "./types";
import { StatusService } from "../../services/status-service";
import { NoteStatusSettings } from "../../models/types";
import { ReactUtils } from "../../utils/react-utils";

/**
 * High-level manager for status dropdown interactions using React
 */
export class StatusDropdownManager {
	private app: App;
	private settings: NoteStatusSettings;
	private statusService: StatusService;
	private currentStatuses: string[] = ["unknown"];
	private isOpen = false;
	private targetFiles: TFile[] = [];
	private dropdownContainer: HTMLElement | null = null;

	constructor(
		app: App,
		settings: NoteStatusSettings,
		statusService: StatusService,
	) {
		this.app = app;
		this.settings = settings;
		this.statusService = statusService;
	}

	/**
	 * Updates the dropdown UI based on current statuses
	 */
	public update(currentStatuses: string[] | string, _file?: TFile): void {
		this.currentStatuses = Array.isArray(currentStatuses)
			? [...currentStatuses]
			: [currentStatuses];

		if (this.isOpen) {
			this.renderDropdown();
		}
	}

	/**
	 * Updates settings reference
	 */
	public updateSettings(settings: NoteStatusSettings): void {
		this.settings = settings;
		if (this.isOpen) {
			this.renderDropdown();
		}
	}

	/**
	 * Get position from cursor or fallback
	 */
	private getCursorPosition(
		editor: Editor,
		view: MarkdownView,
	): { x: number; y: number } {
		try {
			const cursor = editor.getCursor("head");
			const lineElement = view.contentEl.querySelector(
				`.cm-line:nth-child(${cursor.line + 1})`,
			);

			if (lineElement) {
				const rect = lineElement.getBoundingClientRect();
				return { x: rect.left + 20, y: rect.bottom + 5 };
			}

			const editorEl = view.contentEl.querySelector(".cm-editor");
			if (editorEl) {
				const rect = editorEl.getBoundingClientRect();
				return { x: rect.left + 100, y: rect.top + 100 };
			}
		} catch (error) {
			console.error("Error getting position for dropdown:", error);
		}

		return { x: window.innerWidth / 2, y: window.innerHeight / 3 };
	}

	/**
	 * Universal function to open the status dropdown
	 */
	public openStatusDropdown(options: DropdownOptions): void {
		const activeFile = this.app.workspace.getActiveFile();
		const files = options.files || (activeFile ? [activeFile] : []);

		if (!files.length) {
			new Notice("No files selected");
			return;
		}

		if (this.isOpen) {
			this.resetDropdown();
			return;
		}

		this.targetFiles = files;

		const isSingleFile = files.length === 1;

		// Update current statuses based on files
		if (isSingleFile) {
			this.currentStatuses = this.statusService.getFileStatuses(files[0]);
		} else {
			this.currentStatuses = this.findCommonStatuses(files);
		}

		this.positionAndOpenDropdown(options);
	}

	/**
	 * Reset dropdown state before opening
	 */
	public resetDropdown(): void {
		this.close();
		this.targetFiles = [];
	}

	/**
	 * Position and open the dropdown
	 */
	private positionAndOpenDropdown(options: {
		target?: HTMLElement;
		position?: { x: number; y: number };
		editor?: Editor;
		view?: MarkdownView;
	}): void {
		let position: { x: number; y: number };

		if (options.editor && options.view) {
			position = this.getCursorPosition(options.editor, options.view);
		} else if (options.target) {
			if (options.position) {
				position = options.position;
			} else {
				const rect = options.target.getBoundingClientRect();
				position = { x: rect.left, y: rect.bottom + 5 };
			}
		} else if (options.position) {
			position = options.position;
		} else {
			position = { x: window.innerWidth / 2, y: window.innerHeight / 3 };
		}

		this.open(position);
	}

	/**
	 * Open dropdown at a specific position
	 */
	private open(position: { x: number; y: number }): void {
		this.isOpen = true;

		// Create container for the dropdown
		this.dropdownContainer = document.createElement("div");
		this.dropdownContainer.style.position = "fixed";
		this.dropdownContainer.style.left = `${position.x}px`;
		this.dropdownContainer.style.top = `${position.y}px`;
		this.dropdownContainer.style.zIndex = "1000";
		document.body.appendChild(this.dropdownContainer);

		this.renderDropdown();

		// Add event listeners for closing dropdown
		setTimeout(() => {
			document.addEventListener("click", this.handleClickOutside);
			document.addEventListener("keydown", this.handleEscapeKey);
		}, 10);
	}

	/**
	 * Render the React dropdown component
	 */
	private renderDropdown(): void {
		if (!this.dropdownContainer) return;

		ReactUtils.render(
			React.createElement(StatusDropdownComponent, {
				isOpen: this.isOpen,
				currentStatuses: this.currentStatuses,
				targetFiles: this.targetFiles,
				settings: this.settings,
				statusService: this.statusService,
				onRemoveStatus: this.handleRemoveStatus.bind(this),
				onSelectStatus: this.handleSelectStatus.bind(this),
				onClose: this.close.bind(this),
			}),
			this.dropdownContainer,
		);
	}

	/**
	 * Handle status removal
	 */
	private async handleRemoveStatus(
		status: string,
		target: TFile | TFile[],
	): Promise<void> {
		const isMultiple = Array.isArray(target);

		await this.statusService.handleStatusChange({
			files: target,
			statuses: status,
			operation: "remove",
			showNotice: isMultiple,
		});

		this.close();
	}

	/**
	 * Handle status selection
	 */
	private async handleSelectStatus(
		status: string,
		targetFiles: TFile[],
	): Promise<void> {
		const isMultipleFiles = targetFiles.length > 1;

		if (isMultipleFiles) {
			// Count how many files already have this status
			const filesWithStatus = targetFiles.filter((file) =>
				this.statusService.getFileStatuses(file).includes(status),
			);

			// If ALL have the status, remove it. Otherwise, add it
			const operation =
				filesWithStatus.length === targetFiles.length
					? "remove"
					: !this.settings.useMultipleStatuses
						? "set"
						: "add";

			await this.statusService.handleStatusChange({
				files: targetFiles,
				statuses: status,
				isMultipleSelection: true,
				operation: operation,
			});
		} else {
			// For individual files, maintain default behavior
			await this.statusService.handleStatusChange({
				files: targetFiles,
				statuses: status,
			});
		}

		this.close();
	}

	/**
	 * Close the dropdown
	 */
	private close = (): void => {
		this.isOpen = false;

		document.removeEventListener("click", this.handleClickOutside);
		document.removeEventListener("keydown", this.handleEscapeKey);

		if (this.dropdownContainer) {
			ReactUtils.unmount(this.dropdownContainer);
			this.dropdownContainer.remove();
			this.dropdownContainer = null;
		}
	};

	/**
	 * Handle click outside to close dropdown
	 */
	private handleClickOutside = (e: MouseEvent): void => {
		if (
			this.dropdownContainer &&
			!this.dropdownContainer.contains(e.target as Node)
		) {
			this.close();
		}
	};

	/**
	 * Handle escape key to close dropdown
	 */
	private handleEscapeKey = (e: KeyboardEvent): void => {
		if (e.key === "Escape") {
			this.close();
		}
	};

	/**
	 * Find common statuses across multiple files
	 */
	private findCommonStatuses(files: TFile[]): string[] {
		if (files.length === 0) return ["unknown"];

		const firstFileStatuses = this.statusService.getFileStatuses(files[0]);

		return firstFileStatuses.filter(
			(status) =>
				status !== "unknown" &&
				files.every((file) =>
					this.statusService.getFileStatuses(file).includes(status),
				),
		);
	}

	/**
	 * Render method (kept for compatibility)
	 */
	public render(): void {
		// No-op - dropdown component handles rendering internally
	}

	/**
	 * Remove dropdown when plugin is unloaded
	 */
	public unload(): void {
		this.close();
	}
}
