export type NoteStatus = {
	name: string;
	icon: string;
	lucideIcon?: string;
	color?: string; // Optional color property
	description?: string; // Optional description property
	templateId?: string; // Optional template scope for namespacing
	[key: string]: unknown;
};

export type ScopedStatusName = {
	templateId?: string;
	name: string;
};

export type StatusIdentifier = string | ScopedStatusName;

export type GroupedStatuses = Record<string, NoteStatus[]>;
