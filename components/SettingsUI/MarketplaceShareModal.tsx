import React, { useState, useCallback } from "react";
import { StatusTemplate } from "@/types/pluginSettings";
import { ObsidianIcon } from "../atoms/ObsidianIcon";

interface MarketplaceShareModalProps {
	template: StatusTemplate;
	onClose: () => void;
}

export const MarketplaceShareModal: React.FC<MarketplaceShareModalProps> = ({
	template,
	onClose,
}) => {
	const [copied, setCopied] = useState(false);

	const marketplaceTemplate = {
		...template,
		id: template.id.replace(/^custom-/, ""),
		statuses: template.statuses.map((s) => ({
			...s,
			templateId: template.id.replace(/^custom-/, ""),
		})),
	};

	const jsonString = JSON.stringify(marketplaceTemplate, null, 2);
	const filename = `${marketplaceTemplate.id}.json`;
	const githubUrl = `https://github.com/devonthesofa/obsidian-note-status/new/master/templates?filename=${filename}`;

	const handleCopy = useCallback(() => {
		navigator.clipboard.writeText(jsonString);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	}, [jsonString]);

	return (
		<div className="template-editor-modal marketplace-share-modal">
			<div className="template-editor-modal__header">
				<h2>Submit to Marketplace</h2>
			</div>

			<div className="template-editor-modal__content">
				<p>
					To share your template with the community, follow these
					simple steps:
				</p>

				<ol className="marketplace-steps">
					<li>
						<strong>Copy</strong> the template data below.
					</li>
					<li>
						<strong>Click</strong> the button to open GitHub.
					</li>
					<li>
						<strong>Paste</strong> the content and click "Propose
						new file".
					</li>
				</ol>

				<div className="marketplace-json-preview">
					<div className="json-preview-header">
						<span>{filename}</span>
						<button
							className={`copy-btn ${copied ? "success" : ""}`}
							onClick={handleCopy}
						>
							<ObsidianIcon
								name={copied ? "check" : "copy"}
								size={14}
							/>
							{copied ? "Copied!" : "Copy JSON"}
						</button>
					</div>
					<pre>{jsonString}</pre>
				</div>
			</div>

			<div className="template-editor-modal__actions">
				<a
					href={githubUrl}
					target="_blank"
					rel="noopener noreferrer"
					className="mod-cta marketplace-github-link"
					onClick={() => {
						// Optionally close or just stay open
					}}
				>
					<ObsidianIcon name="external-link" size={16} />
					Open GitHub to Submit
				</a>
				<button onClick={onClose}>Close</button>
			</div>
		</div>
	);
};
