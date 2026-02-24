/**
 * InlineEdit Component Tests
 * @module components/common/InlineEdit.test
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import InlineEdit from './InlineEdit.svelte';

describe('InlineEdit', () => {
	describe('view mode', () => {
		it('renders value as text by default', () => {
			render(InlineEdit, { props: { value: 'Test Value' } });

			expect(screen.getByText('Test Value')).toBeInTheDocument();
			expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
		});

		it('shows edit icon on hover', () => {
			render(InlineEdit, { props: { value: 'Test Value' } });

			const button = screen.getByRole('button');
			expect(button).toContainHTML('✎');
		});

		it('enters edit mode on click', async () => {
			render(InlineEdit, { props: { value: 'Test Value' } });

			await fireEvent.click(screen.getByRole('button'));

			expect(screen.getByRole('textbox')).toBeInTheDocument();
		});

		it('enters edit mode on Enter key', async () => {
			render(InlineEdit, { props: { value: 'Test Value' } });

			await fireEvent.keyDown(screen.getByRole('button'), { key: 'Enter' });

			expect(screen.getByRole('textbox')).toBeInTheDocument();
		});

		it('enters edit mode on Space key', async () => {
			render(InlineEdit, { props: { value: 'Test Value' } });

			await fireEvent.keyDown(screen.getByRole('button'), { key: ' ' });

			expect(screen.getByRole('textbox')).toBeInTheDocument();
		});

		it('does not enter edit mode when disabled', async () => {
			render(InlineEdit, { props: { value: 'Test Value', disabled: true } });

			await fireEvent.click(screen.getByRole('button'));

			expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
		});
	});

	describe('edit mode', () => {
		it('pre-populates input with current value', async () => {
			render(InlineEdit, { props: { value: 'Test Value' } });

			await fireEvent.click(screen.getByRole('button'));

			expect(screen.getByRole('textbox')).toHaveValue('Test Value');
		});

		it('focuses input automatically', async () => {
			render(InlineEdit, { props: { value: 'Test Value' } });

			await fireEvent.click(screen.getByRole('button'));

			await waitFor(() => {
				expect(screen.getByRole('textbox')).toHaveFocus();
			});
		});

		it('shows save and cancel buttons', async () => {
			render(InlineEdit, { props: { value: 'Test Value' } });

			await fireEvent.click(screen.getByRole('button'));

			expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
			expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
		});
	});

	describe('saving', () => {
		it('saves on Enter key', async () => {
			const onSave = vi.fn();
			render(InlineEdit, { props: { value: 'Test Value', onsave: onSave } });

			await fireEvent.click(screen.getByRole('button'));
			await fireEvent.input(screen.getByRole('textbox'), { target: { value: 'New Value' } });
			await fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });

			expect(onSave).toHaveBeenCalledWith('New Value');
		});

		it('saves on blur', async () => {
			const onSave = vi.fn();
			render(InlineEdit, { props: { value: 'Test Value', onsave: onSave } });

			await fireEvent.click(screen.getByRole('button'));
			await fireEvent.input(screen.getByRole('textbox'), { target: { value: 'New Value' } });
			await fireEvent.blur(screen.getByRole('textbox'));

			expect(onSave).toHaveBeenCalledWith('New Value');
		});

		it('saves on save button click', async () => {
			const onSave = vi.fn();
			render(InlineEdit, { props: { value: 'Test Value', onsave: onSave } });

			await fireEvent.click(screen.getByRole('button'));
			await fireEvent.input(screen.getByRole('textbox'), { target: { value: 'New Value' } });
			await fireEvent.click(screen.getByRole('button', { name: /save/i }));

			expect(onSave).toHaveBeenCalledWith('New Value');
		});

		it('exits edit mode after successful save', async () => {
			const onSave = vi.fn();
			render(InlineEdit, { props: { value: 'Test Value', onsave: onSave } });

			await fireEvent.click(screen.getByRole('button'));
			await fireEvent.input(screen.getByRole('textbox'), { target: { value: 'New Value' } });
			await fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });

			await waitFor(() => {
				expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
			});
		});

		it('does not call onsave if value unchanged', async () => {
			const onSave = vi.fn();
			render(InlineEdit, { props: { value: 'Test Value', onsave: onSave } });

			await fireEvent.click(screen.getByRole('button'));
			// Don't change the value
			await fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' });

			expect(onSave).not.toHaveBeenCalled();
		});
	});

	describe('cancelling', () => {
		it('cancels on Escape key', async () => {
			const onSave = vi.fn();
			render(InlineEdit, { props: { value: 'Test Value', onsave: onSave } });

			await fireEvent.click(screen.getByRole('button'));
			await fireEvent.input(screen.getByRole('textbox'), { target: { value: 'New Value' } });
			await fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });

			expect(onSave).not.toHaveBeenCalled();
			expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
		});

		it('cancels on cancel button click', async () => {
			const onSave = vi.fn();
			render(InlineEdit, { props: { value: 'Test Value', onsave: onSave } });

			await fireEvent.click(screen.getByRole('button'));
			await fireEvent.input(screen.getByRole('textbox'), { target: { value: 'New Value' } });
			await fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

			expect(onSave).not.toHaveBeenCalled();
		});

		it('restores original value on cancel', async () => {
			render(InlineEdit, { props: { value: 'Test Value' } });

			await fireEvent.click(screen.getByRole('button'));
			await fireEvent.input(screen.getByRole('textbox'), { target: { value: 'New Value' } });
			await fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Escape' });

			expect(screen.getByText('Test Value')).toBeInTheDocument();
		});
	});

	describe('error handling', () => {
		it('shows error message on save failure', async () => {
			const onSave = vi.fn().mockRejectedValue(new Error('Save failed'));
			render(InlineEdit, { props: { value: 'Test Value', onsave: onSave } });

			await fireEvent.click(screen.getByRole('button'));
			await fireEvent.input(screen.getByRole('textbox'), { target: { value: 'New Value' } });
			await fireEvent.click(screen.getByRole('button', { name: /save/i }));

			await waitFor(() => {
				expect(screen.getByRole('alert')).toHaveTextContent('Save failed');
			});
		});

		it('reverts to original value on save failure', async () => {
			const onSave = vi.fn().mockRejectedValue(new Error('Save failed'));
			render(InlineEdit, { props: { value: 'Test Value', onsave: onSave } });

			await fireEvent.click(screen.getByRole('button'));
			await fireEvent.input(screen.getByRole('textbox'), { target: { value: 'New Value' } });
			await fireEvent.click(screen.getByRole('button', { name: /save/i }));

			await waitFor(() => {
				expect(screen.getByRole('textbox')).toHaveValue('Test Value');
			});
		});
	});

	describe('loading state', () => {
		it('shows spinner while saving', async () => {
			const onSave = vi.fn(() => new Promise<void>((resolve) => setTimeout(resolve, 100)));
			render(InlineEdit, { props: { value: 'Test Value', onsave: onSave } });

			await fireEvent.click(screen.getByRole('button'));
			await fireEvent.input(screen.getByRole('textbox'), { target: { value: 'New Value' } });
			await fireEvent.click(screen.getByRole('button', { name: /save/i }));

			expect(screen.getByRole('button', { name: /save/i })).toContainHTML('spinner');
		});

		it('disables buttons while saving', async () => {
			const onSave = vi.fn(() => new Promise<void>((resolve) => setTimeout(resolve, 100)));
			render(InlineEdit, { props: { value: 'Test Value', onsave: onSave } });

			await fireEvent.click(screen.getByRole('button'));
			await fireEvent.input(screen.getByRole('textbox'), { target: { value: 'New Value' } });
			await fireEvent.click(screen.getByRole('button', { name: /save/i }));

			expect(screen.getByRole('button', { name: /save/i })).toBeDisabled();
			expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
		});
	});

	describe('accessibility', () => {
		it('input has associated label', async () => {
			render(InlineEdit, { props: { value: 'Test Value', label: 'Title' } });

			await fireEvent.click(screen.getByRole('button'));

			expect(screen.getByRole('textbox')).toHaveAttribute('aria-label', 'Title');
		});

		it('view button has accessible name', () => {
			render(InlineEdit, { props: { value: 'Test Value', label: 'Title' } });

			expect(screen.getByRole('button')).toHaveAttribute(
				'aria-label',
				expect.stringContaining('Title')
			);
		});

		it('error message has role="alert"', async () => {
			const onSave = vi.fn().mockRejectedValue(new Error('Save failed'));
			render(InlineEdit, { props: { value: 'Test Value', onsave: onSave } });

			await fireEvent.click(screen.getByRole('button'));
			await fireEvent.input(screen.getByRole('textbox'), { target: { value: 'New Value' } });
			await fireEvent.click(screen.getByRole('button', { name: /save/i }));

			await waitFor(() => {
				expect(screen.getByRole('alert')).toBeInTheDocument();
			});
		});
	});
});
