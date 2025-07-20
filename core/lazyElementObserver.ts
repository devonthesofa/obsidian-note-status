/**
 * Interface for element processing callbacks
 */
export interface IElementProcessor {
	processElement(element: HTMLElement): void;
}

/**
 * Service for observing DOM changes in file explorer
 * Single responsibility: DOM observation and element detection
 */
export class LazyElementObserver {
	private mutationObserver: MutationObserver | null = null;
	private intersectionObserver: IntersectionObserver | null = null;
	private processedElements = new WeakSet<HTMLElement>();
	private elementProcessor: IElementProcessor;

	private readonly INTERSECTION_ROOT_MARGIN = "50px";
	private readonly FILE_SELECTOR = "[data-path]";

	constructor(elementProcessor: IElementProcessor) {
		this.elementProcessor = elementProcessor;
	}

	/**
	 * Sets up observers for a container element
	 */
	setupObservers(container: Element): void {
		this.cleanup();

		this.initializeIntersectionObserver();
		this.initializeMutationObserver(container);
		this.observeExistingElements(container);
	}

	/**
	 * Marks element as unprocessed for re-processing
	 */
	markElementForReprocessing(element: HTMLElement): void {
		this.processedElements.delete(element);
	}

	/**
	 * Cleanup all observers and reset state
	 */
	cleanup(): void {
		this.disconnectObservers();
		this.resetState();
	}

	/**
	 * Initializes intersection observer for visibility detection
	 */
	private initializeIntersectionObserver(): void {
		this.intersectionObserver = new IntersectionObserver(
			(entries) => this.handleIntersectionEntries(entries),
			{ rootMargin: this.INTERSECTION_ROOT_MARGIN },
		);
	}

	/**
	 * Handles intersection observer entries
	 */
	private handleIntersectionEntries(
		entries: IntersectionObserverEntry[],
	): void {
		entries.forEach((entry) => {
			if (entry.isIntersecting) {
				const element = entry.target as HTMLElement;
				this.processElementIfNeeded(element);
			}
		});
	}

	/**
	 * Processes element if not already processed
	 */
	private processElementIfNeeded(element: HTMLElement): void {
		if (!this.processedElements.has(element)) {
			this.elementProcessor.processElement(element);
			this.processedElements.add(element);
		}
	}

	/**
	 * Initializes mutation observer for DOM changes
	 */
	private initializeMutationObserver(container: Element): void {
		this.mutationObserver = new MutationObserver((mutations) =>
			this.handleMutations(mutations),
		);

		this.mutationObserver.observe(container, {
			childList: true,
			subtree: true,
		});
	}

	/**
	 * Handles mutation observer entries
	 */
	private handleMutations(mutations: MutationRecord[]): void {
		mutations.forEach((mutation) => {
			mutation.addedNodes.forEach((node) => {
				if (node.nodeType === Node.ELEMENT_NODE) {
					this.handleAddedElement(node as HTMLElement);
				}
			});
		});
	}

	/**
	 * Handles newly added DOM elements
	 */
	private handleAddedElement(element: HTMLElement): void {
		this.observeElement(element);

		const fileElements = element.querySelectorAll(this.FILE_SELECTOR);
		fileElements.forEach((el) => this.observeElement(el as HTMLElement));
	}

	/**
	 * Observes existing elements in container
	 */
	private observeExistingElements(container: Element): void {
		const fileElements = container.querySelectorAll(this.FILE_SELECTOR);
		fileElements.forEach((el) => this.observeElement(el as HTMLElement));
	}

	/**
	 * Starts observing a single element
	 */
	private observeElement(element: HTMLElement): void {
		const dataPath = element.getAttribute("data-path");
		if (dataPath && this.intersectionObserver) {
			this.intersectionObserver.observe(element);
		}
	}

	/**
	 * Disconnects all observers
	 */
	private disconnectObservers(): void {
		this.mutationObserver?.disconnect();
		this.intersectionObserver?.disconnect();
	}

	/**
	 * Resets internal state
	 */
	private resetState(): void {
		this.mutationObserver = null;
		this.intersectionObserver = null;
		this.processedElements = new WeakSet();
	}
}
