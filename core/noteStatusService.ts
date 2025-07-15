import { App, TFile } from "obsidian";
import {
	GroupedStatuses,
	NoteStatus,
	NoteStatus as NoteStatusType,
} from "@/types/noteStatus";
import { PREDEFINED_TEMPLATES } from "@/constants/defaultSettings";
import settingsService from "@/core/settingsService";
import eventBus from "./eventBus";

export abstract class BaseNoteStatusService {
	static app: App;
	statuses: GroupedStatuses;

	constructor() {
		this.statuses = {};
	}

	static initialize(app: App) {
		BaseNoteStatusService.app = app;
	}

	private static allEnabledTemplatesStatuses(): NoteStatusType[] {
		if (settingsService.settings.useCustomStatusesOnly) {
			return [];
		}
		const enabledTemplates = PREDEFINED_TEMPLATES.filter((template) =>
			settingsService.settings.enabledTemplates.includes(template.id),
		);
		return enabledTemplates.flatMap((t) => t.statuses);
	}

	static getAllAvailableStatuses(): NoteStatus[] {
		const availableStatuses = [
			...settingsService.settings.customStatuses,
			...BaseNoteStatusService.allEnabledTemplatesStatuses(),
		];
		return availableStatuses;
	}

	static async insertStatusMetadataInEditor(file: TFile): Promise<void> {
		const tagPrefix = settingsService.settings.tagPrefix;

		await BaseNoteStatusService.app.fileManager.processFrontMatter(
			file,
			(frontmatter) => {
				const noteStatusFrontmatter =
					(frontmatter?.[tagPrefix] as string[]) || [];
				if (!noteStatusFrontmatter.length) {
					frontmatter[tagPrefix] = [];
				}
			},
		);
	}

	protected statusNameToObject(statusName: NoteStatusType["name"]) {
		const availableStatuses =
			BaseNoteStatusService.getAllAvailableStatuses();
		const s = availableStatuses.find((f) => f.name === statusName);
		return s;
	}

	protected getStatusMetadataKeys(): string[] {
		return [settingsService.settings.tagPrefix];
	}

	abstract populateStatuses(): void;
	abstract removeStatus(
		frontmatterTagName: string,
		status: NoteStatus,
	): Promise<boolean>;
	abstract addStatus(
		frontmatterTagName: string,
		statusIdentifier: NoteStatus["name"],
	): Promise<boolean>;
}

export class NoteStatusService extends BaseNoteStatusService {
	private file: TFile;

	constructor(file: TFile) {
		super();
		this.file = file;
	}

	public populateStatuses(): void {
		const STATUS_METADATA_KEYS = this.getStatusMetadataKeys();
		this.statuses = Object.fromEntries(
			STATUS_METADATA_KEYS.map((key) => [key, []]),
		);

		if (!this.file) {
			return;
		}

		const cachedMetadata =
			BaseNoteStatusService.app.metadataCache.getFileCache(this.file);
		const frontmatter = cachedMetadata?.frontmatter;
		if (!frontmatter) {
			return;
		}

		STATUS_METADATA_KEYS.forEach((key) => {
			const value = frontmatter[key];
			if (value) {
				let statuses: (NoteStatusType | undefined)[] = [];
				if (Array.isArray(value)) {
					statuses = value.map((v) =>
						this.statusNameToObject(v.toString()),
					);
				} else {
					statuses = [this.statusNameToObject(value.toString())];
				}

				statuses = statuses.filter((s) => s !== undefined);
				if (
					statuses.length &&
					!settingsService.settings.useMultipleStatuses
				) {
					statuses = statuses.slice(0, 1);
				}
				this.statuses[key] = statuses as NoteStatusType[];
			}
		});
	}

	async removeStatus(
		frontmatterTagName: string,
		status: NoteStatus,
	): Promise<boolean> {
		let removed = false;
		await BaseNoteStatusService.app.fileManager.processFrontMatter(
			this.file,
			(frontmatter) => {
				const noteStatusFrontmatter =
					(frontmatter?.[frontmatterTagName] as string[]) || [];
				if (!noteStatusFrontmatter.length) return;

				if (Array.isArray(noteStatusFrontmatter)) {
					const i = noteStatusFrontmatter.findIndex(
						(statusName: string) => statusName === status.name,
					);
					if (i !== -1) {
						noteStatusFrontmatter.splice(i, 1);
						removed = true;
					}
				}
			},
		);

		if (removed) {
			eventBus.publish("frontmatter-manually-changed", {
				file: this.file,
			});
		}
		return removed;
	}

	async clearStatus(frontmatterTagName: string): Promise<boolean> {
		await BaseNoteStatusService.app.fileManager.processFrontMatter(
			this.file,
			(frontmatter) => {
				if (frontmatterTagName in frontmatter) {
					delete frontmatter[frontmatterTagName];
				}
			},
		);
		eventBus.publish("frontmatter-manually-changed", { file: this.file });
		return true;
	}

	async overrideStatuses(
		frontmatterTagName: string,
		statusIdentifiers: NoteStatus["name"][],
	): Promise<boolean> {
		await BaseNoteStatusService.app.fileManager.processFrontMatter(
			this.file,
			(frontmatter) => {
				if (
					frontmatterTagName in frontmatter &&
					Array.isArray(frontmatter[frontmatterTagName])
				) {
					frontmatter[frontmatterTagName].splice(0);
					frontmatter[frontmatterTagName].push(...statusIdentifiers);
				}
				frontmatter[frontmatterTagName] = [...statusIdentifiers];
			},
		);
		eventBus.publish("frontmatter-manually-changed", { file: this.file });
		return true;
	}

