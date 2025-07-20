import eventBus from "core/eventBus";
import {
	Menu,
	Notice,
	Plugin,
	TAbstractFile,
	TFile,
	WorkspaceLeaf,
} from "obsidian";
import {
	MultipleNoteStatusService,
	NoteStatusService,
} from "@/core/noteStatusService";

export class ContextMenuIntegration {
	private static instance: ContextMenuIntegration | null = null;
	private plugin: Plugin;
	private currentLeaf: WorkspaceLeaf | null = null;
	private noteStatusService:
		| NoteStatusService
		| MultipleNoteStatusService
		| null = null;

	constructor(plugin: Plugin) {
		if (ContextMenuIntegration.instance) {
			throw new Error("The context menu instance is already created");
		}
		this.plugin = plugin;
		ContextMenuIntegration.instance = this;
	}

	async integrate() {
		this.plugin.registerEvent(
			this.plugin.app.workspace.on(
				"files-menu",
				(
					menu: Menu,
					files: TAbstractFile[],
					source: string,
					leaf?: WorkspaceLeaf,
				) => {
					menu.addItem((item) => {
						item.setTitle("Change note status")
							.setIcon("rotate-ccw") // Lucide icon
							.onClick(async () => {
								const tFiles = files.filter(
									(f): f is TFile => f instanceof TFile,
								);
								if (tFiles.length) {
									this.openMultipleFilesStatusesModal(tFiles);
								} else {
									new Notice(
										"The selected files are not valid to add status, just .md files can have status in this plugin version",
									);
								}
							});
					});
				},
			),
		);
		this.plugin.registerEvent(
			this.plugin.app.workspace.on("file-menu", (menu, file, f, f2) => {
				menu.addItem((item) => {
					item.setTitle("Change note state")
						.setIcon("rotate-ccw") // Lucide icon
						.onClick(async () => {
							if (file instanceof TFile) {
								this.openSingleFileStatusesModal(file);
							} else {
								new Notice(
									"The selected file is not valid to add status, just .md files can have status in this plugin version",
								);
							}
						});
				});
			}),
		);

		this.plugin.registerEvent(
			this.plugin.app.workspace.on(
				"editor-menu",
				(menu, editor, view) => {
					menu.addItem((item) => {
						item.setTitle("Change note status")
							.setIcon("rotate-ccw") // Lucide icon
							.onClick(async () => {
								if (view.file) {
									if (view.file instanceof TFile) {
										this.openSingleFileStatusesModal(
											view.file,
										);
									} else {
										new Notice(
											"The selected file is not valid to add status, just .md files can have status in this plugin version",
										);
									}
								}
							});
					});
				},
			),
		);
	}

	private openMultipleFilesStatusesModal(tFiles: TFile[]) {
		const multipleStatusService = new MultipleNoteStatusService(tFiles);
		multipleStatusService.populateStatuses();
		eventBus.publish("triggered-open-modal", {
			statusService: multipleStatusService,
		});
	}
	private openSingleFileStatusesModal(tFile: TFile) {
		const noteStatusService = new NoteStatusService(tFile);
		noteStatusService.populateStatuses();
		eventBus.publish("triggered-open-modal", {
			statusService: noteStatusService,
		});
	}

	destroy() {
		this.currentLeaf = null;
		this.noteStatusService = null;
		ContextMenuIntegration.instance = null;
	}
}

export default ContextMenuIntegration;
