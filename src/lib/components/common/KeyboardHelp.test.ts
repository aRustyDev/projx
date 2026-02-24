/**
 * KeyboardHelp Component Tests
 * @module components/common/KeyboardHelp.test
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import KeyboardHelp from './KeyboardHelp.svelte';
import type { ShortcutHandler } from '$lib/shortcuts/ShortcutManager.js';

const mockShortcuts: ShortcutHandler[] = [
	{ config: { key: 'j', description: 'Move down', category: 'Navigation' }, handler: vi.fn() },
	{ config: { key: 'k', description: 'Move up', category: 'Navigation' }, handler: vi.fn() },
	{ config: { key: 'c', description: 'Create issue', category: 'Actions' }, handler: vi.fn() },
	{
		config: { key: 's', ctrl: true, description: 'Save', category: 'Actions' },
		handler: vi.fn()
	},
	{ config: { key: '?', description: 'Show help', category: 'Help' }, handler: vi.fn() }
];

describe('KeyboardHelp', () => {
	describe('rendering', () => {
		it('renders modal when open is true', () => {
			render(KeyboardHelp, { props: { open: true, shortcuts: mockShortcuts } });

			expect(screen.getByRole('dialog')).toBeInTheDocument();
			expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
		});

		it('does not render when open is false', () => {
			render(KeyboardHelp, { props: { open: false, shortcuts: mockShortcuts } });

			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});

		it('displays all shortcuts grouped by category', () => {
			render(KeyboardHelp, { props: { open: true, shortcuts: mockShortcuts } });

			// Check categories
			expect(screen.getByText('Navigation')).toBeInTheDocument();
			expect(screen.getByText('Actions')).toBeInTheDocument();
			expect(screen.getByText('Help')).toBeInTheDocument();
		});

		it('displays shortcut keys and descriptions', () => {
			render(KeyboardHelp, { props: { open: true, shortcuts: mockShortcuts } });

			expect(screen.getByText('J')).toBeInTheDocument();
			expect(screen.getByText('Move down')).toBeInTheDocument();
			expect(screen.getByText('K')).toBeInTheDocument();
			expect(screen.getByText('Move up')).toBeInTheDocument();
		});

		it('formats modifier keys correctly', () => {
			render(KeyboardHelp, { props: { open: true, shortcuts: mockShortcuts } });

			// Ctrl+S should be displayed
			expect(screen.getByText('Ctrl + S')).toBeInTheDocument();
		});

		it('shows close button', () => {
			render(KeyboardHelp, { props: { open: true, shortcuts: mockShortcuts } });

			expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
		});
	});

	describe('closing', () => {
		it('calls onclose when close button clicked', async () => {
			const onClose = vi.fn();
			render(KeyboardHelp, { props: { open: true, shortcuts: mockShortcuts, onclose: onClose } });

			await fireEvent.click(screen.getByRole('button', { name: /close/i }));

			expect(onClose).toHaveBeenCalledTimes(1);
		});

		it('calls onclose on Escape key', async () => {
			const onClose = vi.fn();
			render(KeyboardHelp, { props: { open: true, shortcuts: mockShortcuts, onclose: onClose } });

			await fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

			expect(onClose).toHaveBeenCalledTimes(1);
		});

		it('calls onclose when clicking backdrop', async () => {
			const onClose = vi.fn();
			render(KeyboardHelp, { props: { open: true, shortcuts: mockShortcuts, onclose: onClose } });

			// Click the backdrop (the dialog element itself)
			const backdrop = screen.getByRole('dialog');
			await fireEvent.click(backdrop);

			expect(onClose).toHaveBeenCalledTimes(1);
		});

		it('does not close when clicking modal content', async () => {
			const onClose = vi.fn();
			render(KeyboardHelp, { props: { open: true, shortcuts: mockShortcuts, onclose: onClose } });

			// Click the modal content (not the backdrop)
			await fireEvent.click(screen.getByText('Keyboard Shortcuts'));

			expect(onClose).not.toHaveBeenCalled();
		});
	});

	describe('accessibility', () => {
		it('has role="dialog"', () => {
			render(KeyboardHelp, { props: { open: true, shortcuts: mockShortcuts } });

			expect(screen.getByRole('dialog')).toBeInTheDocument();
		});

		it('has aria-modal="true"', () => {
			render(KeyboardHelp, { props: { open: true, shortcuts: mockShortcuts } });

			expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
		});

		it('has aria-labelledby pointing to title', () => {
			render(KeyboardHelp, { props: { open: true, shortcuts: mockShortcuts } });

			const dialog = screen.getByRole('dialog');
			expect(dialog).toHaveAttribute('aria-labelledby', 'keyboard-help-title');
			expect(screen.getByText('Keyboard Shortcuts').id).toBe('keyboard-help-title');
		});

		it('close button has accessible name', () => {
			render(KeyboardHelp, { props: { open: true, shortcuts: mockShortcuts } });

			expect(screen.getByRole('button', { name: /close keyboard shortcuts/i })).toBeInTheDocument();
		});
	});

	describe('empty state', () => {
		it('renders empty modal when no shortcuts', () => {
			render(KeyboardHelp, { props: { open: true, shortcuts: [] } });

			expect(screen.getByRole('dialog')).toBeInTheDocument();
			expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
		});
	});
});
