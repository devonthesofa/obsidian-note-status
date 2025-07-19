import { DEFAULT_PLUGIN_SETTINGS } from "@/constants/defaultSettings";
import { PluginSettings } from "@/types/pluginSettings";
import { Plugin } from "obsidian";
import eventBus from "./eventBus";

class SettingsService {
	private plugin: Plugin;
	public settings: PluginSettings;

	constructor() {}

	async initialize(plugin: Plugin): Promise<void> {
		this.plugin = plugin;
		await this.loadSettings();
	}

	setValue(key: keyof PluginSettings, value: unknown) {
		if (!(key in this.settings)) {
			throw new Error(`The "${key}" setting is not a known setting key`);
		}
		// const oldValue = this.settings[key]; // TODO: Send the old value
		this.settings[key] = value;
		this.saveSettings().catch(console.error);
		// INFO: Send the propgation event
		eventBus.publish("plugin-settings-changed", {
			key,
			value,
			currentSettings: this.settings,
		});
	}

	private async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_PLUGIN_SETTINGS,
			await this.plugin.loadData(),
		);
		return this.settings;
	}

	private async saveSettings() {
		await this.plugin.saveData(this.settings);
	}
}

export default new SettingsService();
