import { ItemView, WorkspaceLeaf, Notice, App } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { StatusDashboard } from "@/components/StatusDashboard/StatusDashboard";
import { DashboardAction } from "@/components/StatusDashboard/QuickActionsPanel";
import { BaseNoteStatusService } from "@/core/noteStatusService";
import settingsService from "@/core/settingsService";

interface AppWithCommands extends App {
	commands: {
		executeCommandById(commandId: string): boolean;
	};
}

export const VIEW_TYPE_STATUS_DASHBOARD = "status-dashboard-view";

export class StatusDashboardView extends ItemView {
	root: Root | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_STATUS_DASHBOARD;
	}

	getDisplayText() {
		return "Status Dashboard";
	}

	getIcon() {
		return "bar-chart-2";
	}

	private handleAction = (action: DashboardAction, value?: string) => {
		const appWithCommands = this.app as AppWithCommands;

		switch (action) {
			case "open-grouped-view":
				this.openGroupedView();
				break;
			case "find-unassigned":
				this.findUnassignedNotes();
				break;
			case "change-status":
				appWithCommands.commands.executeCommandById(
					"note-status:change-status",
				);
				break;
			case "insert-metadata":
				appWithCommands.commands.executeCommandById(
					"note-status:insert-status-metadata",
				);
				break;
			case "cycle-status":
				appWithCommands.commands.executeCommandById(
					"note-status:cycle-status",
				);
				break;
			case "clear-status":
				appWithCommands.commands.executeCommandById(
					"note-status:clear-status",
				);
				break;
			case "copy-status":
				appWithCommands.commands.executeCommandById(
					"note-status:copy-status",
				);
				break;
			case "paste-status":
				appWithCommands.commands.executeCommandById(
					"note-status:paste-status",
				);
				break;
			case "search-by-status":
				appWithCommands.commands.executeCommandById(
					"note-status:search-by-status",
				);
				break;
			case "toggle-multiple-mode":
				appWithCommands.commands.executeCommandById(
					"note-status:toggle-multiple-statuses",
				);
				break;
			case "set-quick-status":
				if (value) {
					const commandId = `note-status:set-status-${value}`;
					const result =
						appWithCommands.commands.executeCommandById(commandId);
					if (!result) {
						new Notice(
							`Quick status command failed: ${value}. Make sure the status exists and multiple statuses mode is disabled.`,
						);
					}
				}
				break;
		}
	};

	private openGroupedView() {
		const leaf = BaseNoteStatusService.app.workspace.getLeaf();
		leaf.setViewState({ type: "grouped-status-view", active: true });
	}

	private findUnassignedNotes() {
		const files = BaseNoteStatusService.app.vault.getMarkdownFiles();
		const filesWithoutStatus = files.filter((file) => {
			const cachedMetadata =
				BaseNoteStatusService.app.metadataCache.getFileCache(file);
			const frontmatter = cachedMetadata?.frontmatter;
			return (
				!frontmatter || !frontmatter[settingsService.settings.tagPrefix]
			);
		});
		new Notice(`Found ${filesWithoutStatus.length} notes without status`);
		console.log(
			"Notes without status:",
			filesWithoutStatus.map((f) => f.path),
		);
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		container.addClass("status-dashboard-view-container");

		this.root = createRoot(container);
		this.root.render(
			<StatusDashboard
				onAction={this.handleAction}
				settings={settingsService.settings}
			/>,
		);
	}

	async onClose() {
		this.root?.unmount();
		this.root = null;
	}
}
