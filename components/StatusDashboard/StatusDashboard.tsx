import { useState, useEffect, useCallback } from "react";
import { BaseNoteStatusService } from "@/core/noteStatusService";
import eventBus from "@/core/eventBus";
import { VaultStatsCard } from "./VaultStatsCard";
import { CurrentNoteSection } from "./CurrentNoteSection";
import { StatusDistributionChart } from "./StatusDistributionChart";
import { QuickActionsPanel } from "./QuickActionsPanel";
import { useVaultStats } from "./useVaultStats";
import { useCurrentNote } from "./useCurrentNote";

export const StatusDashboard = () => {
	const [isLoading, setIsLoading] = useState(true);
	const { vaultStats, updateVaultStats } = useVaultStats();
	const { currentNote, updateCurrentNote } = useCurrentNote();

	const loadData = useCallback(() => {
		setIsLoading(true);
		try {
			updateVaultStats();
			updateCurrentNote();
		} finally {
			setIsLoading(false);
		}
	}, [updateVaultStats, updateCurrentNote]);

	useEffect(() => {
		loadData();

		const handleFileChange = () => {
			updateCurrentNote();
		};

		const handleVaultChange = () => {
			loadData();
		};

		eventBus.subscribe(
			"frontmatter-manually-changed",
			handleVaultChange,
			"status-dashboard-vault-subscription",
		);
		eventBus.subscribe(
			"active-file-change",
			handleFileChange,
			"status-dashboard-file-subscription",
		);

		const unsubscribeActiveFile = BaseNoteStatusService.app.workspace.on(
			"active-leaf-change",
			handleFileChange,
		);

		return () => {
			eventBus.unsubscribe(
				"frontmatter-manually-changed",
				"status-dashboard-vault-subscription",
			);
			eventBus.unsubscribe(
				"active-file-change",
				"status-dashboard-file-subscription",
			);
			BaseNoteStatusService.app.workspace.offref(unsubscribeActiveFile);
		};
	}, [loadData, updateCurrentNote]);

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
					onClick={loadData}
					title="Refresh Dashboard"
				>
					🔄
				</button>
			</div>

			<div className="status-dashboard-content">
				<CurrentNoteSection currentNote={currentNote} />
				<VaultStatsCard vaultStats={vaultStats} />
				<StatusDistributionChart vaultStats={vaultStats} />
				<QuickActionsPanel onRefresh={loadData} />
			</div>
		</div>
	);
};
