import { useState, useCallback } from "react";
import { TFile } from "obsidian";
import { NoteStatus } from "@/types/noteStatus";
import {
	BaseNoteStatusService,
	NoteStatusService,
} from "@/core/noteStatusService";
import settingsService from "@/core/settingsService";
import { getKnownFrontmatterKeys } from "@/utils/frontmatterMappings";

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
		const files = BaseNoteStatusService.app.vault.getFiles();
		const availableStatuses =
			BaseNoteStatusService.getAllAvailableStatuses();
		const statusMetadataKeys = getKnownFrontmatterKeys(
			settingsService.settings,
		);

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
			const noteStatusService = new NoteStatusService(file);
			noteStatusService.populateStatuses();
			let hasAnyStatus = false;

			statusMetadataKeys.forEach((key) => {
				const statuses = noteStatusService.getStatusesForKey(key);
				if (!statuses.length) return;

				hasAnyStatus = true;
				tagDistribution[key]++;

				statuses.forEach((status) => {
					const scopedIdentifier = status.templateId
						? `${status.templateId}:${status.name}`
						: status.name;
					if (!statusDistribution.hasOwnProperty(scopedIdentifier)) {
						statusDistribution[scopedIdentifier] = 0;
					}
					statusDistribution[scopedIdentifier]++;
				});
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
