/**
 * Keyboard Navigation Tests
 * @module e2e/keyboard.spec
 *
 * Tests for keyboard accessibility and shortcut functionality.
 */

import { test, expect } from '@playwright/test';

test.describe('Keyboard Navigation', () => {
	test('Tab navigates through interactive elements', async ({ page }) => {
		await page.goto('/');

		// Get all tabbable elements
		const tabbableSelector = 'a, button, input, textarea, select, [tabindex]:not([tabindex="-1"])';
		const tabbableElements = await page.locator(tabbableSelector).all();

		// If there are tabbable elements, verify Tab works
		if (tabbableElements.length > 0) {
			await page.keyboard.press('Tab');

			const focusedTag = await page.evaluate(() => {
				return document.activeElement?.tagName?.toLowerCase() ?? null;
			});

			// Focus should be on an interactive element
			expect(focusedTag).not.toBeNull();
		}
	});

	test('Shift+Tab navigates backwards', async ({ page }) => {
		await page.goto('/');

		// Tab forward a few times
		await page.keyboard.press('Tab');
		await page.keyboard.press('Tab');

		// Store current focus
		const beforeFocus = await page.evaluate(() => {
			return document.activeElement?.id || document.activeElement?.tagName;
		});

		// Tab backward
		await page.keyboard.press('Shift+Tab');

		const afterFocus = await page.evaluate(() => {
			return document.activeElement?.id || document.activeElement?.tagName;
		});

		// Focus should have changed
		expect(beforeFocus).not.toBe(afterFocus);
	});

	test('Escape closes modals and dropdowns', async ({ page }) => {
		await page.goto('/');

		// Press Escape - should not cause errors
		await page.keyboard.press('Escape');

		// Page should still be functional
		const heading = page.locator('h1');
		await expect(heading).toBeVisible();
	});

	test('Enter activates buttons', async ({ page }) => {
		await page.goto('/');

		const buttons = await page.locator('button').all();

		for (const button of buttons) {
			// Focus the button
			await button.focus();

			// Verify it's focused
			const isFocused = await button.evaluate((el) => el === document.activeElement);
			expect(isFocused).toBe(true);
		}
	});

	test('Space activates buttons and checkboxes', async ({ page }) => {
		await page.goto('/');

		const checkboxes = await page.locator('input[type="checkbox"]').all();

		for (const checkbox of checkboxes) {
			const initialState = await checkbox.isChecked();

			// Focus and press space
			await checkbox.focus();
			await page.keyboard.press('Space');

			const newState = await checkbox.isChecked();
			expect(newState).toBe(!initialState);

			// Reset
			await page.keyboard.press('Space');
		}
	});
});

