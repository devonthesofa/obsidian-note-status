import { VaultStatsCard } from "./VaultStatsCard";
import { CurrentNoteSection } from "./CurrentNoteSection";
import { StatusDistributionChart } from "./StatusDistributionChart";
import { QuickActionsPanel, DashboardAction } from "./QuickActionsPanel";
import { VaultStats } from "./useVaultStats";
import { PluginSettings } from "@/types/pluginSettings";
import { TFile } from "obsidian";
import { NoteStatus } from "@/types/noteStatus";

interface CurrentNoteInfo {
	file: TFile | null;
	statuses: Record<string, NoteStatus[]>;
	lastModified: number;
}

interface StatusDashboardProps {
	onAction: (action: DashboardAction, value?: string) => void;
	settings: PluginSettings;
	vaultStats: VaultStats;
	currentNote: CurrentNoteInfo;
	isLoading: boolean;
	availableStatuses: NoteStatus[];
}

export const StatusDashboard = ({
	onAction,
	settings,
	vaultStats,
	currentNote,
	isLoading,
	availableStatuses,
}: StatusDashboardProps) => {
	if (isLoading) {
		return (
			<div className="status-dashboard">
				<div className="status-dashboard-loading">
					Loading dashboard...
				</div>
			</div>
		);
	}

	return (
		<div className="status-dashboard">
			<div className="status-dashboard-header">
				<h2 className="status-dashboard-title">Status Dashboard</h2>
				<button
					className="status-dashboard-refresh"
					onClick={() => onAction("refresh")}
					title="Refresh Dashboard"
				>
					🔄
				</button>
			</div>

			<div className="status-dashboard-content">
				<CurrentNoteSection currentNote={currentNote} />
				<VaultStatsCard vaultStats={vaultStats} />
				<StatusDistributionChart
					vaultStats={vaultStats}
					availableStatuses={availableStatuses}
				/>
				<QuickActionsPanel
					hasCurrentFile={!!currentNote.file}
					useMultipleStatuses={settings.useMultipleStatuses}
					quickStatusCommands={settings.quickStatusCommands.map(
						(name) => ({
							name,
							command: `note-status:set-status-${name}`,
						}),
					)}
					availableStatuses={availableStatuses}
					onAction={onAction}
				/>
			</div>
		</div>
	);
};
