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

		// Initialize distribution using full scoped identifiers
		availableStatuses.forEach((status) => {
			const scopedIdentifier = status.templateId
				? `${status.templateId}:${status.name}`
				: status.name;
			statusDistribution[scopedIdentifier] = 0;
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

						// Determine the scoped identifier to use
						let scopedIdentifier: string;

						if (statusStr.includes(":")) {
							// Already scoped
							scopedIdentifier = statusStr;
						} else {
							// Legacy status - find first template that has this status
							const firstTemplateWithStatus =
								availableStatuses.find(
									(s) => s.name === statusStr && s.templateId,
								);
							scopedIdentifier = firstTemplateWithStatus
								? `${firstTemplateWithStatus.templateId}:${statusStr}`
								: statusStr; // Fallback to unscoped if no template found
						}

						// Initialize status if not already present
						if (
							!statusDistribution.hasOwnProperty(scopedIdentifier)
						) {
							statusDistribution[scopedIdentifier] = 0;
						}
						statusDistribution[scopedIdentifier]++;
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
