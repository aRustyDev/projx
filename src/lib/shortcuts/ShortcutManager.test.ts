/**
 * ShortcutManager Tests
 * @module lib/shortcuts/ShortcutManager.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	ShortcutManager,
	getShortcutManager,
	resetShortcutManager,
	DEFAULT_SHORTCUTS
} from './ShortcutManager.js';

describe('ShortcutManager', () => {
	let manager: ShortcutManager;

	beforeEach(() => {
		manager = new ShortcutManager();
	});

	afterEach(() => {
		manager.stop();
		manager.clear();
	});

	describe('registration', () => {
		it('registers shortcuts with handlers', () => {
			const handler = vi.fn();
			const result = manager.register({ key: 'a', description: 'Test' }, handler);

			expect(result).toBe(true);
			expect(manager.has({ key: 'a', description: 'Test' })).toBe(true);
		});

		it('prevents duplicate registrations', () => {
			const handler1 = vi.fn();
			const handler2 = vi.fn();

			manager.register({ key: 'a', description: 'Test' }, handler1);
			const result = manager.register({ key: 'a', description: 'Test' }, handler2);

			expect(result).toBe(false);
		});

		it('unregisters shortcuts', () => {
			const handler = vi.fn();
			manager.register({ key: 'a', description: 'Test' }, handler);

			const result = manager.unregister({ key: 'a', description: 'Test' });

			expect(result).toBe(true);
			expect(manager.has({ key: 'a', description: 'Test' })).toBe(false);
		});

		it('handles modifier keys', () => {
			const handler = vi.fn();
			manager.register({ key: 'a', ctrl: true, shift: true, description: 'Test' }, handler);

			expect(manager.has({ key: 'a', ctrl: true, shift: true, description: 'Test' })).toBe(true);
			// Different modifiers = different shortcut
			expect(manager.has({ key: 'a', description: 'Test' })).toBe(false);
		});

		it('normalizes key to lowercase', () => {
			const handler = vi.fn();
			manager.register({ key: 'A', description: 'Test' }, handler);

			expect(manager.has({ key: 'a', description: 'Test' })).toBe(true);
		});
	});

	describe('getAll and getByCategory', () => {
		it('returns all registered shortcuts', () => {
			manager.register({ key: 'a', description: 'A' }, vi.fn());
			manager.register({ key: 'b', description: 'B' }, vi.fn());
			manager.register({ key: 'c', description: 'C' }, vi.fn());

			const all = manager.getAll();
			expect(all).toHaveLength(3);
		});

		it('groups shortcuts by category', () => {
			manager.register({ key: 'j', description: 'Down', category: 'Navigation' }, vi.fn());
			manager.register({ key: 'k', description: 'Up', category: 'Navigation' }, vi.fn());
			manager.register({ key: 'c', description: 'Create', category: 'Actions' }, vi.fn());
			manager.register({ key: '?', description: 'Help', category: 'Help' }, vi.fn());

			const byCategory = manager.getByCategory();

			expect(byCategory.get('Navigation')).toHaveLength(2);
			expect(byCategory.get('Actions')).toHaveLength(1);
			expect(byCategory.get('Help')).toHaveLength(1);
		});

		it('uses "General" as default category', () => {
			manager.register({ key: 'a', description: 'Test' }, vi.fn());

			const byCategory = manager.getByCategory();
			expect(byCategory.get('General')).toHaveLength(1);
		});
	});

	describe('enable/disable', () => {
		it('starts enabled by default', () => {
			expect(manager.isEnabled()).toBe(true);
		});

		it('can be disabled', () => {
			manager.disable();
			expect(manager.isEnabled()).toBe(false);
		});

		it('can be re-enabled', () => {
			manager.disable();
			manager.enable();
			expect(manager.isEnabled()).toBe(true);
		});
	});

	describe('keyboard event handling', () => {
		beforeEach(() => {
			manager.start();
		});

		it('calls handler when shortcut is pressed', () => {
			const handler = vi.fn();
			manager.register({ key: 'a', description: 'Test' }, handler);

			const event = new KeyboardEvent('keydown', { key: 'a' });
			document.dispatchEvent(event);

			expect(handler).toHaveBeenCalledTimes(1);
		});

		it('handles modifier keys correctly', () => {
			const handler = vi.fn();
			manager.register({ key: 'a', ctrl: true, description: 'Test' }, handler);

			// Without ctrl - should not trigger
			document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
			expect(handler).not.toHaveBeenCalled();

			// With ctrl - should trigger
			document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a', ctrlKey: true }));
			expect(handler).toHaveBeenCalledTimes(1);
		});

		it('prevents default when shortcut matches', () => {
			const handler = vi.fn();
			manager.register({ key: 'a', description: 'Test' }, handler);

			const event = new KeyboardEvent('keydown', { key: 'a' });
			const preventDefaultSpy = vi.spyOn(event, 'preventDefault');

			document.dispatchEvent(event);

			expect(preventDefaultSpy).toHaveBeenCalled();
		});

		it('does not call handler when disabled', () => {
			const handler = vi.fn();
			manager.register({ key: 'a', description: 'Test' }, handler);
			manager.disable();

			document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));

			expect(handler).not.toHaveBeenCalled();
		});
	});

	describe('input element handling', () => {
		beforeEach(() => {
			manager.start();
		});

		it('ignores shortcuts when typing in input', () => {
			const handler = vi.fn();
			manager.register({ key: 'a', description: 'Test' }, handler);

			const input = document.createElement('input');
			document.body.appendChild(input);
			input.focus();

			const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
			Object.defineProperty(event, 'target', { value: input });
			document.dispatchEvent(event);

			expect(handler).not.toHaveBeenCalled();

			document.body.removeChild(input);
		});

		it('ignores shortcuts when typing in textarea', () => {
			const handler = vi.fn();
			manager.register({ key: 'a', description: 'Test' }, handler);

			const textarea = document.createElement('textarea');
			document.body.appendChild(textarea);

			const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
			Object.defineProperty(event, 'target', { value: textarea });
			document.dispatchEvent(event);

			expect(handler).not.toHaveBeenCalled();

			document.body.removeChild(textarea);
		});

		it('ignores shortcuts in contenteditable elements', () => {
			const handler = vi.fn();
			manager.register({ key: 'a', description: 'Test' }, handler);

			const div = document.createElement('div');
			div.setAttribute('contenteditable', 'true');
			document.body.appendChild(div);

			const event = new KeyboardEvent('keydown', { key: 'a', bubbles: true });
			Object.defineProperty(event, 'target', { value: div });
			document.dispatchEvent(event);

			expect(handler).not.toHaveBeenCalled();

			document.body.removeChild(div);
		});
	});

	describe('start/stop', () => {
		it('starts listening on start()', () => {
			const handler = vi.fn();
			manager.register({ key: 'a', description: 'Test' }, handler);

			// Before start - should not respond
			document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
			expect(handler).not.toHaveBeenCalled();

			manager.start();

			// After start - should respond
			document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
			expect(handler).toHaveBeenCalledTimes(1);
		});

		it('stops listening on stop()', () => {
			const handler = vi.fn();
			manager.register({ key: 'a', description: 'Test' }, handler);
			manager.start();

			document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
			expect(handler).toHaveBeenCalledTimes(1);

			manager.stop();

			document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
			expect(handler).toHaveBeenCalledTimes(1); // Still 1, not 2
		});

		it('is idempotent - multiple starts do not add multiple listeners', () => {
			const handler = vi.fn();
			manager.register({ key: 'a', description: 'Test' }, handler);

			manager.start();
			manager.start();
			manager.start();

			document.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }));
			expect(handler).toHaveBeenCalledTimes(1);
		});
	});

	describe('clear', () => {
		it('removes all registered shortcuts', () => {
			manager.register({ key: 'a', description: 'A' }, vi.fn());
			manager.register({ key: 'b', description: 'B' }, vi.fn());

			manager.clear();

			expect(manager.getAll()).toHaveLength(0);
		});
	});
});

describe('global instance', () => {
	afterEach(() => {
		resetShortcutManager();
	});

	it('returns singleton instance', () => {
		const instance1 = getShortcutManager();
		const instance2 = getShortcutManager();

		expect(instance1).toBe(instance2);
	});

	it('resetShortcutManager clears the instance', () => {
		const instance1 = getShortcutManager();
		instance1.register({ key: 'a', description: 'Test' }, vi.fn());

		resetShortcutManager();

		const instance2 = getShortcutManager();
		expect(instance2).not.toBe(instance1);
		expect(instance2.getAll()).toHaveLength(0);
	});
});

describe('DEFAULT_SHORTCUTS', () => {
	it('includes navigation shortcuts', () => {
		const navShortcuts = DEFAULT_SHORTCUTS.filter((s) => s.category === 'Navigation');
		expect(navShortcuts.some((s) => s.key === 'j')).toBe(true);
		expect(navShortcuts.some((s) => s.key === 'k')).toBe(true);
	});

	it('includes action shortcuts', () => {
		const actionShortcuts = DEFAULT_SHORTCUTS.filter((s) => s.category === 'Actions');
		expect(actionShortcuts.some((s) => s.key === 'c')).toBe(true);
		expect(actionShortcuts.some((s) => s.key === 'e')).toBe(true);
	});

	it('includes help shortcut', () => {
		expect(DEFAULT_SHORTCUTS.some((s) => s.key === '?')).toBe(true);
	});
});
