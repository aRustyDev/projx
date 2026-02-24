/**
 * E2E Test Fixtures
 * @module e2e/fixtures/test-fixtures
 *
 * Reusable test fixtures and helpers for Playwright E2E tests.
 */

import { test as base, expect, type Page } from '@playwright/test';

/**
 * Custom test fixture with app-specific helpers
 */
export const test = base.extend<{
	appPage: Page;
}>({
	appPage: async ({ page }, use) => {
		// Navigate to the app and wait for it to be ready
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		await use(page);
	}
});

export { expect };

/**
 * Wait for app to be fully loaded
 */
export async function waitForAppReady(page: Page): Promise<void> {
	await page.waitForLoadState('domcontentloaded');
	// Wait for any hydration to complete
	await page.waitForTimeout(100);
}

/**
 * Test data factory for issues
 */
export function createTestIssue(overrides: Record<string, unknown> = {}) {
	return {
		id: `TEST-${Date.now()}`,
		title: 'Test Issue',
		description: 'Test description',
		status: 'open',
		priority: 2,
		issue_type: 'task',
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		...overrides
	};
}

/**
 * Check if element is visible and enabled
 */
export async function isInteractive(page: Page, selector: string): Promise<boolean> {
	const element = page.locator(selector);
	const isVisible = await element.isVisible();
	const isEnabled = await element.isEnabled();
	return isVisible && isEnabled;
}

/**
 * Keyboard shortcuts helper
 */
export class KeyboardHelper {
	constructor(private page: Page) {}

	async pressShortcut(
		key: string,
		modifiers: { ctrl?: boolean; shift?: boolean; alt?: boolean; meta?: boolean } = {}
	): Promise<void> {
		const keys: string[] = [];
		if (modifiers.ctrl) keys.push('Control');
		if (modifiers.shift) keys.push('Shift');
		if (modifiers.alt) keys.push('Alt');
		if (modifiers.meta) keys.push('Meta');
		keys.push(key);

		await this.page.keyboard.press(keys.join('+'));
	}

	async pressEscape(): Promise<void> {
		await this.page.keyboard.press('Escape');
	}

	async pressEnter(): Promise<void> {
		await this.page.keyboard.press('Enter');
	}

	async pressArrowDown(): Promise<void> {
		await this.page.keyboard.press('ArrowDown');
	}

	async pressArrowUp(): Promise<void> {
		await this.page.keyboard.press('ArrowUp');
	}
}

/**
 * Theme helper for testing theme toggle
 */
export class ThemeHelper {
	constructor(private page: Page) {}

	async getCurrentTheme(): Promise<string> {
		return await this.page.evaluate(() => {
			return document.documentElement.getAttribute('data-theme') ?? 'system';
		});
	}

	async setTheme(theme: 'light' | 'dark' | 'system'): Promise<void> {
		await this.page.evaluate((t) => {
			document.documentElement.setAttribute('data-theme', t);
			localStorage.setItem('theme', t);
		}, theme);
	}

	async getPrefersDark(): Promise<boolean> {
		return await this.page.evaluate(() => {
			return window.matchMedia('(prefers-color-scheme: dark)').matches;
		});
	}
}

/**
 * Modal helper for testing modal interactions
 */
export class ModalHelper {
	constructor(private page: Page) {}

	async isOpen(testId: string): Promise<boolean> {
		return await this.page.locator(`[data-testid="${testId}"]`).isVisible();
	}

	async close(): Promise<void> {
		await this.page.keyboard.press('Escape');
	}

	async clickBackdrop(testId: string): Promise<void> {
		const modal = this.page.locator(`[data-testid="${testId}"]`);
		const box = await modal.boundingBox();
		if (box) {
			// Click outside the modal content
			await this.page.mouse.click(box.x - 10, box.y + box.height / 2);
		}
	}
}
