import { App, TFile } from 'obsidian';
import { NoteStatusSettings } from '../../models/types';
import { ExplorerIntegration } from '../explorer/explorer-integration';
import { StatusService } from 'services/status-service';

export class MetadataIntegration {
  private app: App;
  private settings: NoteStatusSettings;
  private statusService: StatusService;
  private explorerIntegration: ExplorerIntegration;
  private metadataChangedRef: any;
  private metadataResolvedRef: any;

  constructor(
    app: App, 
    settings: NoteStatusSettings, 
    statusService: StatusService,
    explorerIntegration: ExplorerIntegration
  ) {
    this.app = app;
    this.settings = settings;
    this.statusService = statusService;
    this.explorerIntegration = explorerIntegration;
  }

  public updateSettings(settings: NoteStatusSettings): void {
    this.settings = settings;
  }

  public registerMetadataEvents(): void {
    this.metadataChangedRef = (file: TFile) => {
      if (file instanceof TFile && file.extension === 'md') {
        this.handleMetadataChanged(file);
      }
    };

    this.metadataResolvedRef = () => {
      setTimeout(() => {
        if (this.settings.showStatusIconsInExplorer) {
          this.explorerIntegration.updateAllFileExplorerIcons();
        }
      }, 500);
    };

    this.app.metadataCache.on('changed', this.metadataChangedRef);
    this.app.metadataCache.on('resolved', this.metadataResolvedRef);
  }

  private handleMetadataChanged(file: TFile): void {
    if (this.settings.showStatusIconsInExplorer) {
      this.explorerIntegration.updateFileExplorerIcons(file);
    }
    
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile?.path === file.path) {
      const statuses = this.statusService.getFileStatuses(file);
      window.dispatchEvent(new CustomEvent('note-status:status-changed', { 
        detail: { statuses, file: file.path } 
      }));
    }
  }

  public unload(): void {
    if (this.metadataChangedRef) {
      this.app.metadataCache.off('changed', this.metadataChangedRef);
    }
    if (this.metadataResolvedRef) {
      this.app.metadataCache.off('resolved', this.metadataResolvedRef);
    }
  }
}
