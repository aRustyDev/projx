/**
 * ShortcutManager - Global keyboard shortcut management
 * @module lib/shortcuts/ShortcutManager
 *
 * Provides centralized keyboard shortcut registration and handling
 * with context awareness (ignores shortcuts when in inputs).
 */

export interface ShortcutConfig {
	key: string;
	ctrl?: boolean;
	alt?: boolean;
	shift?: boolean;
	meta?: boolean;
	description: string;
	category?: string;
}

export interface ShortcutHandler {
	config: ShortcutConfig;
	handler: () => void;
}

export interface ShortcutManagerOptions {
	/** Elements that should ignore shortcuts (in addition to inputs) */
	ignoreElements?: string[];
}

/**
 * Normalize a key combination to a consistent string format
 */
function normalizeKey(config: ShortcutConfig): string {
	const parts: string[] = [];
	if (config.ctrl) parts.push('ctrl');
	if (config.alt) parts.push('alt');
	if (config.shift) parts.push('shift');
	if (config.meta) parts.push('meta');
	parts.push(config.key.toLowerCase());
	return parts.join('+');
}

/**
 * Check if an element is an input-like element
 */
function isInputElement(element: Element | null): boolean {
	if (!element) return false;

	const tagName = element.tagName?.toLowerCase();
	if (!tagName) return false;
	if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
		return true;
	}

	// Check for contenteditable
	if (element.getAttribute('contenteditable') === 'true') {
		return true;
	}

	return false;
}

/**
 * ShortcutManager class for handling global keyboard shortcuts
 */
export class ShortcutManager {
	private shortcuts: Map<string, ShortcutHandler> = new Map();
	private ignoreElements: string[];
	private boundHandler: ((event: KeyboardEvent) => void) | null = null;
	private enabled: boolean = true;

	constructor(options: ShortcutManagerOptions = {}) {
		this.ignoreElements = options.ignoreElements ?? [];
	}

	/**
	 * Register a keyboard shortcut
	 * @returns true if registered, false if already exists
	 */
	register(config: ShortcutConfig, handler: () => void): boolean {
		const key = normalizeKey(config);

		if (this.shortcuts.has(key)) {
			return false;
		}

		this.shortcuts.set(key, { config, handler });
		return true;
	}

	/**
	 * Unregister a keyboard shortcut
	 * @returns true if unregistered, false if didn't exist
	 */
	unregister(config: ShortcutConfig): boolean {
		const key = normalizeKey(config);
		return this.shortcuts.delete(key);
	}

	/**
	 * Check if a shortcut is registered
	 */
	has(config: ShortcutConfig): boolean {
		const key = normalizeKey(config);
		return this.shortcuts.has(key);
	}

	/**
	 * Get all registered shortcuts
	 */
	getAll(): ShortcutHandler[] {
		return Array.from(this.shortcuts.values());
	}

	/**
	 * Get shortcuts grouped by category
	 */
	getByCategory(): Map<string, ShortcutHandler[]> {
		const categories = new Map<string, ShortcutHandler[]>();

		for (const handler of this.shortcuts.values()) {
			const category = handler.config.category ?? 'General';
			if (!categories.has(category)) {
				categories.set(category, []);
			}
			categories.get(category)!.push(handler);
		}

		return categories;
	}

	/**
	 * Enable shortcut handling
	 */
	enable(): void {
		this.enabled = true;
	}

	/**
	 * Disable shortcut handling
	 */
	disable(): void {
		this.enabled = false;
	}

	/**
	 * Check if shortcuts are enabled
	 */
	isEnabled(): boolean {
		return this.enabled;
	}

	/**
	 * Start listening for keyboard events
	 */
	start(): void {
		if (this.boundHandler) return;

		this.boundHandler = this.handleKeyDown.bind(this);
		if (typeof document !== 'undefined') {
			document.addEventListener('keydown', this.boundHandler);
		}
	}

	/**
	 * Stop listening for keyboard events
	 */
	stop(): void {
		if (!this.boundHandler) return;

		if (typeof document !== 'undefined') {
			document.removeEventListener('keydown', this.boundHandler);
		}
		this.boundHandler = null;
	}

	/**
	 * Handle keydown events
	 */
	private handleKeyDown(event: KeyboardEvent): void {
		if (!this.enabled) return;

		// Check if we should ignore this event
		const target = event.target as Element | null;
		if (isInputElement(target)) return;

		// Check custom ignore elements
		if (target && this.ignoreElements.some((selector) => target.matches(selector))) {
			return;
		}

		// Build the key string from the event
		const parts: string[] = [];
		if (event.ctrlKey) parts.push('ctrl');
		if (event.altKey) parts.push('alt');
		if (event.shiftKey) parts.push('shift');
		if (event.metaKey) parts.push('meta');
		parts.push(event.key.toLowerCase());

		const key = parts.join('+');

		// Find and execute the handler
		const shortcut = this.shortcuts.get(key);
		if (shortcut) {
			event.preventDefault();
			shortcut.handler();
		}
	}

	/**
	 * Clear all registered shortcuts
	 */
	clear(): void {
		this.shortcuts.clear();
	}
}

/**
 * Default shortcuts for the application
 */
export const DEFAULT_SHORTCUTS: ShortcutConfig[] = [
	{ key: 'j', description: 'Move selection down', category: 'Navigation' },
	{ key: 'k', description: 'Move selection up', category: 'Navigation' },
	{ key: 'Enter', description: 'Open selected issue', category: 'Navigation' },
	{ key: 'c', description: 'Create new issue', category: 'Actions' },
	{ key: 'n', description: 'Create new issue', category: 'Actions' },
	{ key: 'e', description: 'Edit selected issue', category: 'Actions' },
	{ key: 'Escape', description: 'Close modal / Cancel', category: 'General' },
	{ key: '/', description: 'Focus search', category: 'General' },
	{ key: '?', description: 'Show keyboard shortcuts', category: 'Help' }
];

// Singleton instance for app-wide shortcut management
let instance: ShortcutManager | null = null;

/**
 * Get the global ShortcutManager instance
 */
export function getShortcutManager(): ShortcutManager {
	if (!instance) {
		instance = new ShortcutManager();
	}
	return instance;
}

/**
 * Reset the global instance (for testing)
 */
export function resetShortcutManager(): void {
	if (instance) {
		instance.stop();
		instance.clear();
	}
	instance = null;
}
