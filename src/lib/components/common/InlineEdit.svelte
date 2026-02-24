<script lang="ts">
	/**
	 * InlineEdit - Click-to-edit component for inline editing
	 * @component
	 */

	interface Props {
		value: string;
		label?: string;
		placeholder?: string;
		disabled?: boolean;
		onsave?: (value: string) => void | Promise<void>;
	}

	let { value, label = 'Value', placeholder = '', disabled = false, onsave }: Props = $props();

	let isEditing = $state(false);
	let editValue = $state(value);
	let saving = $state(false);
	let error = $state<string | null>(null);
	let inputElement: HTMLInputElement | undefined;
	let originalValue = $state(value);

	// Sync external value changes
	$effect(() => {
		if (!isEditing) {
			editValue = value;
			originalValue = value;
		}
	});

	function enterEditMode() {
		if (disabled) return;
		isEditing = true;
		editValue = value;
		originalValue = value;
		error = null;
	}

	function cancelEdit() {
		isEditing = false;
		editValue = originalValue;
		error = null;
	}

	async function saveEdit() {
		if (editValue === originalValue) {
			isEditing = false;
			return;
		}

		saving = true;
		error = null;

		try {
			await onsave?.(editValue);
			originalValue = editValue;
			isEditing = false;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to save';
			// Revert to original value on error
			editValue = originalValue;
		} finally {
			saving = false;
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter') {
			event.preventDefault();
			saveEdit();
		} else if (event.key === 'Escape') {
			event.preventDefault();
			cancelEdit();
		}
	}

	function handleBlur() {
		if (isEditing && !saving) {
			saveEdit();
		}
	}

	function handleViewKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			enterEditMode();
		}
	}

	$effect(() => {
		if (isEditing && inputElement) {
			inputElement.focus();
			inputElement.select();
		}
	});
</script>

<div class="inline-edit" class:error class:disabled>
	{#if isEditing}
		<div class="edit-mode">
			<input
				bind:this={inputElement}
				bind:value={editValue}
				type="text"
				class="edit-input"
				aria-label={label}
				{placeholder}
				{disabled}
				onkeydown={handleKeyDown}
				onblur={handleBlur}
			/>
			<div class="edit-actions">
				<button
					type="button"
					class="save-button"
					aria-label="Save"
					disabled={saving}
					onclick={saveEdit}
				>
					{#if saving}
						<span class="spinner" aria-hidden="true"></span>
					{:else}
						✓
					{/if}
				</button>
				<button
					type="button"
					class="cancel-button"
					aria-label="Cancel"
					disabled={saving}
					onclick={cancelEdit}
				>
					✕
				</button>
			</div>
		</div>
		{#if error}
			<div class="error-message" role="alert">{error}</div>
		{/if}
	{:else}
		<button
			type="button"
			class="view-mode"
			aria-label="Click to edit {label}"
			{disabled}
			onclick={enterEditMode}
			onkeydown={handleViewKeyDown}
		>
			<span class="value">{value || placeholder}</span>
			<span class="edit-icon" aria-hidden="true">✎</span>
		</button>
	{/if}
</div>

<style>
	.inline-edit {
		display: inline-block;
		position: relative;
	}

	.inline-edit.disabled {
		opacity: 0.6;
		pointer-events: none;
	}

	.view-mode {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 4px 8px;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 4px;
		cursor: pointer;
		text-align: left;
		font: inherit;
		color: inherit;
	}

	.view-mode:hover {
		background: var(--bg-hover, #f3f4f6);
		border-color: var(--border-color, #e5e7eb);
	}

	.view-mode:focus {
		outline: 2px solid var(--focus-color, #3b82f6);
		outline-offset: 2px;
	}

	.edit-icon {
		opacity: 0;
		transition: opacity 0.15s;
		font-size: 0.875em;
		color: var(--text-secondary, #6b7280);
	}

	.view-mode:hover .edit-icon,
	.view-mode:focus .edit-icon {
		opacity: 1;
	}

	.edit-mode {
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}

	.edit-input {
		padding: 4px 8px;
		border: 1px solid var(--border-color, #e5e7eb);
		border-radius: 4px;
		font: inherit;
	}

	.edit-input:focus {
		outline: 2px solid var(--focus-color, #3b82f6);
		outline-offset: -1px;
		border-color: var(--focus-color, #3b82f6);
	}

	.edit-actions {
		display: flex;
		gap: 2px;
	}

	.save-button,
	.cancel-button {
		padding: 4px 8px;
		border: 1px solid var(--border-color, #e5e7eb);
		border-radius: 4px;
		cursor: pointer;
		font-size: 0.875em;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.save-button {
		background: var(--success-bg, #dcfce7);
		color: var(--success-color, #16a34a);
	}

	.save-button:hover:not(:disabled) {
		background: var(--success-bg-hover, #bbf7d0);
	}

	.cancel-button {
		background: var(--bg-secondary, #f3f4f6);
		color: var(--text-secondary, #6b7280);
	}

	.cancel-button:hover:not(:disabled) {
		background: var(--bg-tertiary, #e5e7eb);
	}

	.save-button:disabled,
	.cancel-button:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.spinner {
		width: 12px;
		height: 12px;
		border: 2px solid currentColor;
		border-top-color: transparent;
		border-radius: 50%;
		animation: spin 0.6s linear infinite;
	}

	@keyframes spin {
		to {
			transform: rotate(360deg);
		}
	}

	.error-message {
		position: absolute;
		top: 100%;
		left: 0;
		margin-top: 4px;
		padding: 4px 8px;
		font-size: 0.75rem;
		color: var(--error-color, #dc2626);
		background: var(--error-bg, #fef2f2);
		border: 1px solid var(--error-border, #fecaca);
		border-radius: 4px;
		white-space: nowrap;
	}

	.inline-edit.error .edit-input {
		border-color: var(--error-color, #dc2626);
	}
</style>
