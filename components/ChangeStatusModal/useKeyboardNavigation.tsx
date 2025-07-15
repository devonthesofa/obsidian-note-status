import { useState, useEffect, useRef } from "react";
import { NoteStatus } from "@/types/noteStatus";

interface UseKeyboardNavigationProps {
	availableStatuses: NoteStatus[];
	currentStatuses: NoteStatus[];
	onSelectStatus: (status: NoteStatus) => void;
	onRemoveStatus: (status: NoteStatus) => void;
}

export const useKeyboardNavigation = ({
	availableStatuses,
	currentStatuses,
	onSelectStatus,
	onRemoveStatus,
}: UseKeyboardNavigationProps) => {
	const [focusedIndex, setFocusedIndex] = useState(-1);
	const [searchFilter, setSearchFilter] = useState("");
	const containerRef = useRef<HTMLDivElement>(null);
	const searchRef = useRef<HTMLInputElement>(null);

	const filteredStatuses = searchFilter
		? availableStatuses.filter((status) =>
				status.name.toLowerCase().includes(searchFilter.toLowerCase()),
			)
		: availableStatuses;

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
						onRemoveStatus(status);
					} else {
						onSelectStatus(status);
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

	return {
		focusedIndex,
		searchFilter,
		filteredStatuses,
		containerRef,
		searchRef,
		handleKeyDown,
		setSearchFilter,
	};
};
