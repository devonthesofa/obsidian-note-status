import { App, MarkdownView } from 'obsidian';
import { NoteStatusSettings } from '../../models/types';
import { StatusService } from '../../services/status-service';
import { StatusDropdown } from '../../components/status-dropdown';
import { ToolbarButton } from 'components/toolbar-button';

/**
 * Gestiona la integración con la barra de herramientas del editor
 */
export class ToolbarIntegration {
  private app: App;
  private settings: NoteStatusSettings;
  private statusService: StatusService;
  private statusDropdown: StatusDropdown;
  private buttonView: ToolbarButton;
  private buttonElement: HTMLElement | null = null;

  constructor(
    app: App, 
    settings: NoteStatusSettings, 
    statusService: StatusService,
  ) {
    this.app = app;
    this.settings = settings;
    this.statusService = statusService;
    this.statusDropdown = new StatusDropdown(this.app, this.settings, this.statusService);
    this.buttonView = new ToolbarButton(settings, statusService);
  }
  
  public updateSettings(settings: NoteStatusSettings): void {
    this.settings = settings;
    this.buttonView.updateSettings(settings);
    this.updateStatusDisplay([]);
  }

  public addToolbarButtonToActiveLeaf(): void {
    const activeLeaf = this.app.workspace.activeLeaf;
    if (!activeLeaf?.view || !(activeLeaf.view instanceof MarkdownView)) return;

    const toolbarContainer = activeLeaf.view.containerEl.querySelector('.view-header .view-actions');
    if (!toolbarContainer) return;

    // Always remove existing button first
    this.removeToolbarButton();
    
    // Create a new button
    this.buttonElement = this.buttonView.createElement();
    this.buttonElement.addEventListener('click', this.handleButtonClick.bind(this));
    
    if (toolbarContainer.firstChild) {
      toolbarContainer.insertBefore(this.buttonElement, toolbarContainer.firstChild);
    } else {
      toolbarContainer.appendChild(this.buttonElement);
    }
    
    this.updateButtonDisplay();
  }

  private removeToolbarButton(): void {
    const activeLeaf = this.app.workspace.activeLeaf;
    if (!activeLeaf?.view || !(activeLeaf.view instanceof MarkdownView)) return;

    const toolbarContainer = activeLeaf.view.containerEl.querySelector('.view-header .view-actions');
    if (!toolbarContainer) return;

    const existingButton = toolbarContainer.querySelector('.note-status-toolbar-button');
    if (existingButton) {
      existingButton.remove();
    }
    
    this.buttonElement = null;
  }

  private updateButtonDisplay(): void {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile || !this.buttonElement) return;
    
    const statuses = this.statusService.getFileStatuses(activeFile);
    this.buttonView.updateDisplay(statuses);
  }

  private handleButtonClick(e: MouseEvent): void {
    e.stopPropagation();
    e.preventDefault();
    
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) return;
    
    this.statusDropdown.openStatusDropdown({
      target: this.buttonElement || undefined,
      files: [activeFile]
    });
  }

  public updateStatusDisplay(statuses: string[]): void {
    this.removeToolbarButton();
    this.addToolbarButtonToActiveLeaf();
  }

  public unload(): void {
    this.buttonView.destroy();
    this.statusDropdown.unload();
    this.removeToolbarButton();
  }
}