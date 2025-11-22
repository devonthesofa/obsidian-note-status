import { NoteStatus } from "@/types/noteStatus";
import {
	CSSProperties,
	FC,
	MouseEvent,
	ReactNode,
	memo,
	useMemo,
	useState,
} from "react";
import { getStatusTooltip } from "@/utils/statusUtils";
import { ObsidianIcon } from "./ObsidianIcon";
import { StatusIcon } from "./StatusIcon";

export type StatusDisplayVariant = "chip" | "badge" | "template";

interface StatusDisplayProps {
	status: NoteStatus;
	variant: StatusDisplayVariant;
	badgeStyle?: "accent" | "filled" | "dot";
	removable?: boolean;
	hasNameConflicts?: boolean;
	templateNameMode?: "always" | "never" | "auto";
	icon?: ReactNode;
	onRemove?: () => void;
	onClick?: () => void;
}

export const StatusDisplay: FC<StatusDisplayProps> = memo(
	({
		status,
		variant,
		removable = false,
		badgeStyle = "accent",
		hasNameConflicts = false,
		templateNameMode = "auto",
		icon,
		onRemove,
		onClick,
	}) => {
		const [isRemoving, setIsRemoving] = useState(false);

		const getDisplayName = () => {
			const shouldShowTemplate = (() => {
				switch (templateNameMode) {
					case "always":
						return true;
					case "never":
						return false;
					case "auto":
						return hasNameConflicts && status.templateId;
					default:
						return false;
				}
			})();

			return shouldShowTemplate && status.templateId
				? `${status.name} (${status.templateId})`
				: status.name;
		};

		const handleRemove = (e: MouseEvent) => {
			e.stopPropagation();
			if (onRemove) {
				setIsRemoving(true);
				setTimeout(() => {
					onRemove();
				}, 150);
			}
		};

		const handleClick = () => {
			if (onClick) {
				onClick();
			}
		};

		const defaultIcon = useMemo(() => {
			const baseSize = variant === "chip" ? 16 : 14;
			return (
				<StatusIcon
					icon={status.icon}
					lucideIcon={status.lucideIcon}
					size={baseSize}
				/>
			);
		}, [status.icon, status.lucideIcon, variant]);

		const iconNode = icon ?? defaultIcon;

		if (variant === "chip") {
			const chipClassName = [
				"note-status-chip",
				isRemoving ? "note-status-chip--removing" : "",
				onClick ? "note-status-chip--clickable" : "",
			]
				.filter(Boolean)
				.join(" ");

			return (
				<div
					className={chipClassName}
					title={getStatusTooltip(status)}
					data-clickable={!!onClick}
					onClick={handleClick}
				>
					<span className="note-status-chip__icon">{iconNode}</span>
					<span className="note-status-chip__text">
						{getDisplayName()}
					</span>
					{removable && (
						<button
							type="button"
							className="note-status-chip__remove"
							onClick={handleRemove}
							aria-label={`Remove status ${status.name}`}
						>
							<ObsidianIcon name="trash" size={12} />
						</button>
					)}
				</div>
			);
		}

		if (variant === "badge") {
			const badgeStyleVars = status.color
				? ({
						"--status-accent": status.color,
					} as CSSProperties)
				: undefined;
			const badgeClassName = [
				"status-badge-container",
				`status-badge--${badgeStyle}`,
				onClick ? "status-badge-container--clickable" : "",
			]
				.filter(Boolean)
				.join(" ");
			const showDot = badgeStyle === "dot";

			return (
				<div
					className={badgeClassName}
					style={badgeStyleVars}
					onClick={handleClick}
					data-clickable={!!onClick}
				>
					{showDot && (
						<span className="status-badge-dot" aria-hidden="true" />
					)}
					<div className="status-badge-item">
						<span className="status-badge-icon">{iconNode}</span>
						<span className="status-badge-text">
							{getDisplayName()}
						</span>
					</div>
				</div>
			);
		}

		if (variant === "template") {
			return (
				<div
					className="template-status-chip"
					onClick={handleClick}
					data-clickable={!!onClick}
				>
					<span
						className="template-status-color-dot"
						style={
							{
								"--dot-color": status.color,
							} as CSSProperties
						}
					/>
					<span className="template-status-chip__label">
						<span className="template-status-chip__icon">
							{iconNode}
						</span>
						{getDisplayName()}
					</span>
				</div>
			);
		}

		return null;
	},
);
