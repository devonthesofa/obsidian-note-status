import eventBus from "core/eventBus";
import {
	Menu,
	Notice,
	Plugin,
	TAbstractFile,
	TFile,
	TFolder,
	WorkspaceLeaf,
} from "obsidian";
import {
	BaseNoteStatusService,
	MultipleNoteStatusService,
	NoteStatusService,
} from "@/core/noteStatusService";
import settingsService from "@/core/settingsService";

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
			this.plugin.app.workspace.on("file-menu", (menu, file) => {
				if (file instanceof TFile) {
					menu.addItem((item) => {
						item.setTitle("Change note state")
							.setIcon("rotate-ccw")
							.onClick(async () => {
								this.openSingleFileStatusesModal(file);
							});
					});
				} else if (file instanceof TFolder) {
					this.addFolderStatusActions(menu, file);
				}
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

	private addFolderStatusActions(menu: Menu, folder: TFolder) {
		const availableStatuses =
			BaseNoteStatusService.getAllAvailableStatuses();

		if (!availableStatuses.length) {
			menu.addItem((item) => {
				item.setTitle("Apply note status (no statuses available)")
					.setIcon("alert-triangle")
					.setDisabled(true);
			});
			return;
		}

		menu.addItem((item) => {
			item.setTitle("Apply note status to folder")
				.setIcon("folder-sync")
				.onClick(() => {
					this.openFolderStatusModal(folder, false);
				});
		});

		if (settingsService.settings.applyStatusRecursivelyToSubfolders) {
			menu.addItem((item) => {
				item.setTitle("Apply note status to folder and subfolders")
					.setIcon("git-merge")
					.onClick(() => {
						this.openFolderStatusModal(folder, true);
					});
			});
		}
	}

	private openFolderStatusModal(
		folder: TFolder,
		includeSubfolders: boolean,
	): void {
		const markdownFiles = this.getMarkdownFilesFromFolder(
			folder,
			includeSubfolders,
		);

		if (!markdownFiles.length) {
			new Notice("This folder does not contain any Markdown notes.");
			return;
		}

		const warningThreshold = 50;
		if (markdownFiles.length >= warningThreshold) {
			new Notice(
				`This folder contains ${markdownFiles.length} notes. Applying status changes may take a while.`,
				8000,
			);
		}

		const multiStatusService = new MultipleNoteStatusService(markdownFiles);
		multiStatusService.populateStatuses();

		eventBus.publish("triggered-open-modal", {
			statusService: multiStatusService,
		});
	}

	private getMarkdownFilesFromFolder(
		folder: TFolder,
		includeSubfolders: boolean,
	): TFile[] {
		const files: TFile[] = [];
		const queue: TFolder[] = [folder];

		while (queue.length) {
			const current = queue.shift();
			if (!current) continue;

			current.children.forEach((child) => {
				if (child instanceof TFile) {
					if (child.extension === "md") {
						files.push(child);
					}
				} else if (includeSubfolders && child instanceof TFolder) {
					queue.push(child);
				}
			});

			if (!includeSubfolders) {
				break;
			}
		}

		return files;
	}

	destroy() {
		this.currentLeaf = null;
		this.noteStatusService = null;
		ContextMenuIntegration.instance = null;
	}
}

export default ContextMenuIntegration;
