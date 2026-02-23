# Component Library Specification

This document defines the design system, component APIs, and documentation approach for the Unified Beads WebUI.

---

## Design Tokens

### Colors

Based on gastown_ui design system with Tailwind CSS v4.

```css
/* tailwind.config.ts → theme.extend.colors */
@theme {
  /* Semantic Colors */
  --color-background: var(--color-zinc-950);
  --color-foreground: var(--color-zinc-50);
  --color-muted: var(--color-zinc-400);
  --color-muted-foreground: var(--color-zinc-500);
  --color-border: var(--color-zinc-800);
  --color-input: var(--color-zinc-900);

  /* Primary */
  --color-primary: var(--color-blue-600);
  --color-primary-foreground: var(--color-white);

  /* Semantic Status */
  --color-success: var(--color-emerald-500);
  --color-success-foreground: var(--color-emerald-950);
  --color-warning: var(--color-amber-500);
  --color-warning-foreground: var(--color-amber-950);
  --color-error: var(--color-red-500);
  --color-error-foreground: var(--color-red-950);
  --color-info: var(--color-sky-500);
  --color-info-foreground: var(--color-sky-950);

  /* Issue Status */
  --color-status-open: var(--color-zinc-400);
  --color-status-in-progress: var(--color-blue-500);
  --color-status-blocked: var(--color-red-500);
  --color-status-deferred: var(--color-amber-500);
  --color-status-closed: var(--color-emerald-500);

  /* Priority */
  --color-priority-0: var(--color-red-600);      /* Critical */
  --color-priority-1: var(--color-orange-500);   /* High */
  --color-priority-2: var(--color-yellow-500);   /* Medium */
  --color-priority-3: var(--color-blue-400);     /* Low */
  --color-priority-4: var(--color-zinc-400);     /* Minimal */

  /* Agent States */
  --color-agent-idle: var(--color-zinc-400);
  --color-agent-working: var(--color-blue-500);
  --color-agent-stalled: var(--color-amber-500);
  --color-agent-zombie: var(--color-red-500);

  /* RAG Health */
  --color-rag-green: var(--color-emerald-500);
  --color-rag-amber: var(--color-amber-500);
  --color-rag-red: var(--color-red-500);
}
```

### Spacing

```css
@theme {
  /* Base unit: 4px */
  --spacing-0: 0;
  --spacing-1: 0.25rem;  /* 4px */
  --spacing-2: 0.5rem;   /* 8px */
  --spacing-3: 0.75rem;  /* 12px */
  --spacing-4: 1rem;     /* 16px */
  --spacing-5: 1.25rem;  /* 20px */
  --spacing-6: 1.5rem;   /* 24px */
  --spacing-8: 2rem;     /* 32px */
  --spacing-10: 2.5rem;  /* 40px */
  --spacing-12: 3rem;    /* 48px */
  --spacing-16: 4rem;    /* 64px */
}
```

### Typography

```css
@theme {
  /* Font Families */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;

  /* Font Sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */

  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
}
```

### Borders & Radii

```css
@theme {
  --radius-none: 0;
  --radius-sm: 0.125rem;  /* 2px */
  --radius-md: 0.375rem;  /* 6px */
  --radius-lg: 0.5rem;    /* 8px */
  --radius-xl: 0.75rem;   /* 12px */
  --radius-full: 9999px;

  --border-width: 1px;
}
```

### Shadows

```css
@theme {
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}
```

---

## Component API Standards

### Props Pattern (Svelte 5)

```svelte
<script lang="ts">
  import { tv, type VariantProps } from 'tailwind-variants';

  // Define variants
  const button = tv({
    base: 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-muted text-muted-foreground hover:bg-muted/80',
        outline: 'border border-border bg-transparent hover:bg-muted',
        ghost: 'hover:bg-muted',
        destructive: 'bg-error text-error-foreground hover:bg-error/90',
      },
      size: {
        sm: 'h-8 px-3 text-sm rounded-md',
        md: 'h-10 px-4 text-sm rounded-lg',
        lg: 'h-12 px-6 text-base rounded-lg',
        icon: 'h-10 w-10 rounded-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  });

  type ButtonVariants = VariantProps<typeof button>;

  // Props with $props()
  let {
    variant = 'default',
    size = 'md',
    disabled = false,
    class: className = '',
    children,
    ...restProps
  }: ButtonVariants & {
    disabled?: boolean;
    class?: string;
    children?: import('svelte').Snippet;
  } & Omit<HTMLButtonAttributes, 'class'> = $props();
</script>

<button
  class={button({ variant, size, class: className })}
  {disabled}
  {...restProps}
>
  {@render children?.()}
</button>
```

