import settingsService from "@/core/settingsService";
import { GroupedStatuses, NoteStatus } from "@/types/noteStatus";

export const DEFAULT_STATUS_ACCENT_COLOR = "var(--text-accent)";
const DEFAULT_UNKNOWN_STATUS_COLOR = "#8b949e";

export function getPrimaryStatus(
	statuses?: GroupedStatuses | null,
): NoteStatus | null {
	if (!statuses) {
		return null;
	}

	for (const list of Object.values(statuses)) {
		if (list.length) {
			return list[0];
		}
	}

	return null;
}

export function getUnknownStatusColor(): string {
	return (
		settingsService.settings.unknownStatusColor?.trim() ||
		DEFAULT_UNKNOWN_STATUS_COLOR
	);
}

export function resolveStatusColor(
	status?: NoteStatus | null,
	fallbackColor?: string,
	defaultColor: string | null = DEFAULT_STATUS_ACCENT_COLOR,
): string | undefined {
	const statusColor = status?.color?.trim();
	if (statusColor) {
		return statusColor;
	}

	const fallback = fallbackColor?.trim();
	if (fallback) {
		return fallback;
	}

	if (defaultColor === null) {
		return undefined;
	}

	return defaultColor || undefined;
}
