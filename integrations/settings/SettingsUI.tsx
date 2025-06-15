import React, { useCallback } from "react";
import { NoteStatusSettings, Status } from "../../models/types";
import { PREDEFINED_TEMPLATES } from "../../constants/status-templates";
import { SettingsUICallbacks } from "./types";

interface SettingsUIProps {
	settings: NoteStatusSettings;
	callbacks: SettingsUICallbacks;
}

interface TemplateSettingsProps {
	settings: NoteStatusSettings;
	callbacks: SettingsUICallbacks;
}

const TemplateSettings: React.FC<TemplateSettingsProps> = ({
	settings,
	callbacks,
}) => {
	const handleTemplateToggle = useCallback(
		(templateId: string, enabled: boolean) => {
			callbacks.onTemplateToggle(templateId, enabled);
		},
		[callbacks],
	);

	return (
		<div className="template-settings">
			<h3>Status templates</h3>
			<p className="setting-item-description">
				Enable predefined templates to quickly add common status
				workflows
			</p>

			<div className="templates-container">
				{PREDEFINED_TEMPLATES.map((template) => {
					const isEnabled = settings.enabledTemplates.includes(
						template.id,
					);

					return (
						<div key={template.id} className="template-item">
							<div className="template-header">
								<input
									type="checkbox"
									className="template-checkbox"
									checked={isEnabled}
									onChange={(e) =>
										handleTemplateToggle(
											template.id,
											e.target.checked,
										)
									}
								/>
								<span className="template-name">
									{template.name}
								</span>
							</div>
							<div className="template-description">
								{template.description}
							</div>
							<div className="template-statuses">
								{template.statuses.map((status, index) => (
									<div
										key={index}
										className="template-status-chip"
									>
										<span
											className="status-color-dot"
											style={
												{
													"--dot-color":
														status.color ||
														"#ffffff",
												} as React.CSSProperties
											}
										/>
										<span>
											{status.icon} {status.name}
										</span>
									</div>
								))}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

interface UISettingsProps {
	settings: NoteStatusSettings;
	callbacks: SettingsUICallbacks;
}

const UISettings: React.FC<UISettingsProps> = ({ settings, callbacks }) => {
	return (
		<div className="ui-settings">
			<h3>User interface</h3>

			<div className="setting-item">
				<div className="setting-item-info">
					<div className="setting-item-name">Show status bar</div>
					<div className="setting-item-description">
						Display the status bar
					</div>
				</div>
				<div className="setting-item-control">
					<input
						type="checkbox"
						checked={settings.showStatusBar}
						onChange={(e) =>
							callbacks.onSettingChange(
								"showStatusBar",
								e.target.checked,
							)
						}
					/>
				</div>
			</div>

			<div className="setting-item">
				<div className="setting-item-info">
					<div className="setting-item-name">
						Auto-hide status bar
					</div>
					<div className="setting-item-description">
						Hide the status bar when status is unknown
					</div>
				</div>
				<div className="setting-item-control">
					<input
						type="checkbox"
						checked={settings.autoHideStatusBar}
						onChange={(e) =>
							callbacks.onSettingChange(
								"autoHideStatusBar",
								e.target.checked,
							)
						}
					/>
				</div>
			</div>

			<div className="setting-item">
				<div className="setting-item-info">
					<div className="setting-item-name">
						Show status icons in file explorer
					</div>
					<div className="setting-item-description">
						Display status icons in the file explorer
					</div>
				</div>
				<div className="setting-item-control">
					<input
						type="checkbox"
						checked={settings.showStatusIconsInExplorer}
						onChange={(e) =>
							callbacks.onSettingChange(
								"showStatusIconsInExplorer",
								e.target.checked,
							)
						}
					/>
				</div>
			</div>

			<div className="setting-item">
				<div className="setting-item-info">
					<div className="setting-item-name">
						Hide unknown status in file explorer
					</div>
					<div className="setting-item-description">
						Hide status icons for files with unknown status in the
						file explorer
					</div>
				</div>
				<div className="setting-item-control">
					<input
						type="checkbox"
						checked={settings.hideUnknownStatusInExplorer || false}
						onChange={(e) =>
							callbacks.onSettingChange(
								"hideUnknownStatusInExplorer",
								e.target.checked,
							)
						}
					/>
				</div>
			</div>

			<div className="setting-item">
				<div className="setting-item-info">
					<div className="setting-item-name">
						Default to compact view
					</div>
					<div className="setting-item-description">
						Start the status pane in compact view by default
					</div>
				</div>
				<div className="setting-item-control">
					<input
						type="checkbox"
						checked={settings.compactView || false}
						onChange={(e) =>
							callbacks.onSettingChange(
								"compactView",
								e.target.checked,
							)
						}
					/>
				</div>
			</div>

			<div className="setting-item">
				<div className="setting-item-info">
					<div className="setting-item-name">
						Exclude unassigned notes from status pane
					</div>
					<div className="setting-item-description">
						Improves performance by excluding notes with no assigned
						status from the status pane. Recommended for large
						vaults.
					</div>
				</div>
				<div className="setting-item-control">
					<input
						type="checkbox"
						checked={settings.excludeUnknownStatus || false}
						onChange={(e) =>
							callbacks.onSettingChange(
								"excludeUnknownStatus",
								e.target.checked,
							)
						}
					/>
				</div>
			</div>
		</div>
	);
};

interface TagSettingsProps {
	settings: NoteStatusSettings;
	callbacks: SettingsUICallbacks;
}

const TagSettings: React.FC<TagSettingsProps> = ({ settings, callbacks }) => {
	return (
		<div className="tag-settings">
			<h3>Status tag</h3>

			<div className="setting-item">
				<div className="setting-item-info">
					<div className="setting-item-name">
						Enable multiple statuses
					</div>
					<div className="setting-item-description">
						Allow notes to have multiple statuses at the same time
					</div>
				</div>
				<div className="setting-item-control">
					<input
						type="checkbox"
						checked={settings.useMultipleStatuses}
						onChange={(e) =>
							callbacks.onSettingChange(
								"useMultipleStatuses",
								e.target.checked,
							)
						}
					/>
				</div>
			</div>

			<div className="setting-item">
				<div className="setting-item-info">
					<div className="setting-item-name">Status tag prefix</div>
					<div className="setting-item-description">
						The YAML frontmatter tag name used for status (default:
						obsidian-note-status)
					</div>
				</div>
				<div className="setting-item-control">
					<input
						type="text"
						value={settings.tagPrefix}
						onChange={(e) => {
							if (e.target.value.trim()) {
								callbacks.onSettingChange(
									"tagPrefix",
									e.target.value.trim(),
								);
							}
						}}
					/>
				</div>
			</div>

			<div className="setting-item">
				<div className="setting-item-info">
					<div className="setting-item-name">
						Strict status validation
					</div>
					<div className="setting-item-description">
						Only show statuses that are defined in templates or
						custom statuses. ⚠️ WARNING: When enabled, any unknown
						statuses will be automatically removed when modifying
						file statuses.
					</div>
				</div>
				<div className="setting-item-control">
					<input
						type="checkbox"
						checked={settings.strictStatuses || false}
						onChange={(e) =>
							callbacks.onSettingChange(
								"strictStatuses",
								e.target.checked,
							)
						}
					/>
				</div>
			</div>
		</div>
	);
};

interface CustomStatusItemProps {
	status: Status;
	index: number;
	settings: NoteStatusSettings;
	callbacks: SettingsUICallbacks;
}

const CustomStatusItem: React.FC<CustomStatusItemProps> = ({
	status,
	index,
	settings,
	callbacks,
}) => {
	return (
		<div className="custom-status-item setting-item">
			<div className="setting-item-info">
				<div className="setting-item-name">{status.name}</div>
			</div>
			<div className="setting-item-controls">
				<input
					type="text"
					placeholder="Name"
					value={status.name}
					onChange={(e) =>
						callbacks.onCustomStatusChange(
							index,
							"name",
							e.target.value || "unnamed",
						)
					}
				/>
				<input
					type="text"
					placeholder="Icon"
					value={status.icon}
					onChange={(e) =>
						callbacks.onCustomStatusChange(
							index,
							"icon",
							e.target.value || "❓",
						)
					}
				/>
				<input
					type="color"
					value={settings.statusColors[status.name] || "#ffffff"}
					onChange={(e) =>
						callbacks.onCustomStatusChange(
							index,
							"color",
							e.target.value,
						)
					}
				/>
				<input
					type="text"
					placeholder="Description"
					value={status.description || ""}
					onChange={(e) =>
						callbacks.onCustomStatusChange(
							index,
							"description",
							e.target.value,
						)
					}
				/>
				<button
					className="status-remove-button"
					onClick={() => callbacks.onCustomStatusRemove(index)}
				>
					Remove
				</button>
			</div>
		</div>
	);
};

interface CustomStatusSettingsProps {
	settings: NoteStatusSettings;
	callbacks: SettingsUICallbacks;
}

const CustomStatusSettings: React.FC<CustomStatusSettingsProps> = ({
	settings,
	callbacks,
}) => {
	return (
		<div className="custom-status-settings">
			<h3>Custom statuses</h3>

			<div className="setting-item">
				<div className="setting-item-info">
					<div className="setting-item-name">
						Use only custom statuses
					</div>
					<div className="setting-item-description">
						Ignore template statuses and use only the custom
						statuses defined below
					</div>
				</div>
				<div className="setting-item-control">
					<input
						type="checkbox"
						checked={settings.useCustomStatusesOnly || false}
						onChange={(e) =>
							callbacks.onSettingChange(
								"useCustomStatusesOnly",
								e.target.checked,
							)
						}
					/>
				</div>
			</div>

			<div className="custom-status-list">
				{settings.customStatuses.map((status, index) => (
					<CustomStatusItem
						key={index}
						status={status}
						index={index}
						settings={settings}
						callbacks={callbacks}
					/>
				))}
			</div>

			<div className="setting-item">
				<div className="setting-item-info">
					<div className="setting-item-name">Add new status</div>
					<div className="setting-item-description">
						Add a custom status with a name, icon, and color
					</div>
				</div>
				<div className="setting-item-control">
					<button
						className="mod-cta"
						onClick={() => callbacks.onCustomStatusAdd()}
					>
						Add Status
					</button>
				</div>
			</div>
		</div>
	);
};

interface QuickCommandsSettingsProps {
	settings: NoteStatusSettings;
	callbacks: SettingsUICallbacks;
}

const QuickCommandsSettings: React.FC<QuickCommandsSettingsProps> = ({
	settings,
	callbacks,
}) => {
	const getAllAvailableStatuses = useCallback((): Array<{
		name: string;
		icon: string;
		description?: string;
	}> => {
		const statuses: Array<{
			name: string;
			icon: string;
			description?: string;
		}> = [];

		statuses.push(...settings.customStatuses);

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
	}, [settings]);

	const allStatuses = getAllAvailableStatuses();
	const currentQuickCommands = settings.quickStatusCommands || [];

	const handleQuickCommandToggle = useCallback(
		(statusName: string, enabled: boolean) => {
			const updatedCommands = enabled
				? [
						...currentQuickCommands.filter(
							(cmd) => cmd !== statusName,
						),
						statusName,
					]
				: currentQuickCommands.filter((cmd) => cmd !== statusName);

			callbacks.onSettingChange("quickStatusCommands", updatedCommands);
		},
		[currentQuickCommands, callbacks],
	);

	return (
		<div className="quick-commands-settings">
			<h3>Quick status commands</h3>
			<div className="setting-item-description">
				Select which statuses should have dedicated commands in the
				command palette. These can be assigned hotkeys for quick access.
			</div>

			<div className="quick-commands-container">
				{allStatuses.length === 0 ? (
					<div className="setting-item-description">
						No statuses available. Enable templates or add custom
						statuses first.
					</div>
				) : (
					allStatuses.map((status) => (
						<div key={status.name} className="setting-item">
							<div className="setting-item-info">
								<div className="setting-item-name">
									{status.icon} {status.name}
								</div>
								{status.description && (
									<div className="setting-item-description">
										{status.description}
									</div>
								)}
							</div>
							<div className="setting-item-control">
								<input
									type="checkbox"
									checked={currentQuickCommands.includes(
										status.name,
									)}
									onChange={(e) =>
										handleQuickCommandToggle(
											status.name,
											e.target.checked,
										)
									}
								/>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
};

export const SettingsUI: React.FC<SettingsUIProps> = ({
	settings,
	callbacks,
}) => {
	return (
		<div className="note-status-settings">
			<TemplateSettings settings={settings} callbacks={callbacks} />
			<UISettings settings={settings} callbacks={callbacks} />
			<TagSettings settings={settings} callbacks={callbacks} />
			<CustomStatusSettings settings={settings} callbacks={callbacks} />
			<QuickCommandsSettings settings={settings} callbacks={callbacks} />
		</div>
	);
};

export class NoteStatusSettingsUIManager {
	private callbacks: SettingsUICallbacks;
	private container: HTMLElement | null = null;

	constructor(callbacks: SettingsUICallbacks) {
		this.callbacks = callbacks;
	}

	render(containerEl: HTMLElement, settings: NoteStatusSettings): void {
		this.container = containerEl;
		containerEl.empty();

		import("../../utils/react-utils").then(({ ReactUtils }) => {
			ReactUtils.render(
				React.createElement(SettingsUI, {
					settings,
					callbacks: this.callbacks,
				}),
				containerEl,
			);
		});
	}

	destroy(): void {
		if (this.container) {
			import("../../utils/react-utils").then(({ ReactUtils }) => {
				ReactUtils.unmount(this.container!);
			});
		}
	}
}

export default SettingsUI;
