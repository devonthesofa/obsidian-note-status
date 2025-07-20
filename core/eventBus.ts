import { EventBusEvents, EventName } from "@/types/eventBus";

class EventBus {
	private events: { [K in EventName]: Map<string, EventBusEvents[K]> } = {
		"active-file-change": new Map(),
		"plugin-settings-changed": new Map(),
		"frontmatter-manually-changed": new Map(),
		"triggered-open-modal": new Map(),
	};

	subscribe<T extends EventName>(
		event: T,
		callback: EventBusEvents[T],
		id: string,
	) {
		this.events[event].set(id, callback);
		return () => {
			this.events[event].delete(id);
		};
	}

	unsubscribe(event: EventName, id: string) {
		this.events[event].delete(id);
	}

	publish(
		event: "active-file-change",
		...args: Parameters<EventBusEvents["active-file-change"]>
	): void;
	publish(
		event: "plugin-settings-changed",
		...args: Parameters<EventBusEvents["plugin-settings-changed"]>
	): void;
	publish(
		event: "frontmatter-manually-changed",
		...args: Parameters<EventBusEvents["frontmatter-manually-changed"]>
	): void;
	publish(
		event: "triggered-open-modal",
		...args: Parameters<EventBusEvents["triggered-open-modal"]>
	): void;
	publish(event: EventName, ...args: unknown[]) {
		const callbacks = this.events[event];
		callbacks.forEach((callback) => {
			(callback as (...args: unknown[]) => void)(...args);
		});
	}
}

export default new EventBus();
