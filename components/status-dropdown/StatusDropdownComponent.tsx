import React, { useState, useEffect, useRef } from "react";
import { TFile, setTooltip } from "obsidian";
import { StatusService } from "../../services/status-service";
import { NoteStatusSettings, Status } from "../../models/types";

interface StatusDropdownProps {
	isOpen: boolean;
	currentStatuses: string[];
	targetFiles: TFile[];
	settings: NoteStatusSettings;
	statusService: StatusService;
	onRemoveStatus: (status: string, target: TFile | TFile[]) => Promise<void>;
	onSelectStatus: (status: string, target: TFile[]) => Promise<void>;
	onClose: () => void;
}

export const StatusDropdownComponent: React.FC<StatusDropdownProps> = ({
	isOpen,
	currentStatuses,
	targetFiles,
	settings,
	statusService,
	onRemoveStatus,
	onSelectStatus,
	onClose,
}) => {
	const [searchFilter, setSearchFilter] = useState("");
	const searchInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (isOpen && searchInputRef.current) {
			setTimeout(() => searchInputRef.current?.focus(), 50);
		}
	}, [isOpen]);

	if (!isOpen) return null;

	const allStatuses = statusService
		.getAllStatuses()
		.filter((status) => status.name !== "unknown");

	const filteredStatuses = searchFilter
		? allStatuses.filter(
				(status) =>
					status.name
						.toLowerCase()
						.includes(searchFilter.toLowerCase()) ||
					status.icon.includes(searchFilter),
			)
		: allStatuses;

	const hasNoValidStatus =
		currentStatuses.length === 0 ||
		(currentStatuses.length === 1 && currentStatuses[0] === "unknown");

	const handleRemoveStatus = async (status: string) => {
		const target = targetFiles.length > 1 ? targetFiles : targetFiles[0];
		if (target) {
			await onRemoveStatus(status, target);
		}
	};

	const handleSelectStatus = async (status: string) => {
		if (targetFiles.length > 0) {
			await onSelectStatus(status, targetFiles);
		}
	};

	return (
		<div className="note-status-popover note-status-unified-dropdown note-status-popover-animate-in">
			{/* Header */}
			<div className="note-status-popover-header">
				<div className="note-status-popover-title">
					<div className="note-status-popover-icon">
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
							<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
							<line x1="7" y1="7" x2="7.01" y2="7" />
						</svg>
					</div>
					<span className="note-status-popover-label">
						Note status
					</span>
					{targetFiles.length > 1 && (
						<span className="note-status-popover-count">
							({targetFiles.length} files)
						</span>
					)}
				</div>
			</div>

			{/* Current Status Chips */}
			<div className="note-status-popover-chips">
				{hasNoValidStatus ? (
					<div className="note-status-empty-indicator">
						No status assigned
					</div>
				) : (
					currentStatuses
						.filter((status) => status !== "unknown")
						.map((status) => {
							const statusObj = allStatuses.find(
								(s) => s.name === status,
							);
							if (!statusObj) return null;

							return (
								<StatusChip
									key={status}
									status={statusObj}
									onRemove={() => handleRemoveStatus(status)}
								/>
							);
						})
				)}
			</div>

			{/* Search Filter */}
			<div className="note-status-popover-search">
				<input
					ref={searchInputRef}
					type="text"
					placeholder="Filter statuses..."
					className="note-status-popover-search-input"
					value={searchFilter}
					onChange={(e) => setSearchFilter(e.target.value)}
				/>
			</div>

			{/* Status Options */}
			<div className="note-status-options-container">
				{filteredStatuses.length === 0 ? (
					<div className="note-status-empty-options">
						{searchFilter
							? `No statuses match "${searchFilter}"`
							: "No statuses found"}
					</div>
				) : (
					filteredStatuses.map((status) => (
						<StatusOption
							key={status.name}
							status={status}
							isSelected={currentStatuses.includes(status.name)}
							onSelect={() => handleSelectStatus(status.name)}
						/>
					))
				)}
			</div>
		</div>
	);
};

interface StatusChipProps {
	status: Status;
	onRemove: () => void;
}

const StatusChip: React.FC<StatusChipProps> = ({ status, onRemove }) => {
	const chipRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (chipRef.current) {
			const tooltipValue = status.description
				? `${status.name} - ${status.description}`
				: status.name;
			setTooltip(chipRef.current, tooltipValue);
		}
	}, [status]);

	const handleRemove = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (chipRef.current) {
			chipRef.current.classList.add("note-status-chip-removing");
			setTimeout(() => {
				onRemove();
			}, 150);
		}
	};

	return (
		<div ref={chipRef} className={`note-status-chip status-${status.name}`}>
			<span className="note-status-chip-icon">{status.icon}</span>
			<span className="note-status-chip-text">{status.name}</span>
			<div
				className="note-status-chip-remove"
				aria-label={`Remove ${status.name} status`}
				title={`Remove ${status.name} status`}
				onClick={handleRemove}
			>
				<svg
					width="12"
					height="12"
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
			</div>
		</div>
	);
};

interface StatusOptionProps {
	status: Status;
	isSelected: boolean;
	onSelect: () => void;
}

const StatusOption: React.FC<StatusOptionProps> = ({
	status,
	isSelected,
	onSelect,
}) => {
	const optionRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (optionRef.current && status.description) {
			setTooltip(
				optionRef.current,
				`${status.name} - ${status.description}`,
			);
		}
	}, [status]);

	const handleClick = () => {
		if (optionRef.current) {
			optionRef.current.classList.add("note-status-option-selecting");
			setTimeout(() => {
				onSelect();
			}, 150);
		}
	};

	return (
		<div
			ref={optionRef}
			className={`note-status-option ${
				isSelected ? "is-selected" : ""
			} status-${status.name}`}
			onClick={handleClick}
		>
			<span className="note-status-option-icon">{status.icon}</span>
			<span className="note-status-option-text">{status.name}</span>
			{isSelected && (
				<div className="note-status-option-check">
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
						<polyline points="20,6 9,17 4,12" />
					</svg>
				</div>
			)}
		</div>
	);
};
