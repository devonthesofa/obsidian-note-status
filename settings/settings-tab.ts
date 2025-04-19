import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import { Status } from '../models/types';
import { PREDEFINED_TEMPLATES } from '../constants/status-templates';
import NoteStatus from 'main';

/**
 * Settings tab for the Note Status plugin
 */
export class NoteStatusSettingTab extends PluginSettingTab {
	plugin: NoteStatus;

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
				
		// NEW SETTING: Hide unknown status in explorer
		new Setting(containerEl)
			.setName('Hide unknown status in file explorer')
			.setDesc('Hide status icons for files with unknown status in the file explorer')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.hideUnknownStatusInExplorer || false)
				.onChange(async (value) => {
					this.plugin.settings.hideUnknownStatusInExplorer = value;
					await this.plugin.saveSettings();
					
					// Refresh explorer icons when this setting changes
					this.plugin.explorerIntegration.updateAllFileExplorerIcons();
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

		containerEl.createEl('h3', { text: 'Status Tag Settings' });
		// Option to use multiple statuses
		new Setting(containerEl)
			.setName('Enable multiple statuses')
			.setDesc('Allow notes to have multiple statuses at the same time')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.useMultipleStatuses)
				.onChange(async (value) => {
					this.plugin.settings.useMultipleStatuses = value;
					await this.plugin.saveSettings();
					
					// Refresh UI to show multi-select or single-select options
					window.dispatchEvent(new CustomEvent('note-status:refresh-ui'));
				}));

		// Status tag prefix
		new Setting(containerEl)
			.setName('Status tag prefix')
			.setDesc('The YAML frontmatter tag name used for status (default: obsidian-note-status)')
			.addText(text => text
				.setValue(this.plugin.settings.tagPrefix)
				.onChange(async (value) => {
					// Don't allow empty tag prefix
					if (!value.trim()) {
						return;
					}
					
					this.plugin.settings.tagPrefix = value.trim();
					await this.plugin.saveSettings();
					
					// Add this line to trigger a full UI refresh
					window.dispatchEvent(new CustomEvent('note-status:refresh-ui'));
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
		
				// Name field - now properly implemented
				setting.addText(text => text
					.setPlaceholder('Name')
					.setValue(status.name)
					.onChange(async (value) => {
						const oldName = status.name;
						status.name = value || 'unnamed';
						
						// Update color mapping when name changes
						if (oldName !== status.name) {
							this.plugin.settings.statusColors[status.name] = 
								this.plugin.settings.statusColors[oldName];
							delete this.plugin.settings.statusColors[oldName];
						}
						
						await this.plugin.saveSettings();
					}));
		
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
					
				// Description field
				setting.addText(text => text
					.setPlaceholder('Description')
					.setValue(status.description || '')
					.onChange(async (value) => {
						status.description = value;
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
						(id: string) => id !== template.id
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