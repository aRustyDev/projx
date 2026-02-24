/**
 * CreateIssueModal Component Tests (TDD)
 * @module components/issues/CreateIssueModal.test
 *
 * RED: Tests written first, will fail until implementation complete.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import CreateIssueModal from './CreateIssueModal.svelte';

describe('CreateIssueModal', () => {
	describe('rendering', () => {
		it('renders modal when open is true', () => {
			render(CreateIssueModal, { props: { open: true } });

			expect(screen.getByRole('dialog')).toBeInTheDocument();
			expect(screen.getByText(/create issue/i)).toBeInTheDocument();
		});

		it('does not render modal when open is false', () => {
			render(CreateIssueModal, { props: { open: false } });

			expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
		});

		it('renders all required form fields', () => {
			render(CreateIssueModal, { props: { open: true } });

			expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
			expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
		});

		it('renders optional assignee field', () => {
			render(CreateIssueModal, { props: { open: true } });

			expect(screen.getByLabelText(/assignee/i)).toBeInTheDocument();
		});

		it('renders submit and cancel buttons', () => {
			render(CreateIssueModal, { props: { open: true } });

			expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
		});
	});

	describe('form validation', () => {
		it('requires title field', async () => {
			render(CreateIssueModal, { props: { open: true } });

			const submitButton = screen.getByRole('button', { name: /create/i });
			await fireEvent.click(submitButton);

			expect(screen.getByText(/title is required/i)).toBeInTheDocument();
		});

		it('shows validation error for empty title on blur', async () => {
			render(CreateIssueModal, { props: { open: true } });

			const titleInput = screen.getByLabelText(/title/i);
			await fireEvent.focus(titleInput);
			await fireEvent.blur(titleInput);

			expect(screen.getByText(/title is required/i)).toBeInTheDocument();
		});

		it('clears validation error when title is entered', async () => {
			render(CreateIssueModal, { props: { open: true } });

			const titleInput = screen.getByLabelText(/title/i);
			await fireEvent.focus(titleInput);
			await fireEvent.blur(titleInput);

			// Error should appear
			expect(screen.getByText(/title is required/i)).toBeInTheDocument();

			// Enter title
			await fireEvent.input(titleInput, { target: { value: 'Test Issue' } });

			// Error should clear
			expect(screen.queryByText(/title is required/i)).not.toBeInTheDocument();
		});
	});

	describe('form submission', () => {
		it('calls onsubmit with form data when submitted', async () => {
			const onSubmit = vi.fn();
			render(CreateIssueModal, { props: { open: true, onsubmit: onSubmit } });

			// Fill in form
			await fireEvent.input(screen.getByLabelText(/title/i), {
				target: { value: 'Test Issue Title' }
			});
			await fireEvent.change(screen.getByLabelText(/type/i), {
				target: { value: 'bug' }
			});
			await fireEvent.change(screen.getByLabelText(/priority/i), {
				target: { value: '1' }
			});
			await fireEvent.input(screen.getByLabelText(/description/i), {
				target: { value: 'Test description' }
			});

			// Submit
			await fireEvent.click(screen.getByRole('button', { name: /create/i }));

			expect(onSubmit).toHaveBeenCalledWith({
				title: 'Test Issue Title',
				issue_type: 'bug',
				priority: 1,
				description: 'Test description',
				assignee: ''
			});
		});

		it('disables submit button while submitting', async () => {
			const onSubmit = vi.fn(
				(): Promise<void> => new Promise((resolve) => setTimeout(resolve, 100))
			);
			render(CreateIssueModal, { props: { open: true, onsubmit: onSubmit } });

			await fireEvent.input(screen.getByLabelText(/title/i), {
				target: { value: 'Test Issue' }
			});

			const submitButton = screen.getByRole('button', { name: /create/i });
			await fireEvent.click(submitButton);

			expect(submitButton).toBeDisabled();
		});

		it('shows loading state while submitting', async () => {
			const onSubmit = vi.fn(
				(): Promise<void> => new Promise((resolve) => setTimeout(resolve, 100))
			);
			render(CreateIssueModal, { props: { open: true, onsubmit: onSubmit } });

			await fireEvent.input(screen.getByLabelText(/title/i), {
				target: { value: 'Test Issue' }
			});

			await fireEvent.click(screen.getByRole('button', { name: /create/i }));

			expect(screen.getByText(/creating/i)).toBeInTheDocument();
		});
	});

	describe('modal behavior', () => {
		it('calls onclose when cancel button is clicked', async () => {
			const onClose = vi.fn();
			render(CreateIssueModal, { props: { open: true, onclose: onClose } });

			await fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

			expect(onClose).toHaveBeenCalled();
		});

		it('calls onclose when escape key is pressed', async () => {
			const onClose = vi.fn();
			render(CreateIssueModal, { props: { open: true, onclose: onClose } });

			await fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

			expect(onClose).toHaveBeenCalled();
		});

		it('calls onclose when clicking backdrop', async () => {
			const onClose = vi.fn();
			render(CreateIssueModal, { props: { open: true, onclose: onClose } });

			const backdrop = screen.getByTestId('modal-backdrop');
			await fireEvent.click(backdrop);

			expect(onClose).toHaveBeenCalled();
		});

		it('resets form when modal is closed and reopened', async () => {
			const { rerender } = render(CreateIssueModal, { props: { open: true } });

			// Fill in form
			await fireEvent.input(screen.getByLabelText(/title/i), {
				target: { value: 'Test Issue' }
			});

			// Close modal
			rerender({ open: false });

			// Reopen modal
			rerender({ open: true });

			// Form should be reset
			expect(screen.getByLabelText(/title/i)).toHaveValue('');
		});
	});

	describe('accessibility', () => {
		it('has role="dialog" on modal', () => {
			render(CreateIssueModal, { props: { open: true } });

			expect(screen.getByRole('dialog')).toBeInTheDocument();
		});

		it('has aria-modal="true"', () => {
			render(CreateIssueModal, { props: { open: true } });

			expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
		});

		it('has accessible name via aria-labelledby', () => {
			render(CreateIssueModal, { props: { open: true } });

			const dialog = screen.getByRole('dialog');
			expect(dialog).toHaveAttribute('aria-labelledby');

			const labelId = dialog.getAttribute('aria-labelledby');
			expect(document.getElementById(labelId!)).toHaveTextContent(/create issue/i);
		});

		it('focuses title input when modal opens', async () => {
			render(CreateIssueModal, { props: { open: true } });

			await waitFor(() => {
				expect(screen.getByLabelText(/title/i)).toHaveFocus();
			});
		});

		it('traps focus within modal', async () => {
			render(CreateIssueModal, { props: { open: true } });

			const cancelButton = screen.getByRole('button', { name: /cancel/i });

			// Tab from last focusable element should go to first
			cancelButton.focus();
			await fireEvent.keyDown(cancelButton, { key: 'Tab' });

			// Focus should cycle within modal
			expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
		});
	});

	describe('default values', () => {
		it('defaults type to task', () => {
			render(CreateIssueModal, { props: { open: true } });

			expect(screen.getByLabelText(/type/i)).toHaveValue('task');
		});

		it('defaults priority to 3 (medium)', () => {
			render(CreateIssueModal, { props: { open: true } });

			expect(screen.getByLabelText(/priority/i)).toHaveValue('3');
		});
	});
});
