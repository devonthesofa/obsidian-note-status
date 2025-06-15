import React, { useState, useEffect, useCallback } from "react";
import { App } from "obsidian";
import { NoteStatusSettings } from "../models/types";
import { StatusService } from "../services/status-service";
import { StatusBarView } from "./status-bar/StatusBarView";

interface StatusBarControllerProps {
	app: App;
	settings: NoteStatusSettings;
	statusService: StatusService;
	initialStatuses?: string[];
}

interface StatusDetails {
	name: string;
	icon: string;
	tooltipText: string;
}

export const StatusBarController: React.FC<StatusBarControllerProps> = ({
	app,
	settings,
	statusService,
	initialStatuses = ["unknown"],
}) => {
	const [currentStatuses, setCurrentStatuses] =
		useState<string[]>(initialStatuses);

	const updateStatuses = useCallback((statuses: string[]) => {
		setCurrentStatuses(statuses);
	}, []);

	const shouldShowStatusBar = useCallback((): boolean => {
		const onlyUnknown =
			currentStatuses.length === 1 && currentStatuses[0] === "unknown";

		if (settings.autoHideStatusBar && onlyUnknown) {
			return false;
		}

		return true;
	}, [currentStatuses, settings.autoHideStatusBar]);

	const getStatusDetails = useCallback((): StatusDetails[] => {
		const statusesToShow = settings.useMultipleStatuses
			? currentStatuses
			: [currentStatuses[0]];

		return statusesToShow.map((status) => {
			const statusObj = statusService
				.getAllStatuses()
				.find((s) => s.name === status);
			return {
				name: status,
				icon: statusService.getStatusIcon(status),
				tooltipText: statusObj?.description
					? `${status} - ${statusObj.description}`
					: status,
			};
		});
	}, [currentStatuses, settings.useMultipleStatuses, statusService]);

	useEffect(() => {
		const handleStatusChanged = (event: CustomEvent) => {
			if (event.detail?.statuses) {
				updateStatuses(event.detail.statuses);
			}
		};

		window.addEventListener(
			"note-status:status-changed",
			handleStatusChanged as EventListener,
		);

		return () => {
			window.removeEventListener(
				"note-status:status-changed",
				handleStatusChanged as EventListener,
			);
		};
	}, [updateStatuses]);

	if (!settings.showStatusBar) {
		return null;
	}

	const statusDetails = getStatusDetails();
	const isVisible = shouldShowStatusBar();

	return <StatusBarView statuses={statusDetails} isVisible={isVisible} />;
};

export default StatusBarController;
