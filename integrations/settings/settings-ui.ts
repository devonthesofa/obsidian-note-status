import { Setting } from "obsidian";
import { NoteStatusSettings, Status } from "../../models/types";
import { PREDEFINED_TEMPLATES } from "../../constants/status-templates";
import { SettingsUICallbacks } from "./types";

/**
 * Pure UI component for rendering settings interface
 */
export class NoteStatusSettingsUI {
	private callbacks: SettingsUICallbacks;
	private quickCommandsContainer: HTMLElement | null = null;

	constructor(callbacks: SettingsUICallbacks) {
		this.callbacks = callbacks;
	}

	/**
	 * Renders the complete settings interface
	 */
	render(containerEl: HTMLElement, settings: NoteStatusSettings): void {
		containerEl.empty();

		this.renderTemplateSettings(containerEl, settings);
		this.renderUISettings(containerEl, settings);
		this.renderTagSettings(containerEl, settings);
		this.renderCustomStatusSettings(containerEl, settings);
		this.renderQuickCommandsSettings(containerEl, settings);
	}

	/**
	 * Renders the status templates section
	 */
	private renderTemplateSettings(
		containerEl: HTMLElement,
		settings: NoteStatusSettings,
	): void {
		new Setting(containerEl).setName("Status templates").setHeading();

		containerEl.createEl("p", {
			text: "Enable predefined templates to quickly add common status workflows",
			cls: "setting-item-description",
		});

		const templatesContainer = containerEl.createDiv({
			cls: "templates-container",
		});

		PREDEFINED_TEMPLATES.forEach((template) => {
			const templateEl = templatesContainer.createDiv({
				cls: "template-item",
			});
			const headerEl = templateEl.createDiv({ cls: "template-header" });

			const isEnabled = settings.enabledTemplates.includes(template.id);
			const checkbox = headerEl.createEl("input", {
				type: "checkbox",
				cls: "template-checkbox",
			});
			checkbox.checked = isEnabled;

			checkbox.addEventListener("change", () => {
				this.callbacks.onTemplateToggle(template.id, checkbox.checked);
				this.refreshQuickCommandsList(settings);
			});

			headerEl.createEl("span", {
				text: template.name,
				cls: "template-name",
			});

			templateEl.createEl("div", {
				text: template.description,
				cls: "template-description",
			});

			const statusesEl = templateEl.createDiv({
				cls: "template-statuses",
			});
			template.statuses.forEach((status) => {
				const statusEl = statusesEl.createEl("div", {
					cls: "template-status-chip",
				});
				const colorDot = statusEl.createEl("span", {
					cls: "status-color-dot",
				});
				colorDot.style.setProperty(
					"--dot-color",
					status.color || "#ffffff",
				);
				statusEl.createSpan({ text: `${status.icon} ${status.name}` });
			});
		});
	}

	/**
	 * Renders the UI display settings section
	 */
	private renderUISettings(
		containerEl: HTMLElement,
		settings: NoteStatusSettings,
	): void {
		new Setting(containerEl).setName("User interface").setHeading();

		new Setting(containerEl)
			.setName("Show status bar")
			.setDesc("Display the status bar")
			.addToggle((toggle) =>
				toggle
					.setValue(settings.showStatusBar)
					.onChange((value) =>
						this.callbacks.onSettingChange("showStatusBar", value),
					),
			);

		new Setting(containerEl)
			.setName("Auto-hide status bar")
			.setDesc("Hide the status bar when status is unknown")
			.addToggle((toggle) =>
				toggle
					.setValue(settings.autoHideStatusBar)
					.onChange((value) =>
						this.callbacks.onSettingChange(
							"autoHideStatusBar",
							value,
						),
					),
			);

		new Setting(containerEl)
			.setName("Show status icons in file explorer")
			.setDesc("Display status icons in the file explorer")
			.addToggle((toggle) =>
				toggle
					.setValue(settings.showStatusIconsInExplorer)
					.onChange((value) =>
						this.callbacks.onSettingChange(
							"showStatusIconsInExplorer",
							value,
						),
					),
			);

		new Setting(containerEl)
			.setName("Hide unknown status in file explorer")
			.setDesc(
				"Hide status icons for files with unknown status in the file explorer",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(settings.hideUnknownStatusInExplorer || false)
					.onChange((value) =>
						this.callbacks.onSettingChange(
							"hideUnknownStatusInExplorer",
							value,
						),
					),
			);

		new Setting(containerEl)
			.setName("Default to compact view")
			.setDesc("Start the status pane in compact view by default")
			.addToggle((toggle) =>
				toggle
					.setValue(settings.compactView || false)
					.onChange((value) =>
						this.callbacks.onSettingChange("compactView", value),
					),
			);

		new Setting(containerEl)
			.setName("Exclude unassigned notes from status pane")
			.setDesc(
				"Improves performance by excluding notes with no assigned status from the status pane. Recommended for large vaults.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(settings.excludeUnknownStatus || false)
					.onChange((value) =>
						this.callbacks.onSettingChange(
							"excludeUnknownStatus",
							value,
						),
					),
			);
	}

