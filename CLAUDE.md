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

## Release Workflow

Releases are created using an interactive script that handles versioning, changelog generation, and tagging.

```bash
# Preview a release (no changes)
just release --dry-run

# Create a release interactively
just release

# View unreleased changes
just changelog
```

### Process

1. Script validates clean working directory
2. Shows unreleased changes from conventional commits
3. Prompts for version bump (patch/minor/major/custom)
4. Runs tests before proceeding
5. Updates CHANGELOG.md via git-cliff
6. Updates package.json version
7. Creates annotated tag with release notes
8. Pushes to trigger GitHub Actions

### CI Workflow

When a tag is pushed, GitHub Actions automatically:

- Builds the application
- Generates SBOM (CycloneDX)
- Creates GitHub release with artifacts
- Publishes to npm with provenance (SLSA Level 2)
- Signs artifacts with Sigstore

### Verification

```bash
# Verify npm package provenance
npm audit signatures

# Verify GitHub release signatures
cosign verify-blob \
  --signature looms-VERSION.tar.gz.sig \
  --certificate looms-VERSION.tar.gz.pem \
  --certificate-identity-regexp='https://github.com/aRustyDev/looms/.*' \
  --certificate-oidc-issuer='https://token.actions.githubusercontent.com' \
  looms-VERSION.tar.gz
```

See [RELEASING.md](RELEASING.md) and [ADR-0020](docs/src/adrs/0020-release-workflow.md) for details.

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

**CRITICAL**: NEVER edit `.beads/issues.jsonl` directly. ALWAYS use the `bd` CLI to interact with beads.

### Why This Matters

**The database is the source of truth, NOT the JSONL file.**

- `bd sync` exports DB → JSONL (overwrites the file)
- `bd import` has merge conflicts if issues already exist
- Direct JSONL edits are **lost** when sync runs
- The bd CLI reads from the database, not JSONL
- Auto-generated IDs follow patterns like `projx-695.21`

```bash
# Issue operations - ALWAYS use bd CLI
bd list                          # List all issues
bd list --status open            # List open issues
bd show projx-695.1              # Show issue details
bd create --title "..." --type task  # Create issue
bd update projx-695.1 --status closed  # Update issue
bd close projx-695.1             # Close issue

# Sync database to JSONL (for git commits)
bd sync                          # Export DB → JSONL

# Query/browse (read-only)
just db status        # View issue counts
just db query '.[]'   # Query issues with jq
just db browse        # Interactive issue browser (fzf)
```

### Prohibited Actions

- ❌ Edit `.beads/issues.jsonl` with `Write`, `Edit`, `sed`, `awk`, or any direct manipulation
- ❌ Use `cat >>` or `echo >>` to append to issues.jsonl
- ❌ Create issues with manual IDs (let bd auto-generate them)
- ✅ ALWAYS use `bd` CLI for create, update, close, reopen operations
- ✅ Run `bd sync` after CLI operations to update the JSONL file for git

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
