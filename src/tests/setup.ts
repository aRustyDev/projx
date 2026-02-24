/**
 * Vitest Test Setup
 * @module tests/setup
 *
 * Configures the test environment for Svelte 5 component testing.
 */

import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/svelte';
import { afterEach, vi } from 'vitest';
import { faker } from '@faker-js/faker';

// Set fixed seed for reproducible test data
faker.seed(12345);

// Export faker for use in test files
export { faker };

// Cleanup after each test
afterEach(() => {
	cleanup();
});

// Mock matchMedia for components that use media queries
const mockMatchMedia = vi.fn().mockImplementation((query: string) => ({
	matches: false,
	media: query,
	onchange: null,
	addListener: vi.fn(),
	removeListener: vi.fn(),
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
	dispatchEvent: vi.fn()
}));

vi.stubGlobal('matchMedia', mockMatchMedia);
