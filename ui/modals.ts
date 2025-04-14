import { App, Modal, TFile, Notice } from 'obsidian';
import { NoteStatusSettings } from '../models/types';
import { StatusService } from '../services/status-service';

/**
 * Modal for batch updating statuses
 */
export class BatchStatusModal extends Modal {
    settings: NoteStatusSettings;
    statusService: StatusService;
    app: App;

    constructor(app: App, settings: NoteStatusSettings, statusService: StatusService) {
        super(app);
        this.app = app;
        this.settings = settings;
        this.statusService = statusService;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.createEl('h2', { text: 'Batch Update Note Status' });
        contentEl.addClass('note-status-batch-modal');

        // Create file selection with search filter
        const searchContainer = contentEl.createDiv({ cls: 'note-status-modal-search' });
        const searchInput = searchContainer.createEl('input', {
            type: 'text',
            placeholder: 'Filter files...',
            cls: 'note-status-modal-search-input'
        });

        // File selection container
        const fileSelectContainer = contentEl.createDiv({ cls: 'note-status-file-select-container' });
        const fileSelect = fileSelectContainer.createEl('select', {
            cls: 'note-status-file-select',
            attr: { multiple: 'true', size: '10' }
        });

        // Get all markdown files and populate select
        const mdFiles = this.app.vault.getMarkdownFiles();
        const populateFiles = (filter = '') => {
            fileSelect.empty();
            mdFiles
                .filter(file => !filter || file.path.toLowerCase().includes(filter.toLowerCase()))
                .sort((a, b) => a.path.localeCompare(b.path))
                .forEach(file => {
                    const statuses = this.statusService.getFileStatuses(file);
                    const statusIcons = statuses.map(s => this.statusService.getStatusIcon(s)).join(' ');
                    
                    const option = fileSelect.createEl('option', {
                        text: `${file.path} ${statusIcons}`,
                        value: file.path
                    });
                    
                    // Use first status for class styling
                    if (statuses.length > 0) {
                        option.classList.add(`status-${statuses[0]}`);
                    }
                });
        };

        populateFiles();

        // Add search functionality
        searchInput.addEventListener('input', () => {
            populateFiles(searchInput.value);
        });

        // Status selection section
        const statusSelectContainer = contentEl.createDiv({ cls: 'note-status-status-select-container' });
        
        // Create status selection based on whether multiple statuses are allowed
        if (this.settings.useMultipleStatuses) {
            // Add mode selection radio buttons
            const modeContainer = contentEl.createDiv({ cls: 'note-status-mode-container' });
            
            // Create radio buttons for replace/add mode
            const replaceRadio = modeContainer.createEl('input', {
                type: 'radio',
                attr: { 
                    name: 'status-update-mode',
                    id: 'mode-replace',
                    checked: 'checked'
                }
            });
            
            modeContainer.createEl('label', {
                text: 'Replace existing statuses',
                attr: { for: 'mode-replace' }
            });
            
            modeContainer.createEl('br');
            
             modeContainer.createEl('input', {
                type: 'radio',
                attr: { 
                    name: 'status-update-mode',
                    id: 'mode-add'
                }
            });
            
            modeContainer.createEl('label', {
                text: 'Add to existing statuses',
                attr: { for: 'mode-add' }
            });
            
            // Create multi-select status dropdown
            const statusSelect = statusSelectContainer.createEl('select', { 
                cls: 'note-status-status-select',
                attr: { 
                    multiple: 'true',
                    size: '5'
                }
            });

            // Get all available statuses
            const allStatuses = this.statusService.getAllStatuses();

            // Add status options (excluding 'unknown')
            allStatuses
                .filter(status => status.name !== 'unknown')
                .forEach(status => {
                    const option = statusSelect.createEl('option', {
                        text: `${status.name} ${status.icon}`,
                        value: status.name
                    });
                    option.classList.add(`status-${status.name}`);
                });
                
            // Add action buttons
            const buttonContainer = contentEl.createDiv({ cls: 'note-status-modal-buttons' });

            // Select all files button
            const selectAllButton = buttonContainer.createEl('button', {
                text: 'Select All Files',
                cls: 'note-status-select-all'
            });

            selectAllButton.addEventListener('click', () => {
                for (const option of Array.from(fileSelect.options)) {
                    option.selected = true;
                }
            });

            // Apply button
            const applyButton = buttonContainer.createEl('button', {
                text: 'Apply Statuses',
                cls: 'mod-cta'
            });

            applyButton.addEventListener('click', async () => {
                const selectedFiles = Array.from(fileSelect.selectedOptions)
                    .map(opt => mdFiles.find(f => f.path === opt.value))
                    .filter(Boolean) as TFile[];

                if (selectedFiles.length === 0) {
                    new Notice('No files selected');
                    return;
                }

                const selectedStatuses = Array.from(statusSelect.selectedOptions)
                    .map(opt => opt.value);
                    
                if (selectedStatuses.length === 0) {
                    new Notice('No statuses selected');
                    return;
                }

                // Get update mode
                const mode = replaceRadio.checked ? 'replace' : 'add';
                
                await this.statusService.batchUpdateStatuses(selectedFiles, selectedStatuses, mode);
                this.close();
            });
        } else {
            // Legacy single-status dropdown
            const statusSelect = statusSelectContainer.createEl('select', { cls: 'note-status-status-select' });

            // Get all available statuses
            const allStatuses = this.statusService.getAllStatuses();

            // Add status options (excluding 'unknown')
            allStatuses
                .filter(status => status.name !== 'unknown')
                .forEach(status => {
                    const option = statusSelect.createEl('option', {
                        text: `${status.name} ${status.icon}`,
                        value: status.name
                    });
                    option.classList.add(`status-${status.name}`);
                });

            // Add action buttons
            const buttonContainer = contentEl.createDiv({ cls: 'note-status-modal-buttons' });

            // Select all button
            const selectAllButton = buttonContainer.createEl('button', {
                text: 'Select All',
                cls: 'note-status-select-all'
            });

            selectAllButton.addEventListener('click', () => {
                for (const option of Array.from(fileSelect.options)) {
                    option.selected = true;
                }
            });

            // Apply button
            const applyButton = buttonContainer.createEl('button', {
                text: 'Apply Status',
                cls: 'mod-cta'
            });

            applyButton.addEventListener('click', async () => {
                const selectedFiles = Array.from(fileSelect.selectedOptions)
                    .map(opt => mdFiles.find(f => f.path === opt.value))
                    .filter(Boolean) as TFile[];

                if (selectedFiles.length === 0) {
                    new Notice('No files selected');
                    return;
                }

                const newStatus = statusSelect.value;
                await this.statusService.batchUpdateStatus(selectedFiles, newStatus);
                this.close();
            });
        }
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}