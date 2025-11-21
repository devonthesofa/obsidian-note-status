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
import {
	getKnownFrontmatterKeys,
	resolveFrontmatterKeysForStatus,
} from "@/utils/frontmatterMappings";

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

	private isMarkdownFile(): boolean {
		return this.file.extension === "md";
	}

	private getKeysForReading(): string[] {
		const defaultKey = settingsService.settings.tagPrefix;
		if (!this.isMarkdownFile()) {
			return [defaultKey];
		}
		const knownKeys = getKnownFrontmatterKeys(settingsService.settings);
		return [defaultKey, ...knownKeys.filter((key) => key !== defaultKey)];
	}

	private collectIdentifiersForFile(): string[] {
		const keysToRead = this.getKeysForReading();
		const seen = new Set<string>();
		const identifiers: string[] = [];

		keysToRead.forEach((key) => {
			const values = this.statusStore.getStatuses(this.file, key);
			values.forEach((value) => {
				const normalized = value?.toString();
				if (!normalized || seen.has(normalized)) {
					return;
				}
				seen.add(normalized);
				identifiers.push(normalized);
			});
		});

		return identifiers;
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

	private resolveTargetKeys(
		frontmatterTagName: string,
		status: StatusIdentifier | NoteStatus,
		options?: { includeSourceKey?: boolean },
	): string[] {
		if (!this.isMarkdownFile()) {
			return [frontmatterTagName];
		}

		let resolved = resolveFrontmatterKeysForStatus(
			status,
			settingsService.settings,
			{ isMarkdownFile: true },
		);

		const defaultKey = settingsService.settings.tagPrefix;
		if (
			resolved.length === 1 &&
			resolved[0] === defaultKey &&
			frontmatterTagName !== defaultKey
		) {
			resolved = [frontmatterTagName];
		}

		if (options?.includeSourceKey && frontmatterTagName) {
			resolved = [...resolved, frontmatterTagName];
		}

		const uniqueKeys = Array.from(
			new Set(resolved.filter((key) => key && key.trim().length)),
		);
		return uniqueKeys.length ? uniqueKeys : [frontmatterTagName];
	}

	private async runAcrossKeys(
		keys: string[],
		action: (key: string) => Promise<boolean>,
	): Promise<boolean> {
		let hasChanged = false;
		for (const key of keys) {
			const changed = await action(key);
			if (changed) {
				hasChanged = true;
			}
		}
		return hasChanged;
	}

	private statusesAreEqual(a: string[], b: string[]): boolean {
		if (a.length !== b.length) return false;
		return a.every((value, index) => value === b[index]);
	}

	public populateStatuses(): void {
		const defaultKey = settingsService.settings.tagPrefix;
		this.statuses = { [defaultKey]: [] };

		if (!this.file) {
			return;
		}

		const identifiers = this.collectIdentifiersForFile();
		if (!identifiers.length) {
			return;
		}

		let statuses = identifiers
			.map((identifier) => this.statusNameToObject(identifier))
			.filter((status): status is NoteStatusType => status !== undefined);

		if (statuses.length && !settingsService.settings.useMultipleStatuses) {
			statuses = statuses.slice(0, 1);
		}
		this.statuses[defaultKey] = statuses;
	}

	async removeStatus(
		frontmatterTagName: string,
		status: NoteStatus,
	): Promise<boolean> {
		const targetKeys = this.resolveTargetKeys(frontmatterTagName, status, {
			includeSourceKey: true,
		});
		const removed = await this.runAcrossKeys(targetKeys, (key) =>
			this.removeStatusFromKey(key, status),
		);

		if (removed) {
			eventBus.publish("status-changed", {
				file: this.file,
			});
		}
		return removed;
	}

	private async removeStatusFromKey(
		frontmatterTagName: string,
		status: NoteStatus,
	): Promise<boolean> {
		const targetIdentifier = status.templateId
			? BaseNoteStatusService.formatStatusIdentifier({
					templateId: status.templateId,
					name: status.name,
				})
			: status.name;

		return this.statusStore.mutateStatuses(
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
	}

	async clearStatus(frontmatterTagName: string): Promise<boolean> {
		const keys = new Set<string>([frontmatterTagName]);
		if (this.isMarkdownFile()) {
			this.getKeysForReading().forEach((key) => keys.add(key));
		}

		const cleared = await this.runAcrossKeys([...keys], (key) =>
			this.clearStatusForKey(key),
		);
		if (cleared) {
			eventBus.publish("status-changed", {
				file: this.file,
			});
		}
		return cleared;
	}

	private async clearStatusForKey(
		frontmatterTagName: string,
	): Promise<boolean> {
		return this.statusStore.mutateStatuses(
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
	}

	async overrideStatuses(
		frontmatterTagName: string,
		statusIdentifiers: StatusIdentifier[],
	): Promise<boolean> {
		const limitedIdentifiers = settingsService.settings.useMultipleStatuses
			? statusIdentifiers
			: statusIdentifiers.slice(0, 1);

		if (!limitedIdentifiers.length) {
			return this.clearStatus(frontmatterTagName);
		}

		const keyMap = new Map<string, StatusIdentifier[]>();
		if (!this.isMarkdownFile()) {
			keyMap.set(frontmatterTagName, limitedIdentifiers);
		} else {
			limitedIdentifiers.forEach((identifier) => {
				const keys = this.resolveTargetKeys(
					frontmatterTagName,
					identifier,
				);
				keys.forEach((key) => {
					const currentList = keyMap.get(key) ?? [];
					currentList.push(identifier);
					keyMap.set(key, currentList);
				});
			});

			const knownKeys = new Set([
				frontmatterTagName,
				...this.getStatusMetadataKeys(),
			]);
			knownKeys.forEach((key) => {
				if (!keyMap.has(key)) {
					keyMap.set(key, []);
				}
			});
		}

		const overridden = await this.runAcrossKeys(
			Array.from(keyMap.keys()),
			(key) => this.overrideStatusesForKey(key, keyMap.get(key) ?? []),
		);

		if (overridden) {
			eventBus.publish("status-changed", {
				file: this.file,
			});
		}
		return overridden;
	}

	private async overrideStatusesForKey(
		frontmatterTagName: string,
		statusIdentifiers: StatusIdentifier[],
	): Promise<boolean> {
		const formattedIdentifiers = statusIdentifiers.map((id) =>
			typeof id === "string"
				? id
				: BaseNoteStatusService.formatStatusIdentifier(id),
		);

		return this.statusStore.mutateStatuses(
			this.file,
			frontmatterTagName,
			(current) => {
				if (this.statusesAreEqual(current, formattedIdentifiers)) {
					return { hasChanged: false };
				}
				return {
					hasChanged: true,
					nextStatuses: formattedIdentifiers,
				};
			},
			this.getStoreOptions(),
		);
	}

	async addStatus(
		frontmatterTagName: string,
		statusIdentifier: StatusIdentifier,
	): Promise<boolean> {
		const targetKeys = this.resolveTargetKeys(
			frontmatterTagName,
			statusIdentifier,
		);
		const added = await this.runAcrossKeys(targetKeys, (key) =>
			this.addStatusToKey(key, statusIdentifier),
		);

		if (added) {
			eventBus.publish("status-changed", {
				file: this.file,
			});
		}
		return added;
	}

	private async addStatusToKey(
		frontmatterTagName: string,
		statusIdentifier: StatusIdentifier,
	): Promise<boolean> {
		const formattedIdentifier =
			typeof statusIdentifier === "string"
				? statusIdentifier
				: BaseNoteStatusService.formatStatusIdentifier(
						statusIdentifier,
					);

		return this.statusStore.mutateStatuses(
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

	private getKeysForReading(file: TFile): string[] {
		const defaultKey = settingsService.settings.tagPrefix;
		if (file.extension !== "md") {
			return [defaultKey];
		}
		const knownKeys = getKnownFrontmatterKeys(settingsService.settings);
		return [defaultKey, ...knownKeys.filter((key) => key !== defaultKey)];
	}

	public populateStatuses(): void {
		const defaultKey = settingsService.settings.tagPrefix;
		this.statuses = { [defaultKey]: [] };

		const aggregated = new Set<string>();

		this.files.forEach((file) => {
			let store: StatusStore;
			try {
				store = statusStoreManager.getStoreForFile(file);
			} catch {
				return;
			}

			const keys = this.getKeysForReading(file);
			keys.forEach((key) => {
				const identifiers = store.getStatuses(file, key);
				identifiers.forEach((identifier) => {
					const normalized = identifier?.toString();
					if (normalized && !aggregated.has(normalized)) {
						aggregated.add(normalized);
					}
				});
			});
		});

		if (!aggregated.size) {
			return;
		}

		const statuses = Array.from(aggregated)
			.map((identifier) => this.statusNameToObject(identifier))
			.filter((status): status is NoteStatusType => status !== undefined);

		this.statuses[defaultKey] = statuses;
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
