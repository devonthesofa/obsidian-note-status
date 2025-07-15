import React from "react";
import { GroupedStatuses } from "@/types/noteStatus";
import { StatusBadge } from "../atoms/StatusBadge";

export interface Props {
	statuses: GroupedStatuses;
	onClose?: () => void;
}

export const StatusFileInfoPopup: React.FC<Props> = ({ statuses }) => {
	const statusEntries = Object.entries(statuses);

	if (statusEntries.length === 0) {
		return (
			<div className="status-popup-empty">
				<span className="status-empty-icon">📋</span>
				No statuses found
			</div>
		);
	}

	return (
		<div className="status-info-popup" onClick={(e) => e.stopPropagation()}>
			<div className="status-popup-header">
				<span className="status-header-icon">📊</span>
				Status Overview
			</div>

			<div className="status-popup-content">
				{statusEntries.map(([groupName, statusList]) => (
					<div key={groupName} className="status-group">
						<div className="status-group-header">
							<span className="status-group-name">
								{groupName.toLowerCase()}
							</span>
							<span className="status-group-count">
								{statusList.length}
							</span>
						</div>

						<div className="status-group-items">
							{statusList.map((status, index) => (
								<div
									key={`${groupName}-${index}`}
									className="status-item"
								>
									<StatusBadge status={status} />
									{status.description && (
										<div
											className="status-description"
											title={status.description}
										>
											{status.description}
										</div>
									)}
								</div>
							))}
						</div>
					</div>
				))}
			</div>
		</div>
	);
};
