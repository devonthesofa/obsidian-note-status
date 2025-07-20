export type DashboardAction =
	| "refresh"
	| "open-grouped-view"
	| "find-unassigned"
	| "change-status"
	| "cycle-status"
	| "clear-status"
	| "copy-status"
	| "paste-status"
	| "search-by-status"
	| "search-by-specific-status"
	| "toggle-multiple-mode"
	| "set-quick-status";

interface QuickActionsPanelProps {
	hasCurrentFile: boolean;
	hasCurrentNoteStatuses: boolean;
	useMultipleStatuses: boolean;
	quickStatusCommands: string[];
	onAction: (action: DashboardAction, value?: string) => void;
}

export const QuickActionsPanel = ({
	hasCurrentFile,
	hasCurrentNoteStatuses,
	useMultipleStatuses,
	quickStatusCommands,
	onAction,
}: QuickActionsPanelProps) => {
	return (
		<div className="status-dashboard-section">
			<div className="status-dashboard-section-header">
				<h3>Quick Actions</h3>
			</div>
			<div className="quick-actions">
				{/* Views Group */}
				<div className="quick-actions-group">
					<div className="quick-actions-group-title">📊 Views</div>
					<button
						className="quick-action-btn"
						onClick={() => onAction("open-grouped-view")}
						title="Open grouped status view"
					>
						📊 Grouped Statuses
					</button>
					<button
						className="quick-action-btn"
						onClick={() => onAction("find-unassigned")}
						title="Find notes without status"
					>
						🔍 Find Unassigned
					</button>
				</div>

				{/* Quick Status Group - Only show when not in multi-status mode and has quick statuses */}
				{!useMultipleStatuses && quickStatusCommands.length > 0 && (
					<div className="quick-actions-group">
						<div className="quick-actions-group-title">
							⚡ Quick Status
						</div>
						{quickStatusCommands.map((statusName) => (
							<button
								key={statusName}
								className="quick-action-btn"
								onClick={() =>
									onAction("set-quick-status", statusName)
								}
								disabled={!hasCurrentFile}
								title={`Set status to ${statusName}`}
							>
								⚡ {statusName}
							</button>
						))}
					</div>
				)}

				{/* Current Note Group */}
				<div className="quick-actions-group">
					<div className="quick-actions-group-title">
						📝 Current Note
					</div>
					<button
						className="quick-action-btn"
						onClick={() => onAction("change-status")}
						disabled={!hasCurrentFile}
						title="Change status of current note"
					>
						📝 Change Status
					</button>
					<button
						className="quick-action-btn"
						onClick={() => onAction("cycle-status")}
						disabled={!hasCurrentFile || useMultipleStatuses}
						title="Cycle through available statuses"
					>
						📝 Cycle Status
					</button>
					<button
						className="quick-action-btn"
						onClick={() => onAction("clear-status")}
						disabled={!hasCurrentFile}
						title="Clear status from current note"
					>
						📝 Clear Status
					</button>
				</div>

				{/* Clipboard Group */}
				<div className="quick-actions-group">
					<div className="quick-actions-group-title">
						📋 Clipboard
					</div>
					<button
						className="quick-action-btn"
						onClick={() => onAction("copy-status")}
						disabled={!hasCurrentFile}
						title="Copy status to clipboard"
					>
						📋 Copy Status
					</button>
					<button
						className="quick-action-btn"
						onClick={() => onAction("paste-status")}
						disabled={!hasCurrentFile}
						title="Paste status from clipboard"
					>
						📋 Paste Status
					</button>
				</div>

				{/* Tools Group */}
				<div className="quick-actions-group">
					<div className="quick-actions-group-title">⚙️ Tools</div>
					<button
						className="quick-action-btn"
						onClick={() => onAction("search-by-status")}
						disabled={!hasCurrentFile || !hasCurrentNoteStatuses}
						title="Search for notes with same status"
					>
						⚙️ Search by Status
					</button>
					<button
						className="quick-action-btn"
						onClick={() => onAction("toggle-multiple-mode")}
						title="Toggle multiple statuses mode"
					>
						⚙️ Toggle Multi-Status
					</button>
					<button
						className="quick-action-btn"
						onClick={() => onAction("refresh")}
						title="Refresh dashboard data"
					>
						⚙️ Refresh Data
					</button>
				</div>
			</div>
		</div>
	);
};
