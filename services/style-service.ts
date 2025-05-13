import { NoteStatusSettings } from '../models/types';
import { PREDEFINED_TEMPLATES } from '../constants/status-templates';

/**
 * Handles dynamic styling for the plugin
 */
export class StyleService {
  private dynamicStyleEl?: HTMLStyleElement;
  private settings: NoteStatusSettings;

  constructor(settings: NoteStatusSettings) {
    this.settings = settings;
    this.initializeDynamicStyles();
  }

  /**
   * Updates the settings reference
   */
  public updateSettings(settings: NoteStatusSettings): void {
    this.settings = settings;
    this.updateDynamicStyles();
  }

  /**
   * Creates the style element if it doesn't exist
   */
  private initializeDynamicStyles(): void {
    if (!this.dynamicStyleEl) {
      this.dynamicStyleEl = document.createElement('style');
      document.head.appendChild(this.dynamicStyleEl);
    }
    this.updateDynamicStyles();
  }

  /**
   * Get all status colors including those from enabled templates
   */
  private getAllStatusColors(): Record<string, string> {
    const colors = { ...this.settings.statusColors };

    if (this.settings.useCustomStatusesOnly) return colors;
    
    // Add colors from template statuses
    for (const templateId of this.settings.enabledTemplates) {
      const template = PREDEFINED_TEMPLATES.find(t => t.id === templateId);
      if (!template) continue;
      
      for (const status of template.statuses) {
        if (status.color && !colors[status.name]) {
          colors[status.name] = status.color;
        }
      }
    }

    return colors;
  }

  /**
   * Updates the dynamic styles based on current settings
   */
  public updateDynamicStyles(): void {
    if (!this.dynamicStyleEl) {
      this.initializeDynamicStyles();
      return;
    }

    const allColors = this.getAllStatusColors();
    const cssRules = this.generateColorCssRules(allColors);
    this.dynamicStyleEl.textContent = cssRules;
  }
  
  /**
   * Generate CSS rules for status colors
   */
  private generateColorCssRules(colors: Record<string, string>): string {
    let css = '';
    
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
  }

  /**
   * Cleans up styles when plugin is unloaded
   */
  public unload(): void {
    if (this.dynamicStyleEl) {
      this.dynamicStyleEl.remove();
      this.dynamicStyleEl = undefined;
    }
  }
}