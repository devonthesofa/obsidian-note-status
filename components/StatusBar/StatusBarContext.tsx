import { createContext, useContext, ReactNode } from "react";
import { NoteStatus } from "@/types/noteStatus";

interface StatusBarContextValue {
	onStatusClick: (status: NoteStatus) => void;
}

const StatusBarContext = createContext<StatusBarContextValue>({
	onStatusClick: () => {},
});

export const useStatusBarContext = () => useContext(StatusBarContext);

export type Props = {
	children: ReactNode;
	onStatusClick: StatusBarContextValue["onStatusClick"];
};

export const StatusBarProvider: React.FC<Props> = ({
	children,
	onStatusClick,
}) => {
	const value = {
		onStatusClick: (status: NoteStatus) => {
			onStatusClick(status);
		},
	};

	return (
		<StatusBarContext.Provider value={value}>
			{children}
		</StatusBarContext.Provider>
	);
};
