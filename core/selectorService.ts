import { App } from "obsidian";
import {
	MultipleNoteStatusService,
	NoteStatusService,
} from "./noteStatusService";

class SelectorService {
	static app: App;
	public noteStatusService: NoteStatusService | MultipleNoteStatusService;

	constructor(
		noteStatusService: NoteStatusService | MultipleNoteStatusService,
	) {
		this.noteStatusService = noteStatusService;
	}
}

export default SelectorService;
