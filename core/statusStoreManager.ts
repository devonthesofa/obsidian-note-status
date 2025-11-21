import { Plugin, TFile } from "obsidian";
import { FrontmatterStatusStore } from "./statusStores/frontmatterStatusStore";
import { NonMarkdownStatusStore } from "./statusStores/nonMarkdownStatusStore";
import { StatusStore } from "./statusStores/types";

class StatusStoreManager {
	private stores: StatusStore[] = [];

	async initialize(plugin: Plugin) {
		const frontmatterStore = new FrontmatterStatusStore(plugin.app);
		this.stores = [frontmatterStore];

		const nonMarkdownStore = new NonMarkdownStatusStore(plugin);
		await nonMarkdownStore.initialize();
		this.registerStore(nonMarkdownStore);
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
