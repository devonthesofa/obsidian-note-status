import { App, TFile } from "obsidian";
import { StatusMutation, StatusStore } from "./types";

export class FrontmatterStatusStore implements StatusStore {
	constructor(private readonly app: App) {}

	canHandle(file: TFile): boolean {
		return file.extension === "md";
	}

	getStatuses(file: TFile, frontmatterTagName: string): string[] {
		const cachedMetadata = this.app.metadataCache.getFileCache(file);
		const frontmatter = cachedMetadata?.frontmatter;
		if (!frontmatter) return [];

		return this.normalizeValue(frontmatter[frontmatterTagName]);
	}

	async mutateStatuses(
		file: TFile,
		frontmatterTagName: string,
		mutator: (current: string[]) => StatusMutation,
		options: { storeAsArray: boolean },
	): Promise<boolean> {
		let changed = false;
		await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
			const currentStatuses = this.normalizeValue(
				frontmatter?.[frontmatterTagName],
			);
			const mutation = mutator([...currentStatuses]);

			if (!mutation.hasChanged) return;

			this.writeStatuses(
				frontmatter,
				frontmatterTagName,
				mutation.nextStatuses,
				options.storeAsArray,
			);
			changed = true;
		});
		return changed;
	}

	private normalizeValue(value: unknown): string[] {
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

	private writeStatuses(
		frontmatter: Record<string, unknown>,
		frontmatterTagName: string,
		statuses: string[],
		storeAsArray: boolean,
	) {
		if (!statuses.length) {
			if (storeAsArray) {
				frontmatter[frontmatterTagName] = [];
			} else {
				delete frontmatter[frontmatterTagName];
			}
			return;
		}

		if (storeAsArray) {
			frontmatter[frontmatterTagName] = [...statuses];
		} else {
			frontmatter[frontmatterTagName] = statuses[0];
		}
	}
}
