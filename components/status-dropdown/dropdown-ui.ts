import { App, TFile } from "obsidian";
import {
	DropdownDependencies,
	StatusRemoveHandler,
	StatusSelectHandler,
} from "./types";
import { positionDropdown } from "./dropdown-position";
import { renderDropdownContent } from "./dropdown-render";
import { setupDropdownEvents } from "./dropdown-events";
import { StatusService } from "services/status-service";
import { NoteStatusSettings } from "models/types";

/**
 * Core UI component for the status dropdown
 */
export class DropdownUI {
	private app: App;
	private statusService: StatusService;
	private settings: NoteStatusSettings;

	private dropdownElement: HTMLElement | null = null;
	private currentStatuses: string[] = ["unknown"];
	private targetFile: TFile | null = null;
	private targetFiles: TFile[] = [];
	private animationDuration = 220;

	public isOpen = false;
	private onRemoveStatus: StatusRemoveHandler = async () => {};
	private onSelectStatus: StatusSelectHandler = async () => {};

	// Event handlers
	private clickOutsideHandler: (e: MouseEvent) => void;
	private escapeKeyHandler: (e: KeyboardEvent) => void;

	constructor({ app, settings, statusService }: DropdownDependencies) {
		this.app = app;
		this.statusService = statusService;
		this.settings = settings;

		// Bind methods
		this.clickOutsideHandler = this.handleClickOutside.bind(this);
		this.escapeKeyHandler = this.handleEscapeKey.bind(this);
	}

	/**
	 * Set the target file for status updates
	 */
	public setTargetFile(file: TFile | null): void {
		this.targetFile = file;
		this.targetFiles = file ? [file] : [];
	}

	/**
	 * Set multiple target files for status updates
	 */
	public setTargetFiles(files: TFile[]): void {
		this.targetFiles = [...files];
		this.targetFile = files.length === 1 ? files[0] : null;
	}

	/**
	 * Register handler for removing a status
	 */
	public setOnRemoveStatusHandler(handler: StatusRemoveHandler): void {
		this.onRemoveStatus = handler;
	}

	/**
	 * Register handler for selecting a status
	 */
	public setOnSelectStatusHandler(handler: StatusSelectHandler): void {
		this.onSelectStatus = handler;
	}

	/**
	 * Updates the current statuses
	 */
	public updateStatuses(statuses: string[] | string): void {
		this.currentStatuses = Array.isArray(statuses)
			? [...statuses]
			: [statuses];

		if (this.isOpen && this.dropdownElement) {
			this.refreshDropdownContent();
		}
	}

	/**
	 * Updates settings reference
	 */
	public updateSettings(settings: NoteStatusSettings): void {
		this.settings = settings;

		if (this.isOpen && this.dropdownElement) {
			this.refreshDropdownContent();
		}
	}

	/**
	 * Toggle the dropdown visibility
	 */
	public toggle(
		targetEl: HTMLElement,
		position?: { x: number; y: number },
	): void {
		if (this.isOpen) {
			this.close();
			setTimeout(() => {
				if (!this.isOpen && !this.dropdownElement) {
					this.open(targetEl, position);
				}
			}, 50);
		} else {
			this.open(targetEl, position);
		}
	}

	/**
	 * Open the dropdown
	 */
	public open(
		targetEl: HTMLElement,
		position?: { x: number; y: number },
	): void {
		if (this.isOpen || this.dropdownElement) {
			this.close();
			setTimeout(() => this.actuallyOpen(targetEl, position), 10);
			return;
		}

		this.actuallyOpen(targetEl, position);
	}

	/**
	 * Actually open the dropdown (internal method)
	 */
	private actuallyOpen(
		targetEl: HTMLElement,
		position?: { x: number; y: number },
	): void {
		this.isOpen = true;

		// Create dropdown element
		this.createDropdownElement();
		this.refreshDropdownContent();

		// Position the dropdown
		positionDropdown({
			dropdownElement: this.dropdownElement!,
			targetEl,
			position,
		});

		this.dropdownElement?.addClass("note-status-popover-animate-in");

		// Add event listeners with slight delay to prevent immediate triggering
		setTimeout(() => {
			setupDropdownEvents({
				clickOutsideHandler: this.clickOutsideHandler,
				escapeKeyHandler: this.escapeKeyHandler,
			});
		}, 10);
	}

	/**
	 * Create the dropdown element
	 */
	private createDropdownElement(): void {
		this.dropdownElement = document.createElement("div");
		this.dropdownElement.addClass(
			"note-status-popover",
			"note-status-unified-dropdown",
		);
		document.body.appendChild(this.dropdownElement);
	}

	/**
	 * Close the dropdown
	 */
	public close(): void {
		if (!this.dropdownElement || !this.isOpen) return;

		this.dropdownElement.addClass("note-status-popover-animate-out");

		document.removeEventListener("click", this.clickOutsideHandler);
		document.removeEventListener("keydown", this.escapeKeyHandler);

		this.isOpen = false;

		if (this.dropdownElement) {
			this.dropdownElement.remove();
			this.dropdownElement = null;
		}
	}

	/**
	 * Refresh the dropdown content
	 */
	private refreshDropdownContent(): void {
		if (!this.dropdownElement) return;

		renderDropdownContent({
			dropdownElement: this.dropdownElement,
			settings: this.settings,
			statusService: this.statusService,
			currentStatuses: this.currentStatuses,
			targetFile: this.targetFile,
			targetFiles: this.targetFiles,
			onRemoveStatus: this.onRemoveStatus,
			onSelectStatus: this.onSelectStatus,
		});
	}

	/**
	 * Handle click outside the dropdown
	 */
	private handleClickOutside(e: MouseEvent): void {
		if (
			this.dropdownElement &&
			!this.dropdownElement.contains(e.target as Node)
		) {
			this.close();
		}
	}

	/**
	 * Handle escape key to close dropdown
	 */
	private handleEscapeKey(e: KeyboardEvent): void {
		if (e.key === "Escape") {
			this.close();
		}
	}

	/**
	 * Dispose of resources
	 */
	public dispose(): void {
		this.close();
	}
}
