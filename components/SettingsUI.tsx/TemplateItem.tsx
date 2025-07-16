import React from "react";
import { StatusTemplate } from "@/types/pluginSettings";
import { StatusDisplay } from "../atoms/StatusDisplay";

interface TemplateItemProps {
	template: StatusTemplate;
	isEnabled: boolean;
	onToggle: (templateId: string, enabled: boolean) => void;
}

export const TemplateItem: React.FC<TemplateItemProps> = ({
	template,
	isEnabled,
	onToggle,
}) => (
	<div
		className={`template-item ${isEnabled ? "enabled" : ""}`}
		onClick={() => onToggle(template.id, !isEnabled)}
	>
		<div className="template-header">
			<input
				type="checkbox"
				className="template-checkbox"
				checked={isEnabled}
				readOnly
			/>
			<span className="setting-item-name">{template.name}</span>
		</div>
		<div className="setting-item-description">{template.description}:</div>
		<div className="template-statuses">
			{template.statuses.map((status, index) => (
				<StatusDisplay key={index} status={status} variant="template" />
			))}
		</div>
	</div>
);
