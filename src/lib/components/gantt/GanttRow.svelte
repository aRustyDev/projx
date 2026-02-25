<script lang="ts">
	/**
	 * GanttRow - Single task row with progress bar in Gantt chart
	 * @component
	 *
	 * Displays:
	 * - Task bar with status-based coloring
	 * - Progress indicator
	 * - Hover effects
	 */
	import type { Issue } from '$lib/db/types.js';

	interface GanttTask extends Issue {
		startDate: Date;
		endDate: Date;
		progress?: number;
	}

	interface Props {
		task: GanttTask;
		style: { left: string; width: string };
		onclick?: () => void;
	}

	let { task, style, onclick }: Props = $props();

	// Status-based colors
	const STATUS_COLORS: Record<string, { bg: string; border: string; progress: string }> = {
		open: {
			bg: 'bg-blue-100 dark:bg-blue-900/40',
			border: 'border-blue-300 dark:border-blue-700',
			progress: 'bg-blue-500'
		},
		in_progress: {
			bg: 'bg-yellow-100 dark:bg-yellow-900/40',
			border: 'border-yellow-300 dark:border-yellow-700',
			progress: 'bg-yellow-500'
		},
		review: {
			bg: 'bg-purple-100 dark:bg-purple-900/40',
			border: 'border-purple-300 dark:border-purple-700',
			progress: 'bg-purple-500'
		},
		done: {
			bg: 'bg-green-100 dark:bg-green-900/40',
			border: 'border-green-300 dark:border-green-700',
			progress: 'bg-green-500'
		},
		closed: {
			bg: 'bg-gray-100 dark:bg-gray-700/40',
			border: 'border-gray-300 dark:border-gray-600',
			progress: 'bg-gray-500'
		},
		blocked: {
			bg: 'bg-red-100 dark:bg-red-900/40',
			border: 'border-red-300 dark:border-red-700',
			progress: 'bg-red-500'
		}
	};

	const colors = $derived(STATUS_COLORS[task.status] || STATUS_COLORS.open);

	// Priority indicators
	const PRIORITY_COLORS: Record<number, string> = {
		0: 'border-l-red-500',
		1: 'border-l-orange-500',
		2: 'border-l-yellow-500',
		3: 'border-l-green-500',
		4: 'border-l-gray-400'
	};

	const priorityBorder = $derived(PRIORITY_COLORS[task.priority] || 'border-l-gray-400');

	function handleClick() {
		onclick?.();
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onclick?.();
		}
	}

	// Format date range for tooltip
	const dateRange = $derived.by(() => {
		const start = task.startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		const end = task.endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		return `${start} - ${end}`;
	});

	// Strip date prefix from title for display
	const displayTitle = $derived(
		task.title.replace(/\[\d{4}-\d{2}-\d{2}(?:\s*(?:to|-)\s*\d{4}-\d{2}-\d{2})?\]\s*/, '')
	);
</script>

<div class="gantt-row relative h-12 border-b border-gray-100 dark:border-gray-800">
	<!-- Task bar -->
	<div
		role="button"
		tabindex="0"
		onclick={handleClick}
		onkeydown={handleKeyDown}
		class="absolute top-1.5 h-9 cursor-pointer overflow-hidden rounded border border-l-4 transition-all hover:shadow-md {colors.bg} {colors.border} {priorityBorder}"
		style="left: {style.left}; width: {style.width};"
		title="{task.id}: {displayTitle}\n{dateRange}\nStatus: {task.status}\nProgress: {task.progress ||
			0}%"
	>
		<!-- Progress bar background -->
		<div class="absolute inset-0 flex items-center">
			<div class="h-full opacity-30 {colors.progress}" style="width: {task.progress || 0}%;"></div>
		</div>

		<!-- Task content -->
		<div class="relative flex h-full items-center gap-2 px-2">
			<!-- Task ID -->
			<span class="flex-shrink-0 font-mono text-xs font-medium text-gray-600 dark:text-gray-400">
				{task.id}
			</span>

			<!-- Task title (truncated) -->
			<span class="min-w-0 flex-1 truncate text-sm font-medium text-gray-800 dark:text-gray-200">
				{displayTitle}
			</span>

			<!-- Progress percentage -->
			{#if task.progress && task.progress > 0 && task.progress < 100}
				<span class="flex-shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400">
					{task.progress}%
				</span>
			{/if}

			<!-- Completed checkmark -->
			{#if task.progress === 100}
				<svg
					class="h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M5 13l4 4L19 7"
					/>
				</svg>
			{/if}
		</div>
	</div>
</div>
