import { normalizePath, Plugin, TAbstractFile, TFile } from "obsidian";
import eventBus from "@/core/eventBus";
import { StatusMutation, StatusStore } from "./types";

type FileStatusMap = Record<string, Record<string, string[]>>;

type PersistedData = {
	version: number;
	files: FileStatusMap;
};

export class NonMarkdownStatusStore implements StatusStore {
	private data: FileStatusMap = {};
	private readonly dataPath: string;

	constructor(private readonly plugin: Plugin) {
		const configDir = this.plugin.app.vault.configDir;
		const pluginDir = `${configDir}/plugins/${this.plugin.manifest.id}`;
		this.dataPath = normalizePath(
			`${pluginDir}/non-markdown-statuses.json`,
		);
	}

	async initialize(): Promise<void> {
		this.data = await this.loadFromDisk();
		this.registerVaultEvents();
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
		try {
			const raw = await this.plugin.app.vault.adapter.read(this.dataPath);
			const parsed = JSON.parse(raw) as PersistedData;
			if (parsed && typeof parsed === "object" && parsed.files) {
				return parsed.files;
			}
		} catch {
			// File may not exist yet or be malformed; start with empty dataset.
		}
		return {};
	}

	private async persistData(): Promise<void> {
		const payload: PersistedData = {
			version: 1,
			files: this.data,
		};
		await this.ensureDirectoryExists();
		await this.plugin.app.vault.adapter.write(
			this.dataPath,
			JSON.stringify(payload, null, 2),
		);
	}

	private async ensureDirectoryExists(): Promise<void> {
		const dir = this.dataPath.split("/").slice(0, -1).join("/");
		if (!(await this.plugin.app.vault.adapter.exists(dir))) {
			await this.plugin.app.vault.adapter.mkdir(dir);
		}
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
