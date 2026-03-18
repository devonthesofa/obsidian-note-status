import { Plugin, TFile } from "obsidian";
import { FrontmatterStatusStore } from "./statusStores/frontmatterStatusStore";
import { NonMarkdownStatusStore } from "./statusStores/nonMarkdownStatusStore";
import { StatusStore } from "./statusStores/types";

class StatusStoreManager {
	private stores: StatusStore[] = [];
	private nonMarkdownStore: NonMarkdownStatusStore | null = null;

	async initialize(plugin: Plugin) {
		const frontmatterStore = new FrontmatterStatusStore(plugin.app);
		this.stores = [frontmatterStore];

		this.nonMarkdownStore = new NonMarkdownStatusStore(plugin);
		await this.nonMarkdownStore.initialize();
		this.registerStore(this.nonMarkdownStore);
	}

	getNonMarkdownStore(): NonMarkdownStatusStore {
		if (!this.nonMarkdownStore) {
			throw new Error("NonMarkdownStatusStore is not initialized");
		}
		return this.nonMarkdownStore;
	}

	registerStore(store: StatusStore) {
		this.stores.push(store);
	}

	getStoreForFile(file: TFile): StatusStore {
		const store = this.stores.find((candidate) =>
			candidate.canHandle(file),
		);

		if (!store) {
			throw new Error(
				`No status store registered for file type: ${file.extension}`,
			);
		}

		return store;
	}
}

export default new StatusStoreManager();
