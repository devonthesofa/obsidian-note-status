import { useState, useCallback } from "react";
import { TFile } from "obsidian";
import { NoteStatus } from "@/types/noteStatus";
import {
	BaseNoteStatusService,
	NoteStatusService,
} from "@/core/noteStatusService";

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

		setCurrentNote({
			file: activeFile,
			statuses: noteStatusService.statuses,
			lastModified: activeFile.stat.mtime,
		});
	}, []);

	return {
		currentNote,
		updateCurrentNote,
	};
};
