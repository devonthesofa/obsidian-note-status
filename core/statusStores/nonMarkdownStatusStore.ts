import { normalizePath, Plugin, TAbstractFile, TFile } from "obsidian";
import eventBus from "@/core/eventBus";
import settingsService from "@/core/settingsService";
import { StatusMutation, StatusStore } from "./types";

type FileStatusMap = Record<string, Record<string, string[]>>;

type PersistedData = {
	version: number;
	files: FileStatusMap;
};

export class NonMarkdownStatusStore implements StatusStore {
	private data: FileStatusMap = {};
	private isWatcherRegistered = false;

	constructor(private readonly plugin: Plugin) {}

	async initialize(): Promise<void> {
		this.data = await this.loadFromDisk();
		this.registerVaultEvents();
		this.setupSyncWatcher();

		// Reload if settings change
		eventBus.subscribe(
			"plugin-settings-changed",
			({ key }) => {
				if (
					key === "enableNonMarkdownSync" ||
					key === "nonMarkdownSyncPath"
				) {
					this.loadFromDisk()
						.then((newData) => {
							this.data = newData;
							this.setupSyncWatcher();
							// Notify UI that statuses might have changed
							this.plugin.app.workspace.iterateAllLeaves(
								(leaf) => {
									const view = leaf.view as {
										requestRefresh?: () => void;
									};
									if (view.requestRefresh)
										view.requestRefresh();
								},
							);
						})
						.catch(console.error);
				}
			},
			"non-markdown-status-store-sync-subscriptor",
		);
	}

	private getDataPath(): string {
		const settings = settingsService.settings;
		if (
			settings &&
			settings.enableNonMarkdownSync &&
			settings.nonMarkdownSyncPath
		) {
			return normalizePath(settings.nonMarkdownSyncPath);
		}

		const configDir = this.plugin.app.vault.configDir;
		const pluginDir = `${configDir}/plugins/${this.plugin.manifest.id}`;
		return normalizePath(`${pluginDir}/non-markdown-statuses.json`);
	}

	canHandle(file: TFile): boolean {
		return file.extension !== "md";
	}

	getStatuses(file: TFile, frontmatterTagName: string): string[] {
		const fileStatuses = this.data[file.path];
		if (!fileStatuses) return [];
		const statuses = fileStatuses[frontmatterTagName];
		return statuses ? [...statuses] : [];
	}

	async mutateStatuses(
		file: TFile,
		frontmatterTagName: string,
		mutator: (current: string[]) => StatusMutation,
		_options: { storeAsArray: boolean },
	): Promise<boolean> {
		const fileStatuses = this.data[file.path] ?? {};
		const current = fileStatuses[frontmatterTagName] ?? [];
		const mutation = mutator([...current]);

		if (!mutation.hasChanged) {
			return false;
		}

		if (mutation.nextStatuses.length) {
			if (!this.data[file.path]) {
				this.data[file.path] = {};
			}
			this.data[file.path][frontmatterTagName] = [
				...mutation.nextStatuses,
			];
		} else if (this.data[file.path]) {
			delete this.data[file.path][frontmatterTagName];
			if (Object.keys(this.data[file.path]).length === 0) {
				delete this.data[file.path];
			}
		}

		await this.persistData();
		return true;
	}

	private async loadFromDisk(): Promise<FileStatusMap> {
		const path = this.getDataPath();
		try {
			const exists = await this.plugin.app.vault.adapter.exists(path);
			if (!exists) return {};

			const raw = await this.plugin.app.vault.adapter.read(path);
			const parsed = JSON.parse(raw) as PersistedData;
			if (parsed && typeof parsed === "object" && parsed.files) {
				return parsed.files;
			}
		} catch (e) {
			console.error("Failed to load non-markdown statuses:", e);
		}
		return {};
	}

	private async persistData(): Promise<void> {
		const payload: PersistedData = {
			version: 1,
			files: this.data,
		};
		const path = this.getDataPath();
		await this.ensureDirectoryExists(path);
		await this.plugin.app.vault.adapter.write(
			path,
			JSON.stringify(payload, null, 2),
		);
	}

	private async ensureDirectoryExists(path: string): Promise<void> {
		const dir = path.split("/").slice(0, -1).join("/");
		if (!dir) return;
		if (!(await this.plugin.app.vault.adapter.exists(dir))) {
			await this.plugin.app.vault.adapter.mkdir(dir);
		}
	}

	private setupSyncWatcher() {
		if (this.isWatcherRegistered) return;

		this.plugin.registerEvent(
			this.plugin.app.vault.on("modify", (file) => {
				const settings = settingsService.settings;
				if (!settings.enableNonMarkdownSync) return;

				if (
					file instanceof TFile &&
					file.path === normalizePath(settings.nonMarkdownSyncPath)
				) {
					this.loadFromDisk()
						.then((newData) => {
							this.data = newData;
							// Emit events for all files that might have changed
							// This is a bit heavy, but non-markdown files are fewer
							Object.keys(this.data).forEach((filePath) => {
								const f =
									this.plugin.app.vault.getAbstractFileByPath(
										filePath,
									);
								if (f instanceof TFile) {
									eventBus.publish("status-changed", {
										file: f,
									});
								}
							});
						})
						.catch(console.error);
				}
			}),
		);
		this.isWatcherRegistered = true;
	}

	private registerVaultEvents() {
		this.plugin.registerEvent(
			this.plugin.app.vault.on("rename", (file, oldPath) => {
				this.handleRename(file, oldPath);
			}),
		);

		this.plugin.registerEvent(
			this.plugin.app.vault.on("delete", (file) => {
				this.handleDelete(file);
			}),
		);
	}

	private handleRename(file: TAbstractFile, oldPath: string) {
		if (!(file instanceof TFile)) return;
		const existing = this.data[oldPath];
		if (!existing) return;
		this.data[file.path] = existing;
		delete this.data[oldPath];
		this.persistData()
			.then(() => {
				eventBus.publish("status-changed", { file });
			})
			.catch(console.error);
	}

	private handleDelete(file: TAbstractFile) {
		if (!(file instanceof TFile)) return;
		if (!this.data[file.path]) return;
		delete this.data[file.path];
		this.persistData()
			.then(() => {
				eventBus.publish("status-changed", { file });
			})
			.catch(console.error);
	}
}
