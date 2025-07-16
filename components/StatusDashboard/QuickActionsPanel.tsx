import { BaseNoteStatusService } from "@/core/noteStatusService";
import settingsService from "@/core/settingsService";

interface QuickActionsPanelProps {
	onRefresh: () => void;
}

export const QuickActionsPanel = ({ onRefresh }: QuickActionsPanelProps) => {
	return (
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
							type: "grouped-status-view",
							active: true,
						});
					}}
				>
					📊 View Grouped Statuses
				</button>
				<button
					className="quick-action-btn"
					onClick={() => {
						const files =
							BaseNoteStatusService.app.vault.getMarkdownFiles();
						const filesWithoutStatus = files.filter((file) => {
							const cachedMetadata =
								BaseNoteStatusService.app.metadataCache.getFileCache(
									file,
								);
							const frontmatter = cachedMetadata?.frontmatter;
							return (
								!frontmatter ||
								!frontmatter[settingsService.settings.tagPrefix]
							);
						});

						console.log(
							`Found ${filesWithoutStatus.length} notes without status:`,
							filesWithoutStatus.map((f) => f.path),
						);
					}}
				>
					🔍 Find Notes Without Status
				</button>
				<button className="quick-action-btn" onClick={onRefresh}>
					🔄 Refresh Data
				</button>
			</div>
		</div>
	);
};
