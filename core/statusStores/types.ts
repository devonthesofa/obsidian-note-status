import { TFile } from "obsidian";

export type StatusMutation =
	| { hasChanged: false }
	| { hasChanged: true; nextStatuses: string[] };

export type StatusMutator = (current: string[]) => StatusMutation;

export interface StatusStore {
	canHandle(file: TFile): boolean;
	getStatuses(file: TFile, frontmatterTagName: string): string[];
	mutateStatuses(
		file: TFile,
		frontmatterTagName: string,
		mutator: StatusMutator,
		options: { storeAsArray: boolean },
	): Promise<boolean>;
}
