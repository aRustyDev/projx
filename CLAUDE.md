# Claude Code Instructions for projx-ui

> Project-specific instructions for AI assistants working on this codebase.

## Project Overview

Unified Beads WebUI - A SvelteKit-based interface for the Beads project management system.

**Tech Stack**: Bun, SvelteKit 2.x, Svelte 5, TypeScript, Vitest, Playwright

## Architecture Decision Records (ADRs)

**CRITICAL**: You MUST use the `adrs` CLI for ALL ADR operations. Never create, modify, or delete ADR files directly.

**ADR Location**: `docs/src/adrs/`

### Creating ADRs

```bash
# Standard creation with MADR format and tags
adrs --ng new --format madr -t tag1,tag2 --no-edit "Title of Decision"

# Create with link to existing ADR
adrs --ng new --format madr --link "2:Implements:Implemented by" --no-edit "Title"

# Create with accepted status (for already-decided items)
adrs --ng new --format madr -t tag1,tag2 --status accepted --no-edit "Title"

# Supersede an existing ADR
adrs --ng new --supersedes 5 --no-edit "New approach to X"
```

**Always use `--no-edit`** to prevent the CLI from opening an editor.

### Managing ADRs

```bash
# List all ADRs
adrs list

# Change status
adrs status 12 accepted

# Link two ADRs (bidirectional)
adrs link 3 "Amends" 2
```

### Known Issue: Numbering Collisions

**IMPORTANT**: The `adrs` CLI can create duplicate numbers if files were recently added manually or by another process. Always verify after creation:

```bash
# After creating an ADR, check for duplicates
ls docs/src/adrs/00*.md | sort

# If collision detected (e.g., two 0016 files), rename the new one:
mv docs/src/adrs/0016-new-title.md docs/src/adrs/0017-new-title.md

# Then update the frontmatter number field in the renamed file
```

**Workflow to avoid collisions:**

1. Run `adrs list` before creating to see current highest number
2. Create the ADR with `adrs --ng new ...`
3. Verify no collision: `ls docs/src/adrs/00*.md | tail -5`
4. If collision, rename file AND update `number:` in frontmatter

### After Creation: Filling Content

The CLI creates a template. You MUST fill in the content:

```bash
# 1. CLI creates template at docs/src/adrs/0019-my-decision.md
adrs --ng new --format madr -t tag1 --no-edit "My Decision"

# 2. Read the template
# (file will have placeholder text like "{decision driver 1}")

# 3. Edit the file to fill in actual content
# - Replace all {placeholder} text
# - Add Context, Decision Drivers, Options, Consequences
# - Remove HTML comments if not needed

# 4. Update the index
# Edit docs/src/adrs/index.md to add the new ADR to the table
```

### Prohibited Actions

- **DO NOT** create ADR files with `Write` tool or text editors
- **DO NOT** manually assign ADR numbers (use CLI, fix collisions if needed)
- **DO NOT** edit YAML frontmatter `date` field
- **DO NOT** manually create links between ADRs (use `adrs link`)

### Allowed After Creation

After creating an ADR with `adrs` CLI, you MAY:

- Edit/replace all content sections (Context, Decision, Consequences, etc.)
- Add `deciders:` list to frontmatter
- Fix `number:` field if collision occurred
- Update status via `adrs status` command

### ADR Locations

| Location                | Purpose                                         |
| ----------------------- | ----------------------------------------------- |
| `docs/src/adrs/`        | Project architecture decisions (permanent)      |
| `.claude/plans/*/adrs/` | Planning-phase decisions (temporary/historical) |

Planning ADRs are for decisions about _how we planned_, not _what we're building_.

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
