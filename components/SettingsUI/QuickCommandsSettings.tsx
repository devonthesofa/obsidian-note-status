import { PluginSettings, StatusTemplate } from "@/types/pluginSettings";
import React, { useCallback, useMemo } from "react";
import { StatusGroup } from "./StatusGroup";
import { NoStatusesMessage } from "./NoStatusesMessage";

export type Props = {
	settings: PluginSettings;
	onChange: (key: keyof PluginSettings, value: unknown) => void;
};

type GroupedStatuses = {
	customStatuses: PluginSettings["customStatuses"];
	templateGroups: Array<{
		template: StatusTemplate;
		statuses: PluginSettings["customStatuses"];
	}>;
};

export const QuickCommandsSettings: React.FC<Props> = ({
	settings,
	onChange,
}) => {
	const groupedStatuses = useMemo((): GroupedStatuses => {
		const customStatuses = settings.customStatuses.filter(
			(s) => s.name !== "unknown",
		);
		const templateGroups = [];
		if (!settings.useCustomStatusesOnly) {
			for (const templateId of settings.enabledTemplates) {
				const template = settings.templates.find(
					(t) => t.id === templateId,
				);
				if (template) {
					const statuses = template.statuses.filter(
						(s) => s.name !== "unknown",
					);
					if (statuses.length > 0) {
						templateGroups.push({ template, statuses });
					}
				}
			}
		}
		return { customStatuses, templateGroups };
	}, [settings]);

	const currentQuickCommands = settings.quickStatusCommands || [];

	const handleQuickCommandToggle = useCallback(
		(statusName: string, enabled: boolean) => {
			const updatedCommands = enabled
				? [
						...currentQuickCommands.filter(
							(cmd) => cmd !== statusName,
						),
						statusName,
					]
				: currentQuickCommands.filter((cmd) => cmd !== statusName);
			onChange("quickStatusCommands", updatedCommands);
		},
		[currentQuickCommands, onChange],
	);

	const hasAnyStatuses =
		groupedStatuses.customStatuses.length > 0 ||
		groupedStatuses.templateGroups.length > 0;

	return (
		<div className="quick-commands-settings">
			<h3>Quick status commands</h3>
			<p>
				Select which statuses should have dedicated commands in the
				command palette. These can be assigned hotkeys for quick access.
			</p>
			<div className="quick-commands-container">
				{!hasAnyStatuses ? (
					<NoStatusesMessage />
				) : (
					<>
						{groupedStatuses.customStatuses.length > 0 && (
							<StatusGroup
								statuses={groupedStatuses.customStatuses}
								title="Custom Statuses"
								description="Your manually defined statuses"
								currentQuickCommands={currentQuickCommands}
								onToggle={handleQuickCommandToggle}
							/>
						)}
						{groupedStatuses.templateGroups.map(
							({ template, statuses }) => (
								<StatusGroup
									key={template.id}
									statuses={statuses}
									title={template.name}
									description={template.description}
									currentQuickCommands={currentQuickCommands}
									onToggle={handleQuickCommandToggle}
								/>
							),
						)}
					</>
				)}
			</div>
		</div>
	);
};
