import { DEFAULT_PLUGIN_SETTINGS } from "@/constants/defaultSettings";
import { PluginSettings } from "@/types/pluginSettings";
import { Plugin, TFile, normalizePath } from "obsidian";
import eventBus from "./eventBus";

class SettingsService {
	private plugin: Plugin;
	public settings: PluginSettings;
	private isWatcherRegistered = false;

	constructor() {}

	async initialize(plugin: Plugin): Promise<void> {
		this.plugin = plugin;
		await this.loadSettings();

		if (this.settings.enableExternalStatusSync) {
			await this.loadFromExternalFile();
			this.setupExternalFileWatcher();
		}
	}

	setValue(key: keyof PluginSettings, value: unknown) {
		if (!(key in this.settings)) {
			throw new Error(`The "${key}" setting is not a known setting key`);
		}
		// const oldValue = this.settings[key]; // TODO: Send the old value
		this.settings[key] = value;
		this.saveSettings().catch(console.error);

		// Handle external sync
		if (this.settings.enableExternalStatusSync) {
			this.syncToExternalFile().catch(console.error);
		}

		if (key === "enableExternalStatusSync") {
			if (value) {
				this.syncToExternalFile().catch(console.error);
				this.setupExternalFileWatcher();
			}
		}

		// INFO: Send the propgation event
		eventBus.publish("plugin-settings-changed", {
			key,
			value,
			currentSettings: this.settings,
		});
	}

	private async loadSettings() {
		const loadedData = await this.plugin.loadData();
		this.settings = this.mergeSettings(DEFAULT_PLUGIN_SETTINGS, loadedData);
		return this.settings;
	}

	/**
	 * Deep merges loaded settings with defaults to prevent data loss for nested objects like statusColors.
	 */
	private mergeSettings(
		defaults: PluginSettings,
		loaded: Partial<PluginSettings> | null,
	): PluginSettings {
		if (!loaded) return { ...defaults };

		const result = { ...defaults, ...loaded };

		// Deep merge statusColors
		if (loaded.statusColors) {
			result.statusColors = {
				...defaults.statusColors,
				...loaded.statusColors,
			};
		}

		return result;
	}

	private async saveSettings() {
		await this.plugin.saveData(this.settings);
	}

	async syncToExternalFile(force = false) {
		if (!this.settings.enableExternalStatusSync && !force) return;

		const path = normalizePath(this.settings.externalStatusSyncPath);
		const data = {
			...this.settings,
			updatedAt: new Date().toISOString(),
		};

		try {
			await this.plugin.app.vault.adapter.write(
				path,
				JSON.stringify(data, null, 2),
			);
		} catch (error) {
			console.error("Failed to sync settings to external file:", error);
		}
	}

	async loadFromExternalFile(force = false) {
		if (!this.settings.enableExternalStatusSync && !force) return;
		const path = normalizePath(this.settings.externalStatusSyncPath);
		if (!(await this.plugin.app.vault.adapter.exists(path))) return;

		try {
			const content = await this.plugin.app.vault.adapter.read(path);
			const data = JSON.parse(content);

			let hasChanged = false;
			const keys = Object.keys(data).filter(
				(k) => k !== "updatedAt",
			) as Array<keyof PluginSettings>;

			for (const key of keys) {
				if (!(key in this.settings)) continue;

				const newValue = data[key];
				const currentValue = this.settings[key];

				// Basic deep equality check to avoid unnecessary updates
				if (JSON.stringify(newValue) !== JSON.stringify(currentValue)) {
					(this.settings as Record<string, unknown>)[key] = newValue;
					hasChanged = true;

					// Notify UI and other services
					eventBus.publish("plugin-settings-changed", {
						key: key as keyof PluginSettings,
						value: newValue,
						currentSettings: this.settings,
					});
				}
			}

			if (hasChanged) {
				await this.saveSettings();
			}
		} catch (error) {
			console.error("Failed to load settings from external file:", error);
		}
	}

	private setupExternalFileWatcher() {
		if (this.isWatcherRegistered) return;

		this.plugin.registerEvent(
			this.plugin.app.vault.on("modify", (file) => {
				if (!this.settings.enableExternalStatusSync) return;

				if (
					file instanceof TFile &&
					file.path ===
						normalizePath(this.settings.externalStatusSyncPath)
				) {
					this.loadFromExternalFile().catch(console.error);
				}
			}),
		);
		this.isWatcherRegistered = true;
	}
}

export default new SettingsService();
