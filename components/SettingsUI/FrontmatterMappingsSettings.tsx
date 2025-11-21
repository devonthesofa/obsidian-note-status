import React, { useMemo } from "react";
import {
	PluginSettings,
	StatusFrontmatterMapping,
} from "@/types/pluginSettings";

type Props = {
	settings: PluginSettings;
	onChange: (key: keyof PluginSettings, value: unknown) => void;
};

type StatusOption = {
	label: string;
	value: string;
};

const isStatusMapping = (
	mapping: StatusFrontmatterMapping,
): mapping is StatusFrontmatterMapping & { scope: "status" } =>
	mapping.scope === "status";

const generateId = () =>
	typeof crypto !== "undefined" && crypto.randomUUID
		? crypto.randomUUID()
		: `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const sanitizeKeys = (raw: string): string[] =>
	raw
		.split(",")
		.map((key) => key.trim())
		.filter((key) => Boolean(key));

const buildStatusIdentifier = (
	templateId: string | undefined,
	statusName: string,
): string => {
	if (!templateId) {
		return statusName;
	}
	return `${templateId}:${statusName}`;
};

export const FrontmatterMappingsSettings: React.FC<Props> = ({
	settings,
	onChange,
}) => {
	const mappings = settings.statusFrontmatterMappings || [];

	const templateOptions = useMemo(
		() =>
			(settings.templates || []).map((template) => ({
				value: template.id,
				label: template.name || template.id,
			})),
		[settings.templates],
	);

	const statusOptions = useMemo<StatusOption[]>(() => {
		const templateStatuses =
			settings.templates?.flatMap((template) =>
				template.statuses.map((status) => ({
					value: buildStatusIdentifier(template.id, status.name),
					label: `${status.name} (${template.name || template.id})`,
				})),
			) || [];

		const customStatuses =
			settings.customStatuses?.map((status) => ({
				value: status.name,
				label: `${status.name} (Custom)`,
			})) || [];

		return [...templateStatuses, ...customStatuses];
	}, [settings.templates, settings.customStatuses]);

	const updateMappings = (nextMappings: StatusFrontmatterMapping[]) => {
		onChange("statusFrontmatterMappings", nextMappings);
	};

	const handleMappingChange = (
		id: string,
		updater: (
			mapping: StatusFrontmatterMapping,
		) => StatusFrontmatterMapping,
	) => {
		updateMappings(
			mappings.map((mapping) =>
				mapping.id === id ? updater(mapping) : mapping,
			),
		);
	};

	const handleScopeChange = (
		id: string,
		scope: StatusFrontmatterMapping["scope"],
	) => {
		handleMappingChange(id, (mapping) => {
			const frontmatterKeys = mapping.frontmatterKeys || [];

			if (scope === "template") {
				const templateId =
					mapping.scope === "template"
						? mapping.templateId
						: templateOptions[0]?.value || "";

				return {
					id: mapping.id,
					scope: "template",
					templateId,
					frontmatterKeys,
				};
			}

			const defaultStatusOption = statusOptions[0];
			const templateId = isStatusMapping(mapping)
				? mapping.templateId
				: defaultStatusOption?.value.includes(":")
					? defaultStatusOption.value.split(":", 2)[0]
					: undefined;
			const statusName = isStatusMapping(mapping)
				? mapping.statusName || ""
				: defaultStatusOption?.value?.split(":")?.pop() || "";

			return {
				id: mapping.id,
				scope: "status",
				templateId,
				statusName,
				frontmatterKeys,
			};
		});
	};

	const handleTemplateChange = (id: string, templateId: string) => {
		handleMappingChange(id, (mapping) => ({
			...mapping,
			scope: "template",
			templateId,
		}));
	};

	const handleStatusChange = (id: string, identifier: string) => {
		const [maybeTemplateId, name] = identifier.includes(":")
			? identifier.split(":", 2)
			: [undefined, identifier];
		handleMappingChange(id, (mapping) => ({
			...mapping,
			templateId: maybeTemplateId,
			statusName: name,
			scope: "status",
		}));
	};

	const handleKeysChange = (id: string, raw: string) => {
		const keys = sanitizeKeys(raw);
		handleMappingChange(id, (mapping) => ({
			...mapping,
			frontmatterKeys: keys,
		}));
	};

	const handleRemove = (id: string) => {
		updateMappings(mappings.filter((mapping) => mapping.id !== id));
	};

	const handleAdd = () => {
		const newMapping: StatusFrontmatterMapping = {
			id: generateId(),
			scope: "template",
			templateId: templateOptions[0]?.value || "",
			frontmatterKeys: [],
		};
		updateMappings([...mappings, newMapping]);
	};

	return (
		<div className="status-mapping-list">
			{mappings.length === 0 && (
				<div className="status-mapping-empty">
					No mappings configured yet.
				</div>
			)}
			{mappings.map((mapping) => {
				const currentKeys = mapping.frontmatterKeys || [];
				const keysValue = currentKeys.join(", ");
				const selectedStatus =
					mapping.scope === "status"
						? buildStatusIdentifier(
								mapping.templateId,
								mapping.statusName || "",
							)
						: undefined;

				return (
					<div className="status-mapping-row" key={mapping.id}>
						<div className="status-mapping-row__fields">
							<div className="status-mapping-field">
								<label>Target type</label>
								<select
									value={mapping.scope}
									onChange={(event) =>
										handleScopeChange(
											mapping.id,
											event.target
												.value as StatusFrontmatterMapping["scope"],
										)
									}
								>
									<option value="template">Template</option>
									<option value="status">
										Specific status
									</option>
								</select>
							</div>

							{mapping.scope === "template" ? (
								<div className="status-mapping-field">
									<label>Template</label>
									<select
										value={mapping.templateId || ""}
										onChange={(event) =>
											handleTemplateChange(
												mapping.id,
												event.target.value,
											)
										}
									>
										{templateOptions.length === 0 && (
											<option value="">
												No templates available
											</option>
										)}
										{templateOptions.map((template) => (
											<option
												value={template.value}
												key={template.value}
											>
												{template.label}
											</option>
										))}
									</select>
								</div>
							) : (
								<div className="status-mapping-field">
									<label>Status</label>
									<select
										value={selectedStatus || ""}
										onChange={(event) =>
											handleStatusChange(
												mapping.id,
												event.target.value,
											)
										}
									>
										{statusOptions.length === 0 && (
											<option value="">
												No statuses available
											</option>
										)}
										{statusOptions.map((option) => (
											<option
												value={option.value}
												key={option.value}
											>
												{option.label}
											</option>
										))}
									</select>
								</div>
							)}

							<div className="status-mapping-field status-mapping-field--keys">
								<label>Frontmatter keys</label>
								<input
									type="text"
									placeholder="status, project-status"
									value={keysValue}
									onChange={(event) =>
										handleKeysChange(
											mapping.id,
											event.target.value,
										)
									}
								/>
							</div>
						</div>

						<div className="status-mapping-row__actions">
							<button
								type="button"
								className="status-mapping-remove-btn"
								onClick={() => handleRemove(mapping.id)}
							>
								Remove
							</button>
						</div>
					</div>
				);
			})}

			<button
				type="button"
				className="status-mapping-add-btn"
				onClick={handleAdd}
			>
				Add mapping
			</button>
		</div>
	);
};
