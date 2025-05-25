import { App, PluginSettingTab } from "obsidian";
import NoteStatus from "main";
import { StatusService } from "services/status-service";
import { NoteStatusSettingsController } from "./settings-controller";

/**
 * Settings tab for the Note Status plugin - delegates to controller
 */
export class NoteStatusSettingTab extends PluginSettingTab {
	private controller: NoteStatusSettingsController;

	constructor(app: App, plugin: NoteStatus, statusService: StatusService) {
		super(app, plugin);
		this.controller = new NoteStatusSettingsController(
			app,
			plugin,
			statusService,
		);
	}

	/**
	 * Displays the settings interface
	 */
	display(): void {
		this.controller.display(this.containerEl);
	}
}
