import { TFile } from "obsidian";
import { NoteStatus } from "@/types/noteStatus";
import { StatusDisplay } from "@/components/atoms/StatusDisplay";
import { GroupLabel } from "@/components/atoms/GroupLabel";

interface CurrentNoteInfo {
	file: TFile | null;
	statuses: Record<string, NoteStatus[]>;
	lastModified: number;
}

interface CurrentNoteSectionProps {
	currentNote: CurrentNoteInfo;
}

export const CurrentNoteSection = ({
	currentNote,
}: CurrentNoteSectionProps) => {
	return (
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
												statuses.map((status) => (
													<StatusDisplay
														key={`${status.templateId || "custom"}:${status.name}`}
														status={status}
														variant="badge"
													/>
												))
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
	);
};
