import { setTooltip } from "obsidian";

/**
 * Renders the status bar UI
 */
export class StatusBarView {
	private element: HTMLElement;

	constructor(element: HTMLElement) {
		this.element = element;
		this.element.addClass("note-status-bar");
	}

	/**
	 * Clears the element and resets CSS classes
	 */
	reset(): void {
		this.element.empty();
		this.element.removeClass("left", "hidden", "auto-hide", "visible");
		this.element.addClass("note-status-bar");
	}

	/**
	 * Hide the status bar
	 */
	hide(): void {
		this.element.addClass("hidden");
		this.element.removeClass("visible");
	}

	/**
	 * Show the status bar
	 */
	show(): void {
		this.element.removeClass("hidden");
		this.element.addClass("visible");
	}

	renderStatuses(
		statuses: Array<{ name: string; icon: string; tooltipText: string }>,
	): void {
		if (statuses.length === 1) {
			this.renderSingleStatus(
				statuses[0].name,
				statuses[0].icon,
				statuses[0].tooltipText,
			);
		} else {
			this.renderMultipleStatuses(statuses);
		}
	}

	/**
	 * Render a single status
	 */
	private renderSingleStatus(
		status: string,
		icon: string,
		tooltipText: string,
	): void {
		const statusText = this.element.createEl("span", {
			text: `Status: ${status}`,
			cls: `note-status-${status}`,
		});
		setTooltip(statusText, tooltipText);

		const statusIcon = this.element.createEl("span", {
			text: icon,
			cls: `note-status-icon status-${status}`,
		});
		setTooltip(statusIcon, tooltipText);
	}

	/**
	 * Render multiple statuses
	 */
	private renderMultipleStatuses(
		statuses: Array<{ name: string; icon: string; tooltipText: string }>,
	): void {
		this.element.createEl("span", {
			text: "Statuses: ",
			cls: "note-status-label",
		});

		const badgesContainer = this.element.createEl("span", {
			cls: "note-status-badges",
		});

		statuses.forEach((status) =>
			this.createStatusBadge(badgesContainer, status),
		);
	}

	/**
	 * Create a status badge for multiple status display
	 */
	private createStatusBadge(
		container: HTMLElement,
		status: { name: string; icon: string; tooltipText: string },
	): void {
		const badge = container.createEl("span", {
			cls: `note-status-badge status-${status.name}`,
		});
		setTooltip(badge, status.tooltipText);

		badge.createEl("span", {
			text: status.icon,
			cls: "note-status-badge-icon",
		});

		badge.createEl("span", {
			text: status.name,
			cls: "note-status-badge-text",
		});
	}

	/**
	 * Clean up the element
	 */
	destroy(): void {
		this.element.empty();
	}
}
