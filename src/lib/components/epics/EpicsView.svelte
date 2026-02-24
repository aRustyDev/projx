<script lang="ts">
	/**
	 * EpicsView - Hierarchical view of epics with expandable children
	 * @component
	 */
	import { SvelteSet } from 'svelte/reactivity';
	import type { Issue } from '$lib/db/types.js';

	interface Epic extends Issue {
		children: Issue[];
	}

	interface Props {
		issues: Issue[];
		onselect?: (issue: Issue) => void;
	}

	let { issues, onselect }: Props = $props();

	// Track expanded epics
	let expandedIds = new SvelteSet<string>();

	// Filter and group issues into epics with children
	function getEpics(): Epic[] {
		const epics = issues.filter((i) => i.issue_type === 'epic');
		const nonEpics = issues.filter((i) => i.issue_type !== 'epic');

		return epics.map((epic) => ({
			...epic,
			// For now, assume children are linked by spec_id or parent reference
			// In reality, this would use the dependencies table
			children: nonEpics.filter((i) => i.spec_id === epic.id || i.external_ref?.includes(epic.id))
		}));
	}

	function toggleExpand(epicId: string) {
		if (expandedIds.has(epicId)) {
			expandedIds.delete(epicId);
		} else {
			expandedIds.add(epicId);
		}
	}

	function getProgress(epic: Epic): { done: number; total: number; percent: number } {
		const total = epic.children.length;
		const done = epic.children.filter((c) => c.status === 'done' || c.status === 'closed').length;
		const percent = total > 0 ? Math.round((done / total) * 100) : 0;
		return { done, total, percent };
	}

	function handleRowClick(epic: Issue) {
		onselect?.(epic);
	}

	function handleKeyDown(event: KeyboardEvent, epic: Issue) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleRowClick(epic);
		} else if (event.key === 'ArrowRight') {
			event.preventDefault();
			if (!expandedIds.has(epic.id)) {
				toggleExpand(epic.id);
			}
		} else if (event.key === 'ArrowLeft') {
			event.preventDefault();
			if (expandedIds.has(epic.id)) {
				toggleExpand(epic.id);
			}
		}
	}
</script>