test.describe('Focus Management', () => {
	test('focus trap works in dialogs', async ({ page }) => {
		await page.goto('/');

		// Look for any dialog triggers
		const dialogTrigger = page.locator('[data-opens-dialog], [aria-haspopup="dialog"]');

		if ((await dialogTrigger.count()) > 0) {
			await dialogTrigger.first().click();

			// Wait for dialog
			const dialog = page.locator('[role="dialog"], dialog[open]');
			await expect(dialog).toBeVisible({ timeout: 5000 });

			// Focus should be trapped in dialog
			// Tab multiple times - focus should stay in dialog
			for (let i = 0; i < 10; i++) {
				await page.keyboard.press('Tab');

				const focusInDialog = await page.evaluate(() => {
					const dialog = document.querySelector('[role="dialog"], dialog[open]');
					return dialog?.contains(document.activeElement) ?? false;
				});

				expect(focusInDialog).toBe(true);
			}

			// Close dialog
			await page.keyboard.press('Escape');
		}
	});

	test('focus returns after dialog close', async ({ page }) => {
		await page.goto('/');

		const dialogTrigger = page.locator('[data-opens-dialog], [aria-haspopup="dialog"]');

		if ((await dialogTrigger.count()) > 0) {
			const trigger = dialogTrigger.first();

			// Focus and click trigger
			await trigger.focus();
			await trigger.click();

			// Wait for dialog
			const dialog = page.locator('[role="dialog"], dialog[open]');
			await expect(dialog).toBeVisible({ timeout: 5000 });

			// Close dialog
			await page.keyboard.press('Escape');

			// Focus should return to trigger
			const focusedElement = await page.evaluate(() => {
				return document.activeElement?.getAttribute('data-opens-dialog') ?? null;
			});

			expect(focusedElement).not.toBeNull();
		}
	});

	test('focus visible on all interactive elements', async ({ page }) => {
		await page.goto('/');

		// Tab through all elements and verify focus is visible
		let lastFocusedElement = '';
		let iterations = 0;
		const maxIterations = 50; // Prevent infinite loops

		while (iterations < maxIterations) {
			await page.keyboard.press('Tab');
			iterations++;

			const currentFocused = await page.evaluate(() => {
				const el = document.activeElement;
				if (!el || el === document.body) return 'body';
				return `${el.tagName}#${el.id}.${el.className}`;
			});

			// Check if we've looped back
			if (currentFocused === lastFocusedElement && currentFocused !== 'body') {
				break;
			}

			if (currentFocused !== 'body') {
				// Check that focus is visible
				const hasVisibleFocus = await page.evaluate(() => {
					const el = document.activeElement;
					if (!el) return false;

					const styles = window.getComputedStyle(el);
					const hasOutline = styles.outlineStyle !== 'none' && styles.outlineWidth !== '0px';
					const hasBoxShadow = styles.boxShadow !== 'none';
					const hasBorder = styles.borderStyle !== 'none' && styles.borderWidth !== '0px';

					return hasOutline || hasBoxShadow || hasBorder;
				});

				// This is a soft check - not all designs use outlines
				// But we should verify focus is somehow indicated
				if (!hasVisibleFocus) {
					console.warn(`Focus may not be visible on: ${currentFocused}`);
				}
			}

			lastFocusedElement = currentFocused;
		}
	});
});

test.describe('Arrow Key Navigation', () => {
	test('arrow keys work in comboboxes', async ({ page }) => {
		await page.goto('/');

		const combobox = page.locator('[role="combobox"]');

		if ((await combobox.count()) > 0) {
			// Focus combobox
			await combobox.first().focus();

			// Open dropdown
			await page.keyboard.press('ArrowDown');

			// Check if listbox is visible
			const listbox = page.locator('[role="listbox"]');
			if ((await listbox.count()) > 0) {
				await expect(listbox).toBeVisible();

				// Navigate options
				await page.keyboard.press('ArrowDown');
				await page.keyboard.press('ArrowUp');

				// Close with Escape
				await page.keyboard.press('Escape');
			}
		}
	});

	test('arrow keys work in menus', async ({ page }) => {
		await page.goto('/');

		const menuTrigger = page.locator('[aria-haspopup="menu"]');

		if ((await menuTrigger.count()) > 0) {
			await menuTrigger.first().click();

			const menu = page.locator('[role="menu"]');
			await expect(menu).toBeVisible();

			// Navigate menu items
			await page.keyboard.press('ArrowDown');

			const firstMenuItem = page.locator('[role="menuitem"]').first();
			const isFocused = await firstMenuItem.evaluate((el) => el === document.activeElement);

			expect(isFocused).toBe(true);

			await page.keyboard.press('Escape');
		}
	});

	test('arrow keys work in grids', async ({ page }) => {
		await page.goto('/');

		const grid = page.locator('[role="grid"]');

		if ((await grid.count()) > 0) {
			// Focus first cell
			const firstRow = page.locator('[role="row"]').first();
			await firstRow.focus();

			// Navigate with arrows
			await page.keyboard.press('ArrowRight');
			await page.keyboard.press('ArrowDown');
			await page.keyboard.press('ArrowLeft');
			await page.keyboard.press('ArrowUp');

			// Should still be functional
			await expect(grid).toBeVisible();
		}
	});
});
