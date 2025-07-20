import { useMemo } from "react";
import { StatusDisplay } from "@/components/atoms/StatusDisplay";
import { VaultStats } from "./useVaultStats";
import { NoteStatus } from "@/types/noteStatus";

interface StatusDistributionChartProps {
	vaultStats: VaultStats;
	availableStatuses: NoteStatus[];
	onStatusClick?: (statusName: string) => void;
}

export const StatusDistributionChart = ({
	vaultStats,
	availableStatuses,
	onStatusClick,
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

	const statusMap = useMemo(() => {
		const map = new Map();
		availableStatuses.forEach((s) => {
			const scopedIdentifier = s.templateId
				? `${s.templateId}:${s.name}`
				: s.name;
			map.set(scopedIdentifier, s);
		});

		// Also handle the case where we need to map legacy statuses to their first template
		Object.keys(vaultStats.statusDistribution).forEach(
			(statusIdentifier) => {
				if (!map.has(statusIdentifier)) {
					// This might be a legacy status that got assigned to a template
					if (statusIdentifier.includes(":")) {
						const [templateId, statusName] =
							statusIdentifier.split(":");
						const templateStatus = availableStatuses.find(
							(s) =>
								s.templateId === templateId &&
								s.name === statusName,
						);
						if (templateStatus) {
							map.set(statusIdentifier, templateStatus);
						}
					}
				}
			},
		);

		return map;
	}, [availableStatuses, vaultStats.statusDistribution]);

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
								<div
									key={name}
									className={`status-chart-item ${onStatusClick ? "status-chart-item--clickable" : ""}`}
									onClick={() => onStatusClick?.(name)}
									title={
										onStatusClick
											? `Click to search for notes with status: ${name}`
											: undefined
									}
								>
									<div className="status-chart-info">
										{status ? (
											<StatusDisplay
												status={status}
												variant="badge"
											/>
										) : (
											<span className="status-unknown-badge">
												{name}
											</span>
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
