/**
 * Event handlers setup and cleanup for the dropdown
 */

/**
 * Setup event handlers for the dropdown
 */
export function setupDropdownEvents(options: {
  clickOutsideHandler: (e: MouseEvent) => void,
  escapeKeyHandler: (e: KeyboardEvent) => void
}): void {
  const { clickOutsideHandler, escapeKeyHandler } = options;
  
  document.addEventListener('click', clickOutsideHandler);
  document.addEventListener('keydown', escapeKeyHandler);
}

/**
 * Remove dropdown event handlers
 */
export function removeDropdownEvents(options: {
  clickOutsideHandler: (e: MouseEvent) => void,
  escapeKeyHandler: (e: KeyboardEvent) => void
}): void {
  const { clickOutsideHandler, escapeKeyHandler } = options;
  
  document.removeEventListener('click', clickOutsideHandler);
  document.removeEventListener('keydown', escapeKeyHandler);
}