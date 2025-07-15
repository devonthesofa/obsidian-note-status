import React, { useState, useEffect, useRef } from "react";
import { NoteStatus } from "@/types/noteStatus";
import { SearchFilter } from "../atoms/SearchFilter";
import { StatusChip } from "../atoms/StatusChip";
import { StatusSelector } from "../atoms/StatusSelector";
import { SettingItem } from "../SettingsUI.tsx/SettingItem";

export interface Props {
	frontmatterTagName: string;
	currentStatuses: NoteStatus[];
	availableStatuses: NoteStatus[];
	onSelectedState: (
		frontmatterTagName: string,
		status: NoteStatus,
		action: "select" | "unselected",
	) => void;
}

export const StatusSelectorGroupedByTag: React.FC<Props> = ({
	currentStatuses,
	availableStatuses,
	frontmatterTagName,
	onSelectedState,
}) => {
	const [searchFilter, setSearchFilter] = useState("");
	const [focusedIndex, setFocusedIndex] = useState(-1);
	const containerRef = useRef<HTMLDivElement>(null);
	const searchRef = useRef<HTMLInputElement>(null);

	const filteredStatuses = searchFilter
		? availableStatuses.filter((status) =>
				status.name.toLowerCase().includes(searchFilter.toLowerCase()),
			)
		: availableStatuses;

	const handleRemoveStatus = async (status: NoteStatus) => {
		onSelectedState(frontmatterTagName, status, "unselected");
	};

	const handleSelectStatus = async (status: NoteStatus) => {
		onSelectedState(frontmatterTagName, status, "select");
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		switch (e.key) {
			case "ArrowDown":
				e.preventDefault();
				if (filteredStatuses.length > 0) {
					setFocusedIndex((prev) =>
						prev < filteredStatuses.length - 1 ? prev + 1 : 0,
					);
				}
				break;
			case "ArrowUp":
				e.preventDefault();
				if (filteredStatuses.length > 0) {
					setFocusedIndex((prev) =>
						prev > 0 ? prev - 1 : filteredStatuses.length - 1,
					);
				}
				break;
			case "Tab":
				if (!e.shiftKey) {
					e.preventDefault();
					if (filteredStatuses.length > 0) {
						setFocusedIndex((prev) =>
							prev < filteredStatuses.length - 1 ? prev + 1 : 0,
						);
					}
				} else {
					e.preventDefault();
					if (filteredStatuses.length > 0) {
						setFocusedIndex((prev) =>
							prev > 0 ? prev - 1 : filteredStatuses.length - 1,
						);
					}
				}
				break;
			case "Enter":
				if (
					focusedIndex >= 0 &&
					focusedIndex < filteredStatuses.length
				) {
					e.preventDefault();
					const status = filteredStatuses[focusedIndex];
					const isSelected = currentStatuses.some(
						(s) => s.name === status.name,
					);
					if (isSelected) {
						handleRemoveStatus(status);
					} else {
						handleSelectStatus(status);
					}
				}
				break;
			case "Backspace":
				e.preventDefault();
				setSearchFilter((prev) => prev.slice(0, -1));
				if (searchRef.current) {
					searchRef.current.focus();
				}
				break;
			case "Escape":
				e.preventDefault();
				setSearchFilter("");
				break;
			default:
				if (
					e.key.length === 1 &&
					!e.ctrlKey &&
					!e.metaKey &&
					!e.altKey
				) {
					e.preventDefault();
					setSearchFilter((prev) => prev + e.key);
					if (searchRef.current) {
						searchRef.current.focus();
					}
				}
				break;
		}
	};

	useEffect(() => {
		setFocusedIndex(filteredStatuses.length > 0 ? 0 : -1);
	}, [searchFilter, filteredStatuses.length]);

	useEffect(() => {
		if (containerRef.current) {
			containerRef.current.focus();
		}
	}, []);

	return (
		<div
			ref={containerRef}
			tabIndex={0}
			onKeyDown={handleKeyDown}
			style={{ outline: "none" }}
		>
			<SearchFilter
				ref={searchRef}
				value={searchFilter}
				onFilterChange={(value) => setSearchFilter(value)}
			/>
			<SettingItem name="Current statuses" vertical>
				{filteredStatuses.length === 0 ? (
					<div
						style={{
							padding: "16px",
							textAlign: "center",
							color: "var(--text-muted)",
							fontStyle: "italic",
						}}
					>
						{searchFilter
							? `No statuses match "${searchFilter}"`
							: "No statuses found"}
					</div>
				) : (
					<StatusSelector
						availableStatuses={filteredStatuses}
						currentStatuses={currentStatuses}
						focusedIndex={focusedIndex}
						onToggleStatus={(status, selected) =>
							selected
								? handleSelectStatus(status)
								: handleRemoveStatus(status)
						}
					/>
				)}
			</SettingItem>
			<SettingItem name="Available statuses" vertical>
				<div
					className="note-status-chips"
					style={{
						display: "flex",
						flexWrap: "wrap",
						gap: "6px",
						minHeight: "32px",
						alignItems: "center",
					}}
				>
					{currentStatuses.map((s) => (
						<StatusChip
							key={s.name}
							status={s}
							onRemove={() => handleRemoveStatus(s)}
						/>
					))}
				</div>
			</SettingItem>
		</div>
	);
};