	/**
	 * Renders the status tag configuration section
	 */
	private renderTagSettings(
		containerEl: HTMLElement,
		settings: NoteStatusSettings,
	): void {
		new Setting(containerEl).setName("Status tag").setHeading();

		new Setting(containerEl)
			.setName("Enable multiple statuses")
			.setDesc("Allow notes to have multiple statuses at the same time")
			.addToggle((toggle) =>
				toggle
					.setValue(settings.useMultipleStatuses)
					.onChange((value) =>
						this.callbacks.onSettingChange(
							"useMultipleStatuses",
							value,
						),
					),
			);

		new Setting(containerEl)
			.setName("Status tag prefix")
			.setDesc(
				"The YAML frontmatter tag name used for status (default: obsidian-note-status)",
			)
			.addText((text) =>
				text.setValue(settings.tagPrefix).onChange((value) => {
					if (value.trim()) {
						this.callbacks.onSettingChange(
							"tagPrefix",
							value.trim(),
						);
					}
				}),
			);

		new Setting(containerEl)
			.setName("Strict status validation")
			.setDesc(
				"Only show statuses that are defined in templates or custom statuses. ⚠️ WARNING: When enabled, any unknown statuses will be automatically removed when modifying file statuses.",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(settings.strictStatuses || false)
					.onChange((value) =>
						this.callbacks.onSettingChange("strictStatuses", value),
					),
			);
	}

	/**
	 * Renders the quick commands configuration section
	 */
	private renderQuickCommandsSettings(
		containerEl: HTMLElement,
		settings: NoteStatusSettings,
	): void {
		new Setting(containerEl)
			.setName("Quick status commands")
			.setDesc(
				"Select which statuses should have dedicated commands in the command palette. These can be assigned hotkeys for quick access.",
			)
			.setHeading();

		this.quickCommandsContainer = containerEl.createDiv({
			cls: "quick-commands-container",
		});
		this.populateQuickCommandsList(settings);
	}

	/**
	 * Populate the quick commands list
	 */
	private populateQuickCommandsList(settings: NoteStatusSettings): void {
		if (!this.quickCommandsContainer) return;

		this.quickCommandsContainer.empty();
		// Get all available statuses from service
		const allStatuses = this.getAllAvailableStatuses(settings);
		const currentQuickCommands = settings.quickStatusCommands || [];

		allStatuses.forEach((status) => {
			if (!this.quickCommandsContainer) return;
			const setting = new Setting(this.quickCommandsContainer)
				.setName(`${status.icon} ${status.name}`)
				.addToggle((toggle) =>
					toggle
						.setValue(currentQuickCommands.includes(status.name))
						.onChange(async (value) => {
							const updatedCommands: string[] = value
								? [
										...currentQuickCommands.filter(
											(cmd: string) =>
												cmd !== status.name,
										),
										status.name,
									]
								: currentQuickCommands.filter(
										(cmd: string) => cmd !== status.name,
									);

							await this.callbacks.onSettingChange(
								"quickStatusCommands",
								updatedCommands,
							);
						}),
				);

			if (status.description) {
				setting.setDesc(status.description);
			}
		});

		if (allStatuses.length === 0) {
			this.quickCommandsContainer.createDiv({
				text: "No statuses available. Enable templates or add custom statuses first.",
				cls: "setting-item-description",
			});
		}
	}
	/**
	 * Refresh the quick commands list when statuses change
	 */
	private refreshQuickCommandsList(settings: NoteStatusSettings): void {
		// Add small delay to ensure settings are updated
		setTimeout(() => {
			this.populateQuickCommandsList(settings);
		}, 50);
	}

