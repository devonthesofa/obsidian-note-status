import { createRoot, Root } from "react-dom/client";
import eventBus from "core/eventBus";
import { MarkdownView, Plugin, WorkspaceLeaf } from "obsidian";
import settingsService from "@/core/settingsService";
import { EditorToolbarButton } from "@/components/Toolbar/EditorToolbarButton";
import { NoteStatusService } from "@/core/noteStatusService";

interface LeafButton {
	leaf: WorkspaceLeaf;
	root: Root;
	buttonElement: HTMLElement;
	noteStatusService: NoteStatusService;
}

export class EditorToolbarIntegration {
	private static instance: EditorToolbarIntegration | null = null;
	private plugin: Plugin;
	private leafButtons: Map<WorkspaceLeaf, LeafButton> = new Map();
	private currentActiveLeaf: WorkspaceLeaf | null = null;
	private readonly BUTTON_CLASS = "note-status-editor-toolbar-badge";

	constructor(plugin: Plugin) {
		if (EditorToolbarIntegration.instance) {
			throw new Error("The editor toolbar instance is already created");
		}
		this.plugin = plugin;
		EditorToolbarIntegration.instance = this;
	}

	async integrate() {
		// Initialize the current active leaf
		const activeLeaf = this.plugin.app.workspace.activeLeaf;
		if (activeLeaf && this.isValidMarkdownLeaf(activeLeaf)) {
			this.currentActiveLeaf = activeLeaf;
		}

		// Initialize buttons based on display mode
		this.initializeButtons();

		// Listen for new leaves being created
		this.plugin.registerEvent(
			this.plugin.app.workspace.on("layout-change", () => {
				this.handleLayoutChange();
			}),
		);

		eventBus.subscribe(
			"active-file-change",
			({ leaf }) => {
				this.currentActiveLeaf =
					leaf && this.isValidMarkdownLeaf(leaf) ? leaf : null;
				this.handleActiveLeafChange();
			},
			"editorToolbarIntegrationSubscription1",
		);

		eventBus.subscribe(
			"plugin-settings-changed",
			({ key }) => {
				if (key === "enabledTemplates" || key === "templates") {
					this.refreshAllButtons();
				}
				if (key === "useMultipleStatuses") {
					this.refreshAllButtons();
				}
				if (key === "tagPrefix") {
					this.refreshAllButtons();
				}
				if (key === "useCustomStatusesOnly") {
					this.refreshAllButtons();
				}
				if (key === "customStatuses") {
					this.refreshAllButtons();
				}
				if (
					key === "unknownStatusIcon" ||
					key === "unknownStatusColor"
				) {
					this.renderAllButtons();
				}
				if (key === "showEditorToolbarButton") {
					this.handleShowHideButtons();
				}
				if (key === "editorToolbarButtonPosition") {
					this.recreateAllButtons();
				}
				if (key === "editorToolbarButtonDisplay") {
					this.handleDisplayModeChange();
				}
			},
			"editorToolbarIntegrationSubscription2",
		);

		eventBus.subscribe(
			"frontmatter-manually-changed",
			({ file }) => {
				// Find the button for the specific file and refresh only that one
				for (const [leaf, leafButton] of this.leafButtons.entries()) {
					const markdownView = leaf.view as MarkdownView;
					if (markdownView.file === file) {
						leafButton.noteStatusService = new NoteStatusService(
							file,
						);
						leafButton.noteStatusService.populateStatuses();
						this.renderButtonForLeaf(leafButton);
						break;
					}
				}
			},
			"editorToolbarIntegrationSubscription3",
		);
	}

	private initializeButtons() {
		const targetLeaves = this.getTargetLeaves();
		for (const leaf of targetLeaves) {
			this.createButtonForLeaf(leaf);
		}
	}

	private handleActiveLeafChange() {
		this.syncButtons();
	}

	private handleDisplayModeChange() {
		this.syncButtons();
	}

	private syncButtons() {
		const targetLeaves = new Set(this.getTargetLeaves());

		// Remove buttons that shouldn't exist
		for (const leaf of this.leafButtons.keys()) {
			if (!targetLeaves.has(leaf)) {
				this.removeButtonForLeaf(leaf);
			}
		}

		// Add buttons that should exist but don't
		for (const leaf of targetLeaves) {
			if (!this.leafButtons.has(leaf)) {
				this.createButtonForLeaf(leaf);
			}
		}
	}

	private handleLayoutChange() {
		this.syncButtons();
	}

