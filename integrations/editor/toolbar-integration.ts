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
  private currentLeafId: string | null = null;

  constructor(
    app: App, 
    settings: NoteStatusSettings, 
    statusService: StatusService,
    statusDropdown: StatusDropdown
  ) {
    this.app = app;
    this.settings = settings;
    this.statusService = statusService;
    this.statusDropdown = statusDropdown;
    this.buttonView = new ToolbarButton(settings, statusService);
  }
  
  public updateSettings(settings: NoteStatusSettings): void {
    this.settings = settings;
    this.buttonView.updateSettings(settings);
    this.updateStatusDisplay([]);
  }

  public addToolbarButtonToActiveLeaf(statuses?: string[]): void {
    const activeLeaf = this.app.workspace.activeLeaf;
    if (!activeLeaf?.view || !(activeLeaf.view instanceof MarkdownView)) return;

    const leafId = (activeLeaf as any).id || activeLeaf.view.containerEl.id;
    
    // Only recreate button if we're on a different leaf or button doesn't exist
    if (this.currentLeafId !== leafId || !this.buttonElement || !this.isButtonInDOM()) {
      this.recreateButton(activeLeaf.view, leafId);
    }
    
    this.updateButtonDisplay(statuses);
  }

  private recreateButton(view: MarkdownView, leafId: string): void {
    const toolbarContainer = view.containerEl.querySelector('.view-header .view-actions');
    if (!toolbarContainer) return;

    // Remove old button if it exists
    this.removeToolbarButton();
    
    // Create new button
    this.buttonElement = this.buttonView.createElement();
    this.buttonElement.addEventListener('click', this.handleButtonClick.bind(this));
    
    if (toolbarContainer.firstChild) {
      toolbarContainer.insertBefore(this.buttonElement, toolbarContainer.firstChild);
    } else {
      toolbarContainer.appendChild(this.buttonElement);
    }
    
    this.currentLeafId = leafId;
  }

  private isButtonInDOM(): boolean {
    return this.buttonElement?.isConnected === true;
  }

  private removeToolbarButton(): void {
    if (this.buttonElement) {
      this.buttonElement.remove();
      this.buttonElement = null;
    }
    this.currentLeafId = null;
  }

  private updateButtonDisplay(overrideStatuses?: string[]): void {
    if (!this.buttonElement) return;
    
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) return;
    
    const statuses = overrideStatuses?.length ? overrideStatuses : this.statusService.getFileStatuses(activeFile);
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
    this.updateButtonDisplay(statuses);
  }

  public unload(): void {
    this.buttonView.destroy();
    this.removeToolbarButton();
  }
}
