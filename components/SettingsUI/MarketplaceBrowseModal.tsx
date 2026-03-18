import React, { useState, useMemo } from "react";
import { StatusTemplate } from "@/types/pluginSettings";
import { PREDEFINED_TEMPLATES } from "@/constants/predefinedTemplates";
import { StatusDisplay } from "../atoms/StatusDisplay";
import { ObsidianIcon } from "../atoms/ObsidianIcon";
import { SearchFilter } from "../atoms/SearchFilter";

interface MarketplaceBrowseModalProps {
	installedIds: string[];
	onInstall: (template: StatusTemplate) => void;
	onClose: () => void;
}

export const MarketplaceBrowseModal: React.FC<MarketplaceBrowseModalProps> = ({
	installedIds,
	onInstall,
	onClose,
}) => {
	const [searchQuery, setSearchQuery] = useState("");

	const filteredTemplates = useMemo(() => {
		return PREDEFINED_TEMPLATES.filter(
			(t) =>
				t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				t.description.toLowerCase().includes(searchQuery.toLowerCase()),
		);
	}, [searchQuery]);

	return (
		<div className="template-editor-modal marketplace-browse-modal">
			<div className="template-editor-modal__header">
				<div className="marketplace-header-content">
					<h2>Template Marketplace</h2>
					<SearchFilter
						value={searchQuery}
						onChange={setSearchQuery}
						placeholder="Search templates..."
					/>
				</div>
			</div>

			<div className="template-editor-modal__content">
				<div className="marketplace-grid">
					{filteredTemplates.map((template) => {
						const isInstalled =
							installedIds.includes(template.id) ||
							installedIds.includes(`custom-${template.id}`);
						return (
							<div key={template.id} className="marketplace-card">
								<div className="marketplace-card-header">
									<div className="marketplace-card-title">
										{template.name}
									</div>
									{template.author && (
										<div className="marketplace-card-author">
											by {template.author}
										</div>
									)}
								</div>
								<div className="marketplace-card-description">
									{template.description}
								</div>
								<div className="marketplace-card-statuses">
									{template.statuses.map((status, idx) => (
										<StatusDisplay
											key={idx}
											status={status}
											variant="template"
										/>
									))}
								</div>
								<div className="marketplace-card-actions">
									<button
										className={`marketplace-install-btn ${
											isInstalled
												? "installed"
												: "mod-cta"
										}`}
										onClick={() =>
											!isInstalled && onInstall(template)
										}
										disabled={isInstalled}
									>
										<ObsidianIcon
											name={
												isInstalled
													? "check"
													: "download"
											}
											size={16}
										/>
										{isInstalled
											? "Installed"
											: "Install Template"}
									</button>
								</div>
							</div>
						);
					})}
				</div>
				{filteredTemplates.length === 0 && (
					<div className="marketplace-empty">
						<ObsidianIcon name="search-slash" size={48} />
						<p>No templates found matching your search.</p>
					</div>
				)}
			</div>

			<div className="template-editor-modal__actions">
				<button onClick={onClose}>Close</button>
			</div>
		</div>
	);
};
