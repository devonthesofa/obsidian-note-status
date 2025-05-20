import { App, MarkdownView } from 'obsidian';
import { NoteStatusSettings } from '../../models/types';
import { StatusService } from 'services/status-service';
import { StatusDropdown } from 'components/status-dropdown';

/**
 * Gestiona la integración con la barra de herramientas del editor
 */
export class ToolbarIntegration {
  private app: App;
  private settings: NoteStatusSettings;
  private statusService: StatusService;
  private statusDropdown: StatusDropdown;
  private toolbarButton: HTMLElement | null = null;

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
  }
  /**
   * Actualiza la configuración
   */
  public updateSettings(settings: NoteStatusSettings): void {
    this.settings = settings;
    this.updateToolbarButton();
  }

  /**
   * Añade el botón de estado a la barra de herramientas
   */
  public addToolbarButtonToActiveLeaf(): void {
    const activeLeaf = this.app.workspace.activeLeaf;
    if (!activeLeaf?.view || !(activeLeaf.view instanceof MarkdownView)) return;

    const toolbarContainer = activeLeaf.view.containerEl.querySelector('.view-header .view-actions');
    if (!toolbarContainer) return;

    const existingButton = toolbarContainer.querySelector('.note-status-toolbar-button');
    if (existingButton) {
      this.toolbarButton = existingButton as HTMLElement;
      this.updateToolbarButton();
      return;
    }

    this.toolbarButton = this.createToolbarButton();

    if (toolbarContainer.firstChild) {
      toolbarContainer.insertBefore(this.toolbarButton, toolbarContainer.firstChild);
    } else {
      toolbarContainer.appendChild(this.toolbarButton);
    }
  }

  /**
   * Crea el botón de la barra de herramientas
   */
  private createToolbarButton(): HTMLElement {
    const button = document.createElement('button');
    button.addClass('note-status-toolbar-button', 'clickable-icon', 'view-action');
    button.setAttribute('aria-label', 'Note status');
    
    this.updateToolbarButton();
    
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      this.handleToolbarButtonClick();
    });
    
    return button;
  }

  /**
   * Actualiza la apariencia del botón
   */
  private updateToolbarButton(): void {
    if (!this.toolbarButton) return;

    this.toolbarButton.empty();
    
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) return;
    
    const statuses = this.statusService.getFileStatuses(activeFile);
    const hasValidStatus = statuses.length > 0 && statuses[0] !== 'unknown';

    const badgeContainer = document.createElement('div');
    badgeContainer.addClass('note-status-toolbar-badge-container');

    if (hasValidStatus) {
      this.addStatusBadge(badgeContainer, statuses);
    } else {
      this.addUnknownStatusBadge(badgeContainer);
    }

    this.toolbarButton.appendChild(badgeContainer);
  }

  /**
   * Añade insignia de estado al botón
   */
  private addStatusBadge(container: HTMLElement, statuses: string[]): void {
    const primaryStatus = statuses[0];
    const icon = this.statusService.getStatusIcon(primaryStatus);
    
    const iconSpan = document.createElement('span');
    iconSpan.addClass(`note-status-toolbar-icon`, `status-${primaryStatus}`);
    iconSpan.textContent = icon;
    container.appendChild(iconSpan);

    if (this.settings.useMultipleStatuses && statuses.length > 1) {
      const countBadge = document.createElement('span');
      countBadge.addClass('note-status-count-badge');
      countBadge.textContent = `+${statuses.length - 1}`;
      container.appendChild(countBadge);
    }
  }

  /**
   * Añade insignia de estado desconocido
   */
  private addUnknownStatusBadge(container: HTMLElement): void {
    const iconSpan = document.createElement('span');
    iconSpan.addClass('note-status-toolbar-icon', 'status-unknown');
    iconSpan.textContent = this.statusService.getStatusIcon('unknown');
    container.appendChild(iconSpan);
  }

  /**
   * Maneja clic en el botón de la barra de herramientas
   */
  private handleToolbarButtonClick(): void {
    const activeFile = this.app.workspace.getActiveFile();
    if (!activeFile) return;
    
    // En la implementación real, esto mostraría un dropdown de estados
    console.log("Mostrar dropdown de estados");
  }

  /**
   * Actualiza el botón con nuevos estados
   */
  public updateStatusDisplay(statuses: string[]): void {
    // Actualiza el botón con los nuevos estados
    if (this.toolbarButton) {
      this.updateToolbarButton();
    }
  }

  /**
   * Limpieza al descargar el plugin
   */
  public unload(): void {
    if (this.toolbarButton) {
      this.toolbarButton.remove();
      this.toolbarButton = null;
    }
  }
}