	async addStatus(
		frontmatterTagName: string,
		statusIdentifier: NoteStatus["name"],
	): Promise<boolean> {
		let added = false;
		await BaseNoteStatusService.app.fileManager.processFrontMatter(
			this.file,
			(frontmatter) => {
				const noteStatusFrontmatter =
					(frontmatter?.[frontmatterTagName] as string[]) || [];
				if (!settingsService.settings.useMultipleStatuses) {
					frontmatter[frontmatterTagName] = statusIdentifier;
					added = true;
				} else {
					const i = noteStatusFrontmatter.findIndex(
						(statusName: string) => statusName === statusIdentifier,
					);
					if (i === -1) {
						frontmatter[frontmatterTagName].push(statusIdentifier);
						added = true;
					}
				}
			},
		);
		if (added) {
			eventBus.publish("frontmatter-manually-changed", {
				file: this.file,
			});
		}
		return added;
	}
}

export class MultipleNoteStatusService extends BaseNoteStatusService {
	private files: TFile[];

	constructor(files: TFile[]) {
		super();
		this.files = files;
	}

	selectedFilesQTY() {
		return this.files.length;
	}

	public populateStatuses(): void {
		const STATUS_METADATA_KEYS = this.getStatusMetadataKeys();

		this.statuses = Object.fromEntries(
			STATUS_METADATA_KEYS.map((key) => [key, []]),
		);

		const allStatuses = new Map<string, Set<string>>();

		this.files.forEach((file) => {
			const cachedMetadata =
				BaseNoteStatusService.app.metadataCache.getFileCache(file);
			const frontmatter = cachedMetadata?.frontmatter;
			if (!frontmatter) return;

			STATUS_METADATA_KEYS.forEach((key) => {
				const value = frontmatter[key];
				if (value) {
					if (!allStatuses.has(key)) {
						allStatuses.set(key, new Set());
					}

					const statusNames = Array.isArray(value) ? value : [value];
					statusNames.forEach((name) =>
						allStatuses.get(key)!.add(name.toString()),
					);
				}
			});
		});

		STATUS_METADATA_KEYS.forEach((key) => {
			const statusNames = allStatuses.get(key);
			if (statusNames) {
				const statuses = Array.from(statusNames)
					.map((name) => this.statusNameToObject(name))
					.filter((s) => s !== undefined) as NoteStatusType[];

				this.statuses[key] = statuses;
			}
		});
	}

	async removeStatus(
		frontmatterTagName: string,
		status: NoteStatus,
	): Promise<boolean> {
		let removedFromAny = false;

		const promises = this.files.map(async (file) => {
			let removed = false;
			await BaseNoteStatusService.app.fileManager.processFrontMatter(
				file,
				(frontmatter) => {
					const noteStatusFrontmatter =
						frontmatter[frontmatterTagName];
					if (!noteStatusFrontmatter) return;

					if (Array.isArray(noteStatusFrontmatter)) {
						const index = noteStatusFrontmatter.findIndex(
							(statusName: string) => statusName === status.name,
						);
						if (index !== -1) {
							noteStatusFrontmatter.splice(index, 1);
							removed = true;
						}
					} else if (noteStatusFrontmatter === status.name) {
						delete frontmatter[frontmatterTagName];
						removed = true;
					}
				},
			);
			return removed;
		});

		const results = await Promise.all(promises);
		removedFromAny = results.some((result) => result);

		if (removedFromAny) {
			this.files.forEach((file) => {
				eventBus.publish("frontmatter-manually-changed", { file });
			});
		}

		return removedFromAny;
	}

	async addStatus(
		frontmatterTagName: string,
		statusIdentifier: NoteStatus["name"],
	): Promise<boolean> {
		let addedToAny = false;

		const promises = this.files.map(async (file) => {
			let added = false;
			await BaseNoteStatusService.app.fileManager.processFrontMatter(
				file,
				(frontmatter) => {
					const noteStatusFrontmatter =
						frontmatter[frontmatterTagName];

					if (!noteStatusFrontmatter) {
						frontmatter[frontmatterTagName] = [statusIdentifier];
						added = true;
					} else if (Array.isArray(noteStatusFrontmatter)) {
						if (!noteStatusFrontmatter.includes(statusIdentifier)) {
							noteStatusFrontmatter.push(statusIdentifier);
							added = true;
						}
					} else {
						if (noteStatusFrontmatter !== statusIdentifier) {
							frontmatter[frontmatterTagName] = [
								noteStatusFrontmatter,
								statusIdentifier,
							];
							added = true;
						}
					}
				},
			);
			return added;
		});

		const results = await Promise.all(promises);
		addedToAny = results.some((result) => result);

		if (addedToAny) {
			this.files.forEach((file) => {
				eventBus.publish("frontmatter-manually-changed", { file });
			});
		}

		return addedToAny;
	}

	getFilesWithStatus(
		frontmatterTagName: string,
		status: NoteStatus,
	): TFile[] {
		return this.files.filter((file) => {
			const cachedMetadata =
				BaseNoteStatusService.app.metadataCache.getFileCache(file);
			const frontmatter = cachedMetadata?.frontmatter;
			if (!frontmatter) return false;

			const value = frontmatter[frontmatterTagName];
			if (!value) return false;

			if (Array.isArray(value)) {
				return value.includes(status.name);
			}
			return value === status.name;
		});
	}
}
