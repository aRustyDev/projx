<script lang="ts">
	/**
	 * GanttChart - Timeline view for project tasks and issues
	 * @component
	 *
	 * Displays issues on a horizontal timeline with:
	 * - Scrollable date range
	 * - Task bars showing duration
	 * - Dependency lines (future)
	 * - Drag to resize/move (future)
	 */
	import type { Issue } from '$lib/db/types.js';
	import GanttRow from './GanttRow.svelte';
	import GanttHeader from './GanttHeader.svelte';

	interface GanttTask extends Issue {
		startDate: Date;
		endDate: Date;
		progress?: number;
	}

	interface Props {
		issues: Issue[];
		startDate?: Date;
		endDate?: Date;
		dayWidth?: number;
		onselect?: (issue: Issue) => void;
	}

	let { issues, startDate, endDate, dayWidth = 40, onselect }: Props = $props();

	// Parse dates from issues - look for date prefixes like [2026-02-20]
	function parseTaskDates(issue: Issue): GanttTask {
		let start = new Date(issue.created_at);
		let end = issue.due_at
			? new Date(issue.due_at)
			: new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

		// Try to parse date prefix from title: [2026-02-20] or [2026-02-20 to 2026-02-27]
		const dateRangeMatch = issue.title.match(
			/\[(\d{4}-\d{2}-\d{2})(?:\s*(?:to|-)\s*(\d{4}-\d{2}-\d{2}))?\]/
		);
		if (dateRangeMatch) {
			start = new Date(dateRangeMatch[1]);
			if (dateRangeMatch[2]) {
				end = new Date(dateRangeMatch[2]);
			} else {
				// Default to 3 days duration if only start date given
				end = new Date(start.getTime() + 3 * 24 * 60 * 60 * 1000);
			}
		}

		// Calculate progress based on status
		let progress = 0;
		if (issue.status === 'in_progress') progress = 50;
		else if (issue.status === 'review') progress = 75;
		else if (issue.status === 'done' || issue.status === 'closed') progress = 100;

		return {
			...issue,
			startDate: start,
			endDate: end,
			progress
		};
	}

	// Convert issues to gantt tasks
	const tasks = $derived(issues.map(parseTaskDates));

	// Calculate date range for the chart
	const chartStartDate = $derived.by(() => {
		if (startDate) return startDate;
		if (tasks.length === 0) return new Date();

		const minDate = tasks.reduce((min, task) => {
			return task.startDate < min ? task.startDate : min;
		}, tasks[0].startDate);

		// Start 2 days before the earliest task
		return new Date(minDate.getTime() - 2 * 24 * 60 * 60 * 1000);
	});

	const chartEndDate = $derived.by(() => {
		if (endDate) return endDate;
		if (tasks.length === 0) {
			return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
		}

		const maxDate = tasks.reduce((max, task) => {
			return task.endDate > max ? task.endDate : max;
		}, tasks[0].endDate);

		// End 2 days after the latest task
		return new Date(maxDate.getTime() + 2 * 24 * 60 * 60 * 1000);
	});

	// Calculate total days in the range
	const totalDays = $derived(
		Math.ceil((chartEndDate.getTime() - chartStartDate.getTime()) / (24 * 60 * 60 * 1000))
	);

	// Generate array of dates for the header
	const dates = $derived.by(() => {
		return Array.from({ length: totalDays }, (_, i) => {
			const d = new Date(chartStartDate.getTime() + i * 24 * 60 * 60 * 1000);
			return d;
		});
	});

	// Calculate position and width for a task bar
	function getTaskStyle(task: GanttTask): { left: string; width: string } {
		const startOffset = Math.max(
			0,
			(task.startDate.getTime() - chartStartDate.getTime()) / (24 * 60 * 60 * 1000)
		);
		const duration = Math.max(
			1,
			(task.endDate.getTime() - task.startDate.getTime()) / (24 * 60 * 60 * 1000)
		);

		return {
			left: `${startOffset * dayWidth}px`,
			width: `${duration * dayWidth}px`
		};
	}

	// Today marker position
	const todayOffset = $derived.by(() => {
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const offset = (today.getTime() - chartStartDate.getTime()) / (24 * 60 * 60 * 1000);
		return offset * dayWidth;
	});

	const showTodayMarker = $derived(todayOffset >= 0 && todayOffset <= totalDays * dayWidth);

	function handleTaskClick(task: GanttTask) {
		onselect?.(task);
	}

	// Scroll container reference
	let scrollContainer: HTMLDivElement;

	// Scroll to today on mount
	$effect(() => {
		if (scrollContainer && showTodayMarker) {
			// Scroll to show today near the left side with some padding
			scrollContainer.scrollLeft = Math.max(0, todayOffset - 100);
		}
	});
