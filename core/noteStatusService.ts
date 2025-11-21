import { App, TFile } from "obsidian";
import {
	GroupedStatuses,
	NoteStatus,
	NoteStatus as NoteStatusType,
	StatusIdentifier,
	ScopedStatusName,
} from "@/types/noteStatus";
import settingsService from "@/core/settingsService";
import eventBus from "./eventBus";
import statusStoreManager from "./statusStoreManager";
import type { StatusStore } from "./statusStores/types";

export abstract class BaseNoteStatusService {
	static app: App;
	statuses: GroupedStatuses;

	constructor() {
		this.statuses = {};
	}

	static initialize(app: App) {
		BaseNoteStatusService.app = app;
	}

	static parseStatusIdentifier(
		identifier: StatusIdentifier,
	): ScopedStatusName {
		if (typeof identifier === "string") {
			if (identifier.includes(":")) {
				const [templateId, name] = identifier.split(":", 2);
				return { templateId, name };
			}
			return { name: identifier };
		}
		return identifier;
	}

	static formatStatusIdentifier(scopedName: ScopedStatusName): string {
		if (scopedName.templateId) {
			return `${scopedName.templateId}:${scopedName.name}`;
		}
		return scopedName.name;
	}

	static resolveStatusFromIdentifier(
		identifier: StatusIdentifier,
	): NoteStatus | undefined {
		const parsed = BaseNoteStatusService.parseStatusIdentifier(identifier);
		const availableStatuses =
			BaseNoteStatusService.getAllAvailableStatuses();

		if (parsed.templateId) {
			return availableStatuses.find(
				(s) =>
					s.name === parsed.name &&
					s.templateId === parsed.templateId,
			);
		}

		return availableStatuses.find((s) => s.name === parsed.name);
	}

