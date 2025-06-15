import { useState, useCallback, useRef } from "react";
import { App, TFile, MarkdownView, Editor, Notice } from "obsidian";
import { NoteStatusSettings } from "../models/types";
import { StatusService } from "../services/status-service";
import {
	DropdownOptions,
	StatusRemoveHandler,
	StatusSelectHandler,
} from "../components/status-dropdown/types";
import { createDummyTarget } from "../components/status-dropdown/dropdown-position";
import { DropdownUIManager } from "../components/status-dropdown/DropdownUI";

interface UseDropdownManagerOptions {
	app: App;
	settings: NoteStatusSettings;
	statusService: StatusService;
}

export const useDropdownManager = ({
	app,
	settings,
	statusService,
}: UseDropdownManagerOptions) => {
	const [currentStatuses, setCurrentStatuses] = useState<string[]>([
		"unknown",
	]);
	const dropdownUIRef = useRef<DropdownUIManager | null>(null);

	const initializeDropdownUI = useCallback(() => {
		if (!dropdownUIRef.current) {
			const deps = { app, settings, statusService };
			dropdownUIRef.current = new DropdownUIManager(deps);

			const onRemoveStatusHandler: StatusRemoveHandler = async (
				status,
				targetFile,
			) => {
				if (!targetFile) return;

				const isMultiple = Array.isArray(targetFile);

				await statusService.handleStatusChange({
					files: targetFile,
					statuses: status,
					operation: "remove",
					showNotice: isMultiple,
				});
			};

			const onSelectStatusHandler: StatusSelectHandler = async (
				status,
				targetFile,
			) => {
				const isMultipleFiles =
					Array.isArray(targetFile) && targetFile.length > 1;

				if (isMultipleFiles) {
					const files = targetFile as TFile[];
					const filesWithStatus = files.filter((file) =>
						statusService.getFileStatuses(file).includes(status),
					);

					const operation =
						filesWithStatus.length === files.length
							? "remove"
							: !settings.useMultipleStatuses
								? "set"
								: "add";

					await statusService.handleStatusChange({
						files: targetFile,
						statuses: status,
						isMultipleSelection: true,
						operation: operation,
					});
				} else {
					await statusService.handleStatusChange({
						files: targetFile,
						statuses: status,
					});
				}
			};

			dropdownUIRef.current.setOnRemoveStatusHandler(
				onRemoveStatusHandler,
			);
			dropdownUIRef.current.setOnSelectStatusHandler(
				onSelectStatusHandler,
			);
		}
		return dropdownUIRef.current;
	}, [app, settings, statusService]);

	const update = useCallback(
		(newStatuses: string[] | string, _file?: TFile): void => {
			const statuses = Array.isArray(newStatuses)
				? [...newStatuses]
				: [newStatuses];
			setCurrentStatuses(statuses);

			const dropdownUI = initializeDropdownUI();
			dropdownUI.updateStatuses(statuses);
		},
		[initializeDropdownUI],
	);

	const updateSettings = useCallback(
		(newSettings: NoteStatusSettings): void => {
			const dropdownUI = initializeDropdownUI();
			dropdownUI.updateSettings(newSettings);
		},
		[initializeDropdownUI],
	);

	const getCursorPosition = useCallback(
		(editor: Editor, view: MarkdownView): { x: number; y: number } => {
			try {
				const cursor = editor.getCursor("head");
				const lineElement = view.contentEl.querySelector(
					`.cm-line:nth-child(${cursor.line + 1})`,
				);

				if (lineElement) {
					const rect = lineElement.getBoundingClientRect();
					return { x: rect.left + 20, y: rect.bottom + 5 };
				}

				const editorEl = view.contentEl.querySelector(".cm-editor");
				if (editorEl) {
					const rect = editorEl.getBoundingClientRect();
					return { x: rect.left + 100, y: rect.top + 100 };
				}
			} catch (error) {
				console.error("Error getting position for dropdown:", error);
			}

			return { x: window.innerWidth / 2, y: window.innerHeight / 3 };
		},
		[],
	);

	const findCommonStatuses = useCallback(
		(files: TFile[]): string[] => {
			if (files.length === 0) return ["unknown"];

			const firstFileStatuses = statusService.getFileStatuses(files[0]);

			return firstFileStatuses.filter(
				(status) =>
					status !== "unknown" &&
					files.every((file) =>
						statusService.getFileStatuses(file).includes(status),
					),
			);
		},
		[statusService],
	);

	const resetDropdown = useCallback((): void => {
		const dropdownUI = initializeDropdownUI();
		dropdownUI.close();
		dropdownUI.setTargetFile(null);
	}, [initializeDropdownUI]);

	const openWithPosition = useCallback(
		(position: { x: number; y: number }): void => {
			const dummyTarget = createDummyTarget(position);
			const dropdownUI = initializeDropdownUI();
			dropdownUI.open(dummyTarget, position);

			setTimeout(() => {
				if (dummyTarget.parentNode) {
					dummyTarget.parentNode.removeChild(dummyTarget);
				}
			}, 100);
		},
		[initializeDropdownUI],
	);

	const positionAndOpenDropdown = useCallback(
		(options: {
			target?: HTMLElement;
			position?: { x: number; y: number };
			editor?: Editor;
			view?: MarkdownView;
		}): void => {
			const dropdownUI = initializeDropdownUI();

			if (options.editor && options.view) {
				const position = getCursorPosition(
					options.editor,
					options.view,
				);
				openWithPosition(position);
				return;
			}

			if (options.target) {
				if (options.position) {
					dropdownUI.open(options.target, options.position);
				} else {
					const rect = options.target.getBoundingClientRect();
					dropdownUI.open(options.target, {
						x: rect.left,
						y: rect.bottom + 5,
					});
				}
				return;
			}

			if (options.position) {
				openWithPosition(options.position);
				return;
			}

			openWithPosition({
				x: window.innerWidth / 2,
				y: window.innerHeight / 3,
			});
		},
		[initializeDropdownUI, getCursorPosition, openWithPosition],
	);

	const openStatusDropdown = useCallback(
		(options: DropdownOptions): void => {
			const activeFile = app.workspace.getActiveFile();
			const files = options.files || (activeFile ? [activeFile] : []);
			if (!files.length) {
				new Notice("No files selected");
				return;
			}
			if (!files.length || !files[0]) {
				new Notice("No files selected");
				return;
			}

			const dropdownUI = initializeDropdownUI();

			if (dropdownUI.isOpen) {
				resetDropdown();
				return;
			}

			const isSingleFile = files.length === 1;

			if (isSingleFile) {
				const targetFile = files[0];
				dropdownUI.setTargetFile(targetFile);
				const fileStatuses = statusService.getFileStatuses(targetFile);
				dropdownUI.updateStatuses(fileStatuses);
			} else {
				dropdownUI.setTargetFiles(files);
				const commonStatuses = findCommonStatuses(files);
				dropdownUI.updateStatuses(commonStatuses);
			}

			positionAndOpenDropdown(options);
		},
		[
			app,
			initializeDropdownUI,
			statusService,
			resetDropdown,
			findCommonStatuses,
			positionAndOpenDropdown,
		],
	);

	const render = useCallback((): void => {
		// No-op - dropdown component handles rendering internally
	}, []);

	const unload = useCallback((): void => {
		if (dropdownUIRef.current) {
			dropdownUIRef.current.dispose();
			dropdownUIRef.current = null;
		}
	}, []);

	return {
		currentStatuses,
		update,
		updateSettings,
		openStatusDropdown,
		resetDropdown,
		render,
		unload,
	};
};
