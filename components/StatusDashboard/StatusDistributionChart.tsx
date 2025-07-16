import { useMemo } from "react";
import { BaseNoteStatusService } from "@/core/noteStatusService";
import { StatusDisplay } from "@/components/atoms/StatusDisplay";
import { VaultStats } from "./useVaultStats";

interface StatusDistributionChartProps {
	vaultStats: VaultStats;
}

export const StatusDistributionChart = ({
	vaultStats,
}: StatusDistributionChartProps) => {
	const statusChart = useMemo(() => {
		const total = Object.values(vaultStats.statusDistribution).reduce(
			(sum, count) => sum + count,
			0,
		);
		if (total === 0) return [];

		return Object.entries(vaultStats.statusDistribution)
			.filter(([_, count]) => count > 0)
			.map(([statusName, count]) => ({
				name: statusName,
				count,
				percentage: Math.round((count / total) * 100),
			}))
			.sort((a, b) => b.count - a.count);
	}, [vaultStats.statusDistribution]);

	const availableStatuses = useMemo(
		() => BaseNoteStatusService.getAllAvailableStatuses(),
		[],
	);
	const statusMap = useMemo(
		() => new Map(availableStatuses.map((s) => [s.name, s])),
		[availableStatuses],
	);

	return (
		<div className="status-dashboard-section">
			<div className="status-dashboard-section-header">
				<h3>Status Distribution</h3>
			</div>
			<div className="status-distribution">
				{statusChart.length > 0 ? (
					<div className="status-chart">
						{statusChart.map(({ name, count, percentage }) => {
							const status = statusMap.get(name);
							return (
								<div key={name} className="status-chart-item">
									<div className="status-chart-info">
										{status && (
											<StatusDisplay
												status={status}
												variant="badge"
											/>
										)}
										<span className="status-chart-count">
											{count} notes ({percentage}%)
										</span>
									</div>
									<div className="status-chart-bar">
										<div
											className="status-chart-fill"
											style={{
												width: `${percentage}%`,
												backgroundColor:
													status?.color ||
													"var(--interactive-accent)",
											}}
										/>
									</div>
								</div>
							);
						})}
					</div>
				) : (
					<div className="status-distribution-empty">
						No status data available
					</div>
				)}
			</div>
		</div>
	);
};
