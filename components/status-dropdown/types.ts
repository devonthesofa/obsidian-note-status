// # Tipos comunes
import { NoteStatusSettings } from 'models/types';
import { App, TFile, Editor, MarkdownView } from 'obsidian';
import { StatusService } from 'services/status-service';

/**
 * Options for opening status dropdown
 */
export interface DropdownOptions {
  target?: HTMLElement;
  position?: { x: number, y: number };
  files?: TFile[];
  editor?: Editor;
  view?: MarkdownView;
  mode?: 'replace' | 'add' | 'remove' | 'toggle';
  onStatusChange?: (statuses: string[]) => void;
}

/**
 * Status removal handler function type
 */
export type StatusRemoveHandler = (status: string, targetFile?: TFile | TFile[]) => Promise<void>;

/**
 * Status selection handler function type
 */
export type StatusSelectHandler = (status: string, targetFile: TFile | TFile[]) => Promise<void>;

/**
 * Common dependencies for dropdown components
 */
export interface DropdownDependencies {
  app: App;
  settings: NoteStatusSettings;
  statusService: StatusService;
}
