import { FC } from "react";

export type Props = {
	onEnableClick: () => void;
};

export const StatusBarEnableButton: FC<Props> = ({ onEnableClick }) => {
	return (
		<span
			className="status-bar-item-icon status-bar-enable-button"
			data-tooltip-position="top"
			onClick={onEnableClick}
		>
			📊
		</span>
	);
};
