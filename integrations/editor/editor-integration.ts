import { App, Editor, MarkdownView, Menu } from 'obsidian';
import { NoteStatusSettings } from '../../models/types';
import { StatusService } from 'services/status-service';

/**
 * Gestiona la integración con el editor de Obsidian
 */
export class EditorIntegration {
  private app: App;
  private settings: NoteStatusSettings;
  private statusService: StatusService;

  constructor(app: App, settings: NoteStatusSettings, statusService: StatusService) {
    this.app = app;
    this.settings = settings;
    this.statusService = statusService;
  }

  /**
   * Actualiza la configuración
   */
  public updateSettings(settings: NoteStatusSettings): void {
    this.settings = settings;
  }

  /**
   * Registra los menús contextuales del editor
   */
  public registerEditorMenus(): void {
    this.app.workspace.on('editor-menu', (menu, editor, view) => {
      if (view instanceof MarkdownView) {
        this.addStatusMenuItems(menu, editor, view);
      }
    });
  }

  /**
   * Añade opciones de estado al menú del editor
   */
  private addStatusMenuItems(menu: Menu, editor: Editor, view: MarkdownView): void {
    menu.addItem(item => 
      item
        .setTitle('Change note status')
        .setIcon('tag')
        .onClick(() => {
          this.showStatusChangeUI(editor, view);
        })
    );
    
    menu.addItem(item => 
      item
        .setTitle('Insert status metadata')
        .setIcon('plus-circle')
        .onClick(() => {
          this.insertStatusMetadata(editor);
        })
    );
  }

  /**
   * Muestra la UI para cambiar estado
   */
  private showStatusChangeUI(editor: Editor, view: MarkdownView): void {
    const file = view.file;
    if (!file) return;
    
    // En la implementación real, esto mostraría un dropdown o modal
    console.log("Mostrar UI de cambio de estado");
  }

  /**
   * Inserta metadatos de estado en el editor
   */
  public insertStatusMetadata(editor: Editor): void {
    this.statusService.insertStatusMetadataInEditor(editor);
  }
}