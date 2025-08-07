import { createRoot, Root } from "react-dom/client";
import eventBus from "core/eventBus";
import { MarkdownView, Plugin, WorkspaceLeaf } from "obsidian";
import settingsService from "@/core/settingsService";
import { EditorToolbarButton } from "@/components/Toolbar/EditorToolbarButton";
import { NoteStatusService } from "@/core/noteStatusService";

export class EditorToolbarIntegration {
	private static instance: EditorToolbarIntegration | null = null;
	private root: Root | null = null;
	private plugin: Plugin;
	private buttonElement: HTMLElement | null = null;
	private noteStatusService: NoteStatusService | null = null;
	private currentLeaf: WorkspaceLeaf | null = null;
	private readonly BUTTON_CLASS = "note-status-editor-toolbar-badge";

	constructor(plugin: Plugin) {
		if (EditorToolbarIntegration.instance) {
			throw new Error("The editor toolbar instance is already created");
		}
		this.plugin = plugin;
		EditorToolbarIntegration.instance = this;
	}

	async integrate() {
		eventBus.subscribe(
			"active-file-change",
			({ leaf }) => {
				if (this.isValidMarkdownLeaf(leaf)) {
					this.currentLeaf = leaf;
					this.handleActiveFileChange().catch(console.error);
				} else {
					this.removeButton();
				}
			},
			"editorToolbarIntegrationSubscription1",
		);

		eventBus.subscribe(
			"plugin-settings-changed",
			({ key }) => {
				if (key === "enabledTemplates" || key === "templates") {
					this.handleActiveFileChange().catch(console.error);
				}
				if (key === "useMultipleStatuses") {
					this.handleActiveFileChange().catch(console.error);
				}
				if (key === "tagPrefix") {
					this.handleActiveFileChange().catch(console.error);
				}
				if (key === "useCustomStatusesOnly") {
					this.handleActiveFileChange().catch(console.error);
				}
				if (key === "customStatuses") {
					this.handleActiveFileChange().catch(console.error);
				}
				if (
					key === "unknownStatusIcon" ||
					key === "unknownStatusColor"
				) {
					this.render();
				}
				if (key === "showEditorToolbarButton") {
					this.handleActiveFileChange().catch(console.error);
				}
				if (key === "editorToolbarButtonPosition") {
					this.handleActiveFileChange().catch(console.error);
				}
			},
			"editorToolbarIntegrationSubscription2",
		);

		eventBus.subscribe(
			"frontmatter-manually-changed",
			() => {
				this.handleActiveFileChange().catch(console.error);
			},
			"editorToolbarIntegrationSubscription3",
		);
	}

	private async handleActiveFileChange() {
		this.extractStatusesFromLeaf(this.currentLeaf);

		// Check if toolbar button should be shown
		if (settingsService.settings.showEditorToolbarButton) {
			this.createButton();
			this.render();
		} else {
			this.removeButton();
		}
	}

	private extractStatusesFromLeaf(leaf: WorkspaceLeaf | null) {
		if (!this.isValidMarkdownLeaf(leaf)) {
			return {};
		}

		const markdownView = leaf!.view as MarkdownView;
		if (!markdownView.file) {
			return {};
		}

		this.noteStatusService = new NoteStatusService(markdownView.file);
		this.noteStatusService.populateStatuses();
	}

	private isValidMarkdownLeaf(leaf: WorkspaceLeaf | null): boolean {
		return leaf !== null && leaf.view.getViewType() === "markdown";
	}

	private createButton(): void {
		if (!this.isValidMarkdownLeaf(this.currentLeaf)) {
			return;
		}
		const markdownView = this.currentLeaf!.view as MarkdownView;
		const position = settingsService.settings.editorToolbarButtonPosition;

		// Remove existing button if it exists
		if (this.buttonElement) {
			this.removeButton();
		}

		// Find the appropriate container based on position
		let targetContainer: Element | null = null;

		if (position === "left") {
			// For left position, use the nav buttons area or title container
			targetContainer =
				markdownView.containerEl.querySelector(
					".view-header-nav-buttons",
				) ||
				markdownView.containerEl.querySelector(
					".view-header-title-container",
				) ||
				markdownView.containerEl.querySelector(".view-header-left");
		} else {
			// For right positions, use the view-actions container
			targetContainer =
				markdownView.containerEl.querySelector(".view-actions");
		}

		if (!targetContainer) {
			console.warn(
				"Could not find target container for editor toolbar button",
			);
			return;
		}

		this.buttonElement = document.createElement("div");
		this.buttonElement.className = this.BUTTON_CLASS;

		// Insert button based on position setting
		if (position === "left") {
			// For left, insert after existing nav buttons
			targetContainer.appendChild(this.buttonElement);
		} else if (position === "right-before") {
			// For right-before, insert at the beginning of actions
			targetContainer.insertBefore(
				this.buttonElement,
				targetContainer.firstChild,
			);
		} else {
			// For right, insert at the end of actions
			targetContainer.appendChild(this.buttonElement);
		}

		this.root = createRoot(this.buttonElement);
	}

	private removeButton(): void {
		if (this.root) {
			this.root.unmount();
			this.root = null;
		}
		if (this.buttonElement) {
			this.buttonElement.remove();
			this.buttonElement = null;
		}
	}

	private openStatusModal() {
		if (!this.noteStatusService) {
			throw new Error(
				"open status modal failed because there is no noteStatusService available",
			);
		}
		eventBus.publish("triggered-open-modal", {
			statusService: this.noteStatusService,
		});
	}

	private getUnknownStatusConfig() {
		const settings = settingsService.settings;
		return {
			icon: settings.unknownStatusIcon || "❓",
			color: settings.unknownStatusColor || "#8b949e",
		};
	}

	private render() {
		if (!this.root || !this.buttonElement) {
			return;
		}

		this.root.render(
			<EditorToolbarButton
				statuses={this.noteStatusService?.statuses || {}}
				onClick={() => this.openStatusModal()}
				unknownStatusConfig={this.getUnknownStatusConfig()}
			/>,
		);
	}

	destroy() {
		eventBus.unsubscribe(
			"active-file-change",
			"editorToolbarIntegrationSubscription1",
		);
		eventBus.unsubscribe(
			"plugin-settings-changed",
			"editorToolbarIntegrationSubscription2",
		);
		eventBus.unsubscribe(
			"frontmatter-manually-changed",
			"editorToolbarIntegrationSubscription3",
		);

		this.removeButton();
		this.currentLeaf = null;
		this.noteStatusService = null;
		EditorToolbarIntegration.instance = null;
	}
}

export default EditorToolbarIntegration;
