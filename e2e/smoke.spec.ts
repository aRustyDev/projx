/**
 * Smoke Tests
 * @module e2e/smoke.spec
 *
 * Basic smoke tests to verify the app loads and functions correctly.
 */

import { test, expect } from '@playwright/test';

test.describe('App Smoke Tests', () => {
	test('homepage loads successfully', async ({ page }) => {
		const response = await page.goto('/');
		expect(response?.status()).toBe(200);
	});

	test('has correct page title', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/ProjX/);
	});

	test('displays main heading', async ({ page }) => {
		await page.goto('/');
		const heading = page.locator('h1');
		await expect(heading).toBeVisible();
		await expect(heading).toHaveText('ProjX');
	});

	test('displays subtitle', async ({ page }) => {
		await page.goto('/');
		const subtitle = page.locator('p');
		await expect(subtitle).toContainText('Unified Beads WebUI');
	});

	test('has proper viewport meta tag', async ({ page }) => {
		await page.goto('/');
		const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
		expect(viewport).toContain('width=device-width');
	});

	test('has description meta tag', async ({ page }) => {
		await page.goto('/');
		const description = await page.locator('meta[name="description"]').getAttribute('content');
		expect(description).toBeTruthy();
	});
});

test.describe('Performance Baselines', () => {
	test('page loads within acceptable time', async ({ page }) => {
		const startTime = Date.now();
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		const loadTime = Date.now() - startTime;

		// Page should load within 5 seconds
		expect(loadTime).toBeLessThan(5000);
	});

	test('no console errors on load', async ({ page }) => {
		const errors: string[] = [];
		page.on('console', (msg) => {
			if (msg.type() === 'error') {
				errors.push(msg.text());
			}
		});

		await page.goto('/');
		await page.waitForLoadState('networkidle');

		// Filter out expected errors (e.g., favicon 404)
		const unexpectedErrors = errors.filter(
			(err) => !err.includes('favicon') && !err.includes('404')
		);

		expect(unexpectedErrors).toHaveLength(0);
	});

	test('no uncaught exceptions', async ({ page }) => {
		const exceptions: Error[] = [];
		page.on('pageerror', (error) => {
			exceptions.push(error);
		});

		await page.goto('/');
		await page.waitForLoadState('networkidle');

		expect(exceptions).toHaveLength(0);
	});
});

test.describe('Responsive Design', () => {
	const viewports = [
		{ name: 'Mobile', width: 375, height: 667 },
		{ name: 'Tablet', width: 768, height: 1024 },
		{ name: 'Desktop', width: 1280, height: 720 },
		{ name: 'Wide', width: 1920, height: 1080 }
	];

	for (const viewport of viewports) {
		test(`renders correctly on ${viewport.name} (${viewport.width}x${viewport.height})`, async ({
			page
		}) => {
			await page.setViewportSize({ width: viewport.width, height: viewport.height });
			await page.goto('/');

			// Main content should be visible
			const heading = page.locator('h1');
			await expect(heading).toBeVisible();

			// Content should be properly centered (container has flex center)
			const container = page.locator('.container');
			await expect(container).toBeVisible();
		});
	}
});

test.describe('Navigation', () => {
	test('refreshing page maintains state', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('h1')).toHaveText('ProjX');

		await page.reload();
		await expect(page.locator('h1')).toHaveText('ProjX');
	});

	test('back/forward navigation works', async ({ page }) => {
		await page.goto('/');
		await expect(page.locator('h1')).toHaveText('ProjX');

		// Navigate somewhere else (if routes exist) or just test history
		await page.evaluate(() => {
			window.history.pushState({}, '', '/?test=1');
		});

		await page.goBack();
		await expect(page.locator('h1')).toHaveText('ProjX');
	});
});
