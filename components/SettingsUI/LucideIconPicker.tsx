import React, {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { IconName, getIconIds } from "obsidian";
import { Input } from "@/components/atoms/Input";
import { StatusIcon } from "@/components/atoms/StatusIcon";
import { ObsidianIcon } from "@/components/atoms/ObsidianIcon";

export interface LucideIconPickerProps {
	value?: string;
	onChange: (value: string) => void;
	placeholder?: string;
	allowTextInput?: boolean;
	allowClear?: boolean;
	maxResults?: number;
}

const DEFAULT_MAX_RESULTS = Infinity;

export const LucideIconPicker: React.FC<LucideIconPickerProps> = ({
	value = "",
	onChange,
	placeholder = "Select Lucide icon",
	allowTextInput = false,
	allowClear = true,
	maxResults = DEFAULT_MAX_RESULTS,
}) => {
	const [query, setQuery] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);
	const searchInputRef = useRef<HTMLInputElement>(null);

	const iconIds = useMemo(() => {
		try {
			return getIconIds()
				.slice()
				.sort((a, b) => a.localeCompare(b));
		} catch (error) {
			console.error("Failed to load Lucide icon list", error);
			return [] as IconName[];
		}
	}, []);

	const filteredIcons = useMemo(() => {
		if (!iconIds.length) {
			return [];
		}
		const normalized = query.trim().toLowerCase();
		const matches = normalized.length
			? iconIds.filter((name) => name.toLowerCase().includes(normalized))
			: iconIds;
		if (Number.isFinite(maxResults)) {
			return matches.slice(0, maxResults);
		}
		return matches;
	}, [iconIds, maxResults, query]);

	const closePicker = useCallback(() => {
		setIsOpen(false);
		setQuery("");
	}, []);

	useEffect(() => {
		if (!isOpen) return;

		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				closePicker();
			}
		};
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				closePicker();
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [closePicker, isOpen]);

	useEffect(() => {
		if (isOpen) {
			setTimeout(() => searchInputRef.current?.focus(), 0);
		}
	}, [isOpen]);

	const handleSelect = (iconName: IconName) => {
		onChange(iconName);
		closePicker();
	};

	const handleManualInput = (text: string) => {
		onChange(text);
	};

	const handleClear = () => {
		onChange("");
		setQuery("");
	};

	const togglePopover = () => {
		setIsOpen((prev) => !prev);
	};

	return (
		<div className="lucide-icon-picker" ref={containerRef}>
			{allowTextInput && (
				<Input
					variant="text"
					value={value}
					onChange={handleManualInput}
					placeholder="Emoji or icon name"
					className="lucide-icon-picker__text-input"
				/>
			)}

			<div className="lucide-icon-picker__actions">
				<button
					type="button"
					className={`lucide-icon-picker__trigger${isOpen ? " is-active" : ""}`}
					onClick={togglePopover}
				>
					<span className="lucide-icon-picker__trigger-icon">
						<StatusIcon icon={value} lucideIcon={value} size={16} />
					</span>
					<span className="lucide-icon-picker__trigger-label">
						{value || placeholder}
					</span>
					<ObsidianIcon
						name={isOpen ? "chevron-up" : "chevron-down"}
						size={14}
					/>
				</button>

				{allowClear && value && (
					<button
						type="button"
						className="lucide-icon-picker__clear-trigger"
						onClick={handleClear}
					>
						Clear
					</button>
				)}
			</div>

			{isOpen && (
				<div className="lucide-icon-picker__popover">
					{iconIds.length > 0 ? (
						<>
							<Input
								ref={searchInputRef}
								variant="search"
								value={query}
								onChange={setQuery}
								placeholder="Search Lucide icons…"
								className="lucide-icon-picker__search"
							/>
							<div className="lucide-icon-picker__count">
								Showing {filteredIcons.length} of{" "}
								{iconIds.length} icons
							</div>
							<div className="lucide-icon-picker__options">
								{filteredIcons.map((iconName) => (
									<button
										type="button"
										key={iconName}
										className={`lucide-icon-picker__option${iconName === value ? " lucide-icon-picker__option--selected" : ""}`}
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
								{filteredIcons.length === 0 && (
									<div className="lucide-icon-picker__empty">
										No icons match “{query.trim()}”.
									</div>
								)}
							</div>
						</>
					) : (
						<div className="lucide-icon-picker__empty">
							Lucide icons are not available right now.
						</div>
					)}
				</div>
			)}
		</div>
	);
};
