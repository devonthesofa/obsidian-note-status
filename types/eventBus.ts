import {
	MultipleNoteStatusService,
	NoteStatusService,
} from "@/core/noteStatusService";
import { PluginSettings } from "@/types/pluginSettings";
import { TFile, WorkspaceLeaf } from "obsidian";
import { NoteStatus } from "@/types/noteStatus";

export type EventBusEvents = {
	"active-file-change": ({ leaf }: { leaf: WorkspaceLeaf | null }) => void;
	"plugin-settings-changed": ({
		key,
		value,
		currentSettings,
	}: {
		key: keyof PluginSettings;
		value: unknown;
		currentSettings: PluginSettings;
	}) => void;
	"status-changed": ({ file }: { file: TFile }) => void;
	"triggered-open-modal": ({
		statusService,
		activeStatus,
	}: {
		statusService: NoteStatusService | MultipleNoteStatusService;
		activeStatus?: NoteStatus;
	}) => void;
};

export type EventName = keyof EventBusEvents;
