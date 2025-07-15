import { ItemView, WorkspaceLeaf } from "obsidian";
import { Root, createRoot } from "react-dom/client";
import { StatusDashboard } from "@/components/StatusDashboard/StatusDashboard";

export const VIEW_TYPE_STATUS_DASHBOARD = "status-dashboard-view";

export class StatusDashboardView extends ItemView {
	root: Root | null = null;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_STATUS_DASHBOARD;
	}

	getDisplayText() {
		return "Status Dashboard";
	}

	getIcon() {
		return "bar-chart-2";
	}

	async onOpen() {
		const container = this.containerEl.children[1];
		container.empty();
		container.addClass("status-dashboard-view-container");

		this.root = createRoot(container);
		this.root.render(<StatusDashboard />);
	}

	async onClose() {
		this.root?.unmount();
		this.root = null;
	}
}