	private createButtonForLeaf(leaf: WorkspaceLeaf) {
		if (!this.isValidMarkdownLeaf(leaf)) {
			return;
		}

		// Remove existing button if it exists
		if (this.leafButtons.has(leaf)) {
			this.removeButtonForLeaf(leaf);
		}

		// Check if toolbar button should be shown
		if (!settingsService.settings.showEditorToolbarButton) {
			return;
		}

		const markdownView = leaf.view as MarkdownView;
		if (!markdownView.file) {
			return;
		}

		// Create note status service for this leaf
		const noteStatusService = new NoteStatusService(markdownView.file);
		noteStatusService.populateStatuses();

		// Create button element
		const buttonElement = this.createButtonElement(leaf);
		if (!buttonElement) {
			return;
		}

		// Create React root
		const root = createRoot(buttonElement);

		// Store the button info
		const leafButton: LeafButton = {
			leaf,
			root,
			buttonElement,
			noteStatusService,
		};

		this.leafButtons.set(leaf, leafButton);

		// Render the button
		this.renderButtonForLeaf(leafButton);
	}

	private isValidMarkdownLeaf(leaf: WorkspaceLeaf | null): boolean {
		return leaf !== null && leaf.view.getViewType() === "markdown";
	}

	private shouldHaveButton(leaf: WorkspaceLeaf): boolean {
		if (
			!settingsService.settings.showEditorToolbarButton ||
			!this.isValidMarkdownLeaf(leaf)
		) {
			return false;
		}

		return (
			settingsService.settings.editorToolbarButtonDisplay ===
				"all-notes" || leaf === this.currentActiveLeaf
		);
	}

	private getTargetLeaves(): WorkspaceLeaf[] {
		const leaves: WorkspaceLeaf[] = [];

		if (
			settingsService.settings.editorToolbarButtonDisplay ===
			"active-only"
		) {
			if (
				this.currentActiveLeaf &&
				this.isValidMarkdownLeaf(this.currentActiveLeaf)
			) {
				leaves.push(this.currentActiveLeaf);
			}
		} else {
			this.plugin.app.workspace.iterateAllLeaves((leaf) => {
				if (this.isValidMarkdownLeaf(leaf)) {
					leaves.push(leaf);
				}
			});
		}

		return leaves;
	}

	private createButtonElement(leaf: WorkspaceLeaf): HTMLElement | null {
		const markdownView = leaf.view as MarkdownView;
		const position = settingsService.settings.editorToolbarButtonPosition;

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
			return null;
		}

		const buttonElement = document.createElement("div");
		buttonElement.className = this.BUTTON_CLASS;

		// Insert button based on position setting
		if (position === "left") {
			// For left, insert after existing nav buttons
			targetContainer.appendChild(buttonElement);
		} else if (position === "right-before") {
			// For right-before, insert at the beginning of actions
			targetContainer.insertBefore(
				buttonElement,
				targetContainer.firstChild,
			);
		} else {
			// For right, insert at the end of actions
			targetContainer.appendChild(buttonElement);
		}

		return buttonElement;
	}

	private removeButtonForLeaf(leaf: WorkspaceLeaf): void {
		const leafButton = this.leafButtons.get(leaf);
		if (leafButton) {
			leafButton.root.unmount();
			leafButton.buttonElement.remove();
			this.leafButtons.delete(leaf);
		}
	}

	private renderButtonForLeaf(leafButton: LeafButton): void {
		leafButton.root.render(
			<EditorToolbarButton
				statuses={leafButton.noteStatusService?.statuses || {}}
				onClick={() =>
					this.openStatusModal(leafButton.noteStatusService)
				}
				unknownStatusConfig={this.getUnknownStatusConfig()}
			/>,
		);
	}

	private refreshAllButtons(): void {
		for (const [leaf, leafButton] of this.leafButtons.entries()) {
			const markdownView = leaf.view as MarkdownView;
			if (markdownView.file) {
				leafButton.noteStatusService = new NoteStatusService(
					markdownView.file,
				);
				leafButton.noteStatusService.populateStatuses();
				this.renderButtonForLeaf(leafButton);
			}
		}
	}

	private renderAllButtons(): void {
		for (const leafButton of this.leafButtons.values()) {
			this.renderButtonForLeaf(leafButton);
		}
	}

	private handleShowHideButtons(): void {
		this.syncButtons();
	}

	private recreateAllButtons(): void {
		// Remove all existing buttons first
		for (const leaf of this.leafButtons.keys()) {
			this.removeButtonForLeaf(leaf);
		}
		this.syncButtons();
	}

	private openStatusModal(noteStatusService: NoteStatusService) {
		if (!noteStatusService) {
			throw new Error(
				"open status modal failed because there is no noteStatusService available",
			);
		}
		eventBus.publish("triggered-open-modal", {
			statusService: noteStatusService,
		});
	}

	private getUnknownStatusConfig() {
		const settings = settingsService.settings;
		return {
			icon: settings.unknownStatusIcon || "❓",
			color: settings.unknownStatusColor || "#8b949e",
		};
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

		// Remove all buttons
		for (const leaf of this.leafButtons.keys()) {
			this.removeButtonForLeaf(leaf);
		}

		this.leafButtons.clear();
		EditorToolbarIntegration.instance = null;
	}
}

export default EditorToolbarIntegration;
