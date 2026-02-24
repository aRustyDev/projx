import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';

const dirname =
	typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
	plugins: [
		svelte({
			hot: !process.env.VITEST
		})
	],
	resolve: {
		// Force browser exports for Svelte in tests
		conditions: ['browser', 'development']
	},
	test: {
		// Default project configuration (unit tests)
		include: ['src/**/*.{test,spec}.{js,ts}'],
		exclude: ['src/stories/**'],
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./src/tests/setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html', 'lcov'],
			exclude: ['node_modules/', '.svelte-kit/', 'src/**/*.d.ts', 'src/**/*.test.ts'],
			thresholds: {
				lines: 70,
				functions: 65,
				branches: 75,
				statements: 70
			}
		},
		// Named projects for selective test running
		projects: [
			{
				// Unit tests with jsdom (default: bun run test:unit)
				extends: true,
				test: {
					name: 'unit',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/stories/**'],
					environment: 'jsdom'
				}
			},
			{
				// Storybook tests with real browser (bun run test:storybook)
				extends: true,
				plugins: [
					storybookTest({
						configDir: path.join(dirname, '.storybook')
					})
				],
				test: {
					name: 'storybook',
					browser: {
						enabled: true,
						headless: true,
						provider: playwright({}),
						instances: [{ browser: 'chromium' }]
					},
					setupFiles: ['.storybook/vitest.setup.ts']
				}
			}
		]
	}
});
