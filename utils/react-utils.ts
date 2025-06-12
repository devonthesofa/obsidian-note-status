import { createRoot, Root } from "react-dom/client";

/**
 * Utility functions for React integration with Obsidian plugins
 */
export class ReactUtils {
	private static roots = new Map<HTMLElement, Root>();

	/**
	 * Render a React component into a container element
	 */
	static render(component: React.ReactElement, container: HTMLElement): Root {
		let root = this.roots.get(container);

		if (!root) {
			root = createRoot(container);
			this.roots.set(container, root);
		}

		root.render(component);
		return root;
	}

	/**
	 * Unmount a React component from a container element
	 */
	static unmount(container: HTMLElement): void {
		const root = this.roots.get(container);
		if (root) {
			root.unmount();
			this.roots.delete(container);
		}
	}

	/**
	 * Clean up all React roots
	 */
	static cleanup(): void {
		this.roots.forEach((root) => {
			try {
				root.unmount();
			} catch (error) {
				console.error("Error unmounting React root:", error);
			}
		});
		this.roots.clear();
	}
}
