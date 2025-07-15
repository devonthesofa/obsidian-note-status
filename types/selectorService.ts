export interface SelectorState {
	selectedFile: File | null;
	isSelectorOpened: boolean;
}

export type SelectorListener = (state: SelectorState) => void;
