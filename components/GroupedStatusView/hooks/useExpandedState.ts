import { useState, useEffect, useCallback } from "react";
import { GroupedByStatus } from "../GroupedStatusView";

export const useExpandedState = (filteredData: GroupedByStatus) => {
	const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
		new Set(),
	);
	const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());

	// Auto-expand groups when there's only one group
	useEffect(() => {
		const dataToCheck = filteredData;
		const groupKeys = Object.keys(dataToCheck);

		if (groupKeys.length === 1) {
			const singleGroupKey = `tag-${groupKeys[0]}`;
			setExpandedGroups((prev) => {
				const newSet = new Set(prev);
				newSet.add(singleGroupKey);
				return newSet;
			});

			// Also expand all status groups within the single tag group
			const statusGroups = dataToCheck[groupKeys[0]];
			const statusKeys = Object.keys(statusGroups).map(
				(statusName) => `${groupKeys[0]}-${statusName}`,
			);
			setExpandedFiles((prev) => {
				const newSet = new Set(prev);
				statusKeys.forEach((key) => newSet.add(key));
				return newSet;
			});
		}
	}, [filteredData]);

	const toggleGroup = useCallback((groupKey: string) => {
		setExpandedGroups((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(groupKey)) {
				newSet.delete(groupKey);
			} else {
				newSet.add(groupKey);
			}
			return newSet;
		});
	}, []);

	const toggleFiles = useCallback((groupKey: string) => {
		setExpandedFiles((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(groupKey)) {
				newSet.delete(groupKey);
			} else {
				newSet.add(groupKey);
			}
			return newSet;
		});
	}, []);

	return {
		expandedGroups,
		expandedFiles,
		toggleGroup,
		toggleFiles,
	};
};
