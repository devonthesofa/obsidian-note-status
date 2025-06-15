import { useState, useCallback, useMemo, useEffect } from "react";
import { App, TFile, Editor, Notice } from "obsidian";
import { NoteStatusSettings, Status } from "../models/types";
import { PREDEFINED_TEMPLATES } from "../constants/status-templates";

interface UseStatusServiceOptions {
	app: App;
	settings: NoteStatusSettings;
}

export const useStatusService = ({
	app,
	settings,
}: UseStatusServiceOptions) => {
	const [allStatuses, setAllStatuses] = useState<Status[]>([]);

	const updateAllStatuses = useCallback(() => {
		const newStatuses = [...settings.customStatuses];

		if (!settings.useCustomStatusesOnly) {
			const templateStatuses = settings.enabledTemplates
				.map((id) => PREDEFINED_TEMPLATES.find((t) => t.id === id))
				.filter(Boolean)
				.flatMap((template) => (template ? template.statuses : []));

			for (const status of templateStatuses) {
				const existingIndex = newStatuses.findIndex(
					(s) => s.name.toLowerCase() === status.name.toLowerCase(),
				);

				if (existingIndex === -1) {
					newStatuses.push(status);
				} else if (status.color) {
					if (!settings.statusColors[status.name]) {
						settings.statusColors[status.name] = status.color;
					}
				}
			}
		}

		setAllStatuses(newStatuses);
	}, [settings]);

	useEffect(() => {
		updateAllStatuses();
	}, [updateAllStatuses]);

	const getAllStatuses = useCallback(() => allStatuses, [allStatuses]);

	const getTemplateStatuses = useCallback((): Status[] => {
		return settings.enabledTemplates
			.map((id) => PREDEFINED_TEMPLATES.find((t) => t.id === id))
			.filter(Boolean)
			.flatMap((template) => (template ? template.statuses : []));
	}, [settings.enabledTemplates]);

	const getFileStatuses = useCallback(
		(file: TFile): string[] => {
			const cachedMetadata = app.metadataCache.getFileCache(file);
			if (!cachedMetadata?.frontmatter) return ["unknown"];

			const frontmatterStatus =
				cachedMetadata.frontmatter[settings.tagPrefix];
			if (!frontmatterStatus) return ["unknown"];

			const statuses: string[] = [];

			const addValidStatus = (
				statusName: string,
				targetStatuses: string[],
			): void => {
				const normalizedStatus = statusName.toLowerCase();
				const matchingStatus = allStatuses.find(
					(s) => s.name.toLowerCase() === normalizedStatus,
				);

				if (matchingStatus) {
					targetStatuses.push(matchingStatus.name);
				}
			};

			if (Array.isArray(frontmatterStatus)) {
				for (const statusName of frontmatterStatus) {
					if (settings.strictStatuses) {
						addValidStatus(statusName.toString(), statuses);
					} else {
						const cleanStatus = statusName.toString().trim();
						if (cleanStatus) statuses.push(cleanStatus);
					}
				}
			} else {
				if (settings.strictStatuses) {
					addValidStatus(frontmatterStatus.toString(), statuses);
				} else {
					const cleanStatus = frontmatterStatus.toString().trim();
					if (cleanStatus) statuses.push(cleanStatus);
				}
			}

			return statuses.length > 0 ? statuses : ["unknown"];
		},
		[app, settings, allStatuses],
	);

	const getStatusIcon = useCallback(
		(status: string): string => {
			const customStatus = allStatuses.find(
				(s) => s.name.toLowerCase() === status.toLowerCase(),
			);
			return customStatus ? customStatus.icon : "❓";
		},
		[allStatuses],
	);

	const insertStatusMetadataInEditor = useCallback(
		(editor: Editor): void => {
			const content = editor.getValue();
			const frontMatterMatch = content.match(/^---\n([\s\S]+?)\n---/);

			const statusTagRegex = new RegExp(
				`${settings.tagPrefix}:\\s*\\[?[^\\]]*\\]?`,
				"m",
			);

			const insertIntoExistingFrontmatter = (
				content: string,
				frontMatterMatch: RegExpMatchArray,
				statusMetadata: string,
			): void => {
				const frontMatter = frontMatterMatch[1];
				const updatedFrontMatter = frontMatter.match(statusTagRegex)
					? frontMatter.replace(statusTagRegex, statusMetadata)
					: `${frontMatter}\n${statusMetadata}`;

				const updatedContent = content.replace(
					/^---\n([\s\S]+?)\n---/,
					`---\n${updatedFrontMatter}\n---`,
				);
				editor.setValue(updatedContent);
			};

			const createFrontmatterWithStatus = (
				content: string,
				statusMetadata: string,
			): void => {
				const newFrontMatter = `---\n${statusMetadata}\n---\n\n${content.trim()}`;
				editor.setValue(newFrontMatter);
			};

			if (frontMatterMatch) {
				const frontMatter = frontMatterMatch[1];
				if (frontMatter.match(statusTagRegex)) {
					return;
				}
				const defaultStatuses = ["unknown"];
				const statusMetadata = `${settings.tagPrefix}: ${JSON.stringify(defaultStatuses)}`;
				insertIntoExistingFrontmatter(
					content,
					frontMatterMatch,
					statusMetadata,
				);
			} else {
				if (content.match(statusTagRegex)) {
					return;
				}
				const defaultStatuses = ["unknown"];
				const statusMetadata = `${settings.tagPrefix}: ${JSON.stringify(defaultStatuses)}`;
				createFrontmatterWithStatus(content, statusMetadata);
			}
		},
		[settings],
	);

	const getMarkdownFiles = useCallback(
		(searchQuery = ""): TFile[] => {
			const files = app.vault.getMarkdownFiles();
			if (!searchQuery) return files;

			const lowerQuery = searchQuery.toLowerCase();
			return files.filter((file) =>
				file.basename.toLowerCase().includes(lowerQuery),
			);
		},
		[app],
	);

	const groupFilesByStatus = useCallback(
		(searchQuery = ""): Record<string, TFile[]> => {
			const statusGroups: Record<string, TFile[]> = {};

			for (const status of allStatuses) {
				statusGroups[status.name] = [];
			}

			statusGroups["unknown"] = statusGroups["unknown"] || [];

			const files = getMarkdownFiles(searchQuery);
			for (const file of files) {
				const statuses = getFileStatuses(file);

				for (const status of statuses) {
					if (statusGroups[status]) {
						statusGroups[status].push(file);
					}
				}
			}

			return statusGroups;
		},
		[allStatuses, getMarkdownFiles, getFileStatuses],
	);

	const modifyNoteStatus = useCallback(
		async (options: {
			files: TFile | TFile[];
			statuses: string | string[];
			operation: "set" | "add" | "remove" | "toggle";
			showNotice?: boolean;
		}): Promise<void> => {
			const { operation, showNotice = true } = options;
			const targetFiles = Array.isArray(options.files)
				? options.files
				: [options.files];
			const targetStatuses = Array.isArray(options.statuses)
				? options.statuses
				: [options.statuses];

			if (targetFiles.length === 0) {
				if (showNotice) new Notice("No files selected");
				return;
			}

			const updatePromises = targetFiles.map(async (file) => {
				if (!file || file.extension !== "md") return;

				const currentStatuses = getFileStatuses(file);
				let newStatuses: string[] = [];

				switch (operation) {
					case "set":
						newStatuses = [...targetStatuses];
						break;

					case "add":
						newStatuses = [
							...new Set([
								...currentStatuses.filter(
									(s) => s !== "unknown",
								),
								...targetStatuses,
							]),
						];
						break;

					case "remove":
						newStatuses = currentStatuses.filter(
							(status) => !targetStatuses.includes(status),
						);
						break;

					case "toggle":
						newStatuses = [...currentStatuses];
						for (const status of targetStatuses) {
							if (currentStatuses.includes(status)) {
								newStatuses = newStatuses.filter(
									(s) => s !== status,
								);
							} else {
								newStatuses = [
									...newStatuses.filter(
										(s) => s !== "unknown",
									),
									status,
								];
							}
						}
						break;
				}

				if (newStatuses.length === 0) {
					newStatuses = ["unknown"];
				}

				await app.fileManager.processFrontMatter(
					file,
					(frontmatter) => {
						frontmatter[settings.tagPrefix] = newStatuses;
					},
				);

				window.dispatchEvent(
					new CustomEvent("note-status:status-changed", {
						detail: {
							statuses: newStatuses,
							file: file?.path,
						},
					}),
				);
			});

			await Promise.all(updatePromises);

			if (showNotice && targetFiles.length > 1) {
				const statusText =
					targetStatuses.length === 1
						? targetStatuses[0]
						: `${targetStatuses.length} statuses`;
				const operationText =
					operation === "set"
						? "updated"
						: operation === "add"
							? "added to"
							: operation === "remove"
								? "removed from"
								: "toggled on";

				new Notice(
					`${statusText} ${operationText} ${targetFiles.length} files`,
				);
			}
		},
		[app, settings, getFileStatuses],
	);

	const handleStatusChange = useCallback(
		async (options: {
			files: TFile | TFile[];
			statuses: string | string[];
			isMultipleSelection?: boolean;
			allowMultipleStatuses?: boolean;
			operation?: "set" | "add" | "remove" | "toggle";
			showNotice?: boolean;
			afterChange?: (updatedStatuses: string[]) => void;
		}): Promise<void> => {
			const {
				files,
				statuses,
				isMultipleSelection = false,
				allowMultipleStatuses = settings.useMultipleStatuses,
				operation: explicitOperation,
				showNotice = isMultipleSelection,
			} = options;

			const targetFiles = Array.isArray(files) ? files : [files];
			const targetStatuses = Array.isArray(statuses)
				? statuses
				: [statuses];

			let operation: "set" | "add" | "remove" | "toggle";

			if (explicitOperation) {
				operation = explicitOperation;
			} else if (isMultipleSelection) {
				const firstStatus = targetStatuses[0];
				const filesWithStatus = targetFiles.filter((file) =>
					getFileStatuses(file).includes(firstStatus),
				);

				operation =
					filesWithStatus.length > targetFiles.length / 2
						? "remove"
						: "add";
			} else {
				if (allowMultipleStatuses) {
					operation = "toggle";
				} else {
					operation = "set";
				}
			}

			await modifyNoteStatus({
				files: targetFiles,
				statuses: targetStatuses,
				operation,
				showNotice,
			});
		},
		[settings, getFileStatuses, modifyNoteStatus],
	);

	return useMemo(
		() => ({
			getAllStatuses,
			getTemplateStatuses,
			getFileStatuses,
			getStatusIcon,
			insertStatusMetadataInEditor,
			getMarkdownFiles,
			groupFilesByStatus,
			handleStatusChange,
			updateAllStatuses,
		}),
		[
			getAllStatuses,
			getTemplateStatuses,
			getFileStatuses,
			getStatusIcon,
			insertStatusMetadataInEditor,
			getMarkdownFiles,
			groupFilesByStatus,
			handleStatusChange,
			updateAllStatuses,
		],
	);
};
