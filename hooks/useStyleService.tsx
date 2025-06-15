import { useEffect, useCallback, useRef } from "react";
import { NoteStatusSettings } from "../models/types";
import { PREDEFINED_TEMPLATES } from "../constants/status-templates";

interface UseStyleServiceOptions {
	settings: NoteStatusSettings;
}

export const useStyleService = ({ settings }: UseStyleServiceOptions) => {
	const dynamicStyleElRef = useRef<HTMLStyleElement | null>(null);

	const getAllStatusColors = useCallback((): Record<string, string> => {
		const colors = { ...settings.statusColors };

		if (settings.useCustomStatusesOnly) return colors;

		for (const templateId of settings.enabledTemplates) {
			const template = PREDEFINED_TEMPLATES.find(
				(t) => t.id === templateId,
			);
			if (!template) continue;

			for (const status of template.statuses) {
				if (status.color && !colors[status.name]) {
					colors[status.name] = status.color;
				}
			}
		}

		return colors;
	}, [settings]);

	const generateColorCssRules = useCallback(
		(colors: Record<string, string>): string => {
			let css = "";

			for (const [status, color] of Object.entries(colors)) {
				css += `
        .status-${status} {
            color: ${color} !important;
        }
        .note-status-bar .note-status-${status},
        .nav-file-title .note-status-${status} {
            color: ${color} !important;
        }
      `;
			}

			return css;
		},
		[],
	);

	const updateDynamicStyles = useCallback((): void => {
		if (!dynamicStyleElRef.current) {
			dynamicStyleElRef.current = document.createElement("style");
			document.head.appendChild(dynamicStyleElRef.current);
		}

		const allColors = getAllStatusColors();
		const cssRules = generateColorCssRules(allColors);
		dynamicStyleElRef.current.textContent = cssRules;
	}, [getAllStatusColors, generateColorCssRules]);

	const unload = useCallback((): void => {
		if (dynamicStyleElRef.current) {
			dynamicStyleElRef.current.remove();
			dynamicStyleElRef.current = null;
		}
	}, []);

	useEffect(() => {
		updateDynamicStyles();

		return () => {
			unload();
		};
	}, [updateDynamicStyles, unload]);

	useEffect(() => {
		updateDynamicStyles();
	}, [settings, updateDynamicStyles]);

	return {
		updateDynamicStyles,
		unload,
	};
};
