<script lang="ts">
	/**
	 * KeyboardHelp - Modal showing all keyboard shortcuts
	 * @component
	 */
	import { SvelteMap } from 'svelte/reactivity';
	import type { ShortcutHandler, ShortcutConfig } from '$lib/shortcuts/ShortcutManager.js';

	interface Props {
		open: boolean;
		shortcuts: ShortcutHandler[];
		onclose?: () => void;
	}

	let { open, shortcuts, onclose }: Props = $props();

	let modalElement: HTMLDivElement | undefined;

	// Group shortcuts by category
	function getShortcutsByCategory(): SvelteMap<string, ShortcutHandler[]> {
		const categories = new SvelteMap<string, ShortcutHandler[]>();

		for (const shortcut of shortcuts) {
			const category = shortcut.config.category ?? 'General';
			if (!categories.has(category)) {
				categories.set(category, []);
			}
			categories.get(category)!.push(shortcut);
		}

		return categories;
	}

	// Format key combination for display
	function formatKey(config: ShortcutConfig): string {
		const parts: string[] = [];
		if (config.ctrl) parts.push('Ctrl');
		if (config.alt) parts.push('Alt');
		if (config.shift) parts.push('Shift');
		if (config.meta) parts.push('⌘');

		// Format special keys nicely
		let key = config.key;
		if (key === 'Escape') key = 'Esc';
		if (key === 'Enter') key = '↵';
		if (key === ' ') key = 'Space';

		parts.push(key.toUpperCase());
		return parts.join(' + ');
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			onclose?.();
		}
	}

	function handleBackdropClick(event: MouseEvent) {
		if (event.target === modalElement) {
			onclose?.();
		}
	}

	$effect(() => {
		if (open && modalElement) {
			modalElement.focus();
		}
	});
</script>

{#if open}
	<div
		bind:this={modalElement}
		class="keyboard-help-backdrop"
		role="dialog"
		aria-modal="true"
		aria-labelledby="keyboard-help-title"
		tabindex="-1"
		onkeydown={handleKeyDown}
		onclick={handleBackdropClick}
	>
		<div class="keyboard-help-modal">
			<header class="keyboard-help-header">
				<h2 id="keyboard-help-title">Keyboard Shortcuts</h2>
				<button
					type="button"
					class="close-button"
					aria-label="Close keyboard shortcuts"
					onclick={() => onclose?.()}
				>
					×
				</button>
			</header>

			<div class="keyboard-help-content">
				{#each Array.from(getShortcutsByCategory().entries()) as [category, categoryShortcuts] (category)}
					<section class="shortcut-category">
						<h3>{category}</h3>
						<dl class="shortcut-list">
							{#each categoryShortcuts as shortcut (shortcut.config.key)}
								<div class="shortcut-item">
									<dt class="shortcut-key">
										<kbd>{formatKey(shortcut.config)}</kbd>
									</dt>
									<dd class="shortcut-description">{shortcut.config.description}</dd>
								</div>
							{/each}
						</dl>
					</section>
				{/each}
			</div>

			<footer class="keyboard-help-footer">
				<span class="hint">Press <kbd>Esc</kbd> or <kbd>?</kbd> to close</span>
			</footer>
		</div>
	</div>
{/if}

<style>
	.keyboard-help-backdrop {
		position: fixed;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgba(0, 0, 0, 0.5);
		z-index: 1000;
	}

	.keyboard-help-modal {
		background: var(--bg-primary, white);
		border-radius: 8px;
		box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
		max-width: 500px;
		max-height: 80vh;
		width: 90%;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

	.keyboard-help-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 16px 20px;
		border-bottom: 1px solid var(--border-color, #e5e7eb);
	}

	.keyboard-help-header h2 {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
	}

	.close-button {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		padding: 4px 8px;
		color: var(--text-secondary, #6b7280);
	}

	.close-button:hover {
		color: var(--text-primary, #111827);
	}

	.keyboard-help-content {
		overflow-y: auto;
		padding: 16px 20px;
	}

	.shortcut-category {
		margin-bottom: 20px;
	}

	.shortcut-category:last-child {
		margin-bottom: 0;
	}

	.shortcut-category h3 {
		font-size: 0.875rem;
		font-weight: 600;
		text-transform: uppercase;
		color: var(--text-secondary, #6b7280);
		margin: 0 0 12px 0;
	}

	.shortcut-list {
		margin: 0;
		padding: 0;
	}

	.shortcut-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 0;
		border-bottom: 1px solid var(--border-color-light, #f3f4f6);
	}

	.shortcut-item:last-child {
		border-bottom: none;
	}

	.shortcut-key {
		margin: 0;
	}

	.shortcut-description {
		margin: 0;
		color: var(--text-secondary, #6b7280);
	}

	kbd {
		display: inline-block;
		padding: 4px 8px;
		font-family: ui-monospace, monospace;
		font-size: 0.75rem;
		background: var(--bg-secondary, #f3f4f6);
		border: 1px solid var(--border-color, #e5e7eb);
		border-radius: 4px;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	}

	.keyboard-help-footer {
		padding: 12px 20px;
		border-top: 1px solid var(--border-color, #e5e7eb);
		text-align: center;
	}

	.hint {
		font-size: 0.75rem;
		color: var(--text-tertiary, #9ca3af);
	}

	.hint kbd {
		font-size: 0.625rem;
		padding: 2px 4px;
	}
</style>
