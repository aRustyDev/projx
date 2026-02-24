# Claude Code Instructions for projx-ui

> Project-specific instructions for AI assistants working on this codebase.

## Project Overview

Unified Beads WebUI - A SvelteKit-based interface for the Beads project management system.

**Tech Stack**: Bun, SvelteKit 2.x, Svelte 5, TypeScript, Vitest, Playwright

## Architecture Decision Records (ADRs)

**CRITICAL**: You MUST use the `adrs` CLI for ALL ADR operations. Never create, modify, or delete ADR files directly.

### Creating ADRs

```bash
# Standard creation with MADR format and tags
adrs --ng new --format madr -t tag1,tag2 "Title of Decision"

# Create without opening editor (for scripting)
adrs --ng new --format madr -t tag1,tag2 --no-edit "Title"

# Create with link to existing ADR
adrs --ng new --format madr --link "2:Implements:Implemented by" "Title"

# Supersede an existing ADR
adrs --ng new --supersedes 5 "New approach to X"
```

### Managing ADRs

```bash
# List all ADRs
adrs list

# Change status
adrs status 12 accepted

# Link two ADRs
adrs link 3 "Amends" 2
```

### Prohibited Actions

- **DO NOT** create ADR files with `Write` tool or text editors
- **DO NOT** manually assign ADR numbers
- **DO NOT** edit YAML frontmatter `number` or `date` fields
- **DO NOT** manually create links between ADRs

### Allowed After Creation

After creating an ADR with `adrs` CLI, you MAY:

- Edit content sections (Context, Decision, Consequences)
- Add prose within the markdown body
- Update status via `adrs status` command
- Add deciders to frontmatter

**ADR Location**: `docs/src/adrs/`

## Justfile Commands

Use `just` for all common tasks. See `just --list` for available commands.

```bash
# Development
just dev              # Start dev server with hot reload
just build            # Build all assets
just test             # Run tests (typecheck + unit)
just test --full      # Run full test suite (+ e2e)

# Linting
just lint             # Check code style
just fix              # Fix code style issues

# Docker
just docker up        # Start containers
just docker down      # Stop containers

# Database
just db status        # Show beads database status
just db backup        # Backup database
```

## Git Conventions

### Commit Messages

Use conventional commits with allowed scopes:

- `core`, `ui`, `api`, `cli`, `db`, `realtime`, `kanban`, `metrics`, `gantt`, `terminal`

```bash
# Examples
feat(ui): add status dropdown component
fix(api): handle null response in issues endpoint
docs(core): add ADR for testing strategy
chore(db): update migration scripts
```

### Signing

All commits must be signed. Git is configured to sign automatically with SSH key.

## Testing

- **Unit tests**: Vitest with Testing Library
- **E2E tests**: Playwright
- **Test location**: Co-located with source (`*.test.ts`)

```bash
bun run test:unit     # Unit tests
bun run test:e2e      # E2E tests
bun run test:coverage # Coverage report
```

## Beads Issue Tracking

Issues are tracked in `.beads/issues.jsonl`. Use the beads CLI or justfile recipes:

```bash
just db status        # View issue counts
just db query '.[]'   # Query issues with jq
just db browse        # Interactive issue browser (fzf)
```

## Code Style

- **Formatting**: Prettier (auto-run via pre-commit)
- **Linting**: ESLint with Svelte plugin
- **Types**: Strict TypeScript

Run `just fix` before committing to auto-fix issues.

## Component Patterns

### Event Handling

Use callback props (not custom events) for component communication:

```svelte
<script lang="ts">
	interface Props {
		onchange?: (value: string) => void;
	}
	let { onchange }: Props = $props();
</script>
```

### State Management

Use Svelte 5 runes (`$state`, `$derived`, `$effect`) for reactive state.

## References

- [ADR Index](docs/src/adrs/index.md)
- [Justfile](justfile)
- [Package Scripts](package.json)
