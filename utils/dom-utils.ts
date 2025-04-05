/**
 * Utility functions for DOM manipulation
 */

/**
 * Creates a button element with given properties
 */
export function createButton(
	container: HTMLElement,
	text: string,
	cls: string,
	clickHandler: (e: MouseEvent) => void,
	icon?: string
): HTMLButtonElement {
	const button = container.createEl('button', {
		text: text,
		cls: cls
	});

	if (icon) {
		button.innerHTML = icon;
	}

	button.addEventListener('click', clickHandler);
	return button;
}

/**
 * Creates a text input with label
 */
export function createLabeledInput(
	container: HTMLElement,
	id: string,
	labelText: string,
	placeholder: string,
	initialValue: string,
	changeHandler: (value: string) => void
): HTMLInputElement {
	const wrapper = container.createDiv({ cls: 'setting-item' });

	wrapper.createEl('label', {
		text: labelText,
		attr: { for: id }
	});

	const input = wrapper.createEl('input', {
		type: 'text',
		placeholder: placeholder,
		value: initialValue,
		attr: { id: id }
	});

	input.addEventListener('change', () => {
		changeHandler(input.value);
	});

	return input;
}

/**
 * Creates a dropdown select element
 */
export function createSelect(
	container: HTMLElement,
	options: { value: string; text: string; selected?: boolean }[],
	changeHandler: (value: string) => void,
	cls?: string
): HTMLSelectElement {
	const select = container.createEl('select', { cls: cls });

	options.forEach(option => {
		const optionEl = select.createEl('option', {
			text: option.text,
			value: option.value
		});

		if (option.selected) {
			optionEl.selected = true;
		}
	});

	select.addEventListener('change', (e) => {
		changeHandler((e.target as HTMLSelectElement).value);
	});

	return select;
}

/**
 * Adds a toggle switch with label
 */
export function createToggle(
	container: HTMLElement,
	labelText: string,
	initialValue: boolean,
	changeHandler: (value: boolean) => void
): HTMLElement {
	const wrapper = container.createDiv({ cls: 'setting-item-toggle' });

	// Create label
	wrapper.createEl('span', { text: labelText, cls: 'setting-item-label' });

	// Create toggle component
	const toggleContainer = wrapper.createDiv({ cls: 'setting-item-control' });
	const toggle = toggleContainer.createEl('div', { cls: 'checkbox-container' });

	// Create the actual input
	const input = toggle.createEl('input', {
		type: 'checkbox',
		cls: 'checkbox'
	});
	input.checked = initialValue;

	input.addEventListener('change', () => {
		changeHandler(input.checked);
	});

	return wrapper;
}
