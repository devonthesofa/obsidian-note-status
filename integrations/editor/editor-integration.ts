import { App, Editor, MarkdownView, Menu, TFile } from 'obsidian';
import { NoteStatusSettings } from '../../models/types';
import { StatusService } from 'services/status-service';
import { StatusDropdown } from 'components/status-dropdown';

export class EditorIntegration {
  private app: App;
  private settings: NoteStatusSettings;
  private statusService: StatusService;
  private statusDropdown: StatusDropdown;
  private editorMenuRef: any;

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

  public updateSettings(settings: NoteStatusSettings): void {
    this.settings = settings;
  }

  public registerEditorMenus(): void {
    this.editorMenuRef = (menu: Menu, editor: Editor, view: MarkdownView) => {
      if (view.file) {
        this.addStatusMenuItems(menu, editor, view);
      }
    };

    this.app.workspace.on('editor-menu', this.editorMenuRef);
  }

  private addStatusMenuItems(menu: Menu, editor: Editor, view: MarkdownView): void {
    menu.addItem(item => 
      item
        .setTitle('Change note status')
        .setIcon('tag')
        .onClick(() => {
          if (view.file) {
            this.statusDropdown.openStatusDropdown({
              files: [view.file],
              editor,
              view
            });
          }
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

  public insertStatusMetadata(editor: Editor): void {
    this.statusService.insertStatusMetadataInEditor(editor);
  }

  public unload(): void {
    if (this.editorMenuRef) {
      this.app.workspace.off('editor-menu', this.editorMenuRef);
    }
  }
}
