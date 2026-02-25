<script lang="ts">
	/**
	 * Gantt Chart Page
	 * @module routes/(app)/gantt/+page
	 *
	 * Timeline view of project tasks with:
	 * - Horizontal scrolling timeline
	 * - Task bars showing duration
	 * - Status-based coloring
	 * - Click to view issue details
	 */
	import { GanttChart } from '$lib/components/gantt/index.js';
	import { IssueDetailModal } from '$lib/components/issues/index.js';
	import type { Issue } from '$lib/db/types.js';

	interface PageData {
		issues: Issue[];
		assignees: string[];
		error?: string;
	}

	let { data }: { data: PageData } = $props();

	// Selected issue for detail modal
	let selectedIssue = $state<Issue | null>(null);

	function handleSelectIssue(issue: Issue) {
		selectedIssue = issue;
	}

	function handleCloseModal() {
		selectedIssue = null;
	}

	// Filter state
	let showCompleted = $state(true);
	let assigneeFilter = $state<string>('');

	// Filtered issues
	const filteredIssues = $derived.by(() => {
		let result = data.issues;

		if (!showCompleted) {
			result = result.filter((i) => i.status !== 'done' && i.status !== 'closed');
		}

		if (assigneeFilter) {
			result = result.filter((i) => i.assignee === assigneeFilter);
		}

		return result;
	});
</script>

<svelte:head>
	<title>Gantt Chart | Looms</title>
</svelte:head>

<div class="flex h-full flex-col">
	<!-- Header -->
	<div
		class="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-900"
	>
		<div>
			<h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Gantt Chart</h1>
			<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
				Timeline view of {filteredIssues.length} tasks
			</p>
		</div>

		<!-- Filters -->
		<div class="flex items-center gap-4">
			<!-- Show completed toggle -->
			<label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
				<input
					type="checkbox"
					bind:checked={showCompleted}
					class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
				/>
				Show completed
			</label>

			<!-- Assignee filter -->
			{#if data.assignees.length > 0}
				<select
					bind:value={assigneeFilter}
					class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
				>
					<option value="">All assignees</option>
					{#each data.assignees as assignee (assignee)}
						<option value={assignee}>{assignee}</option>
					{/each}
				</select>
			{/if}
		</div>
	</div>

	<!-- Error state -->
	{#if data.error}
		<div
			class="m-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900"
		>
			<p class="text-red-800 dark:text-red-200">Error loading issues: {data.error}</p>
		</div>
	{/if}

	<!-- Gantt Chart -->
	<div class="flex-1 overflow-hidden p-6">
		<GanttChart issues={filteredIssues} onselect={handleSelectIssue} />
	</div>
</div>

<!-- Issue Detail Modal -->
{#if selectedIssue}
	<IssueDetailModal issue={selectedIssue} onclose={handleCloseModal} />
{/if}
