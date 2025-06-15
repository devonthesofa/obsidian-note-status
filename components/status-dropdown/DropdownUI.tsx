import React, { useState, useEffect, useRef, useCallback } from "react";
import { App, TFile } from "obsidian";
import {
	DropdownDependencies,
	StatusRemoveHandler,
	StatusSelectHandler,
} from "./types";
import { positionDropdown } from "./dropdown-position";
import { StatusService } from "services/status-service";
import { NoteStatusSettings } from "models/types";
import { ReactUtils } from "../../utils/react-utils";

interface DropdownUIProps {
	app: App;
	statusService: StatusService;
	settings: NoteStatusSettings;
	currentStatuses: string[];
	targetFile: TFile | null;
	targetFiles: TFile[];
	isOpen: boolean;
	onRemoveStatus: StatusRemoveHandler;
	onSelectStatus: StatusSelectHandler;
	onClose: () => void;
	targetElement?: HTMLElement;
	position?: { x: number; y: number };
}

interface StatusItemProps {
	status: {
		name: string;
		icon: string;
		description?: string;
	};
	isSelected: boolean;
	onSelect: () => void;
	onRemove?: () => void;
	showRemove: boolean;
}

const StatusItem: React.FC<StatusItemProps> = ({
	status,
	isSelected,
	onSelect,
	onRemove,
	showRemove,
}) => {
	return (
		<div
			className={`note-status-dropdown-item ${isSelected ? "selected" : ""}`}
			onClick={onSelect}
		>
			<div className="note-status-item-content">
				<span className="note-status-item-icon">{status.icon}</span>
				<span className="note-status-item-name">{status.name}</span>
				{status.description && (
					<span className="note-status-item-description">
						{status.description}
					</span>
				)}
			</div>
			{showRemove && isSelected && onRemove && (
				<button
					className="note-status-remove-btn"
					onClick={(e) => {
						e.stopPropagation();
						onRemove();
					}}
					title={`Remove ${status.name} status`}
				>
					×
				</button>
			)}
		</div>
	);
};

interface DropdownContentProps {
	settings: NoteStatusSettings;
	statusService: StatusService;
	currentStatuses: string[];
	targetFile: TFile | null;
	targetFiles: TFile[];
	onRemoveStatus: StatusRemoveHandler;
	onSelectStatus: StatusSelectHandler;
}

const DropdownContent: React.FC<DropdownContentProps> = ({
	settings,
	statusService,
	currentStatuses,
	targetFile,
	targetFiles,
	onRemoveStatus,
	onSelectStatus,
}) => {
	const allStatuses = statusService.getAllStatuses();
	const isMultipleFiles = targetFiles.length > 1;

	const handleStatusSelect = useCallback(
		async (statusName: string) => {
			const files =
				targetFiles.length > 0
					? targetFiles
					: targetFile
						? [targetFile]
						: [];
			await onSelectStatus(
				statusName,
				isMultipleFiles ? files : files[0],
			);
		},
		[targetFile, targetFiles, onSelectStatus, isMultipleFiles],
	);

	const handleStatusRemove = useCallback(
		async (statusName: string) => {
			const files =
				targetFiles.length > 0
					? targetFiles
					: targetFile
						? [targetFile]
						: [];
			await onRemoveStatus(
				statusName,
				isMultipleFiles ? files : files[0],
			);
		},
		[targetFile, targetFiles, onRemoveStatus, isMultipleFiles],
	);

	if (allStatuses.length === 0) {
		return (
			<div className="note-status-dropdown-empty">
				<p>No statuses available</p>
				<p className="note-status-dropdown-help">
					Configure statuses in plugin settings
				</p>
			</div>
		);
	}

	return (
		<div className="note-status-dropdown-content">
			{isMultipleFiles && (
				<div className="note-status-dropdown-header">
					<p>Updating {targetFiles.length} files</p>
				</div>
			)}

			<div className="note-status-dropdown-list">
				{allStatuses.map((status) => {
					const isSelected = currentStatuses.includes(status.name);
					return (
						<StatusItem
							key={status.name}
							status={status}
							isSelected={isSelected}
							onSelect={() => handleStatusSelect(status.name)}
							onRemove={() => handleStatusRemove(status.name)}
							showRemove={settings.useMultipleStatuses}
						/>
					);
				})}
			</div>
		</div>
	);
};

