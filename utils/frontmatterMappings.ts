import {
	PluginSettings,
	StatusFrontmatterMapping,
} from "@/types/pluginSettings";
import {
	NoteStatus,
	ScopedStatusName,
	StatusIdentifier,
} from "@/types/noteStatus";

type StatusLike = NoteStatus | ScopedStatusName | StatusIdentifier;

const normalizeKeys = (keys: string[]): string[] => {
	const unique = new Set(
		keys
			.map((key) => key?.trim())
			.filter((key): key is string => Boolean(key)),
	);
	return Array.from(unique);
};

const toScopedStatusName = (status: StatusLike): ScopedStatusName => {
	if (typeof status === "string") {
		if (status.includes(":")) {
			const [templateId, name] = status.split(":", 2);
			return { templateId, name };
		}
		return { name: status };
	}

	if ("name" in status) {
		return {
			name: status.name,
			templateId: "templateId" in status ? status.templateId : undefined,
		};
	}

	return status;
};

const matchesStatusMapping = (
	mapping: StatusFrontmatterMapping,
	status: ScopedStatusName,
) => {
	if (mapping.scope === "status") {
		const templateMatches =
			(mapping.templateId || null) === (status.templateId || null);
		return templateMatches && mapping.statusName === status.name;
	}

	if (mapping.scope === "template") {
		return Boolean(status.templateId) &&
			status.templateId === mapping.templateId
			? true
			: false;
	}

	return false;
};

const getMappingKeys = (mapping: StatusFrontmatterMapping): string[] => {
	return normalizeKeys(mapping.frontmatterKeys || []);
};

export const getKnownFrontmatterKeys = (settings: PluginSettings): string[] => {
	const keys = [
		settings.tagPrefix,
		...(settings.statusFrontmatterMappings ?? []).flatMap((mapping) =>
			getMappingKeys(mapping),
		),
	];
	return normalizeKeys(keys);
};

export const resolveFrontmatterKeysForStatus = (
	status: StatusLike,
	settings: PluginSettings,
	options?: { isMarkdownFile?: boolean },
): string[] => {
	if (options?.isMarkdownFile === false) {
		return [settings.tagPrefix];
	}

	const scoped = toScopedStatusName(status);
	const mappings = settings.statusFrontmatterMappings ?? [];
	const collectedKeys: string[] = [];

	mappings.forEach((mapping) => {
		if (mapping.scope === "status") {
			if (!matchesStatusMapping(mapping, scoped)) {
				return;
			}
		} else if (mapping.scope === "template") {
			if (!matchesStatusMapping(mapping, scoped)) {
				return;
			}
		}

		const keys = getMappingKeys(mapping);
		collectedKeys.push(...keys);
	});

	if (collectedKeys.length) {
		return normalizeKeys(collectedKeys);
	}

	return [settings.tagPrefix];
};