</script>

<div
	class="gantt-chart flex flex-col rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
>
	{#if tasks.length === 0}
		<div class="flex flex-col items-center justify-center p-12 text-gray-500 dark:text-gray-400">
			<svg class="mb-4 h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="1.5"
					d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
				/>
			</svg>
			<p class="text-lg font-medium">No tasks to display</p>
			<p class="mt-1 text-sm">Add tasks with dates to see them on the timeline</p>
		</div>
	{:else}
		<div class="flex">
			<!-- Task list (fixed left panel) -->
			<div class="w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
				<!-- Header for task list -->
				<div
					class="flex h-14 items-center border-b border-gray-200 bg-gray-50 px-4 dark:border-gray-700 dark:bg-gray-800"
				>
					<span class="text-sm font-semibold text-gray-700 dark:text-gray-300">Task</span>
				</div>

				<!-- Task names -->
				{#each tasks as task (task.id)}
					<div
						class="flex h-12 items-center border-b border-gray-100 px-4 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800"
					>
						<div class="min-w-0 flex-1">
							<div class="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
								{task.title.replace(
									/\[\d{4}-\d{2}-\d{2}(?:\s*(?:to|-)\s*\d{4}-\d{2}-\d{2})?\]\s*/,
									''
								)}
							</div>
							<div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
								<span class="font-mono">{task.id}</span>
								<span
									class="rounded px-1 capitalize"
									class:text-blue-600={task.status === 'open'}
									class:text-yellow-600={task.status === 'in_progress'}
									class:text-purple-600={task.status === 'review'}
									class:text-green-600={task.status === 'done' || task.status === 'closed'}
								>
									{task.status.replace('_', ' ')}
								</span>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Timeline (scrollable) -->
			<div bind:this={scrollContainer} class="flex-1 overflow-x-auto">
				<div style="width: {totalDays * dayWidth}px;">
					<!-- Date header -->
					<GanttHeader {dates} {dayWidth} />

					<!-- Task rows with bars -->
					<div class="relative">
						<!-- Grid lines -->
						<div class="pointer-events-none absolute inset-0">
							{#each dates as date, i (i)}
								<div
									class="absolute top-0 bottom-0 border-l"
									class:border-gray-200={date.getDay() !== 0 && date.getDay() !== 6}
									class:border-gray-300={date.getDay() === 0 || date.getDay() === 6}
									class:dark:border-gray-700={date.getDay() !== 0 && date.getDay() !== 6}
									class:dark:border-gray-600={date.getDay() === 0 || date.getDay() === 6}
									class:bg-gray-50={date.getDay() === 0 || date.getDay() === 6}
									class:dark:bg-gray-800={date.getDay() === 0 || date.getDay() === 6}
									style="left: {i * dayWidth}px; width: {dayWidth}px;"
								></div>
							{/each}
						</div>

						<!-- Today marker -->
						{#if showTodayMarker}
							<div
								class="pointer-events-none absolute top-0 bottom-0 z-10 w-0.5 bg-red-500"
								style="left: {todayOffset}px;"
							>
								<div
									class="absolute -top-1 -translate-x-1/2 rounded bg-red-500 px-1 text-xs font-medium text-white"
								>
									Today
								</div>
							</div>
						{/if}

						<!-- Task bars -->
						{#each tasks as task (task.id)}
							<GanttRow {task} style={getTaskStyle(task)} onclick={() => handleTaskClick(task)} />
						{/each}
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.gantt-chart {
		min-height: 200px;
	}
</style>
