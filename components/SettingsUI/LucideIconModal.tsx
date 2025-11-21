import React, {
	FC,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { App, Modal } from "obsidian";
import { IconName, getIconIds } from "obsidian";
import { Input } from "@/components/atoms/Input";
import { StatusIcon } from "@/components/atoms/StatusIcon";
import { ObsidianIcon } from "@/components/atoms/ObsidianIcon";
import { createRoot, Root } from "react-dom/client";

const BATCH_SIZE = 80;

interface LucideIconModalProps {
	initialValue?: string;
	onSelect: (value: string) => void;
	onCloseRequest: () => void;
}

const LucideIconModalContent: FC<LucideIconModalProps> = ({
	initialValue = "",
	onSelect,
	onCloseRequest,
}) => {
	const [query, setQuery] = useState("");
	const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
	const [showLabels, setShowLabels] = useState(true);
	const listRef = useRef<HTMLDivElement>(null);

	const iconIds = useMemo(() => {
		try {
			return getIconIds()
				.slice()
				.sort((a, b) => a.localeCompare(b));
		} catch (error) {
			console.error("Failed to fetch Lucide icon list", error);
			return [] as IconName[];
		}
	}, []);

	const computeFuzzyScore = useCallback(
		(needle: string, haystack: string): number | null => {
			let lastIndex = -1;
			let score = 0;

			for (let i = 0; i < needle.length; i += 1) {
				const char = needle[i];
				const idx = haystack.indexOf(char, lastIndex + 1);
				if (idx === -1) {
					return null;
				}
				score += idx - lastIndex;
				lastIndex = idx;
			}

			return score + (haystack.length - lastIndex);
		},
		[],
	);

	const filteredIcons = useMemo(() => {
		if (!iconIds.length) {
			return [];
		}
		const normalized = query.trim().toLowerCase();
		if (!normalized.length) {
			return iconIds;
		}

		const matches = iconIds
			.map((name) => {
				const target = name.toLowerCase();
				const score = computeFuzzyScore(normalized, target);
				return score === null ? null : { name, score };
			})
			.filter(
				(
					entry,
				): entry is {
					name: string;
					score: number;
				} => entry !== null,
			)
			.sort((a, b) => a.score - b.score || a.name.localeCompare(b.name));

		return matches.map((entry) => entry.name);
	}, [iconIds, query, computeFuzzyScore]);

	const visibleIcons = useMemo(
		() => filteredIcons.slice(0, visibleCount),
		[filteredIcons, visibleCount],
	);

	useEffect(() => {
		setVisibleCount(BATCH_SIZE);
		listRef.current?.scrollTo({ top: 0 });
	}, [query, filteredIcons.length]);

	const handleScroll = useCallback(
		(event: React.UIEvent<HTMLDivElement>) => {
			const target = event.currentTarget;
			if (
				target.scrollTop + target.clientHeight >=
				target.scrollHeight - 64
			) {
				setVisibleCount((prev) =>
					Math.min(prev + BATCH_SIZE, filteredIcons.length),
				);
			}
		},
		[filteredIcons.length],
	);

	const handleSelect = (iconName: string) => {
		onSelect(iconName);
		onCloseRequest();
	};

	return (
		<div className="lucide-icon-modal">
			<div className="lucide-icon-modal__header">
				<div>
					<h3 className="modal-title">Select Lucide icon</h3>
					<p className="lucide-icon-modal__count">
						Showing {visibleIcons.length} of {filteredIcons.length}{" "}
						( Total {iconIds.length})
					</p>
				</div>
				<button
					type="button"
					className="modal-close-button lucide-icon-modal__close"
					onClick={onCloseRequest}
					aria-label="Close"
				>
					<ObsidianIcon name="x" size={14} />
				</button>
			</div>

			<Input
				variant="search"
				value={query}
				onChange={setQuery}
				placeholder="Search icons…"
				className="lucide-icon-modal__search"
			/>

			<label className="lucide-icon-modal__toggle">
				<input
					type="checkbox"
					checked={showLabels}
					onChange={(e) => setShowLabels(e.target.checked)}
				/>
				Show icon names
			</label>

			<div
				ref={listRef}
				className={`lucide-icon-modal__list${showLabels ? "" : " lucide-icon-modal__list--icons-only"}`}
				onScroll={handleScroll}
			>
				{visibleIcons.map((iconName) => (
					<button
						key={iconName}
						type="button"
						className={`lucide-icon-modal__option${iconName === initialValue ? " lucide-icon-modal__option--selected" : ""}${showLabels ? "" : " lucide-icon-modal__option--compact"}`}
						onClick={() => handleSelect(iconName)}
					>
						<StatusIcon
							icon={iconName}
							lucideIcon={iconName}
							size={16}
						/>
						<span>{iconName}</span>
					</button>
				))}

				{visibleIcons.length === 0 && (
					<div className="lucide-icon-modal__empty">
						No icons match “{query.trim()}”.
					</div>
				)}
			</div>
		</div>
	);
};

type ModalOptions = {
	initialValue?: string;
	onSelect: (value: string) => void;
};

export class LucideIconModal extends Modal {
	private root: Root | null = null;
	private readonly options: ModalOptions;

	constructor(app: App, options: ModalOptions) {
		super(app);
		this.options = options;
	}

	onOpen(): void {
		this.contentEl.empty();
		this.contentEl.addClass("lucide-icon-modal-wrapper");
		this.root = createRoot(this.contentEl);
		this.root.render(
			<LucideIconModalContent
				initialValue={this.options.initialValue}
				onSelect={this.options.onSelect}
				onCloseRequest={() => this.close()}
			/>,
		);
	}

	onClose(): void {
		this.root?.unmount();
		this.root = null;
		this.contentEl.empty();
	}
}