export const DropdownUI: React.FC<DropdownUIProps> = ({
	app,
	statusService,
	settings,
	currentStatuses,
	targetFile,
	targetFiles,
	isOpen,
	onRemoveStatus,
	onSelectStatus,
	onClose,
	targetElement,
	position,
}) => {
	const dropdownRef = useRef<HTMLDivElement>(null);
	const [isAnimating, setIsAnimating] = useState(false);

	const handleClickOutside = useCallback(
		(e: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(e.target as Node)
			) {
				onClose();
			}
		},
		[onClose],
	);

	const handleEscapeKey = useCallback(
		(e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		},
		[onClose],
	);

	useEffect(() => {
		if (isOpen) {
			setIsAnimating(true);
			const timer = setTimeout(() => setIsAnimating(false), 220);

			document.addEventListener("click", handleClickOutside);
			document.addEventListener("keydown", handleEscapeKey);

			return () => {
				clearTimeout(timer);
				document.removeEventListener("click", handleClickOutside);
				document.removeEventListener("keydown", handleEscapeKey);
			};
		}
	}, [isOpen, handleClickOutside, handleEscapeKey]);

	useEffect(() => {
		if (isOpen && dropdownRef.current && targetElement) {
			positionDropdown({
				dropdownElement: dropdownRef.current,
				targetEl: targetElement,
				position,
			});
		}
	}, [isOpen, targetElement, position]);

	if (!isOpen) {
		return null;
	}

	const className = `note-status-popover note-status-unified-dropdown ${
		isAnimating ? "note-status-popover-animate-in" : ""
	}`;

	return (
		<div ref={dropdownRef} className={className}>
			<DropdownContent
				settings={settings}
				statusService={statusService}
				currentStatuses={currentStatuses}
				targetFile={targetFile}
				targetFiles={targetFiles}
				onRemoveStatus={onRemoveStatus}
				onSelectStatus={onSelectStatus}
			/>
		</div>
	);
};

export class DropdownUIManager {
	private app: App;
	private statusService: StatusService;
	private settings: NoteStatusSettings;

	private currentStatuses: string[] = ["unknown"];
	private targetFile: TFile | null = null;
	private targetFiles: TFile[] = [];
	private container: HTMLElement | null = null;

	public isOpen = false;
	private onRemoveStatus: StatusRemoveHandler = async () => {};
	private onSelectStatus: StatusSelectHandler = async () => {};

	constructor({ app, settings, statusService }: DropdownDependencies) {
		this.app = app;
		this.statusService = statusService;
		this.settings = settings;
	}

	public setTargetFile(file: TFile | null): void {
		this.targetFile = file;
		this.targetFiles = file ? [file] : [];
	}

	public setTargetFiles(files: TFile[]): void {
		this.targetFiles = [...files];
		this.targetFile = files.length === 1 ? files[0] : null;
	}

	public setOnRemoveStatusHandler(handler: StatusRemoveHandler): void {
		this.onRemoveStatus = handler;
	}

	public setOnSelectStatusHandler(handler: StatusSelectHandler): void {
		this.onSelectStatus = handler;
	}

	public updateStatuses(statuses: string[] | string): void {
		this.currentStatuses = Array.isArray(statuses)
			? [...statuses]
			: [statuses];
		this.render();
	}

	public updateSettings(settings: NoteStatusSettings): void {
		this.settings = settings;
		this.render();
	}

	public open(
		targetEl: HTMLElement,
		position?: { x: number; y: number },
	): void {
		if (this.isOpen) {
			this.close();
			setTimeout(() => this.actuallyOpen(targetEl, position), 10);
			return;
		}

		this.actuallyOpen(targetEl, position);
	}

	private actuallyOpen(
		targetEl: HTMLElement,
		position?: { x: number; y: number },
	): void {
		this.isOpen = true;
		this.createContainer();
		this.render(targetEl, position);
	}

	private createContainer(): void {
		if (!this.container) {
			this.container = document.createElement("div");
			document.body.appendChild(this.container);
		}
	}

	public close(): void {
		this.isOpen = false;
		this.render();

		setTimeout(() => {
			if (this.container) {
				ReactUtils.unmount(this.container);
				this.container.remove();
				this.container = null;
			}
		}, 220);
	}

	private render(
		targetElement?: HTMLElement,
		position?: { x: number; y: number },
	): void {
		if (!this.container) return;

		ReactUtils.render(
			React.createElement(DropdownUI, {
				app: this.app,
				statusService: this.statusService,
				settings: this.settings,
				currentStatuses: this.currentStatuses,
				targetFile: this.targetFile,
				targetFiles: this.targetFiles,
				isOpen: this.isOpen,
				onRemoveStatus: this.onRemoveStatus,
				onSelectStatus: this.onSelectStatus,
				onClose: () => this.close(),
				targetElement,
				position,
			}),
			this.container,
		);
	}

	public dispose(): void {
		this.close();
	}
}
