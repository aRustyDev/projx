# 4. Use Storybook for visual component documentation

Date: 2026-02-23

## Status

Accepted

## Context

With the decision to use ASCII wireframes instead of Penpot for prototyping (ADR-0003), we lose visual documentation of components. We need an alternative approach for:

1. Visual component documentation and review
2. Interactive component exploration
3. Design system documentation
4. Component state visualization (loading, error, empty, etc.)
5. Stakeholder review of implemented components

Options considered:
- **Storybook**: Industry-standard component documentation tool
- **Histoire**: Vite-native alternative, Svelte-focused
- **Custom docs site**: Build our own documentation
- **No visual docs**: Rely on code comments and README files

## Decision

We will use Storybook for visual component documentation.

Storybook provides:
- Interactive component explorer
- Multiple viewport testing (responsive design)
- Component state stories (variants, states, edge cases)
- Autodocs from component props/types
- Accessibility testing addons
- Visual regression testing integration
- Design token documentation
- Wide ecosystem and community support

## Implementation

### Setup (Phase 0 - projx-13y.6)
```bash
npx storybook@latest init --type sveltekit
```

### Story Structure
```
src/
├── lib/
│   └── components/
│       └── IssueCard/
│           ├── IssueCard.svelte
│           ├── IssueCard.stories.ts    # Component stories
│           └── IssueCard.test.ts       # Unit tests
```

### Story Example
```typescript
// IssueCard.stories.ts
import type { Meta, StoryObj } from '@storybook/svelte';
import IssueCard from './IssueCard.svelte';

const meta = {
  title: 'Components/IssueCard',
  component: IssueCard,
  tags: ['autodocs'],
} satisfies Meta<IssueCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    issue: { id: '123', title: 'Fix login bug', status: 'open', priority: 'P1' }
  }
};

export const InProgress: Story = {
  args: {
    issue: { id: '124', title: 'Add dark mode', status: 'in_progress', priority: 'P2' }
  }
};

export const Loading: Story = {
  args: { loading: true }
};
```

### Recommended Addons
- `@storybook/addon-essentials` (controls, actions, viewport, backgrounds)
- `@storybook/addon-a11y` (accessibility testing)
- `@storybook/addon-designs` (link to design files if available)
- `@storybook/addon-interactions` (interaction testing)

## Consequences

### Positive
- Visual documentation alongside code
- Interactive component exploration
- Design system documentation in one place
- Supports visual regression testing
- Stakeholder review without running full app
- Documents component states and edge cases
- Accessibility testing built-in

### Negative
- Additional build/dev tooling
- Learning curve for writing stories
- Maintenance burden (stories must stay in sync with components)
- Adds to CI build time

### Mitigation
- Use autodocs to minimize manual documentation
- Co-locate stories with components for easier maintenance
- Include story updates in component PR requirements
- Run Storybook build in CI to catch breaking changes

## Workflow Integration

```
1. ASCII Wireframe (structure)
   └── Define layout, components needed

2. Component Development
   ├── Create component (.svelte)
   ├── Create stories (.stories.ts)
   └── Create tests (.test.ts)

3. Visual Review (Storybook)
   ├── Review component states
   ├── Check responsive behavior
   └── Verify accessibility

4. Integration
   └── Compose components into views
```

## Related

- ADR-0003: Use ASCII wireframes instead of Penpot
- projx-13y.6: Storybook setup task (Phase 0)
