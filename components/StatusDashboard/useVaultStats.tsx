import { useState, useCallback } from "react";
import { TFile } from "obsidian";
import { NoteStatus } from "@/types/noteStatus";
import { BaseNoteStatusService } from "@/core/noteStatusService";
import settingsService from "@/core/settingsService";

export interface VaultStats {
	totalNotes: number;
	notesWithStatus: number;
	statusDistribution: Record<string, number>;
	tagDistribution: Record<string, number>;
	recentChanges: Array<{
		file: TFile;
		status: NoteStatus;
		timestamp: number;
		action: "added" | "removed";
	}>;
}

export const useVaultStats = () => {
	const [vaultStats, setVaultStats] = useState<VaultStats>({
		totalNotes: 0,
		notesWithStatus: 0,
		statusDistribution: {},
		tagDistribution: {},
		recentChanges: [],
	});

	const calculateVaultStats = useCallback((): VaultStats => {
		const files = BaseNoteStatusService.app.vault.getMarkdownFiles();
		const availableStatuses =
			BaseNoteStatusService.getAllAvailableStatuses();
		const statusMetadataKeys = [settingsService.settings.tagPrefix];

		let notesWithStatus = 0;
		const statusDistribution: Record<string, number> = {};
		const tagDistribution: Record<string, number> = {};

		availableStatuses.forEach((status) => {
			statusDistribution[status.name] = 0;
		});

		statusMetadataKeys.forEach((tag) => {
			tagDistribution[tag] = 0;
		});

		files.forEach((file) => {
			const cachedMetadata =
				BaseNoteStatusService.app.metadataCache.getFileCache(file);
			const frontmatter = cachedMetadata?.frontmatter;

			if (!frontmatter) return;

			let hasAnyStatus = false;

			statusMetadataKeys.forEach((key) => {
				const value = frontmatter[key];
				if (value) {
					hasAnyStatus = true;
					tagDistribution[key]++;

					const statusNames = Array.isArray(value) ? value : [value];
					statusNames.forEach((statusName) => {
						const statusStr = statusName.toString();
						if (statusDistribution.hasOwnProperty(statusStr)) {
							statusDistribution[statusStr]++;
						}
					});
				}
			});

			if (hasAnyStatus) {
				notesWithStatus++;
			}
		});

		return {
			totalNotes: files.length,
			notesWithStatus,
			statusDistribution,
			tagDistribution,
			recentChanges: [],
		};
	}, []);

	const updateVaultStats = useCallback(() => {
		const stats = calculateVaultStats();
		setVaultStats(stats);
	}, [calculateVaultStats]);

	return {
		vaultStats,
		updateVaultStats,
	};
};