<div class="epics-view">
	{#if getEpics().length === 0}
		<div class="empty-state">
			<p>No epics found</p>
			<p class="hint">Create an epic to organize related issues</p>
		</div>
	{:else}
		<table class="epics-table" role="grid">
			<thead>
				<tr>
					<th class="expand-col"></th>
					<th>Epic</th>
					<th>Status</th>
					<th>Progress</th>
				</tr>
			</thead>
			<tbody>
				{#each getEpics() as epic (epic.id)}
					{@const progress = getProgress(epic)}
					{@const isExpanded = expandedIds.has(epic.id)}
					<tr
						class="epic-row"
						role="row"
						tabindex="0"
						onclick={() => handleRowClick(epic)}
						onkeydown={(e) => handleKeyDown(e, epic)}
					>
						<td class="expand-col">
							<button
								type="button"
								class="expand-toggle"
								aria-expanded={isExpanded}
								aria-label={isExpanded ? 'Collapse epic' : 'Expand epic'}
								onclick={(e: MouseEvent) => {
									e.stopPropagation();
									toggleExpand(epic.id);
								}}
							>
								<span class="expand-icon" class:expanded={isExpanded}>▶</span>
							</button>
						</td>
						<td class="epic-info">
							<span class="epic-id">{epic.id}</span>
							<span class="epic-title">{epic.title}</span>
						</td>
						<td>
							<span class="status-badge" data-status={epic.status}>{epic.status}</span>
						</td>
						<td class="progress-col">
							<div class="progress-wrapper">
								<div
									class="progress-bar"
									role="progressbar"
									aria-valuenow={progress.percent}
									aria-valuemin={0}
									aria-valuemax={100}
									aria-label="Epic progress"
								>
									<div class="progress-fill" style:width="{progress.percent}%"></div>
								</div>
								<span class="progress-text">{progress.done}/{progress.total}</span>
							</div>
						</td>
					</tr>
					{#if isExpanded && epic.children.length > 0}
						{#each epic.children as child (child.id)}
							<tr
								class="child-row"
								role="row"
								tabindex="0"
								onclick={() => onselect?.(child)}
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										onselect?.(child);
									}
								}}
							>
								<td class="expand-col"></td>
								<td class="child-info">
									<span class="child-id">{child.id}</span>
									<span class="child-title">{child.title}</span>
								</td>
								<td>
									<span class="status-badge" data-status={child.status}>{child.status}</span>
								</td>
								<td></td>
							</tr>
						{/each}
					{/if}
				{/each}
			</tbody>
		</table>
	{/if}
</div>

<style>
	.epics-view {
		width: 100%;
	}

	.empty-state {
		text-align: center;
		padding: 48px 24px;
		color: var(--text-secondary, #6b7280);
	}

	.empty-state p {
		margin: 0;
	}

	.empty-state .hint {
		font-size: 0.875rem;
		margin-top: 8px;
	}

	.epics-table {
		width: 100%;
		border-collapse: collapse;
	}

	th {
		text-align: left;
		padding: 12px 16px;
		border-bottom: 1px solid var(--border-color, #e5e7eb);
		font-weight: 600;
		font-size: 0.75rem;
		text-transform: uppercase;
		color: var(--text-secondary, #6b7280);
	}

	td {
		padding: 12px 16px;
		border-bottom: 1px solid var(--border-color-light, #f3f4f6);
	}

	.expand-col {
		width: 40px;
	}

	.expand-toggle {
		background: none;
		border: none;
		cursor: pointer;
		padding: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.expand-icon {
		transition: transform 0.2s;
		font-size: 0.75rem;
		color: var(--text-secondary, #6b7280);
	}

	.expand-icon.expanded {
		transform: rotate(90deg);
	}

	.epic-row {
		cursor: pointer;
	}

	.epic-row:hover {
		background: var(--bg-hover, #f9fafb);
	}

	.epic-row:focus {
		outline: 2px solid var(--focus-color, #3b82f6);
		outline-offset: -2px;
	}

	.epic-info,
	.child-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.epic-id,
	.child-id {
		font-size: 0.75rem;
		color: var(--text-tertiary, #9ca3af);
		font-family: ui-monospace, monospace;
	}

	.epic-title {
		font-weight: 500;
	}

	.child-row {
		background: var(--bg-secondary, #f9fafb);
		cursor: pointer;
	}

	.child-row:hover {
		background: var(--bg-tertiary, #f3f4f6);
	}

	.child-row:focus {
		outline: 2px solid var(--focus-color, #3b82f6);
		outline-offset: -2px;
	}

	.child-info {
		padding-left: 24px;
	}

	.child-title {
		font-size: 0.875rem;
	}

	.status-badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: capitalize;
	}

	.status-badge[data-status='open'] {
		background: var(--status-open-bg, #dbeafe);
		color: var(--status-open-color, #1d4ed8);
	}

	.status-badge[data-status='in_progress'] {
		background: var(--status-progress-bg, #fef3c7);
		color: var(--status-progress-color, #b45309);
	}

	.status-badge[data-status='done'],
	.status-badge[data-status='closed'] {
		background: var(--status-done-bg, #dcfce7);
		color: var(--status-done-color, #16a34a);
	}

	.progress-col {
		min-width: 120px;
	}

	.progress-wrapper {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.progress-bar {
		flex: 1;
		height: 8px;
		background: var(--progress-bg, #e5e7eb);
		border-radius: 4px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: var(--progress-fill, #3b82f6);
		transition: width 0.3s ease;
	}

	.progress-text {
		font-size: 0.75rem;
		color: var(--text-secondary, #6b7280);
		min-width: 40px;
	}
</style>
