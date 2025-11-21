import { IconName, getIcon, getIconIds } from "obsidian";

let cachedIconSet: Set<IconName> | null = null;

const getLucideIconSet = () => {
	if (!cachedIconSet || cachedIconSet.size === 0) {
		try {
			const ids = getIconIds();
			if (ids?.length) {
				cachedIconSet = new Set(ids);
			}
		} catch (error) {
			// Ignore – fallback detection will rely on getIcon
			cachedIconSet = null;
		}
	}
	return cachedIconSet;
};

const iconExists = (iconName: string): boolean => {
	const iconSet = getLucideIconSet();
	if (iconSet?.size) {
		return iconSet.has(iconName as IconName);
	}
	try {
		return !!getIcon(iconName as IconName);
	} catch {
		return false;
	}
};

export const resolveLucideIconName = (
	...candidates: Array<string | undefined | null>
): IconName | null => {
	for (const candidate of candidates) {
		const trimmed = candidate?.trim();
		if (trimmed && iconExists(trimmed)) {
			return trimmed as IconName;
		}
	}

	return null;
};

export const isLucideIconName = (name?: string | null) => {
	const trimmed = name?.trim();
	if (!trimmed) {
		return false;
	}
	return iconExists(trimmed);
};
