import { App, Modal, Notice } from "obsidian";
import { createRoot, Root } from "react-dom/client";
import {
	ChangeStatusModal,
	Props,
} from "@/components/ChangeStatusModal/ChangeStatusModal";
import SelectorService from "@/core/selectorService";
import {
	MultipleNoteStatusService,
	NoteStatusService,
	BaseNoteStatusService,
} from "@/core/noteStatusService";
import eventBus from "@/core/eventBus";
import settingsService from "@/core/settingsService";

export class StatusModalIntegration extends Modal {
	private root: Root | null = null;
	private static instance: StatusModalIntegration | null = null;
	private selectorService: SelectorService;

	constructor(app: App) {
		super(app);
	}

	static open(
		app: App,
		noteStatusService: NoteStatusService | MultipleNoteStatusService,
	) {
		if (StatusModalIntegration.instance) {
			throw new Error("Status Modal is already open");
		}
		StatusModalIntegration.instance = new StatusModalIntegration(app);
		StatusModalIntegration.instance.selectorService = new SelectorService(
			noteStatusService,
		);

		eventBus.subscribe(
			"status-changed",
			() => {
				// TODO: There are multiple calls to populateStatuses, in this case the noteStatusService is passed by reference, so redundant computations
				// FIXME: Line 27
				StatusModalIntegration.instance?.selectorService.noteStatusService.populateStatuses();
				StatusModalIntegration.instance?.render();
			},
			"statusModalIntegrationSubscription1",
		);

		StatusModalIntegration.instance.open();
	}

	private onRemoveStatus: Props["onRemoveStatus"] = async (
		frontmatterTagName,
		status,
	) => {
		const removed =
			await this.selectorService.noteStatusService.removeStatus(
				frontmatterTagName,
				status,
			);
		if (removed) {
			new Notice(
				`Status ${status.name} removed successfully from the note`,
			);
		} else {
			new Notice(
				`Something went wrong removing the status ${status.name} from the note`,
			);
		}
	};
	private onSelectStatus: Props["onSelectStatus"] = async (
		frontmatterTagName,
		status,
	) => {
		const scopedIdentifier = status.templateId
			? BaseNoteStatusService.formatStatusIdentifier({
					templateId: status.templateId,
					name: status.name,
				})
			: status.name;

		const added = await this.selectorService.noteStatusService.addStatus(
			frontmatterTagName,
			scopedIdentifier,
		);
		if (added) {
			new Notice(`Status ${status.name} added successfully to the note`);
		} else {
			new Notice(
				`Something went wrong adding the status ${status.name} to the note`,
			);
		}
	};

	onOpen() {
		this.render();
	}

	private render() {
		const { contentEl } = this;

		if (!this.root) {
			this.root = createRoot(contentEl);
		}

		let filesQuantity = 1;
		if (
			this.selectorService.noteStatusService instanceof
			MultipleNoteStatusService
		) {
			filesQuantity =
				this.selectorService.noteStatusService.selectedFilesQTY();
		}
		this.root.render(
			<ChangeStatusModal
				availableStatuses={NoteStatusService.getAllAvailableStatuses()}
				currentStatuses={
					this.selectorService.noteStatusService.statuses ?? {}
				}
				filesQuantity={filesQuantity}
				templates={settingsService.settings.templates}
				iconFrameMode={
					settingsService.settings.fileExplorerIconFrame || "never"
				}
				iconColorMode={
					settingsService.settings.fileExplorerIconColorMode ||
					"status"
				}
				onRemoveStatus={this.onRemoveStatus}
				onSelectStatus={this.onSelectStatus}
			/>,
		);
	}

	onClose() {
		if (this.root) {
			this.root.unmount();
			this.root = null;
		}
		const { contentEl } = this;
		contentEl.empty();
		StatusModalIntegration.instance = null;

		eventBus.unsubscribe(
			"status-changed",
			"statusModalIntegrationSubscription1",
		);
	}
}
