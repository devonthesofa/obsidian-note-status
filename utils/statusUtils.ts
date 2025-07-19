import { NoteStatus } from "@/types/noteStatus";
import { TFile } from "obsidian";

/**
 * Checks if a status is selected in the current statuses array
 */
export const isStatusSelected = (
	status: NoteStatus,
	currentStatuses: NoteStatus[],
): boolean => {
	return currentStatuses.some((s) => s.name === status.name);
};

/**
 * Generates a tooltip string for a status
 */
export const getStatusTooltip = (status: NoteStatus): string => {
	return status.description
		? `${status.name} - ${status.description}`
		: status.name;
};

/**
 * Converts a TFile to a FileItem for UI display
 */
export interface FileItem {
	id: string;
	name: string;
	path: string;
}

export const convertTFileToFileItem = (file: TFile): FileItem => ({
	id: file.path,
	name: file.basename,
	path: file.path,
});

/**
 * Gets the display name for a status, optionally including description
 */
export const getStatusDisplayName = (
	status: NoteStatus,
	includeDescription = false,
): string => {
	if (!includeDescription || !status.description) {
		return status.name;
	}
	return `${status.name} - ${status.description}`;
};

/**
 * Compares two statuses for equality by name
 */
export const isStatusEqual = (
	status1: NoteStatus,
	status2: NoteStatus,
): boolean => {
	return status1.name === status2.name;
};

/**
 * Finds a status by name in an array
 */
export const findStatusByName = (
	statuses: NoteStatus[],
	name: string,
): NoteStatus | undefined => {
	return statuses.find((status) => status.name === name);
};
