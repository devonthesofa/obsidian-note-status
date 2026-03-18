import { DEFAULT_PLUGIN_SETTINGS } from "@/constants/defaultSettings";
import { PluginSettings, SyncGroup } from "@/types/pluginSettings";
import { PREDEFINED_TEMPLATES } from "@/constants/predefinedTemplates";
import { Plugin, TFile, normalizePath } from "obsidian";
import eventBus from "./eventBus";

export const SETTINGS_GROUPS: Record<SyncGroup, (keyof PluginSettings)[]> = {
	templates: ["templates", "enabledTemplates"],
	customStatuses: ["customStatuses"],
	statusColors: ["statusColors"],
	uiAppearance: [
		"fileExplorerIconPosition",
		"fileExplorerIconFrame",
		"fileExplorerIconColorMode",
		"showStatusBar",
		"autoHideStatusBar",
		"statusBarShowTemplateName",
		"statusBarBadgeStyle",
		"statusBarBadgeContentMode",
		"showStatusIconsInExplorer",
		"hideUnknownStatusInExplorer",
		"fileExplorerColorFileName",
		"fileExplorerColorBlock",
		"fileExplorerLeftBorder",
		"fileExplorerStatusDot",
		"fileExplorerUnderlineFileName",
		"unknownStatusIcon",
		"unknownStatusLucideIcon",
		"unknownStatusColor",
		"statusBarNoStatusText",
		"statusBarShowNoStatusIcon",
		"statusBarShowNoStatusText",
		"showEditorToolbarButton",
		"editorToolbarButtonPosition",
		"editorToolbarButtonDisplay",
	],
	workflow: [
		"useCustomStatusesOnly",
		"useMultipleStatuses",
		"singleStatusStorageMode",
		"strictStatuses",
		"enableStatusOverviewPopup",
	],
	storage: [
		"tagPrefix",
		"statusFrontmatterMappings",
		"writeMappedTagsToDefault",
		"applyStatusRecursivelyToSubfolders",
	],
	features: [
		"quickStatusCommands",
		"enableExperimentalFeatures",
		"enableStatusDashboard",
		"enableGroupedStatusView",
		"vaultSizeLimit",
	],
};

class SettingsService {
	private plugin: Plugin;
	public settings: PluginSettings;
	private isWatcherRegistered = false;

	constructor() {}

	async initialize(plugin: Plugin): Promise<void> {
		this.plugin = plugin;
		const loadedData = await this.loadSettings();
		this.migrateLegacySettings(loadedData);

		if (this.settings.enableExternalStatusSync) {
			await this.loadFromExternalFile();
			this.setupExternalFileWatcher();
		}
	}

	setValue(key: keyof PluginSettings, value: unknown) {
		if (!(key in this.settings)) {
			throw new Error(`The "${key}" setting is not a known setting key`);
		}
		// const oldValue = this.settings[key]; // TODO: Send the old value
		this.settings[key] = value;
		this.saveSettings().catch(console.error);

		// Handle external sync
		if (this.settings.enableExternalStatusSync) {
			this.syncToExternalFile().catch(console.error);
		}

		if (key === "enableExternalStatusSync") {
			if (value) {
				this.syncToExternalFile().catch(console.error);
				this.setupExternalFileWatcher();
			}
		}

		// INFO: Send the propgation event
		eventBus.publish("plugin-settings-changed", {
			key,
			value,
			currentSettings: this.settings,
		});
	}

	private async loadSettings() {
		const loadedData = await this.plugin.loadData();
		this.settings = this.mergeSettings(DEFAULT_PLUGIN_SETTINGS, loadedData);
		this.deduplicateTemplates();
		return loadedData;
	}

	/**
	 * Migrates legacy settings and ensures new users have a starter template.
	 */
	private migrateLegacySettings(loadedData: Partial<PluginSettings> | null) {
		const hasTemplates =
			this.settings.templates && this.settings.templates.length > 0;

		// 1. If it's a truly new user (no data at all), give them the starter template
		if (!loadedData) {
			this.injectStarterTemplate();
			return;
		}

		// 2. If it's an existing user but has no templates, they were using the old defaults
		if (!hasTemplates) {
			const legacyIds = [
				"colorful",
				"minimal",
				"academic",
				"project",
				"creative-writing",
			];
			const enabledLegacy = (this.settings.enabledTemplates || []).filter(
				(id) => legacyIds.includes(id),
			);

			if (enabledLegacy.length > 0) {
				// Restore the ones they had enabled from the marketplace list
				const toRestore = PREDEFINED_TEMPLATES.filter((t) =>
					enabledLegacy.includes(t.id),
				).map((t) => ({
					...t,
					id: t.id, // Keep original ID for legacy compatibility
					statuses: t.statuses.map((s) => ({
						...s,
						templateId: t.id,
					})),
				}));

				this.settings.templates = toRestore;
				// Update enabled list
				this.settings.enabledTemplates = toRestore.map((t) => t.id);
				this.saveSettings().catch(console.error);
			} else {
				// If nothing was enabled, just give them the starter template
				this.injectStarterTemplate();
			}
		}
	}