	/**
	 * Get all available statuses from templates and custom statuses
	 */
	private getAllAvailableStatuses(
		settings: NoteStatusSettings,
	): Array<{ name: string; icon: string; description?: string }> {
		const statuses: Array<{
			name: string;
			icon: string;
			description?: string;
		}> = [];

		// Add custom statuses
		statuses.push(...settings.customStatuses);

		// Add template statuses if not using custom only
		if (!settings.useCustomStatusesOnly) {
			for (const templateId of settings.enabledTemplates) {
				const template = PREDEFINED_TEMPLATES.find(
					(t) => t.id === templateId,
				);
				if (template) {
					for (const status of template.statuses) {
						if (!statuses.find((s) => s.name === status.name)) {
							statuses.push(status);
						}
					}
				}
			}
		}

		return statuses.filter((s) => s.name !== "unknown");
	}

	/**
	 * Renders the custom status management section
	 */
	private renderCustomStatusSettings(
		containerEl: HTMLElement,
		settings: NoteStatusSettings,
	): void {
		new Setting(containerEl).setName("Custom statuses").setHeading();

		new Setting(containerEl)
			.setName("Use only custom statuses")
			.setDesc(
				"Ignore template statuses and use only the custom statuses defined below",
			)
			.addToggle((toggle) =>
				toggle
					.setValue(settings.useCustomStatusesOnly || false)
					.onChange(async (value) => {
						await this.callbacks.onSettingChange(
							"useCustomStatusesOnly",
							value,
						);
						// Update quick commands list when custom-only mode changes
						this.refreshQuickCommandsList(settings);
					}),
			);

		const statusList = containerEl.createDiv({ cls: "custom-status-list" });
		this.renderCustomStatuses(statusList, settings);

		new Setting(containerEl)
			.setName("Add new status")
			.setDesc("Add a custom status with a name, icon, and color")
			.addButton((button) =>
				button
					.setButtonText("Add Status")
					.setCta()
					.onClick(async () => {
						await this.callbacks.onCustomStatusAdd();
						this.refreshQuickCommandsList(settings);
					}),
			);
	}

	/**
	 * Renders the list of custom statuses with edit controls
	 */
	renderCustomStatuses(
		statusList: HTMLElement,
		settings: NoteStatusSettings,
	): void {
		statusList.empty();

		settings.customStatuses.forEach((status: Status, index: number) => {
			const setting = new Setting(statusList)
				.setName(status.name)
				.setClass("status-item");

			setting.addText((text) =>
				text
					.setPlaceholder("Name")
					.setValue(status.name)
					.onChange(async (value) => {
						await this.callbacks.onCustomStatusChange(
							index,
							"name",
							value || "unnamed",
						);
						// Update quick commands list when status name changes
						this.refreshQuickCommandsList(settings);
					}),
			);

			setting.addText((text) =>
				text
					.setPlaceholder("Icon")
					.setValue(status.icon)
					.onChange(async (value) => {
						await this.callbacks.onCustomStatusChange(
							index,
							"icon",
							value || "❓",
						);
						this.refreshQuickCommandsList(settings);
					}),
			);

			setting.addColorPicker((colorPicker) =>
				colorPicker
					.setValue(settings.statusColors[status.name] || "#ffffff")
					.onChange((value) =>
						this.callbacks.onCustomStatusChange(
							index,
							"color",
							value,
						),
					),
			);

			setting.addText((text) =>
				text
					.setPlaceholder("Description")
					.setValue(status.description || "")
					.onChange(async (value) => {
						await this.callbacks.onCustomStatusChange(
							index,
							"description",
							value,
						);
						this.refreshQuickCommandsList(settings);
					}),
			);

			setting.addButton((button) =>
				button
					.setButtonText("Remove")
					.setClass("status-remove-button")
					.setWarning()
					.onClick(async () => {
						await this.callbacks.onCustomStatusRemove(index);
						this.refreshQuickCommandsList(settings);
					}),
			);
		});
	}
}
