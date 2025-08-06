import eventBus from "@/core/eventBus";
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

		eventBus.subscribe(
			"plugin-settings-changed",
			({ key }) => {
				if (
					key === "quickStatusCommands" ||
					key === "useMultipleStatuses" ||
					key === "templates"
				) {
					this.commandsService.destroy();
					/// BUG: if removed a command will persist because is not removed, you need the oldStates to send it to be disabled // const oldValue = this.settings[key]; // TODO: Send the old value
					this.commandsService.registerAllCommands(); // INFO: Reset the registered commands
				}
			},
			"commandsIntegrationSubscription2",
		);
	}

	destroy(): void {
		eventBus.unsubscribe(
			"plugin-settings-changed",
			"commandsIntegrationSubscription2",
		);
		if (this.commandsService) {
			this.commandsService.destroy();
		}
		CommandsIntegration.instance = null;
	}
}
