import React, { useState, useMemo } from "react";
import { StatusTemplate } from "@/types/pluginSettings";
import {
	PREDEFINED_TEMPLATES,
	COMMUNITY_TEMPLATES,
} from "@/constants/predefinedTemplates";
import { StatusDisplay } from "../atoms/StatusDisplay";
import { ObsidianIcon } from "../atoms/ObsidianIcon";
import { SearchFilter } from "../atoms/SearchFilter";

interface MarketplaceBrowseModalProps {
	installedTemplates: StatusTemplate[];
	onInstall: (template: StatusTemplate) => void;
	onClose: () => void;
}

export const MarketplaceBrowseModal: React.FC<MarketplaceBrowseModalProps> = ({
	installedTemplates,
	onInstall,
	onClose,
}) => {
	const [searchQuery, setSearchQuery] = useState("");
	const [languageFilter, setLanguageFilter] = useState("");
	const [typeFilter, setTypeFilter] = useState("");

	const allTemplates = useMemo(() => {
		return [...PREDEFINED_TEMPLATES, ...COMMUNITY_TEMPLATES];
	}, []);

	const availableLanguages = useMemo(() => {
		const langs = new Set<string>();
		allTemplates.forEach((t) => {
			if (t.language) langs.add(t.language);
		});
		return Array.from(langs).sort();
	}, [allTemplates]);

	const availableTypes = useMemo(() => {
		const types = new Set<string>();
		allTemplates.forEach((t) => {
			if (t.type) types.add(t.type);
		});
		return Array.from(types).sort();
	}, [allTemplates]);

	const filteredTemplates = useMemo(() => {
		return allTemplates.filter((t) => {
			const matchesSearch =
				t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				t.description.toLowerCase().includes(searchQuery.toLowerCase());

			const matchesLanguage =
				!languageFilter || t.language === languageFilter;
			const matchesType = !typeFilter || t.type === typeFilter;

			return matchesSearch && matchesLanguage && matchesType;
		});
	}, [allTemplates, searchQuery, languageFilter, typeFilter]);

	return (
		<div className="template-editor-modal marketplace-browse-modal">
			<div className="template-editor-modal__header">
				<div className="marketplace-header-content">
					<h2>Template Marketplace</h2>
					<div style={{ display: "flex", gap: "8px" }}>
						<SearchFilter
							value={searchQuery}
							onFilterChange={setSearchQuery}
							placeholder="Search templates..."
						/>
						{availableLanguages.length > 0 && (
							<select
								value={languageFilter}
								onChange={(e) =>
									setLanguageFilter(e.target.value)
								}
								className="dropdown"
							>
								<option value="">All Languages</option>
								{availableLanguages.map((lang) => (
									<option key={lang} value={lang}>
										{lang}
									</option>
								))}
							</select>
						)}
						{availableTypes.length > 0 && (
							<select
								value={typeFilter}
								onChange={(e) => setTypeFilter(e.target.value)}
								className="dropdown"
							>
								<option value="">All Types</option>
								{availableTypes.map((type) => (
									<option key={type} value={type}>
										{type}
									</option>
								))}
							</select>
						)}
					</div>
				</div>
			</div>

			<div className="template-editor-modal__content">
				<div className="marketplace-grid">
					{filteredTemplates.map((template) => {
						const isInstalled = installedTemplates.some(
							(t) =>
								t.name.toLowerCase() ===
								template.name.toLowerCase(),
						);
						return (
							<div key={template.id} className="marketplace-card">
								<div className="marketplace-card-header">
									<div className="marketplace-card-title">
										{template.name}
									</div>
									<div className="marketplace-card-meta">
										<span
											className={`template-badge ${template.isPredefined ? "badge-accent" : "badge-info"}`}
										>
											{template.isPredefined
												? "Built-in"
												: "Community"}
										</span>
										{template.type && (
											<span className="template-badge badge-neutral">
												{template.type}
											</span>
										)}
										{template.language && (
											<span className="template-badge badge-neutral">
												{template.language}
											</span>
										)}
										{template.authorGithub && (
											<div className="marketplace-card-author">
												by{" "}
												<a
													href={`https://github.com/${template.authorGithub}`}
													target="_blank"
													rel="noopener noreferrer"
													onClick={(e) =>
														e.stopPropagation()
													}
												>
													@{template.authorGithub}
												</a>
											</div>
										)}
									</div>
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
