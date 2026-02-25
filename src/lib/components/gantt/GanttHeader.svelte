<script lang="ts">
	/**
	 * GanttHeader - Date header for the Gantt chart timeline
	 * @component
	 *
	 * Displays:
	 * - Month/year labels
	 * - Day numbers
	 * - Weekend highlighting
	 */

	interface Props {
		dates: Date[];
		dayWidth: number;
	}

	let { dates, dayWidth }: Props = $props();

	// Group dates by month for top-level header
	interface MonthGroup {
		label: string;
		days: number;
		startIndex: number;
	}

	const monthGroups = $derived.by(() => {
		const groups: MonthGroup[] = [];
		let currentMonth = -1;
		let currentYear = -1;

		dates.forEach((date, index) => {
			const month = date.getMonth();
			const year = date.getFullYear();

			if (month !== currentMonth || year !== currentYear) {
				groups.push({
					label: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
					days: 1,
					startIndex: index
				});
				currentMonth = month;
				currentYear = year;
			} else {
				groups[groups.length - 1].days++;
			}
		});

		return groups;
	});

	function getDayLabel(date: Date): string {
		return date.getDate().toString();
	}

	function getDayOfWeek(date: Date): string {
		return date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
	}

	function isWeekend(date: Date): boolean {
		return date.getDay() === 0 || date.getDay() === 6;
	}

	function isToday(date: Date): boolean {
		const today = new Date();
		return (
			date.getDate() === today.getDate() &&
			date.getMonth() === today.getMonth() &&
			date.getFullYear() === today.getFullYear()
		);
	}
</script>

<div
	class="gantt-header sticky top-0 z-20 border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
>
	<!-- Month row -->
	<div class="flex h-7 border-b border-gray-200 dark:border-gray-700">
		{#each monthGroups as group (group.label)}
			<div
				class="flex items-center justify-center border-r border-gray-200 text-xs font-semibold text-gray-700 dark:border-gray-700 dark:text-gray-300"
				style="width: {group.days * dayWidth}px;"
			>
				{group.label}
			</div>
		{/each}
	</div>

	<!-- Day row -->
	<div class="flex h-7">
		{#each dates as date, i (i)}
			<div
				class="flex flex-col items-center justify-center border-r text-xs"
				class:bg-gray-100={isWeekend(date)}
				class:dark:bg-gray-700={isWeekend(date)}
				class:bg-blue-100={isToday(date)}
				class:dark:bg-blue-900={isToday(date)}
				class:border-gray-200={!isWeekend(date)}
				class:border-gray-300={isWeekend(date)}
				class:dark:border-gray-700={!isWeekend(date)}
				class:dark:border-gray-600={isWeekend(date)}
				style="width: {dayWidth}px;"
			>
				<span
					class="font-medium"
					class:text-gray-500={isWeekend(date) && !isToday(date)}
					class:text-gray-700={!isWeekend(date) && !isToday(date)}
					class:text-blue-700={isToday(date)}
					class:dark:text-gray-400={isWeekend(date) && !isToday(date)}
					class:dark:text-gray-300={!isWeekend(date) && !isToday(date)}
					class:dark:text-blue-400={isToday(date)}
				>
					{getDayLabel(date)}
				</span>
				<span class="text-[10px] text-gray-400 dark:text-gray-500">
					{getDayOfWeek(date)}
				</span>
			</div>
		{/each}
	</div>
</div>
