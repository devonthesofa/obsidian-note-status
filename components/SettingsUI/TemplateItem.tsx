import React from "react";
import { StatusTemplate } from "@/types/pluginSettings";
import { StatusDisplay } from "../atoms/StatusDisplay";
import { SelectableListItem } from "../atoms/SelectableListItem";

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
	<SelectableListItem
		selected={isEnabled}
		onClick={() => onToggle(template.id, !isEnabled)}
		className={`template-item ${isEnabled ? "enabled" : ""}`}
		icon={
			<input
				type="checkbox"
				className="template-checkbox"
				checked={isEnabled}
				readOnly
			/>
		}
	>
		<div>
			<div className="template-header">
				<span className="setting-item-name">{template.name}</span>
			</div>
			<div className="setting-item-description">
				{template.description}:
			</div>
			<div className="template-statuses">
				{template.statuses.map((status, index) => (
					<StatusDisplay
						key={index}
						status={status}
						variant="template"
					/>
				))}
			</div>
		</div>
	</SelectableListItem>
);
