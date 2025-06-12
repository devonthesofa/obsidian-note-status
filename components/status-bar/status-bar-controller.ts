import React from "react";
import { NoteStatusSettings } from "../../models/types";
import { StatusService } from "../../services/status-service";
import { StatusBarComponent } from "./StatusBarComponent";
import { ReactUtils } from "../../utils/react-utils";

/**
 * Controller for the status bar using React
 */
export class StatusBarController {
	private container: HTMLElement;
	private settings: NoteStatusSettings;
	private statusService: StatusService;
	private currentStatuses: string[] = ["unknown"];

	constructor(
		statusBarContainer: HTMLElement,
		settings: NoteStatusSettings,
		statusService: StatusService,
	) {
		this.container = statusBarContainer;
		this.settings = settings;
		this.statusService = statusService;

		this.update(["unknown"]);
	}

	/**
	 * Update the status bar with new statuses
	 */
	public update(statuses: string[]): void {
		this.currentStatuses = statuses;
		this.render();
	}

	/**
	 * Render the status bar using React
	 */
	private render(): void {
		if (!this.settings.showStatusBar) {
			ReactUtils.unmount(this.container);
			return;
		}

		const statusesToShow = this.settings.useMultipleStatuses
			? this.currentStatuses
			: [this.currentStatuses[0]];

		const statusDetails = statusesToShow.map((status) => {
			const statusObj = this.statusService
				.getAllStatuses()
				.find((s) => s.name === status);
			return {
				name: status,
				icon: this.statusService.getStatusIcon(status),
				tooltipText: statusObj?.description
					? `${status} - ${statusObj.description}`
					: status,
			};
		});

		const shouldShow = this.shouldShowStatusBar();

		ReactUtils.render(
			React.createElement(StatusBarComponent, {
				statuses: statusDetails,
				isVisible: shouldShow,
			}),
			this.container,
		);
	}

	/**
	 * Determine if status bar should be visible
	 */
	private shouldShowStatusBar(): boolean {
		const onlyUnknown =
			this.currentStatuses.length === 1 &&
			this.currentStatuses[0] === "unknown";

		if (this.settings.autoHideStatusBar && onlyUnknown) {
			return false;
		}

		return true;
	}

	/**
	 * Update settings reference
	 */
	public updateSettings(settings: NoteStatusSettings): void {
		this.settings = settings;
		this.render();
	}

	/**
	 * Clean up when plugin is unloaded
	 */
	public unload(): void {
		ReactUtils.unmount(this.container);
	}
}
