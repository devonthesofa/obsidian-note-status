import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import { Status } from '../models/types';
import { PREDEFINED_TEMPLATES } from '../constants/status-templates';

/**
 * Settings tab for the Note Status plugin
 */
export class NoteStatusSettingTab extends PluginSettingTab {
	plugin: any;

	constructor(app: App, plugin: any) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// Header
		containerEl.createEl('h2', { text: 'Note Status Settings' });

		// Status Template section
		this.displayTemplateSettings(containerEl.createDiv());

		// UI section
		containerEl.createEl('h3', { text: 'UI Settings' });

		// Status dropdown settings
		new Setting(containerEl)
			.setName('Show status dropdown')
			.setDesc('Display status dropdown in notes')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showStatusDropdown)
				.onChange(async (value) => {
					this.plugin.settings.showStatusDropdown = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Dropdown position')
			.setDesc('Where to place the status dropdown')
			.addDropdown(dropdown => dropdown
				.addOption('top', 'Top')
				.addOption('bottom', 'Bottom')
				.setValue(this.plugin.settings.dropdownPosition)
				.onChange(async (value: 'top' | 'bottom') => {
					this.plugin.settings.dropdownPosition = value;
					await this.plugin.saveSettings();
				}));

		// Status bar settings
		new Setting(containerEl)
			.setName('Show status bar')
			.setDesc('Display the status bar')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showStatusBar)
				.onChange(async (value) => {
					this.plugin.settings.showStatusBar = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Status bar position')
			.setDesc('Align the status bar text')
			.addDropdown(dropdown => dropdown
				.addOption('left', 'Left')
				.addOption('right', 'Right')
				.setValue(this.plugin.settings.statusBarPosition)
				.onChange(async (value: 'left' | 'right') => {
					this.plugin.settings.statusBarPosition = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Auto-hide status bar')
			.setDesc('Hide the status bar when status is unknown')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoHideStatusBar)
				.onChange(async (value) => {
					this.plugin.settings.autoHideStatusBar = value;
					await this.plugin.saveSettings();
				}));

		// File explorer settings
		new Setting(containerEl)
			.setName('Show status icons in file explorer')
			.setDesc('Display status icons in the file explorer')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showStatusIconsInExplorer)
				.onChange(async (value) => {
					this.plugin.settings.showStatusIconsInExplorer = value;
					await this.plugin.saveSettings();
				}));

		// Compact view setting
		new Setting(containerEl)
			.setName('Default to compact view')
			.setDesc('Start the status pane in compact view by default')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.compactView || false)
				.onChange(async (value) => {
					this.plugin.settings.compactView = value;
					await this.plugin.saveSettings();
				}));

		// Status management section
		containerEl.createEl('h3', { text: 'Custom Statuses' });
		
		// Option to use only custom statuses
		new Setting(containerEl)
			.setName('Use only custom statuses')
			.setDesc('Ignore template statuses and use only the custom statuses defined below')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useCustomStatusesOnly || false)
				.onChange(async (value) => {
					this.plugin.settings.useCustomStatusesOnly = value;
					await this.plugin.saveSettings();
					
					// Refresh the UI to show/hide template statuses
					window.dispatchEvent(new CustomEvent('note-status:refresh-ui'));
					this.display();
				}));
		
		// Custom statuses list
		const statusList = containerEl.createDiv({ cls: 'custom-status-list' });

		const renderStatuses = () => {
			statusList.empty();

			this.plugin.settings.customStatuses.forEach((status: Status, index: number) => {
				const setting = new Setting(statusList)
					.setName(status.name)
					.setClass('status-item');

				// Name field
				setting.addText(text => {
					text.setPlaceholder('Status Name')
						.setValue(status.name)
						.onChange(async (value) => {
							// Store current selection state and cursor position
							const inputEl = text.inputEl;
							const hadFocus = document.activeElement === inputEl;
							const selectionStart = inputEl.selectionStart;
							const selectionEnd = inputEl.selectionEnd;

							if (value && !this.plugin.settings.customStatuses.some(
								(s: Status) => s.name === value && s !== status)
							) {
								const oldName = status.name;
								status.name = value;

								// Update color mapping
								if (this.plugin.settings.statusColors[oldName]) {
									this.plugin.settings.statusColors[value] = this.plugin.settings.statusColors[oldName];
									delete this.plugin.settings.statusColors[oldName];
								}

								await this.plugin.saveSettings();

								// Use a small timeout to allow the UI to update
								setTimeout(() => {
									// Re-render statuses but restore focus and selection
									renderStatuses();

									// If the element had focus before, find it again in the new DOM and focus it
									if (hadFocus) {
										// Find the new input element for this status
										const newStatusItems = document.querySelectorAll('.status-item');

										for (let i = 0; i < newStatusItems.length; i++) {
											const statusItem = newStatusItems[i];
											const nameText = statusItem.querySelector('.setting-item-name');

											if (nameText && nameText.textContent === value) {
												const newInputEl = statusItem.querySelector('input');
												if (newInputEl) {
													newInputEl.focus();
													// Restore cursor position
													if (selectionStart !== null && selectionEnd !== null) {
														newInputEl.setSelectionRange(selectionStart, selectionEnd);
													}
													break;
												}
											}
										}
									}
								}, 10);
							}
						});
					return text;
				});

				// Icon field
				setting.addText(text => text
					.setPlaceholder('Icon')
					.setValue(status.icon)
					.onChange(async (value) => {
						status.icon = value || '❓';
						await this.plugin.saveSettings();
					}));

				// Color picker
				setting.addColorPicker(colorPicker => colorPicker
					.setValue(this.plugin.settings.statusColors[status.name] || '#ffffff')
					.onChange(async (value) => {
						this.plugin.settings.statusColors[status.name] = value;
						await this.plugin.saveSettings();
					}));

				// Remove button
				setting.addButton(button => button
					.setButtonText('Remove')
					.setClass('status-remove-button')
					.setWarning()
					.onClick(async () => {
						this.plugin.settings.customStatuses.splice(index, 1);
						delete this.plugin.settings.statusColors[status.name];
						await this.plugin.saveSettings();
						renderStatuses();
					}));
			});
		};

		renderStatuses();

		// Add new status
		new Setting(containerEl)
			.setName('Add new status')
			.setDesc('Add a custom status with a name, icon, and color')
			.addButton(button => button
				.setButtonText('Add Status')
				.setCta()
				.onClick(async () => {
					const newStatus = {
						name: `status${this.plugin.settings.customStatuses.length + 1}`,
						icon: '⭐'
					};

					this.plugin.settings.customStatuses.push(newStatus);
					this.plugin.settings.statusColors[newStatus.name] = '#ffffff'; // Initial white color

					await this.plugin.saveSettings();
					renderStatuses();
				}));

		// Reset colors
		new Setting(containerEl)
			.setName('Reset default status colors')
			.setDesc('Restore the default colors for predefined statuses')
			.addButton(button => button
				.setButtonText('Reset Colors')
				.setWarning()
				.onClick(async () => {
					await this.plugin.resetDefaultColors();
					renderStatuses();
					new Notice('Default status colors restored');
				}));
	}
	
	/**
	 * Display template settings section
	 */
	private displayTemplateSettings(containerEl: HTMLElement): void {
		containerEl.createEl('h3', { text: 'Status Templates' });
		containerEl.createEl('p', { 
			text: 'Enable predefined templates to quickly add common status workflows',
			cls: 'setting-item-description'
		});
		
		// Create templates container
		const templatesContainer = containerEl.createDiv({ cls: 'templates-container' });
		
		// List each template with checkbox and preview
		PREDEFINED_TEMPLATES.forEach(template => {
			const templateEl = templatesContainer.createDiv({ cls: 'template-item' });
			
			// Template header with checkbox and name
			const headerEl = templateEl.createDiv({ cls: 'template-header' });
			
			// Checkbox for enabling/disabling template
			const isEnabled = this.plugin.settings.enabledTemplates.includes(template.id);
			const checkbox = headerEl.createEl('input', {
				type: 'checkbox',
				cls: 'template-checkbox'
			});
			checkbox.checked = isEnabled;
			
			checkbox.addEventListener('change', async () => {
				if (checkbox.checked) {
					// Enable template
					if (!this.plugin.settings.enabledTemplates.includes(template.id)) {
						this.plugin.settings.enabledTemplates.push(template.id);
					}
				} else {
					// Disable template
					this.plugin.settings.enabledTemplates = this.plugin.settings.enabledTemplates.filter(
						id => id !== template.id
					);
				}
				
				await this.plugin.saveSettings();
				
				// Refresh UI
				window.dispatchEvent(new CustomEvent('note-status:refresh-ui'));
			});
			
			// Template name
			headerEl.createEl('span', { 
				text: template.name,
				cls: 'template-name'
			});
			
			// Template description
			templateEl.createEl('div', {
				text: template.description,
				cls: 'template-description'
			});
			
			// Preview statuses
			const statusesEl = templateEl.createDiv({ cls: 'template-statuses' });
			
			template.statuses.forEach(status => {
				const statusEl = statusesEl.createEl('div', { cls: 'template-status-chip' });
				
				// Create colored dot for the status
				const colorDot = statusEl.createEl('span', { cls: 'status-color-dot' });
				colorDot.style.display = 'inline-block';
				colorDot.style.width = '8px';
				colorDot.style.height = '8px';
				colorDot.style.borderRadius = '50%';
				colorDot.style.backgroundColor = status.color || '#ffffff';
				colorDot.style.marginRight = '4px';
				
				// Status icon and name
				statusEl.createSpan({ text: `${status.icon} ${status.name}` });
			});
		});
		
		// Import/Export buttons for templates
		const buttonsContainer = containerEl.createDiv({ cls: 'template-buttons' });
		buttonsContainer.style.marginTop = '15px';
		buttonsContainer.style.display = 'flex';
		buttonsContainer.style.gap = '10px';
		
		// Import button
		const importButton = buttonsContainer.createEl('button', {
			text: 'Import Template',
			cls: 'mod-cta'
		});
		
		importButton.addEventListener('click', () => {
			// Show notification about upcoming feature
			new Notice('Template import functionality coming soon!');
		});
		
		// Export button
		const exportButton = buttonsContainer.createEl('button', {
			text: 'Export Templates',
			cls: ''
		});
		
		exportButton.addEventListener('click', () => {
			// Show notification about upcoming feature
			new Notice('Template export functionality coming soon!');
		});
	}
}