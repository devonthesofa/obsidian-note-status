import { useState, useEffect, useMemo, useCallback } from "react";
import { TFile } from "obsidian";
import { NoteStatus } from "@/types/noteStatus";
import {
	BaseNoteStatusService,
	NoteStatusService,
} from "@/core/noteStatusService";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { GroupLabel } from "@/components/atoms/GroupLabel";
import eventBus from "@/core/eventBus";
import settingsService from "@/core/settingsService";

interface VaultStats {
	totalNotes: number;
	notesWithStatus: number;
	statusDistribution: Record<string, number>;
	tagDistribution: Record<string, number>;
	recentChanges: Array<{
		file: TFile;
		status: NoteStatus;
		timestamp: number;
		action: "added" | "removed";
	}>;
}

interface CurrentNoteInfo {
	file: TFile | null;
	statuses: Record<string, NoteStatus[]>;
	lastModified: number;
}

export const StatusDashboard = () => {
	const [vaultStats, setVaultStats] = useState<VaultStats>({
		totalNotes: 0,
		notesWithStatus: 0,
		statusDistribution: {},
		tagDistribution: {},
		recentChanges: [],
	});

	const [currentNote, setCurrentNote] = useState<CurrentNoteInfo>({
		file: null,
		statuses: {},
		lastModified: 0,
	});

	const [isLoading, setIsLoading] = useState(true);

	const calculateVaultStats = useCallback((): VaultStats => {
		const files = BaseNoteStatusService.app.vault.getMarkdownFiles();
		const availableStatuses =
			BaseNoteStatusService.getAllAvailableStatuses();
		const statusMetadataKeys = [settingsService.settings.tagPrefix];

		let notesWithStatus = 0;
		const statusDistribution: Record<string, number> = {};
		const tagDistribution: Record<string, number> = {};

		// Initialize counters
		availableStatuses.forEach((status) => {
			statusDistribution[status.name] = 0;
		});

		statusMetadataKeys.forEach((tag) => {
			tagDistribution[tag] = 0;
		});

		files.forEach((file) => {
			const cachedMetadata =
				BaseNoteStatusService.app.metadataCache.getFileCache(file);
			const frontmatter = cachedMetadata?.frontmatter;

			if (!frontmatter) return;

			let hasAnyStatus = false;

			statusMetadataKeys.forEach((key) => {
				const value = frontmatter[key];
				if (value) {
					hasAnyStatus = true;
					tagDistribution[key]++;

					const statusNames = Array.isArray(value) ? value : [value];
					statusNames.forEach((statusName) => {
						const statusStr = statusName.toString();
						if (statusDistribution.hasOwnProperty(statusStr)) {
							statusDistribution[statusStr]++;
						}
					});
				}
			});

			if (hasAnyStatus) {
				notesWithStatus++;
			}
		});

		return {
			totalNotes: files.length,
			notesWithStatus,
			statusDistribution,
			tagDistribution,
			recentChanges: [], // TODO: Implement recent changes tracking
		};
	}, []);

	const updateCurrentNote = useCallback(() => {
		const activeFile = BaseNoteStatusService.app.workspace.getActiveFile();

		if (!activeFile) {
			setCurrentNote({ file: null, statuses: {}, lastModified: 0 });
			return;
		}

		const noteStatusService = new NoteStatusService(activeFile);
		noteStatusService.populateStatuses();

		setCurrentNote({
			file: activeFile,
			statuses: noteStatusService.statuses,
			lastModified: activeFile.stat.mtime,
		});
	}, []);

	const loadData = useCallback(() => {
		setIsLoading(true);
		try {
			const stats = calculateVaultStats();
			setVaultStats(stats);
			updateCurrentNote();
		} finally {
			setIsLoading(false);
		}
	}, [calculateVaultStats, updateCurrentNote]);

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

	const availableStatuses = BaseNoteStatusService.getAllAvailableStatuses();
	const statusMap = new Map(availableStatuses.map((s) => [s.name, s]));

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
				{/* Current Note Section */}
				<div className="status-dashboard-section">
					<div className="status-dashboard-section-header">
						<h3>Current Note</h3>
					</div>
					<div className="status-dashboard-current-note">
						{currentNote.file ? (
							<>
								<div className="current-note-info">
									<div className="current-note-name">
										{currentNote.file.basename}
									</div>
									<div className="current-note-path">
										{currentNote.file.path}
									</div>
									<div className="current-note-modified">
										Last modified:{" "}
										{new Date(
											currentNote.lastModified,
										).toLocaleString()}
									</div>
								</div>

								<div className="current-note-statuses">
									{Object.entries(currentNote.statuses).map(
										([tag, statuses]) => (
											<div
												key={tag}
												className="current-note-tag-group"
											>
												<GroupLabel name={tag} />
												<div className="current-note-status-list">
													{statuses.length > 0 ? (
														statuses.map(
															(status) => (
																<StatusBadge
																	key={
																		status.name
																	}
																	status={
																		status
																	}
																/>
															),
														)
													) : (
														<span className="current-note-no-status">
															No status assigned
														</span>
													)}
												</div>
											</div>
										),
									)}
								</div>
							</>
						) : (
							<div className="current-note-empty">
								No note currently active
							</div>
						)}
					</div>
				</div>

				{/* Vault Overview Section */}
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
								<div className="vault-stat-label">
									Total Notes
								</div>
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
								<div className="vault-stat-label">
									Total Statuses
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Status Distribution Section */}
				<div className="status-dashboard-section">
					<div className="status-dashboard-section-header">
						<h3>Status Distribution</h3>
					</div>
					<div className="status-distribution">
						{statusChart.length > 0 ? (
							<div className="status-chart">
								{statusChart.map(
									({ name, count, percentage }) => {
										const status = statusMap.get(name);
										return (
											<div
												key={name}
												className="status-chart-item"
											>
												<div className="status-chart-info">
													{status && (
														<StatusBadge
															status={status}
														/>
													)}
													<span className="status-chart-count">
														{count} notes (
														{percentage}%)
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
									},
								)}
							</div>
						) : (
							<div className="status-distribution-empty">
								No status data available
							</div>
						)}
					</div>
				</div>

				{/* Quick Actions Section */}
				<div className="status-dashboard-section">
					<div className="status-dashboard-section-header">
						<h3>Quick Actions</h3>
					</div>
					<div className="quick-actions">
						<button
							className="quick-action-btn"
							onClick={() => {
								const leaf =
									BaseNoteStatusService.app.workspace.getLeaf();
								leaf.setViewState({
									type: "groupped-status-view",
									active: true,
								});
							}}
						>
							📊 View Grouped Statuses
						</button>
						<button
							className="quick-action-btn"
							onClick={() => {
								// Find notes without status
								const files =
									BaseNoteStatusService.app.vault.getMarkdownFiles();
								const filesWithoutStatus = files.filter(
									(file) => {
										const cachedMetadata =
											BaseNoteStatusService.app.metadataCache.getFileCache(
												file,
											);
										const frontmatter =
											cachedMetadata?.frontmatter;
										return (
											!frontmatter ||
											!frontmatter[
												settingsService.settings
													.tagPrefix
											]
										);
									},
								);

								console.log(
									`Found ${filesWithoutStatus.length} notes without status:`,
									filesWithoutStatus.map((f) => f.path),
								);
							}}
						>
							🔍 Find Notes Without Status
						</button>
						<button className="quick-action-btn" onClick={loadData}>
							🔄 Refresh Data
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};
