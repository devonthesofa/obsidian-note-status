import React from "react";
import { StatusIcon } from "@/components/atoms/StatusIcon";
import { LucideIconModal } from "./LucideIconModal";
import { App } from "obsidian";
import { Input } from "@/components/atoms/Input";

const getAppInstance = (): App | undefined => {
	return (window as typeof window & { app?: App }).app;
};

export interface LucideIconPickerProps {
	value?: string;
	onChange: (value: string) => void;
	placeholder?: string;
	allowTextInput?: boolean;
	allowClear?: boolean;
}

export const LucideIconPicker: React.FC<LucideIconPickerProps> = ({
	value = "",
	onChange,
	placeholder = "Choose Lucide icon",
	allowTextInput = false,
	allowClear = true,
}) => {
	const openModal = () => {
		const app = getAppInstance();
		if (!app) {
			console.warn("Cannot open Lucide icon modal without Obsidian app");
			return;
		}
		const modal = new LucideIconModal(app, {
			initialValue: value,
			onSelect: (icon) => onChange(icon),
		});
		modal.open();
	};

	const handleClear = () => {
		onChange("");
	};

	return (
		<div className="lucide-icon-picker">
			{allowTextInput && (
				<Input
					variant="text"
					value={value}
					onChange={(val) => onChange(val)}
					placeholder="Emoji or icon name"
					className="lucide-icon-picker__text-input"
				/>
			)}
			<div className="lucide-icon-picker__row">
				<button
					type="button"
					className="lucide-icon-picker__modal-button"
					onClick={openModal}
				>
					<span className="lucide-icon-picker__preview">
						<StatusIcon icon={value} lucideIcon={value} size={18} />
					</span>
					<span className="lucide-icon-picker__label">
						{value || placeholder}
					</span>
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
		</div>
	);
};
