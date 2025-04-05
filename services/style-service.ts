import { NoteStatusSettings } from '../models/types';

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
	 * Updates the dynamic styles based on current settings
	 */
	public updateDynamicStyles(): void {
		if (!this.dynamicStyleEl) {
			this.initializeDynamicStyles();
			return;
		}

		// Generate CSS for status colors
		let css = '';
		for (const [status, color] of Object.entries(this.settings.statusColors)) {
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
