import SettingsUI from "@/components/SettingsUI.tsx";
import settingsService from "@/core/settingsService";
import { Plugin, PluginSettingTab } from "obsidian";
import { createRoot, Root } from "react-dom/client";

export class PluginSettingIntegration extends PluginSettingTab {
	private static instance: PluginSettingIntegration | null = null;
	private root: Root | null = null;
	private plugin: Plugin;

	constructor(plugin: Plugin) {
		if (PluginSettingIntegration.instance) {
			throw new Error("The status bar instance is already created");
		}
		super(plugin.app, plugin);
		this.plugin = plugin;
		PluginSettingIntegration.instance = this;
	}

	async integrate() {
		// INFO: This will integrate the "display" function component
		this.plugin.addSettingTab(this);
	}

	display(): void {
		const { containerEl } = this;

		if (this.root) {
			this.root.unmount();
			this.root = null;
		}
		containerEl.empty();
		this.root = createRoot(containerEl);

		this.root.render(
			<SettingsUI
				settings={settingsService.settings}
				onChange={(key, value) => {
					settingsService.setValue(key, value);
				}}
			/>,
		);
	}

	destroy(): void {
		if (this.root) {
			this.root.unmount();
			this.root = null;
		}
		PluginSettingIntegration.instance = null;
	}
}
