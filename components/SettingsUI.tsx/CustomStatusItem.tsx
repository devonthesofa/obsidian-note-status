import { NoteStatus } from "@/types/noteStatus";
import { PluginSettings } from "@/types/pluginSettings";
import React, { useState } from "react";
import { Input } from "@/components/atoms/Input";

export type Props = {
	status: NoteStatus;
	index: number;
	settings: PluginSettings;
	onCustomStatusChange: (
		index: number,
		column: "name" | "icon" | "color" | "description",
		value: string,
	) => void;
	onCustomStatusRemove: (index: number) => void;
};

export const CustomStatusItem: React.FC<Props> = ({
	status,
	index,
	onCustomStatusChange,
	onCustomStatusRemove,
}) => {
	const [isHovered, setIsHovered] = useState(false);
	const [focusedField, setFocusedField] = useState<string | null>(null);

	const isValid = status.name.trim().length > 0;
	const hasIcon = status.icon.trim().length > 0;

	return (
		<div
			className="custom-status-card"
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			style={{
				background: "var(--background-secondary)",
				border: `1px solid ${isValid ? "var(--background-modifier-border)" : "var(--background-modifier-error)"}`,
				borderRadius: "var(--radius-m)",
				padding: "var(--size-4-3)",
				marginBottom: "var(--size-4-2)",
				transition: "all 0.2s ease",
				transform: isHovered ? "translateY(-1px)" : "translateY(0)",
				boxShadow: isHovered ? "0 4px 12px rgba(0,0,0,0.1)" : "none",
			}}
		>
			{/* Status Preview Bar */}
			<div
				style={{
					height: "4px",
					background: status.color || "var(--text-muted)",
					borderRadius: "2px",
					marginBottom: "var(--size-4-2)",
					opacity: isValid ? 1 : 0.5,
				}}
			/>

			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "var(--size-4-2)",
				}}
			>
				{/* Icon Input with Preview Circle */}
				<div style={{ position: "relative" }}>
					<div
						style={{
							width: "48px",
							height: "48px",
							borderRadius: "50%",
							background: status.color
								? `${status.color}20`
								: "var(--background-modifier-border)",
							border: `2px solid ${status.color || "var(--background-modifier-border)"}`,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontSize: "20px",
							transition: "all 0.2s ease",
							transform:
								focusedField === "icon"
									? "scale(1.05)"
									: "scale(1)",
						}}
					>
						{hasIcon ? status.icon : "?"}
					</div>
					<Input
						variant="text"
						value={status.icon}
						onChange={(value) =>
							onCustomStatusChange(index, "icon", value || "")
						}
						placeholder="🔥"
						onFocus={() => setFocusedField("icon")}
						onBlur={() => setFocusedField(null)}
						style={{
							position: "absolute",
							top: 0,
							left: 0,
							width: "48px",
							height: "48px",
							opacity: 0,
							cursor: "pointer",
							borderRadius: "50%",
						}}
					/>
				</div>

				{/* Text Inputs */}
				<div
					style={{
						flex: 1,
						display: "flex",
						flexDirection: "column",
						gap: "var(--size-2-2)",
					}}
				>
					<Input
						variant="text"
						value={status.name}
						onChange={(value) =>
							onCustomStatusChange(index, "name", value || "")
						}
						placeholder="Status name"
						onFocus={() => setFocusedField("name")}
						onBlur={() => setFocusedField(null)}
						style={{
							background: "var(--background-primary)",
							border: `1px solid ${
								focusedField === "name"
									? "var(--interactive-accent)"
									: !isValid
										? "var(--background-modifier-error)"
										: "var(--background-modifier-border)"
							}`,
							borderRadius: "var(--radius-s)",
							padding: "var(--size-2-2) var(--size-2-3)",
							fontSize: "var(--font-ui-medium)",
							fontWeight: "var(--font-semibold)",
							color: status.color || "var(--text-normal)",
							transition: "border-color 0.2s ease",
						}}
					/>
					<Input
						variant="text"
						value={status.description || ""}
						onChange={(value) =>
							onCustomStatusChange(index, "description", value)
						}
						placeholder="Description (optional)"
						onFocus={() => setFocusedField("description")}
						onBlur={() => setFocusedField(null)}
						style={{
							background: "var(--background-primary)",
							border: `1px solid ${
								focusedField === "description"
									? "var(--interactive-accent)"
									: "var(--background-modifier-border)"
							}`,
							borderRadius: "var(--radius-s)",
							padding: "var(--size-2-1) var(--size-2-3)",
							fontSize: "var(--font-ui-small)",
							color: "var(--text-muted)",
							transition: "border-color 0.2s ease",
						}}
					/>
				</div>

				{/* Controls */}
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "var(--size-2-2)",
					}}
				>
					{/* Color Picker */}
					<div style={{ position: "relative" }}>
						<Input
							variant="color"
							value={status.color || "#ffffff"}
							onChange={(value) =>
								onCustomStatusChange(index, "color", value)
							}
							onFocus={() => setFocusedField("color")}
							onBlur={() => setFocusedField(null)}
							style={{
								width: "40px",
								height: "40px",
								borderRadius: "var(--radius-s)",
								border: `2px solid ${
									focusedField === "color"
										? "var(--interactive-accent)"
										: "var(--background-modifier-border)"
								}`,
								cursor: "pointer",
								transition: "border-color 0.2s ease",
							}}
						/>
					</div>

					{/* Remove Button */}
					<button
						onClick={() => onCustomStatusRemove(index)}
						onMouseEnter={(e) =>
							(e.currentTarget.style.transform = "scale(1.05)")
						}
						onMouseLeave={(e) =>
							(e.currentTarget.style.transform = "scale(1)")
						}
						aria-label="Remove status"
						style={{
							width: "36px",
							height: "36px",
							borderRadius: "var(--radius-s)",
							border: "1px solid var(--background-modifier-border)",
							background: isHovered
								? "var(--background-modifier-error)"
								: "var(--background-primary)",
							color: isHovered
								? "var(--text-on-accent)"
								: "var(--text-muted)",
							cursor: "pointer",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							fontSize: "16px",
							transition: "all 0.2s ease",
						}}
					>
						{isHovered ? "×" : "🗑️"}
					</button>
				</div>
			</div>

			{/* Validation Message */}
			{!isValid && (
				<div
					style={{
						marginTop: "var(--size-2-2)",
						padding: "var(--size-2-1) var(--size-2-3)",
						background: "var(--background-modifier-error-hover)",
						borderRadius: "var(--radius-s)",
						fontSize: "var(--font-ui-smaller)",
						color: "var(--text-error)",
					}}
				>
					Status name is required
				</div>
			)}
		</div>
	);
};
