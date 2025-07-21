import React from "react";
import { GroupedStatuses } from "@/types/noteStatus";
import { StatusDisplay } from "../atoms/StatusDisplay";

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
						<div className="status-group__header">
							<span className="status-group__name">
								{groupName.toLowerCase()}
							</span>
							<span className="status-group__count">
								{statusList.length}
							</span>
						</div>

						<div className="status-group__items">
							{statusList.map((status, index) => (
								<div
									key={`${groupName}-${index}`}
									className="status-item"
								>
									<StatusDisplay
										status={status}
										variant="badge"
									/>
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
