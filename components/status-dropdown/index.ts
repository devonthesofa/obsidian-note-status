import { DropdownManager } from './dropdown-manager';
import { DropdownOptions } from './types';

// Re-export for public use
export { DropdownManager as StatusDropdown };
export type { DropdownOptions };

// Export default to maintain compatibility with existing code
export default DropdownManager;