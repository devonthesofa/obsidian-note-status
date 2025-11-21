import { TFile } from "obsidian";
import settingsService from "./settingsService";
import { getKnownFrontmatterKeys } from "@/utils/frontmatterMappings";

const ensureOrderedKeys = (keys: string[]): string[] => {
	const defaultKey = settingsService.settings.tagPrefix;
	const seen = new Set<string>();
	const ordered: string[] = [];

	[defaultKey, ...keys].forEach((key) => {
		const trimmed = key?.trim();
		if (!trimmed || seen.has(trimmed)) return;
		seen.add(trimmed);
		ordered.push(trimmed);
	});

	return ordered;
};

export const getAllFrontmatterKeys = (): string[] => {
	const keys = getKnownFrontmatterKeys(settingsService.settings);
	return ensureOrderedKeys(keys);
};

export const getFrontmatterKeysForFile = (file: TFile): string[] => {
	if (file.extension !== "md") {
		return [settingsService.settings.tagPrefix];
	}

	return getAllFrontmatterKeys();
};
