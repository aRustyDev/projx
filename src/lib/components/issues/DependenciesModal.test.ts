/**
 * DependenciesModal Component Tests (TDD)
 * @module components/issues/DependenciesModal.test
 *
 * RED: Tests written first, will fail until implementation complete.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import DependenciesModal from './DependenciesModal.svelte';

const mockIssue = {
	id: 'TEST-123',
	title: 'Main issue'
};

const mockBlockedBy = [
	{ id: 'TEST-100', title: 'Blocking issue 1', status: 'in_progress' },
	{ id: 'TEST-101', title: 'Blocking issue 2', status: 'open' }
];

const mockBlocking = [{ id: 'TEST-200', title: 'Blocked issue', status: 'open' }];

describe('DependenciesModal', () => {
	describe('visibility', () => {
		it('renders modal when open is true', () => {
			render(DependenciesModal, {
				props: { open: true, issue: mockIssue, blockedBy: mockBlockedBy, blocking: mockBlocking }
			});

			expect(screen.getByRole('dialog')).toBeInTheDocument();
		});

		it('does not render when open is false', () => {
			render(DependenciesModal, {
				props: { open: false, issue: mockIssue, blockedBy: mockBlockedBy, blocking: mockBlocking }
			});

			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});

		it('displays issue title in header', () => {
			render(DependenciesModal, {
				props: { open: true, issue: mockIssue, blockedBy: mockBlockedBy, blocking: mockBlocking }
			});

			expect(screen.getByText(/TEST-123/)).toBeInTheDocument();
			expect(screen.getByText(/Main issue/)).toBeInTheDocument();
		});
	});

	describe('closing behavior', () => {
		it('closes on Escape key', async () => {
			const onClose = vi.fn();
			render(DependenciesModal, {
				props: {
					open: true,
					issue: mockIssue,
					blockedBy: mockBlockedBy,
					blocking: mockBlocking,
					onclose: onClose
				}
			});

			await fireEvent.keyDown(document, { key: 'Escape' });

			expect(onClose).toHaveBeenCalled();
		});

		it('closes on backdrop click', async () => {
			const onClose = vi.fn();
			render(DependenciesModal, {
				props: {
					open: true,
					issue: mockIssue,
					blockedBy: mockBlockedBy,
					blocking: mockBlocking,
					onclose: onClose
				}
			});

			const backdrop = screen.getByTestId('modal-backdrop');
			await fireEvent.click(backdrop);

			expect(onClose).toHaveBeenCalled();
		});
	});

	describe('accessibility', () => {
		it('has role="dialog" and aria-modal="true"', () => {
			render(DependenciesModal, {
				props: { open: true, issue: mockIssue, blockedBy: mockBlockedBy, blocking: mockBlocking }
			});

			const dialog = screen.getByRole('dialog');
			expect(dialog).toHaveAttribute('aria-modal', 'true');
		});
	});

	describe('blocked by section', () => {
		it('displays list of blocking issues', () => {
			render(DependenciesModal, {
				props: { open: true, issue: mockIssue, blockedBy: mockBlockedBy, blocking: mockBlocking }
			});

			expect(screen.getByText('Blocking issue 1')).toBeInTheDocument();
			expect(screen.getByText('Blocking issue 2')).toBeInTheDocument();
		});

		it('shows issue ID, title, status for each', () => {
			render(DependenciesModal, {
				props: { open: true, issue: mockIssue, blockedBy: mockBlockedBy, blocking: mockBlocking }
			});

			expect(screen.getByText('TEST-100')).toBeInTheDocument();
			expect(screen.getByText('in_progress')).toBeInTheDocument();
		});

		it('shows "None" when no blockers', () => {
			render(DependenciesModal, {
				props: { open: true, issue: mockIssue, blockedBy: [], blocking: mockBlocking }
			});

			expect(screen.getByText(/no blocking issues/i)).toBeInTheDocument();
		});

		it('clicking issue calls onnavigate', async () => {
			const onNavigate = vi.fn();
			render(DependenciesModal, {
				props: {
					open: true,
					issue: mockIssue,
					blockedBy: mockBlockedBy,
					blocking: mockBlocking,
					onnavigate: onNavigate
				}
			});

			await fireEvent.click(screen.getByText('Blocking issue 1'));

			expect(onNavigate).toHaveBeenCalledWith('TEST-100');
		});
	});

	describe('blocking section', () => {
		it('displays list of blocked issues', () => {
			render(DependenciesModal, {
				props: { open: true, issue: mockIssue, blockedBy: mockBlockedBy, blocking: mockBlocking }
			});

			expect(screen.getByText('Blocked issue')).toBeInTheDocument();
		});

		it('shows issue ID, title, status for each', () => {
			render(DependenciesModal, {
				props: { open: true, issue: mockIssue, blockedBy: mockBlockedBy, blocking: mockBlocking }
			});

			expect(screen.getByText('TEST-200')).toBeInTheDocument();
		});

		it('shows "None" when no blocked issues', () => {
			render(DependenciesModal, {
				props: { open: true, issue: mockIssue, blockedBy: mockBlockedBy, blocking: [] }
			});

			expect(screen.getByText(/no blocked issues/i)).toBeInTheDocument();
		});

		it('clicking issue calls onnavigate', async () => {
			const onNavigate = vi.fn();
			render(DependenciesModal, {
				props: {
					open: true,
					issue: mockIssue,
					blockedBy: mockBlockedBy,
					blocking: mockBlocking,
					onnavigate: onNavigate
				}
			});

			await fireEvent.click(screen.getByText('Blocked issue'));

			expect(onNavigate).toHaveBeenCalledWith('TEST-200');
		});
	});

	describe('add/remove dependencies', () => {
		it('renders "Add Dependency" button', () => {
			render(DependenciesModal, {
				props: { open: true, issue: mockIssue, blockedBy: mockBlockedBy, blocking: mockBlocking }
			});

			expect(screen.getByRole('button', { name: /add dependency/i })).toBeInTheDocument();
		});

		it('calls onadd when add button clicked', async () => {
			const onAdd = vi.fn();
			render(DependenciesModal, {
				props: {
					open: true,
					issue: mockIssue,
					blockedBy: mockBlockedBy,
					blocking: mockBlocking,
					onadd: onAdd
				}
			});

			await fireEvent.click(screen.getByRole('button', { name: /add dependency/i }));

			expect(onAdd).toHaveBeenCalled();
		});

		it('renders remove button on each dependency', () => {
			render(DependenciesModal, {
				props: { open: true, issue: mockIssue, blockedBy: mockBlockedBy, blocking: mockBlocking }
			});

			// Should have remove buttons for each dependency (2 blocked by + 1 blocking = 3)
			const removeButtons = screen.getAllByRole('button', { name: /remove/i });
			expect(removeButtons.length).toBe(3);
		});

		it('calls onremove when remove clicked', async () => {
			const onRemove = vi.fn();
			render(DependenciesModal, {
				props: {
					open: true,
					issue: mockIssue,
					blockedBy: mockBlockedBy,
					blocking: mockBlocking,
					onremove: onRemove
				}
			});

			const removeButtons = screen.getAllByRole('button', { name: /remove/i });
			expect(removeButtons.length).toBeGreaterThan(0);
			await fireEvent.click(removeButtons[0]!);

			expect(onRemove).toHaveBeenCalledWith('TEST-100', 'blockedBy');
		});
	});

	describe('graph visualization', () => {
		// Graph tests - simplified for MVP
		it.todo('renders visual dependency graph');
		it.todo('shows current issue as center node');
		it.todo('nodes are clickable');
	});
});
