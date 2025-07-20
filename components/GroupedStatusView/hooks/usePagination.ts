import { useState, useCallback } from "react";

const ITEMS_PER_LOAD = 20;

export const usePagination = () => {
	const [loadedItems, setLoadedItems] = useState<Record<string, number>>({});

	const getLoadedCount = useCallback(
		(groupKey: string) => {
			return loadedItems[groupKey] || ITEMS_PER_LOAD;
		},
		[loadedItems],
	);

	const loadMoreItems = useCallback((groupKey: string) => {
		setLoadedItems((prev) => ({
			...prev,
			[groupKey]: (prev[groupKey] || ITEMS_PER_LOAD) + ITEMS_PER_LOAD,
		}));
	}, []);

	const handleScroll = useCallback(
		(
			e: React.UIEvent<HTMLDivElement>,
			groupKey: string,
			totalItems: number,
		) => {
			const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
			const loadedCount = getLoadedCount(groupKey);

			if (
				scrollHeight - scrollTop <= clientHeight + 100 &&
				loadedCount < totalItems
			) {
				loadMoreItems(groupKey);
			}
		},
		[getLoadedCount, loadMoreItems],
	);

	return {
		loadedItems,
		getLoadedCount,
		loadMoreItems,
		handleScroll,
	};
};
