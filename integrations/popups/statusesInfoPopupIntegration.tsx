import { createRoot, Root } from "react-dom/client";
import { GroupedStatuses } from "@/types/noteStatus";
import { StatusFileInfoPopup } from "@/components/StatusFileInfoPopup/StatusFileInfoPopup";
import settingsService from "@/core/settingsService";

export class StatusesInfoPopup {
	private root: Root | null = null;
	private static instance: StatusesInfoPopup | null = null;
	private element: HTMLElement | null = null;
	private statuses: GroupedStatuses;

	private constructor() {}

	static open(statuses: GroupedStatuses) {
		// Always ensure previous instance is cleaned up before showing or when disabled
		StatusesInfoPopup.close();

		const isEnabled =
			settingsService.settings?.enableStatusOverviewPopup ?? true;
		if (!isEnabled) {
			return;
		}
		StatusesInfoPopup.instance = new StatusesInfoPopup();
		StatusesInfoPopup.instance.statuses = statuses;
		StatusesInfoPopup.instance.show();
	}

	static close() {
		if (StatusesInfoPopup.instance) {
			StatusesInfoPopup.instance.destroy();
			StatusesInfoPopup.instance = null;
		}
	}

	private show() {
		this.element = createDiv({ cls: "" });

		document.body.appendChild(this.element);

		this.root = createRoot(this.element);
		this.root.render(<StatusFileInfoPopup statuses={this.statuses} />);
	}

	private destroy() {
		if (this.root) {
			this.root.unmount();
			this.root = null;
		}
		if (this.element) {
			this.element.remove();
			this.element = null;
		}
	}
}
