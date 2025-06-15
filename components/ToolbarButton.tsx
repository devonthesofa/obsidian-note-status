import React, { useRef } from "react";
import { NoteStatusSettings } from "models/types";
import { StatusService } from "services/status-service";

interface ToolbarButtonProps {
	settings: NoteStatusSettings;
	statusService: StatusService;
	statuses: string[];
	onClick?: () => void;
	className?: string;
}

interface StatusBadgeProps {
	statuses: string[];
	settings: NoteStatusSettings;
	statusService: StatusService;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
	statuses,
	settings,
	statusService,
}) => {
	const hasValidStatus = statuses.length > 0 && statuses[0] !== "unknown";

	if (hasValidStatus) {
		const primaryStatus = statuses[0];
		const icon = statusService.getStatusIcon(primaryStatus);

		return (
			<div className="note-status-toolbar-badge-container">
				<span
					className={`note-status-toolbar-icon status-${primaryStatus}`}
				>
					{icon}
				</span>
				{settings.useMultipleStatuses && statuses.length > 1 && (
					<span className="note-status-count-badge">
						{statuses.length}
					</span>
				)}
			</div>
		);
	}

	return (
		<div className="note-status-toolbar-badge-container">
			<span className="note-status-toolbar-icon status-unknown">
				{statusService.getStatusIcon("unknown")}
			</span>
		</div>
	);
};

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({
	settings,
	statusService,
	statuses,
	onClick,
	className = "",
}) => {
	const buttonRef = useRef<HTMLButtonElement>(null);

	const finalClassName =
		`note-status-toolbar-button clickable-icon view-action ${className}`.trim();

	return (
		<button
			ref={buttonRef}
			className={finalClassName}
			aria-label="Note status"
			onClick={onClick}
		>
			<StatusBadge
				statuses={statuses}
				settings={settings}
				statusService={statusService}
			/>
		</button>
	);
};

export class ToolbarButtonManager {
	private element: HTMLElement | null = null;
	private settings: NoteStatusSettings;
	private statusService: StatusService;
	private currentStatuses: string[] = ["unknown"];
	private onClick: (() => void) | undefined;

	constructor(settings: NoteStatusSettings, statusService: StatusService) {
		this.settings = settings;
		this.statusService = statusService;
	}

	public createElement(): HTMLElement {
		const container = document.createElement("div");
		container.addClass("note-status-toolbar-container");
		this.element = container;
		this.render();
		return container;
	}

	public updateDisplay(statuses: string[]): void {
		this.currentStatuses = statuses;
		this.render();
	}

	public setClickHandler(handler: () => void): void {
		this.onClick = handler;
		this.render();
	}

	private render(): void {
		if (!this.element) return;

		// Use ReactUtils to render the React component
		import("../utils/react-utils").then(({ ReactUtils }) => {
			ReactUtils.render(
				React.createElement(ToolbarButton, {
					settings: this.settings,
					statusService: this.statusService,
					statuses: this.currentStatuses,
					onClick: this.onClick,
				}),
				this.element!,
			);
		});
	}

	public updateSettings(settings: NoteStatusSettings): void {
		this.settings = settings;
		this.render();
	}

	public destroy(): void {
		if (this.element) {
			import("../utils/react-utils").then(({ ReactUtils }) => {
				ReactUtils.unmount(this.element!);
			});
			this.element.remove();
			this.element = null;
		}
	}
}

export default ToolbarButton;