	private static allEnabledTemplatesStatuses(): NoteStatusType[] {
		if (settingsService.settings.useCustomStatusesOnly) {
			return [];
		}
		const enabledTemplates = settingsService.settings.templates.filter(
			(template) =>
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

	// static async insertStatusMetadataInEditor(file: TFile): Promise<void> {
	// 	const tagPrefix = settingsService.settings.tagPrefix;
	//
	// 	await BaseNoteStatusService.app.fileManager.processFrontMatter(
	// 		file,
	// 		(frontmatter) => {
	// 			const noteStatusFrontmatter =
	// 				(frontmatter?.[tagPrefix] as string[]) || [];
	// 			if (!noteStatusFrontmatter.length) {
	// 				frontmatter[tagPrefix] = [];
	// 			}
	// 		},
	// 	);
	// }

	protected statusNameToObject(statusName: string | StatusIdentifier) {
		if (typeof statusName === "string") {
			return BaseNoteStatusService.resolveStatusFromIdentifier(
				statusName,
			);
		}
		return BaseNoteStatusService.resolveStatusFromIdentifier(statusName);
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
		statusIdentifier: StatusIdentifier,
	): Promise<boolean>;
}

export class NoteStatusService extends BaseNoteStatusService {
	private file: TFile;
	private statusStore: StatusStore;

	constructor(file: TFile) {
		super();
		this.file = file;
		this.statusStore = statusStoreManager.getStoreForFile(file);
	}

	private shouldStoreStatusesAsArray(): boolean {
		if (settingsService.settings.useMultipleStatuses) {
			return true;
		}
		const mode = settingsService.settings.singleStatusStorageMode || "list";
		return mode === "list";
	}

	private getStoreOptions() {
		return { storeAsArray: this.shouldStoreStatusesAsArray() };
	}

	private statusesAreEqual(a: string[], b: string[]): boolean {
		if (a.length !== b.length) return false;
		return a.every((value, index) => value === b[index]);
	}

	public populateStatuses(): void {
		const STATUS_METADATA_KEYS = this.getStatusMetadataKeys();
		this.statuses = Object.fromEntries(
			STATUS_METADATA_KEYS.map((key) => [key, []]),
		);

		if (!this.file) {
			return;
		}

		STATUS_METADATA_KEYS.forEach((key) => {
			const identifiers = this.statusStore.getStatuses(this.file, key);
			if (!identifiers.length) {
				return;
			}

			let statuses = identifiers
				.map((identifier) =>
					this.statusNameToObject(identifier.toString()),
				)
				.filter(
					(status): status is NoteStatusType => status !== undefined,
				);

			if (
				statuses.length &&
				!settingsService.settings.useMultipleStatuses
			) {
				statuses = statuses.slice(0, 1);
			}
			this.statuses[key] = statuses;
		});
	}

	async removeStatus(
		frontmatterTagName: string,
		status: NoteStatus,
	): Promise<boolean> {
		const targetIdentifier = status.templateId
			? BaseNoteStatusService.formatStatusIdentifier({
					templateId: status.templateId,
					name: status.name,
				})
			: status.name;

		const removed = await this.statusStore.mutateStatuses(
			this.file,
			frontmatterTagName,
			(current) => {
				if (!current.length) {
					return { hasChanged: false };
				}

				let i = current.findIndex(
					(statusName: string) => statusName === targetIdentifier,
				);

				if (i === -1 && status.templateId) {
					i = current.findIndex(
						(statusName: string) => statusName === status.name,
					);
				}

				if (i === -1) {
					return { hasChanged: false };
				}

				const nextStatuses = [...current];
				nextStatuses.splice(i, 1);
				return { hasChanged: true, nextStatuses };
			},
			this.getStoreOptions(),
		);

		if (removed) {
			eventBus.publish("status-changed", {
				file: this.file,
			});
		}
		return removed;
	}

	async clearStatus(frontmatterTagName: string): Promise<boolean> {
		const cleared = await this.statusStore.mutateStatuses(
			this.file,
			frontmatterTagName,
			(current) => {
				if (!current.length) {
					return { hasChanged: false };
				}
				return { hasChanged: true, nextStatuses: [] };
			},
			this.getStoreOptions(),
		);
		if (cleared) {
			eventBus.publish("status-changed", {
				file: this.file,
			});
		}
		return cleared;
	}

	async overrideStatuses(
		frontmatterTagName: string,
		statusIdentifiers: StatusIdentifier[],
	): Promise<boolean> {
		const formattedIdentifiers = statusIdentifiers.map((id) =>
			typeof id === "string"
				? id
				: BaseNoteStatusService.formatStatusIdentifier(id),
		);
		const statusesToStore = settingsService.settings.useMultipleStatuses
			? formattedIdentifiers
			: formattedIdentifiers.slice(0, 1);

		const overridden = await this.statusStore.mutateStatuses(
			this.file,
			frontmatterTagName,
			(current) => {
				if (this.statusesAreEqual(current, statusesToStore)) {
					return { hasChanged: false };
				}
				return { hasChanged: true, nextStatuses: statusesToStore };
			},
			this.getStoreOptions(),
		);

		if (overridden) {
			eventBus.publish("status-changed", {
				file: this.file,
			});
		}
		return overridden;
	}

	async addStatus(
		frontmatterTagName: string,
		statusIdentifier: StatusIdentifier,
	): Promise<boolean> {
		const formattedIdentifier =
			typeof statusIdentifier === "string"
				? statusIdentifier
				: BaseNoteStatusService.formatStatusIdentifier(
						statusIdentifier,
					);

		const added = await this.statusStore.mutateStatuses(
			this.file,
			frontmatterTagName,
			(current) => {
				if (!settingsService.settings.useMultipleStatuses) {
					const newValue = [formattedIdentifier];
					if (this.statusesAreEqual(current, newValue)) {
						return { hasChanged: false };
					}
					return { hasChanged: true, nextStatuses: newValue };
				}

				const exactMatch = current.findIndex(
					(statusName: string) => statusName === formattedIdentifier,
				);

				if (exactMatch !== -1) {
					return { hasChanged: false };
				}

				let legacyIndex = -1;
				if (
					typeof statusIdentifier !== "string" &&
					statusIdentifier.templateId
				) {
					legacyIndex = current.findIndex(
						(statusName: string) =>
							statusName === statusIdentifier.name,
					);
				}

				const nextStatuses = [...current];
				if (legacyIndex !== -1) {
					nextStatuses[legacyIndex] = formattedIdentifier;
				} else {
					nextStatuses.push(formattedIdentifier);
				}

				return { hasChanged: true, nextStatuses };
			},
			this.getStoreOptions(),
		);

		if (added) {
			eventBus.publish("status-changed", {
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
			let store: StatusStore;
			try {
				store = statusStoreManager.getStoreForFile(file);
			} catch {
				return;
			}

			STATUS_METADATA_KEYS.forEach((key) => {
				const identifiers = store.getStatuses(file, key);
				if (!identifiers.length) return;

				if (!allStatuses.has(key)) {
					allStatuses.set(key, new Set());
				}

				identifiers.forEach((name) =>
					allStatuses.get(key)!.add(name.toString()),
				);
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
		const removalResults = await Promise.all(
			this.files.map(async (file) => {
				const noteStatusService = new NoteStatusService(file);
				return noteStatusService.removeStatus(
					frontmatterTagName,
					status,
				);
			}),
		);

		const removedFromAny = removalResults.some((result) => result);
		if (removedFromAny) {
			this.populateStatuses();
		}
		return removedFromAny;
	}

	async addStatus(
		frontmatterTagName: string,
		statusIdentifier: StatusIdentifier,
	): Promise<boolean> {
		const results = await Promise.all(
			this.files.map(async (file) => {
				const noteStatusService = new NoteStatusService(file);
				return noteStatusService.addStatus(
					frontmatterTagName,
					statusIdentifier,
				);
			}),
		);

		const addedToAny = results.some((result) => result);
		if (addedToAny) {
			this.populateStatuses();
		}
		return addedToAny;
	}

	getFilesWithStatus(
		frontmatterTagName: string,
		status: NoteStatus,
	): TFile[] {
		const targetIdentifier = status.templateId
			? BaseNoteStatusService.formatStatusIdentifier({
					templateId: status.templateId,
					name: status.name,
				})
			: status.name;

		return this.files.filter((file) => {
			let store: StatusStore;
			try {
				store = statusStoreManager.getStoreForFile(file);
			} catch {
				return false;
			}

			const identifiers = store.getStatuses(file, frontmatterTagName);
			if (!identifiers.length) return false;

			return identifiers.some(
				(identifier) =>
					identifier === targetIdentifier ||
					(status.templateId && identifier === status.name),
			);
		});
	}
}