### Event Handling

```svelte
<script lang="ts">
  let {
    onclose,
    onchange,
  }: {
    onclose?: () => void;
    onchange?: (value: string) => void;
  } = $props();
</script>
```

### Slots → Snippets (Svelte 5)

```svelte
<!-- Parent component -->
<script lang="ts">
  let { header, children, footer }: {
    header?: import('svelte').Snippet;
    children?: import('svelte').Snippet;
    footer?: import('svelte').Snippet;
  } = $props();
</script>

<div class="card">
  {#if header}
    <div class="card-header">
      {@render header()}
    </div>
  {/if}

  <div class="card-body">
    {@render children?.()}
  </div>

  {#if footer}
    <div class="card-footer">
      {@render footer()}
    </div>
  {/if}
</div>

<!-- Usage -->
<Card>
  {#snippet header()}
    <h2>Title</h2>
  {/snippet}

  <p>Card content</p>

  {#snippet footer()}
    <Button>Action</Button>
  {/snippet}
</Card>
```

---

## Core Components

### Button

```typescript
interface ButtonProps {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  disabled?: boolean;
  loading?: boolean;
  class?: string;
}
```

### Badge

```typescript
interface BadgeProps {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
  class?: string;
}
```

### Input

```typescript
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'search';
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  class?: string;
}
```

### Select

```typescript
interface SelectProps<T> {
  value?: T;
  options: { value: T; label: string }[];
  placeholder?: string;
  disabled?: boolean;
  class?: string;
  onchange?: (value: T) => void;
}
```

### Dialog/Modal

```typescript
interface DialogProps {
  open?: boolean;
  title?: string;
  description?: string;
  onclose?: () => void;
  children?: Snippet;
  footer?: Snippet;
}
```

---

## Domain Components

### StatusBadge

```typescript
interface StatusBadgeProps {
  status: 'open' | 'in_progress' | 'blocked' | 'deferred' | 'closed';
  size?: 'sm' | 'md';
}
```

```svelte
<StatusBadge status="in_progress" />
<!-- Renders: ◐ In Progress (with blue color) -->
```

### PriorityIndicator

```typescript
interface PriorityIndicatorProps {
  priority: 0 | 1 | 2 | 3 | 4;
  showLabel?: boolean;
}
```

```svelte
<PriorityIndicator priority={1} showLabel />
<!-- Renders: P1 (with orange color) -->
```

### IssueCard

```typescript
interface IssueCardProps {
  issue: Issue;
  selected?: boolean;
  draggable?: boolean;
  onclick?: () => void;
}
```

### AgentStateIcon

```typescript
interface AgentStateIconProps {
  state: 'idle' | 'working' | 'stalled' | 'zombie' | 'nuked';
  animated?: boolean;
}
```

### HealthBadge (RAG)

```typescript
interface HealthBadgeProps {
  status: 'green' | 'amber' | 'red';
  label?: string;
}
```

### ProgressBar

```typescript
interface ProgressBarProps {
  value: number;      // 0-100
  max?: number;
  showLabel?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'error';
}
```

---

## Layout Components

### PageLayout

```typescript
interface PageLayoutProps {
  title: string;
  description?: string;
  actions?: Snippet;
  children?: Snippet;
}
```

### Sidebar

```typescript
interface SidebarProps {
  collapsed?: boolean;
  items: NavItem[];
  oncollapse?: (collapsed: boolean) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  badge?: number;
  active?: boolean;
}
```

### SplitView

