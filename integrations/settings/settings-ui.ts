import { Setting } from 'obsidian';
import { Status } from '../../models/types';
import { PREDEFINED_TEMPLATES } from '../../constants/status-templates';

/**
 * Callbacks interface for settings UI interactions
 */
export interface SettingsUICallbacks {
  /** Handle template enable/disable toggle */
  onTemplateToggle: (templateId: string, enabled: boolean) => Promise<void>;
  /** Handle general setting changes */
  onSettingChange: (key: string, value: any) => Promise<void>;
  /** Handle custom status field changes */
  onCustomStatusChange: (index: number, field: string, value: any) => Promise<void>;
  /** Handle custom status removal */
  onCustomStatusRemove: (index: number) => Promise<void>;
  /** Handle adding new custom status */
  onCustomStatusAdd: () => Promise<void>;
}

/**
 * Pure UI component for rendering settings interface
 */
export class NoteStatusSettingsUI {
  private callbacks: SettingsUICallbacks;

  constructor(callbacks: SettingsUICallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Renders the complete settings interface
   */
  render(containerEl: HTMLElement, settings: any): void {
    containerEl.empty();

    this.renderTemplateSettings(containerEl, settings);
    this.renderUISettings(containerEl, settings);
    this.renderTagSettings(containerEl, settings);
    this.renderCustomStatusSettings(containerEl, settings);
  }

  /**
   * Renders the status templates section
   */
  private renderTemplateSettings(containerEl: HTMLElement, settings: any): void {
    new Setting(containerEl).setName('Status templates').setHeading();
    
    containerEl.createEl('p', { 
      text: 'Enable predefined templates to quickly add common status workflows',
      cls: 'setting-item-description'
    });
    
    const templatesContainer = containerEl.createDiv({ cls: 'templates-container' });
    
    PREDEFINED_TEMPLATES.forEach(template => {
      const templateEl = templatesContainer.createDiv({ cls: 'template-item' });
      const headerEl = templateEl.createDiv({ cls: 'template-header' });
      
      const isEnabled = settings.enabledTemplates.includes(template.id);
      const checkbox = headerEl.createEl('input', {
        type: 'checkbox',
        cls: 'template-checkbox'
      });
      checkbox.checked = isEnabled;
      
      checkbox.addEventListener('change', () => {
        this.callbacks.onTemplateToggle(template.id, checkbox.checked);
      });
      
      headerEl.createEl('span', { 
        text: template.name,
        cls: 'template-name'
      });
      
      templateEl.createEl('div', {
        text: template.description,
        cls: 'template-description'
      });
      
      const statusesEl = templateEl.createDiv({ cls: 'template-statuses' });
      template.statuses.forEach(status => {
        const statusEl = statusesEl.createEl('div', { cls: 'template-status-chip' });
        const colorDot = statusEl.createEl('span', { cls: 'status-color-dot' });
        colorDot.style.setProperty('--dot-color', status.color || '#ffffff');
        statusEl.createSpan({ text: `${status.icon} ${status.name}` });
      });
    });
  }

  /**
   * Renders the UI display settings section
   */
  private renderUISettings(containerEl: HTMLElement, settings: any): void {
    new Setting(containerEl).setName('User interface').setHeading();

    new Setting(containerEl)
      .setName('Show status bar')
      .setDesc('Display the status bar')
      .addToggle(toggle => toggle
        .setValue(settings.showStatusBar)
        .onChange(value => this.callbacks.onSettingChange('showStatusBar', value)));

    new Setting(containerEl)
      .setName('Auto-hide status bar')
      .setDesc('Hide the status bar when status is unknown')
      .addToggle(toggle => toggle
        .setValue(settings.autoHideStatusBar)
        .onChange(value => this.callbacks.onSettingChange('autoHideStatusBar', value)));

    new Setting(containerEl)
      .setName('Show status icons in file explorer')
      .setDesc('Display status icons in the file explorer')
      .addToggle(toggle => toggle
        .setValue(settings.showStatusIconsInExplorer)
        .onChange(value => this.callbacks.onSettingChange('showStatusIconsInExplorer', value)));

    new Setting(containerEl)
      .setName('Hide unknown status in file explorer')
      .setDesc('Hide status icons for files with unknown status in the file explorer')
      .addToggle(toggle => toggle
        .setValue(settings.hideUnknownStatusInExplorer || false)
        .onChange(value => this.callbacks.onSettingChange('hideUnknownStatusInExplorer', value)));

    new Setting(containerEl)
      .setName('Default to compact view')
      .setDesc('Start the status pane in compact view by default')
      .addToggle(toggle => toggle
        .setValue(settings.compactView || false)
        .onChange(value => this.callbacks.onSettingChange('compactView', value)));

    new Setting(containerEl)
      .setName('Exclude unassigned notes from status pane')
      .setDesc('Improves performance by excluding notes with no assigned status from the status pane. Recommended for large vaults.')
      .addToggle(toggle => toggle
        .setValue(settings.excludeUnknownStatus || false)
        .onChange(value => this.callbacks.onSettingChange('excludeUnknownStatus', value)));
  }

  /**
   * Renders the status tag configuration section
   */
  private renderTagSettings(containerEl: HTMLElement, settings: any): void {
    new Setting(containerEl).setName('Status tag').setHeading();

    new Setting(containerEl)
      .setName('Enable multiple statuses')
      .setDesc('Allow notes to have multiple statuses at the same time')
      .addToggle(toggle => toggle
        .setValue(settings.useMultipleStatuses)
        .onChange(value => this.callbacks.onSettingChange('useMultipleStatuses', value)));

    new Setting(containerEl)
      .setName('Status tag prefix')
      .setDesc('The YAML frontmatter tag name used for status (default: obsidian-note-status)')
      .addText(text => text
        .setValue(settings.tagPrefix)
        .onChange(value => {
          if (value.trim()) {
            this.callbacks.onSettingChange('tagPrefix', value.trim());
          }
        }));


    new Setting(containerEl)
      .setName('Strict status validation')
      .setDesc('Only show statuses that are defined in templates or custom statuses. ⚠️ WARNING: When enabled, any unknown statuses will be automatically removed when modifying file statuses.')
      .addToggle(toggle => toggle
        .setValue(settings.strictStatuses || false)
        .onChange(value => this.callbacks.onSettingChange('strictStatuses', value)));
  }

  /**
   * Renders the custom status management section
   */
  private renderCustomStatusSettings(containerEl: HTMLElement, settings: any): void {
    new Setting(containerEl).setName('Custom statuses').setHeading();
    
    new Setting(containerEl)
      .setName('Use only custom statuses')
      .setDesc('Ignore template statuses and use only the custom statuses defined below')
      .addToggle(toggle => toggle
        .setValue(settings.useCustomStatusesOnly || false)
        .onChange(value => this.callbacks.onSettingChange('useCustomStatusesOnly', value)));
    
    const statusList = containerEl.createDiv({ cls: 'custom-status-list' });
    this.renderCustomStatuses(statusList, settings);

    new Setting(containerEl)
      .setName('Add new status')
      .setDesc('Add a custom status with a name, icon, and color')
      .addButton(button => button
        .setButtonText('Add Status')
        .setCta()
        .onClick(() => this.callbacks.onCustomStatusAdd()));
  }

  /**
   * Renders the list of custom statuses with edit controls
   */
  renderCustomStatuses(statusList: HTMLElement, settings: any): void {
    statusList.empty();
    
    settings.customStatuses.forEach((status: Status, index: number) => {
      const setting = new Setting(statusList)
        .setName(status.name)
        .setClass('status-item');

      setting.addText(text => text
        .setPlaceholder('Name')
        .setValue(status.name)
        .onChange(value => this.callbacks.onCustomStatusChange(index, 'name', value || 'unnamed')));

      setting.addText(text => text
        .setPlaceholder('Icon')
        .setValue(status.icon)
        .onChange(value => this.callbacks.onCustomStatusChange(index, 'icon', value || '❓')));

      setting.addColorPicker(colorPicker => colorPicker
        .setValue(settings.statusColors[status.name] || '#ffffff')
        .onChange(value => this.callbacks.onCustomStatusChange(index, 'color', value)));
        
      setting.addText(text => text
        .setPlaceholder('Description')
        .setValue(status.description || '')
        .onChange(value => this.callbacks.onCustomStatusChange(index, 'description', value)));

      setting.addButton(button => button
        .setButtonText('Remove')
        .setClass('status-remove-button')
        .setWarning()
        .onClick(() => this.callbacks.onCustomStatusRemove(index)));
    });
  }
}
