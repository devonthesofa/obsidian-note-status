import { Plugin } from "obsidian";
import { CommandsService } from "../../core/commandsService";

export class CommandsIntegration {
	private static instance: CommandsIntegration | null = null;
	private plugin: Plugin;
	private commandsService: CommandsService;

	constructor(plugin: Plugin) {
		if (CommandsIntegration.instance) {
			throw new Error(
				"CommandsIntegration instance already created. Use getInstance() instead.",
			);
		}
		this.plugin = plugin;
		this.commandsService = new CommandsService(plugin);
		CommandsIntegration.instance = this;
	}

	static getInstance(): CommandsIntegration | null {
		return CommandsIntegration.instance;
	}

	async integrate(): Promise<void> {
		// Register all commands from the service
		this.commandsService.registerAllCommands();
	}

	destroy(): void {
		if (this.commandsService) {
			this.commandsService.unload();
			this.commandsService.destroy();
		}
		CommandsIntegration.instance = null;
	}
}