```typescript
interface SplitViewProps {
  direction?: 'horizontal' | 'vertical';
  defaultSize?: number;  // percentage
  minSize?: number;
  maxSize?: number;
  children?: Snippet;
  panel?: Snippet;
}
```

### TerminalDrawer

```typescript
interface TerminalDrawerProps {
  open?: boolean;
  height?: number;
  tabs?: TerminalTab[];
  ontoggle?: () => void;
}

interface TerminalTab {
  id: string;
  title: string;
  type: 'terminal' | 'agent';
}
```

---

## Storybook Documentation

### Story Format

```typescript
// Button.stories.ts
import type { Meta, StoryObj } from '@storybook/svelte';
import Button from './Button.svelte';

const meta: Meta<Button> = {
  title: 'Core/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'outline', 'ghost', 'destructive'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    variant: 'default',
    size: 'md',
  },
  render: (args) => ({
    Component: Button,
    props: args,
    slots: { default: 'Click me' },
  }),
};

export const AllVariants: Story = {
  render: () => ({
    Component: ButtonShowcase, // Shows all variants
  }),
};
```

### Story Categories

```
Storybook/
├── Core/
│   ├── Button
│   ├── Badge
│   ├── Input
│   ├── Select
│   ├── Dialog
│   └── Toast
├── Layout/
│   ├── PageLayout
│   ├── Sidebar
│   ├── SplitView
│   └── TerminalDrawer
├── Domain/
│   ├── StatusBadge
│   ├── PriorityIndicator
│   ├── IssueCard
│   ├── AgentStateIcon
│   ├── HealthBadge
│   └── ProgressBar
├── Patterns/
│   ├── IssueList
│   ├── KanbanColumn
│   ├── MetricsCard
│   └── FilterBar
└── Pages/
    ├── Dashboard
    ├── Kanban
    └── Metrics
```

### Accessibility Addon

```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/sveltekit';

const config: StorybookConfig = {
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',  // Accessibility checks
  ],
};
```

---

## Component File Structure

```
src/lib/components/
├── core/
│   ├── Button/
│   │   ├── Button.svelte
│   │   ├── Button.stories.ts
│   │   ├── Button.test.ts
│   │   └── index.ts
│   ├── Badge/
│   ├── Input/
│   └── ...
├── layout/
│   ├── PageLayout/
│   ├── Sidebar/
│   └── ...
├── domain/
│   ├── StatusBadge/
│   ├── IssueCard/
│   └── ...
└── index.ts  # Re-exports all components
```

### Index Exports

```typescript
// src/lib/components/index.ts
export { default as Button } from './core/Button/Button.svelte';
export { default as Badge } from './core/Badge/Badge.svelte';
export { default as Input } from './core/Input/Input.svelte';
// ... etc

export { default as StatusBadge } from './domain/StatusBadge/StatusBadge.svelte';
export { default as IssueCard } from './domain/IssueCard/IssueCard.svelte';
// ... etc
```

---

## Accessibility Requirements

### WCAG 2.1 AA Compliance

All components must:

1. **Color Contrast**: 4.5:1 for normal text, 3:1 for large text
2. **Focus Visible**: Clear focus indicators (2px outline, offset)
3. **Keyboard Navigation**: All interactive elements focusable
4. **Screen Reader**: Proper ARIA labels and roles
5. **Motion**: Respect `prefers-reduced-motion`

### Focus Management

```svelte
<script>
  import { FocusTrap } from '$lib/components/a11y';
</script>

<FocusTrap active={dialogOpen}>
  <Dialog>...</Dialog>
</FocusTrap>
```

### Live Regions

```svelte
<script>
  import { LiveRegion } from '$lib/components/a11y';
</script>

<LiveRegion message={toastMessage} />
```

---

## References

- [tailwind-variants Documentation](https://www.tailwind-variants.org/)
- [Storybook for Svelte](https://storybook.js.org/docs/svelte/get-started)
- [ADR-0007: Component Strategy](../../../../../docs/src/adrs/0007-borrow-components-from-gastown-ui-with-custom-extensions.md)
- [Wireframes](./wireframes.md)
