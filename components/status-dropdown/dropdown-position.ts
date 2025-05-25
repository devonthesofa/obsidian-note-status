/**
 * Dropdown positioning utilities
 */

/**
 * Position the dropdown
 */
export function positionDropdown(options: {
	dropdownElement: HTMLElement;
	targetEl: HTMLElement;
	position?: { x: number; y: number };
}): void {
	const { dropdownElement, targetEl, position } = options;

	if (position) {
		positionAt(dropdownElement, position.x, position.y);
	} else {
		positionRelativeTo(dropdownElement, targetEl);
	}
}

/**
 * Position the dropdown at specific coordinates
 */
function positionAt(dropdownElement: HTMLElement, x: number, y: number): void {
	dropdownElement.addClass("note-status-popover-fixed");
	dropdownElement.style.setProperty("--pos-x-px", `${x}px`);
	dropdownElement.style.setProperty("--pos-y-px", `${y}px`);

	setTimeout(() => adjustPositionToViewport(dropdownElement), 0);
}

/**
 * Adjust the dropdown position to ensure it's visible in the viewport
 */
function adjustPositionToViewport(dropdownElement: HTMLElement): void {
	const rect = dropdownElement.getBoundingClientRect();

	if (rect.right > window.innerWidth) {
		dropdownElement.addClass("note-status-popover-right");
		dropdownElement.style.setProperty("--right-offset-px", "10px");
	} else {
		dropdownElement.removeClass("note-status-popover-right");
	}

	if (rect.bottom > window.innerHeight) {
		dropdownElement.addClass("note-status-popover-bottom");
		dropdownElement.style.setProperty("--bottom-offset-px", "10px");
	} else {
		dropdownElement.removeClass("note-status-popover-bottom");
	}

	const maxHeight = window.innerHeight - rect.top - 20;
	dropdownElement.style.setProperty("--max-height-px", `${maxHeight}px`);
}

/**
 * Position the dropdown relative to a target element
 */
function positionRelativeTo(
	dropdownElement: HTMLElement,
	targetEl: HTMLElement,
): void {
	dropdownElement.addClass("note-status-popover-fixed");

	const targetRect = targetEl.getBoundingClientRect();

	dropdownElement.style.setProperty(
		"--pos-y-px",
		`${targetRect.bottom + 5}px`,
	);
	dropdownElement.style.setProperty("--pos-x-px", `${targetRect.left}px`);

	setTimeout(() => adjustRelativePosition(dropdownElement, targetRect), 0);
}

/**
 * Adjust position when positioned relative to an element
 */
function adjustRelativePosition(
	dropdownElement: HTMLElement,
	targetRect: DOMRect,
): void {
	const rect = dropdownElement.getBoundingClientRect();

	if (rect.right > window.innerWidth) {
		dropdownElement.addClass("note-status-popover-right");
		dropdownElement.style.setProperty(
			"--right-offset-px",
			`${window.innerWidth - targetRect.right}px`,
		);
	} else {
		dropdownElement.removeClass("note-status-popover-right");
	}

	if (rect.bottom > window.innerHeight) {
		dropdownElement.addClass("note-status-popover-bottom");
		dropdownElement.style.setProperty(
			"--bottom-offset-px",
			`${window.innerHeight - targetRect.top + 5}px`,
		);
	} else {
		dropdownElement.removeClass("note-status-popover-bottom");
	}

	const maxHeight = window.innerHeight - rect.top - 20;
	dropdownElement.style.setProperty("--max-height-px", `${maxHeight}px`);
}

/**
 * Create a dummy target element for positioning
 */
export function createDummyTarget(position: {
	x: number;
	y: number;
}): HTMLElement {
	const dummyTarget = document.createElement("div");
	dummyTarget.addClass("note-status-dummy-target");
	dummyTarget.style.setProperty("--pos-x-px", `${position.x}px`);
	dummyTarget.style.setProperty("--pos-y-px", `${position.y}px`);
	document.body.appendChild(dummyTarget);
	return dummyTarget;
}
