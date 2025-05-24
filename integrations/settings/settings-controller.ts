import { App } from 'obsidian';
import { Status } from '../../models/types';
import NoteStatus from 'main';
import { StatusService } from 'services/status-service';
import { NoteStatusSettingsUI, SettingsUICallbacks } from './settings-ui';

/**
 * Controller for settings UI, handles business logic and plugin state updates
 */
export class NoteStatusSettingsController implements SettingsUICallbacks {
  private app: App;
  private plugin: NoteStatus;
  private statusService: StatusService;
  private ui: NoteStatusSettingsUI;

  constructor(app: App, plugin: NoteStatus, statusService: StatusService) {
    this.app = app;
    this.plugin = plugin;
    this.statusService = statusService;
    this.ui = new NoteStatusSettingsUI(this);
  }

  /**
   * Renders the settings interface
   */
  display(containerEl: HTMLElement): void {
    this.ui.render(containerEl, this.plugin.settings);
  }

  /**
   * Handles template enable/disable toggle
   */
  async onTemplateToggle(templateId: string, enabled: boolean): Promise<void> {
    if (enabled) {
      if (!this.plugin.settings.enabledTemplates.includes(templateId)) {
        this.plugin.settings.enabledTemplates.push(templateId);
      }
    } else {
      this.plugin.settings.enabledTemplates = this.plugin.settings.enabledTemplates.filter(
        (id: string) => id !== templateId
      );
    }
    
    await this.plugin.saveSettings();
  }

  /**
   * Handles general setting changes
   */
  async onSettingChange(key: string, value: any): Promise<void> {
    (this.plugin.settings as any)[key] = value;
    await this.plugin.saveSettings();
  }

  /**
   * Handles custom status field changes
   */
  async onCustomStatusChange(index: number, field: string, value: any): Promise<void> {
    const status = this.plugin.settings.customStatuses[index];
    if (!status) return;

    if (field === 'name') {
      const oldName = status.name;
      status.name = value;
      
      if (oldName !== status.name) {
        this.plugin.settings.statusColors[status.name] = 
          this.plugin.settings.statusColors[oldName];
        delete this.plugin.settings.statusColors[oldName];
      }
    } else if (field === 'color') {
      this.plugin.settings.statusColors[status.name] = value;
    } else {
      (status as any)[field] = value;
    }
    
    await this.plugin.saveSettings();
  }

  /**
   * Handles custom status removal
   */
  async onCustomStatusRemove(index: number): Promise<void> {
    const status = this.plugin.settings.customStatuses[index];
    if (!status) return;

    this.plugin.settings.customStatuses.splice(index, 1);
    delete this.plugin.settings.statusColors[status.name];
    
    await this.plugin.saveSettings();
    
    // Re-render the custom statuses section
    const statusList = document.querySelector('.custom-status-list') as HTMLElement;
    if (statusList) {
      this.ui.renderCustomStatuses(statusList, this.plugin.settings);
    }
  }

  /**
   * Handles adding new custom status
   */
  async onCustomStatusAdd(): Promise<void> {
    const newStatus: Status = {
      name: `status${this.plugin.settings.customStatuses.length + 1}`,
      icon: '⭐'
    };

    this.plugin.settings.customStatuses.push(newStatus);
    this.plugin.settings.statusColors[newStatus.name] = '#ffffff';

    await this.plugin.saveSettings();
    
    // Re-render the custom statuses section
    const statusList = document.querySelector('.custom-status-list') as HTMLElement;
    if (statusList) {
      this.ui.renderCustomStatuses(statusList, this.plugin.settings);
    }
  }
}
