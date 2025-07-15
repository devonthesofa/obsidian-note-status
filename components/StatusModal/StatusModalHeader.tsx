import { FC } from "react";

export type Props = {
	filesQuantity: number;
};
export const StatusModalHeader: FC<Props> = ({ filesQuantity }) => {
	// TODO: Move the style to its css file
	return (
		<div className="modal-header" style={{ marginBottom: "16px" }}>
			<div
				className="modal-title-container"
				style={{
					display: "flex",
					alignItems: "center",
					gap: "8px",
				}}
			>
				<div className="modal-title-icon">
					<svg
						width="16"
						height="16"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
						<line x1="7" y1="7" x2="7.01" y2="7" />
					</svg>
				</div>
				<span className="modal-title-text">Note status</span>
				{filesQuantity > 1 && (
					<span
						className="modal-title-count"
						style={{
							opacity: "0.7",
							fontSize: "var(--font-ui-smaller)",
						}}
					>
						({filesQuantity} files)
					</span>
				)}
			</div>
		</div>
	);
};
