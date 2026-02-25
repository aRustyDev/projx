<script lang="ts">
	/**
	 * CreateIssueModal - Modal for creating new issues
	 * @component
	 */

	interface IssueFormData {
		title: string;
		issue_type: string;
		priority: number;
		description: string;
		assignee: string;
	}

	interface Props {
		open: boolean;
		onsubmit?: (data: IssueFormData) => void | Promise<void>;
		onclose?: () => void;
	}

	let { open = false, onsubmit, onclose }: Props = $props();

	// Form state
	let title = $state('');
	let issueType = $state('task');
	let priority = $state('3');
	let description = $state('');
	let assignee = $state('');

	// Validation state
	let titleError = $state('');

	// Submission state
	let submitting = $state(false);

	// Focus management
	let titleInput: HTMLInputElement;
	let modalElement: HTMLDivElement;

	const modalId = 'create-issue-modal';
	const titleId = `${modalId}-title`;

	// Reset form when modal closes/opens
	$effect(() => {
		if (open) {
			resetForm();
			// Focus title input when modal opens
			setTimeout(() => titleInput?.focus(), 50);
		}
	});

	function resetForm() {
		title = '';
		issueType = 'task';
		priority = '3';
		description = '';
		assignee = '';
		titleError = '';
		submitting = false;
	}

	function validateTitle() {
		if (!title.trim()) {
			titleError = 'Title is required';
			return false;
		}
		titleError = '';
		return true;
	}

	function handleTitleBlur() {
		validateTitle();
	}

	function handleTitleFocus() {
		// Clear error on focus to allow user to correct
		titleError = '';
	}

	function handleTitleInput() {
		// Clear error while typing
		titleError = '';
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();

		if (!validateTitle()) {
			return;
		}

		submitting = true;

		try {
			await onsubmit?.({
				title: title.trim(),
				issue_type: issueType,
				priority: parseInt(priority, 10),
				description: description.trim(),
				assignee: assignee.trim()
			});
		} finally {
			submitting = false;
		}
	}

	function handleCancel() {
		onclose?.();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onclose?.();
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === event.currentTarget) {
			onclose?.();
		}
	}

	// Focus trap
	function handleFocusTrap(event: KeyboardEvent) {
		if (event.key !== 'Tab') return;

		const focusableElements = modalElement?.querySelectorAll(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
		);

		if (!focusableElements?.length) return;

		const firstElement = focusableElements[0] as HTMLElement;
		const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

		if (event.shiftKey && document.activeElement === firstElement) {
			lastElement.focus();
			event.preventDefault();
		} else if (!event.shiftKey && document.activeElement === lastElement) {
			firstElement.focus();
			event.preventDefault();
		}
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
		data-testid="modal-backdrop"
		onclick={handleBackdropClick}
	>
		<div
			bind:this={modalElement}
			role="dialog"
			aria-modal="true"
			aria-labelledby={titleId}
			tabindex="0"
			class="mx-4 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
			onkeydown={(e) => {
				handleKeydown(e);
				handleFocusTrap(e);
			}}
		>
			<h2 id={titleId} class="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
				Create Issue
			</h2>

			<form onsubmit={handleSubmit}>
				<!-- Title -->
				<div class="mb-4">
					<label
						for="title"
						class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
					>
						Title
					</label>
					<input
						bind:this={titleInput}
						id="title"
						type="text"
						bind:value={title}
						oninput={handleTitleInput}
						onblur={handleTitleBlur}
						onfocus={handleTitleFocus}
						class="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
						class:border-red-500={titleError}
						placeholder="Issue title"
					/>
					{#if titleError}
						<p class="mt-1 text-sm text-red-500">{titleError}</p>
					{/if}
				</div>

				<!-- Type -->
				<div class="mb-4">
					<label for="type" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
						Type
					</label>
					<select
						id="type"
						bind:value={issueType}
						class="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
					>
						<option value="task">Task</option>
						<option value="bug">Bug</option>
						<option value="feature">Feature</option>
						<option value="epic">Epic</option>
					</select>
				</div>

				<!-- Priority -->
				<div class="mb-4">
					<label
						for="priority"
						class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
					>
						Priority
					</label>
					<select
						id="priority"
						bind:value={priority}
						title="Issue priority level"
						class="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
					>
						<option value="0">P0 - Urgent</option>
						<option value="1">P1 - Critical</option>
						<option value="2">P2 - High</option>
						<option value="3">P3 - Medium</option>
						<option value="4">P4 - Low</option>
					</select>
				</div>

				<!-- Description -->
				<div class="mb-4">
					<label
						for="description"
						class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
					>
						Description
					</label>
					<textarea
						id="description"
						bind:value={description}
						rows="4"
						class="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
						placeholder="Issue description (supports markdown)"
					></textarea>
				</div>

				<!-- Assignee -->
				<div class="mb-6">
					<label
						for="assignee"
						class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
					>
						Assignee
					</label>
					<input
						id="assignee"
						type="text"
						bind:value={assignee}
						class="w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100"
						placeholder="Optional assignee"
					/>
				</div>

				<!-- Buttons -->
				<div class="flex justify-end gap-3">
					<button
						type="button"
						onclick={handleCancel}
						class="rounded-md px-4 py-2 text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={submitting}
						class="rounded-md bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if submitting}
							Creating...
						{:else}
							Create
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
