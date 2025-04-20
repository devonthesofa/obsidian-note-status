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

		// Add colors from template statuses if not using custom statuses only
		if (!this.settings.useCustomStatusesOnly) {
			for (const templateId of this.settings.enabledTemplates) {
				const template = PREDEFINED_TEMPLATES.find(t => t.id === templateId);
				if (template) {
					// Add template colors if they don't already exist in colors
					for (const status of template.statuses) {
						if (status.color && !colors[status.name]) {
							colors[status.name] = status.color;
						}
					}
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

		// Get all status colors
		const allColors = this.getAllStatusColors();

		// Generate CSS for status colors
		let css = '';
		for (const [status, color] of Object.entries(allColors)) {
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

		// Add modern styling for the batch modal
		css += `
            .note-status-batch-modal {
                max-width: 500px;
            }
          
            .note-status-modal-search {
                margin-bottom: 10px;
            }
          
            .note-status-modal-search-input {
                width: 100%;
                padding: var(--input-padding);
                border-radius: var(--input-radius);
            }
          
            .note-status-file-select,
            .note-status-status-select {
                width: 100%;
                margin-bottom: 10px;
                border-radius: var(--input-radius);
            }
          
            .note-status-modal-buttons {
                display: flex;
                justify-content: space-between;
                margin-top: 15px;
            }
            
            /* Template selection styling */
            .template-item {
                border: 1px solid var(--background-modifier-border);
                border-radius: var(--status-border-radius);
                margin-bottom: 10px;
                padding: 10px;
                background: var(--background-primary-alt);
            }
            
            .template-header {
                display: flex;
                align-items: center;
                margin-bottom: 5px;
            }
            
            .template-checkbox {
                margin-right: 10px;
            }
            
            .template-name {
                font-weight: bold;
            }
            
            .template-description {
                font-size: 0.9em;
                color: var(--text-muted);
                margin-bottom: 8px;
            }
            
            .template-statuses {
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
            }
            
            .template-status-chip {
                display: inline-flex;
                align-items: center;
                padding: 2px 8px;
                border-radius: 12px;
                background: var(--background-secondary);
                font-size: 0.85em;
            }
        `;

		this.dynamicStyleEl.textContent = css;
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