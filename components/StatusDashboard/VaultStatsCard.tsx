import { VaultStats } from "./useVaultStats";

interface VaultStatsCardProps {
	vaultStats: VaultStats;
}

export const VaultStatsCard = ({ vaultStats }: VaultStatsCardProps) => {
	return (
		<div className="status-dashboard-section">
			<div className="status-dashboard-section-header">
				<h3>Vault Overview</h3>
			</div>
			<div className="vault-overview">
				<div className="vault-stats-grid">
					<div className="vault-stat-card">
						<div className="vault-stat-number">
							{vaultStats.totalNotes}
						</div>
						<div className="vault-stat-label">Total Notes</div>
					</div>
					<div className="vault-stat-card">
						<div className="vault-stat-number">
							{vaultStats.notesWithStatus}
						</div>
						<div className="vault-stat-label">
							Notes with Status
						</div>
					</div>
					<div className="vault-stat-card">
						<div className="vault-stat-number">
							{vaultStats.totalNotes > 0
								? Math.round(
										(vaultStats.notesWithStatus /
											vaultStats.totalNotes) *
											100,
									)
								: 0}
							%
						</div>
						<div className="vault-stat-label">Coverage</div>
					</div>
					<div className="vault-stat-card">
						<div className="vault-stat-number">
							{Object.values(
								vaultStats.statusDistribution,
							).reduce((sum, count) => sum + count, 0)}
						</div>
						<div className="vault-stat-label">Total Statuses</div>
					</div>
				</div>
			</div>
		</div>
	);
};
