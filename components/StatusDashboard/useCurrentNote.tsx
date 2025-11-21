import { useState, useCallback } from "react";
import { TFile } from "obsidian";
import { NoteStatus } from "@/types/noteStatus";
import {
	BaseNoteStatusService,
	NoteStatusService,
} from "@/core/noteStatusService";
import { getAllFrontmatterKeys } from "@/core/statusKeyHelpers";

interface CurrentNoteInfo {
	file: TFile | null;
	statuses: Record<string, NoteStatus[]>;
	lastModified: number;
}

export const useCurrentNote = () => {
	const [currentNote, setCurrentNote] = useState<CurrentNoteInfo>({
		file: null,
		statuses: {},
		lastModified: 0,
	});

	const updateCurrentNote = useCallback(() => {
		const activeFile = BaseNoteStatusService.app.workspace.getActiveFile();

		if (!activeFile) {
			setCurrentNote({ file: null, statuses: {}, lastModified: 0 });
			return;
		}

		const noteStatusService = new NoteStatusService(activeFile);
		noteStatusService.populateStatuses();

		const statusMetadataKeys = getAllFrontmatterKeys();
		const statusesByKey: Record<string, NoteStatus[]> = {};
		statusMetadataKeys.forEach((key) => {
			const statuses = noteStatusService.getStatusesForKey(key);
			if (statuses.length) {
				statusesByKey[key] = statuses;
			}
		});

		setCurrentNote({
			file: activeFile,
			statuses: statusesByKey,
			lastModified: activeFile.stat.mtime,
		});
	}, []);

	return {
		currentNote,
		updateCurrentNote,
	};
};
