import {
	MultipleNoteStatusService,
	NoteStatusService,
} from "@/core/noteStatusService";
import { PluginSettings } from "@/types/pluginSettings";
import { TFile, WorkspaceLeaf } from "obsidian";

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
	"frontmatter-manually-changed": ({ file }: { file: TFile }) => void;
	"triggered-open-modal": ({
		statusService,
	}: {
		statusService: NoteStatusService | MultipleNoteStatusService;
	}) => void;
};

export type EventName = keyof EventBusEvents;
