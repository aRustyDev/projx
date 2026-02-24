<script lang="ts">
	/**
	 * ThemeToggle - Cycles between light/dark/system themes
	 * @component
	 */

	type Theme = 'light' | 'dark' | 'system';

	interface Props {
		theme?: Theme;
		onthemechange?: (theme: Theme) => void;
	}

	let { theme = 'system', onthemechange }: Props = $props();

	const THEME_ORDER: Theme[] = ['light', 'dark', 'system'];

	function getNextTheme(current: Theme): Theme {
		const currentIndex = THEME_ORDER.indexOf(current);
		const nextIndex = (currentIndex + 1) % THEME_ORDER.length;
		return THEME_ORDER[nextIndex] ?? 'system';
	}

	function cycleTheme() {
		const nextTheme = getNextTheme(theme);
		onthemechange?.(nextTheme);
	}

	function applyTheme(t: Theme) {
		if (t === 'dark') {
			document.documentElement.classList.add('dark');
		} else if (t === 'light') {
			document.documentElement.classList.remove('dark');
		} else {
			// System preference
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			if (prefersDark) {
				document.documentElement.classList.add('dark');
			} else {
				document.documentElement.classList.remove('dark');
			}
		}
	}

	$effect(() => {
		applyTheme(theme);
	});
</script>

<button
	type="button"
	aria-label="Toggle theme (current: {theme})"
	onclick={cycleTheme}
	class="rounded-md p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
>
	{#if theme === 'light'}
		<svg
			data-testid="icon-sun"
			class="h-5 w-5"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
			/>
		</svg>
	{:else if theme === 'dark'}
		<svg
			data-testid="icon-moon"
			class="h-5 w-5"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
			/>
		</svg>
	{:else}
		<svg
			data-testid="icon-system"
			class="h-5 w-5"
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
			/>
		</svg>
	{/if}
</button>
