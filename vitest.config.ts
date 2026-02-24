import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
	plugins: [svelte({ hot: !process.env.VITEST })],
	resolve: {
		// Force browser exports for Svelte in tests
		conditions: ['browser', 'development']
	},
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
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
		}
	}
});
