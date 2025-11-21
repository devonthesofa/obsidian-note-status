import React from "react";
import { GroupedStatuses } from "@/types/noteStatus";
import { StatusDisplay } from "../atoms/StatusDisplay";

export interface Props {
	statuses: GroupedStatuses;
	defaultTagName: string;
	onClose?: () => void;
}

export const StatusFileInfoPopup: React.FC<Props> = ({
	statuses,
	defaultTagName,
}) => {
	const statusEntries = Object.entries(statuses).filter(
		([, statusList]) => statusList.length > 0,
	);

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
				<div className="status-tag-grid">
					{statusEntries.map(([groupName, statusList]) => {
						const isDefault = groupName === defaultTagName;
						return (
							<div key={groupName} className="status-tag-card">
								<div className="status-tag-card__header">
									<div className="status-tag-card__title">
										<span className="status-tag-card__label">
											{groupName}
										</span>
										{isDefault && (
											<span className="status-tag-card__badge">
												Default tag
											</span>
										)}
									</div>
									<span className="status-tag-card__count">
										{statusList.length}
									</span>
								</div>
								<div className="status-tag-card__statuses">
									{statusList.map((status, index) => (
										<StatusDisplay
											key={`${groupName}-${index}`}
											status={status}
											variant="badge"
										/>
									))}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};
