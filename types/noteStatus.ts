export type NoteStatus = {
	name: string;
	icon: string;
	color?: string; // Optional color property
	description?: string; // Optional description property
	[key: string]: unknown;
};

export type GroupedStatuses = Record<string, NoteStatus[]>;
