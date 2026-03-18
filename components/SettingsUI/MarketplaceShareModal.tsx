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
					Share your template with the community by following these
					steps:
				</p>

				<ol className="marketplace-steps">
					<li>
						<strong>Copy</strong> the template JSON data below.
					</li>
					<li>
						Go to the <strong>templates folder</strong> in the
						official repository:
						<br />
						<a
							href="https://github.com/devonthesofa/obsidian-note-status/tree/master/templates"
							target="_blank"
							rel="noopener noreferrer"
						>
							github.com/devonthesofa/obsidian-note-status/templates
						</a>
					</li>
					<li>
						Click <strong>Add file</strong> &gt;{" "}
						<strong>Create new file</strong>.
					</li>
					<li>
						Name it <code>{filename}</code> and{" "}
						<strong>paste</strong> the content.
					</li>
					<li>
						Click <strong>Propose new file</strong> and submit the
						Pull Request.
					</li>
				</ol>

				<p className="marketplace-note">
					<em>
						Note: Submissions are reviewed by maintainers. Once
						verified, your template will be included in the next
						plugin update for all users!
					</em>
				</p>

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
				<button onClick={onClose}>Close</button>
			</div>
		</div>
	);
};
