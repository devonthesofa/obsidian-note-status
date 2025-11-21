import settingsService from "@/core/settingsService";

export type ExperimentalFeature = "statusDashboard" | "groupedStatusView";

const FEATURE_SETTING_MAP: Record<
	ExperimentalFeature,
	keyof typeof settingsService.settings
> = {
	statusDashboard: "enableStatusDashboard",
	groupedStatusView: "enableGroupedStatusView",
};

export function isExperimentalFeatureEnabled(
	feature: ExperimentalFeature,
): boolean {
	const settings = settingsService.settings;
	if (!settings.enableExperimentalFeatures) {
		return false;
	}

	const flagKey = FEATURE_SETTING_MAP[feature];
	return Boolean(settings[flagKey]);
}
