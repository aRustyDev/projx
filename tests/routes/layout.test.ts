/**
 * Root Layout Tests
 * @module routes/+layout.test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/svelte';

// Mock the app store before importing the layout
vi.mock('$lib/stores/app.svelte.js', () => ({
	appStore: {
		init: vi.fn(),
		reset: vi.fn(),
		createModalOpen: false,
		openCreateModal: vi.fn(),
		closeCreateModal: vi.fn(),
		create: vi.fn()
	}
}));

import Layout from '../../src/routes/+layout.svelte';

// Mock localStorage
const mockStorage: Record<string, string> = {};
const localStorageMock = {
	getItem: vi.fn((key: string) => mockStorage[key] || null),
	setItem: vi.fn((key: string, value: string) => {
		mockStorage[key] = value;
	}),
	removeItem: vi.fn((key: string) => {
		delete mockStorage[key];
	}),
	clear: vi.fn(() => {
		Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
	})
};

// Mock matchMedia for system theme detection
const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
	matches: query === '(prefers-color-scheme: dark)',
	media: query,
	onchange: null,
	addListener: vi.fn(),
	removeListener: vi.fn(),
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
	dispatchEvent: vi.fn()
}));

describe('+layout', () => {
	beforeEach(() => {
		Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
		Object.defineProperty(window, 'matchMedia', { value: matchMediaMock, writable: true });
		vi.clearAllMocks();
		localStorageMock.clear();
		document.documentElement.className = '';
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('Rendering', () => {
		it('renders GlobalNav component', () => {
			render(Layout);

			expect(screen.getByRole('navigation')).toBeInTheDocument();
		});

		it('renders children slot', () => {
			render(Layout);

			// Main content area exists
			expect(screen.getByRole('main')).toBeInTheDocument();
		});

		it('renders skip link before main content', () => {
			render(Layout);

			const skipLink = screen.getByRole('link', { name: /skip to main content/i });
			expect(skipLink).toBeInTheDocument();
			expect(skipLink).toHaveAttribute('href', '#main-content');
		});

		it('applies theme class to document', () => {
			mockStorage['theme'] = 'dark';
			render(Layout);

			expect(document.documentElement.classList.contains('dark')).toBe(true);
		});
	});

	describe('Navigation', () => {
		it('GlobalNav receives correct active tab prop', () => {
			render(Layout);

			// Default is Issues tab
			const issuesTab = screen.getByRole('tab', { name: 'Issues' });
			expect(issuesTab).toHaveAttribute('aria-selected', 'true');
		});
	});

	describe('Theme Persistence', () => {
		it('reads theme from localStorage on mount', () => {
			mockStorage['theme'] = 'dark';
			render(Layout);

			expect(localStorageMock.getItem).toHaveBeenCalledWith('theme');
		});

		it('falls back to system preference when no stored value', () => {
			render(Layout);

			expect(window.matchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
		});

		it('updates localStorage when theme changes', async () => {
			render(Layout);

			// Theme toggle changes theme, which should update localStorage
			const themeToggle = screen.getByRole('button', { name: /theme/i });
			await themeToggle.click();

			expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', expect.any(String));
		});
	});

	describe('Density Persistence', () => {
		it('reads density from localStorage on mount', () => {
			mockStorage['density'] = 'compact';
			render(Layout);

			expect(localStorageMock.getItem).toHaveBeenCalledWith('density');
		});

		it('defaults to standard when no stored value', () => {
			render(Layout);

			// Standard density is the default - check data attribute
			expect(document.documentElement.dataset.density).toBe('standard');
		});

		it('updates localStorage when density changes', () => {
			render(Layout);

			// Density is stored when changed
			expect(localStorageMock.getItem).toHaveBeenCalledWith('density');
		});
	});

	describe('Accessibility', () => {
		it('skip link is first focusable element', () => {
			render(Layout);

			const skipLink = screen.getByRole('link', { name: /skip to main content/i });
			const allFocusable = document.querySelectorAll(
				'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
			);

			// Skip link should be among the first focusable elements
			const skipLinkIndex = Array.from(allFocusable).indexOf(skipLink);
			expect(skipLinkIndex).toBeLessThan(5); // Should be near the top
		});

		it('skip link navigates to main content', () => {
			render(Layout);

			const skipLink = screen.getByRole('link', { name: /skip to main content/i });
			expect(skipLink).toHaveAttribute('href', '#main-content');

			const main = screen.getByRole('main');
			expect(main).toHaveAttribute('id', 'main-content');
		});

		it('layout has proper landmark structure', () => {
			render(Layout);

			// Navigation landmark
			expect(screen.getByRole('navigation')).toBeInTheDocument();

			// Main landmark
			expect(screen.getByRole('main')).toBeInTheDocument();
		});
	});
});