	/**
	 * Injects the default starter template.
	 */
	private injectStarterTemplate() {
		const starterTemplate = {
			id: "starter",
			name: "Starter Template",
			description:
				"A simplified set of essential workflow statuses to get you started.",
			authorGithub: "soler1212",
			statuses: [
				{
					name: "todo",
					icon: "📌",
					color: "#F44336",
					templateId: "starter",
				},
				{
					name: "inProgress",
					icon: "⚙️",
					color: "#2196F3",
					templateId: "starter",
				},
				{
					name: "review",
					icon: "👀",
					color: "#9C27B0",
					templateId: "starter",
				},
				{
					name: "done",
					icon: "✓",
					color: "#4CAF50",
					templateId: "starter",
				},
			],
		};

		this.settings.templates = [starterTemplate];
		if (!this.settings.enabledTemplates.includes(starterTemplate.id)) {
			this.settings.enabledTemplates.push(starterTemplate.id);
		}
		this.saveSettings().catch(console.error);
	}

	/**
	 * Removes duplicate templates with the same name, keeping the first occurrence.
	 */
	private deduplicateTemplates() {
		if (!this.settings.templates) return;

		const seenNames = new Set<string>();
		const uniqueTemplates = [];
		let hasDuplicates = false;

		for (const template of this.settings.templates) {
			const lowerName = template.name.toLowerCase().trim();
			if (!seenNames.has(lowerName)) {
				seenNames.add(lowerName);
				uniqueTemplates.push(template);
			} else {
				hasDuplicates = true;
			}
		}

		if (hasDuplicates) {
			this.settings.templates = uniqueTemplates;
			this.saveSettings().catch(console.error);
		}
	}

	/**
	 * Deep merges loaded settings with defaults to prevent data loss for nested objects like statusColors.
	 */
	private mergeSettings(
		defaults: PluginSettings,
		loaded: Partial<PluginSettings> | null,
	): PluginSettings {
		if (!loaded) return { ...defaults };

		const result = { ...defaults, ...loaded };

		// Deep merge statusColors
		if (loaded.statusColors) {
			result.statusColors = {
				...defaults.statusColors,
				...loaded.statusColors,
			};
		}

		return result;
	}

	private async saveSettings() {
		await this.plugin.saveData(this.settings);
	}

	async syncToExternalFile(force = false) {
		if (!this.settings.enableExternalStatusSync && !force) return;

		const path = normalizePath(this.settings.externalStatusSyncPath);

		// Filter settings based on selected groups
		const keysToSync = new Set<keyof PluginSettings>();
		(this.settings.syncGroups || []).forEach((group) => {
			const groupKeys = SETTINGS_GROUPS[group];
			if (groupKeys) {
				groupKeys.forEach((key) => keysToSync.add(key));
			}
		});

		const filteredSettings: Partial<PluginSettings> = {};
		keysToSync.forEach((key) => {
			(filteredSettings as Record<string, unknown>)[key] =
				this.settings[key];
		});

		const data = {
			...filteredSettings,
			syncGroups: this.settings.syncGroups, // Always include meta-settings
			updatedAt: new Date().toISOString(),
		};

		try {
			await this.plugin.app.vault.adapter.write(
				path,
				JSON.stringify(data, null, 2),
			);
		} catch (error) {
			console.error("Failed to sync settings to external file:", error);
		}
	}

	async loadFromExternalFile(force = false) {
		if (!this.settings.enableExternalStatusSync && !force) return;
		const path = normalizePath(this.settings.externalStatusSyncPath);
		if (!(await this.plugin.app.vault.adapter.exists(path))) return;

		try {
			const content = await this.plugin.app.vault.adapter.read(path);
			const data = JSON.parse(content);

			// Determine which keys we should actually apply based on CURRENT settings
			const allowedKeys = new Set<keyof PluginSettings>();
			(this.settings.syncGroups || []).forEach((group) => {
				const groupKeys = SETTINGS_GROUPS[group];
				if (groupKeys) {
					groupKeys.forEach((key) => allowedKeys.add(key));
				}
			});

			let hasChanged = false;
			const keys = Object.keys(data).filter(
				(k) => k !== "updatedAt" && k !== "syncGroups",
			) as Array<keyof PluginSettings>;

			for (const key of keys) {
				if (!(key in this.settings) || !allowedKeys.has(key)) continue;

				const newValue = data[key];
				const currentValue = this.settings[key];

				// Basic deep equality check to avoid unnecessary updates
				if (JSON.stringify(newValue) !== JSON.stringify(currentValue)) {
					(this.settings as Record<string, unknown>)[key] = newValue;
					hasChanged = true;

					// Notify UI and other services
					eventBus.publish("plugin-settings-changed", {
						key: key as keyof PluginSettings,
						value: newValue,
						currentSettings: this.settings,
					});
				}
			}

			if (hasChanged) {
				await this.saveSettings();
			}
		} catch (error) {
			console.error("Failed to load settings from external file:", error);
		}
	}

	private setupExternalFileWatcher() {
		if (this.isWatcherRegistered) return;

		this.plugin.registerEvent(
			this.plugin.app.vault.on("modify", (file) => {
				if (!this.settings.enableExternalStatusSync) return;

				if (
					file instanceof TFile &&
					file.path ===
						normalizePath(this.settings.externalStatusSyncPath)
				) {
					this.loadFromExternalFile().catch(console.error);
				}
			}),
		);
		this.isWatcherRegistered = true;
	}
}

export default new SettingsService();
