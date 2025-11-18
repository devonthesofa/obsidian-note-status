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

	constructor(file: TFile) {
		super();
		this.file = file;
	}

	private shouldStoreStatusesAsArray(): boolean {
		if (settingsService.settings.useMultipleStatuses) {
			return true;
		}
		const mode = settingsService.settings.singleStatusStorageMode || "list";
		return mode === "list";
	}

	private normalizeStoredStatuses(value: unknown): string[] {
		if (!value) return [];
		if (Array.isArray(value)) {
			return value
				.map((status) =>
					status === undefined || status === null
						? undefined
						: String(status),
				)
				.filter((status): status is string => Boolean(status));
		}
		return [String(value)];
	}

	private writeStatusesToFrontmatter(
		frontmatter: Record<string, unknown>,
		frontmatterTagName: string,
		statuses: string[],
	) {
		if (!statuses.length) {
			if (this.shouldStoreStatusesAsArray()) {
				frontmatter[frontmatterTagName] = [];
			} else {
				delete frontmatter[frontmatterTagName];
			}
			return;
		}

		if (this.shouldStoreStatusesAsArray()) {
			frontmatter[frontmatterTagName] = [...statuses];
		} else {
			frontmatter[frontmatterTagName] = statuses[0];
		}
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
		const targetIdentifier = status.templateId
			? BaseNoteStatusService.formatStatusIdentifier({
					templateId: status.templateId,
					name: status.name,
				})
			: status.name;

		await BaseNoteStatusService.app.fileManager.processFrontMatter(
			this.file,
			(frontmatter) => {
				const storedStatuses = this.normalizeStoredStatuses(
					frontmatter?.[frontmatterTagName],
				);
				if (!storedStatuses.length) return;

				// First try to find exact match (scoped or legacy)
				let i = storedStatuses.findIndex(
					(statusName: string) => statusName === targetIdentifier,
				);

				// If not found and we're looking for a scoped status, try legacy format
				if (i === -1 && status.templateId) {
					i = storedStatuses.findIndex(
						(statusName: string) => statusName === status.name,
					);
				}

				if (i !== -1) {
					storedStatuses.splice(i, 1);
					this.writeStatusesToFrontmatter(
						frontmatter,
						frontmatterTagName,
						storedStatuses,
					);
					removed = true;
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
					this.writeStatusesToFrontmatter(
						frontmatter,
						frontmatterTagName,
						[],
					);
				}
			},
		);
		eventBus.publish("frontmatter-manually-changed", { file: this.file });
		return true;
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
		await BaseNoteStatusService.app.fileManager.processFrontMatter(
			this.file,
			(frontmatter) => {
				const statusesToStore = settingsService.settings
					.useMultipleStatuses
					? formattedIdentifiers
					: formattedIdentifiers.slice(0, 1);
				this.writeStatusesToFrontmatter(
					frontmatter,
					frontmatterTagName,
					statusesToStore,
				);
			},
		);
		eventBus.publish("frontmatter-manually-changed", { file: this.file });
		return true;
	}

	async addStatus(
		frontmatterTagName: string,
		statusIdentifier: StatusIdentifier,
	): Promise<boolean> {
		let added = false;
		const formattedIdentifier =
			typeof statusIdentifier === "string"
				? statusIdentifier
				: BaseNoteStatusService.formatStatusIdentifier(
						statusIdentifier,
					);

		await BaseNoteStatusService.app.fileManager.processFrontMatter(
			this.file,
			(frontmatter) => {
				const noteStatusFrontmatter = this.normalizeStoredStatuses(
					frontmatter?.[frontmatterTagName],
				);
				if (!settingsService.settings.useMultipleStatuses) {
					const newValue = [formattedIdentifier];
					this.writeStatusesToFrontmatter(
						frontmatter,
						frontmatterTagName,
						newValue,
					);
					added = true;
				} else {
					// Check if we already have this status (exact match)
					const exactMatch = noteStatusFrontmatter.findIndex(
						(statusName: string) =>
							statusName === formattedIdentifier,
					);

					if (exactMatch === -1) {
						// Check if we have a legacy version of this scoped status
						let legacyIndex = -1;
						if (
							typeof statusIdentifier !== "string" &&
							statusIdentifier.templateId
						) {
							legacyIndex = noteStatusFrontmatter.findIndex(
								(statusName: string) =>
									statusName === statusIdentifier.name,
							);
						}

						if (legacyIndex !== -1) {
							// Replace legacy with scoped version
							noteStatusFrontmatter[legacyIndex] =
								formattedIdentifier;
							added = true;
						} else {
							// Add new status
							noteStatusFrontmatter.push(formattedIdentifier);
							added = true;
						}
					}

					if (added) {
						this.writeStatusesToFrontmatter(
							frontmatter,
							frontmatterTagName,
							noteStatusFrontmatter,
						);
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
			const cachedMetadata =
				BaseNoteStatusService.app.metadataCache.getFileCache(file);
			const frontmatter = cachedMetadata?.frontmatter;
			if (!frontmatter) return false;

			const value = frontmatter[frontmatterTagName];
			if (!value) return false;

			if (Array.isArray(value)) {
				// Check for exact match first, then legacy format if scoped
				return (
					value.includes(targetIdentifier) ||
					(status.templateId && value.includes(status.name))
				);
			}
			// Check for exact match first, then legacy format if scoped
			return (
				value === targetIdentifier ||
				(status.templateId && value === status.name)
			);
		});
	}
}
