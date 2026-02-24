---
number: 14
title: Use adrs CLI for ADR Management
status: proposed
date: 2026-02-24
tags:
  - tooling
  - conventions
deciders:
  - aRustyDev
links:
  - rel: Implements
    target: 1
---

# Use adrs CLI for ADR Management

## Context and Problem Statement

ADR-0001 establishes that we use Architecture Decision Records to document decisions. We need to standardize how ADRs are created, updated, linked, and managed to ensure consistency across all contributors, including AI assistants like Claude.

## Decision Drivers

* **Consistency**: All ADRs should follow the same format and structure
* **Automation**: Reduce manual errors in numbering, linking, and metadata
* **Discoverability**: Easy to list, search, and navigate ADRs
* **AI compatibility**: Clear instructions for AI assistants to follow
* **Version control**: Changes tracked properly in git

## Considered Options

* **adrs CLI** - Rust-based ADR management tool
* **Manual file creation** - Create markdown files directly
* **adr-tools** - Original shell-based ADR tooling
* **Custom scripts** - Project-specific ADR management

## Decision Outcome

Chosen option: **adrs CLI**, because it provides robust automation, supports both Nygard and MADR formats, handles linking and numbering automatically, and is already installed via Brewfile.

### Consequences

* Good, because automatic numbering prevents collisions
* Good, because `--ng` mode provides YAML frontmatter for rich metadata
* Good, because linking between ADRs is bidirectional and automatic
* Good, because `adrs list` and `adrs status` provide easy management
* Good, because consistent format for all ADRs
* Neutral, because requires learning CLI commands
* Bad, because tool must be installed (mitigated by Brewfile)

### Confirmation

* CLAUDE.md documents required CLI usage for AI assistants
* Code review checks that ADRs were created via `adrs` CLI
* Pre-commit hook could validate ADR format (future enhancement)

## Required Commands

### Creating ADRs

```bash
# Create new ADR with MADR format and tags
adrs --ng new --format madr -t tag1,tag2 "Title of Decision"

# Create without opening editor (for scripting/AI)
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
adrs status 5 deprecated

# Link two ADRs
adrs link 3 "Amends" 2

# Generate table of contents
adrs generate toc > docs/src/adrs/README.md
```

### Reading ADRs

```bash
# View specific ADR
adrs show 12

# Search ADRs (via grep/ripgrep on files)
rg "pattern" docs/src/adrs/
```

## Prohibited Actions

The following actions are **prohibited** to maintain consistency:

1. **DO NOT** create ADR files manually with `Write` or text editors
2. **DO NOT** manually assign ADR numbers
3. **DO NOT** edit YAML frontmatter `number` or `date` fields manually
4. **DO NOT** manually create links between ADRs (use `adrs link`)

## Allowed Actions

After creating an ADR with `adrs` CLI, you **MAY**:

1. Edit the content sections (Context, Decision, Consequences, etc.)
2. Add or modify prose within the markdown body
3. Update the `status` field via `adrs status` command
4. Add additional metadata to frontmatter (deciders, custom fields)

## More Information

### Installation

```bash
# Via Homebrew (in Brewfile)
brew install adrs

# Verify installation
adrs --version
```

### References

* [adrs CLI Documentation](https://joshrotenberg.github.io/adrs-book/)
* [ADR-0001: Record Architecture Decisions](./0001-record-architecture-decisions.md)
* [MADR 4.0.0 Format](https://adr.github.io/madr/)
