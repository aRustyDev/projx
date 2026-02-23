# Glossary

Terminology used throughout the Unified Beads WebUI documentation.

---

## Beads System

### bd (CLI)

The **Beads** command-line interface for issue tracking. Primary commands:

| Command | Purpose |
|---------|---------|
| `bd create` | Create a new issue |
| `bd list` | List issues with filters |
| `bd show` | Display issue details |
| `bd update` | Modify issue fields |
| `bd close` | Close an issue |
| `bd sql` | Execute SQL queries |

### Beads

A local-first issue tracking system that stores data in SQLite/Dolt databases with JSONL export. Designed for developer workflows with git integration.

### Issue

A unit of work tracked in Beads. Has fields like:
- `id` - Unique identifier (e.g., `bd-abc123`)
- `title` - Short description
- `status` - Current state (open, in_progress, blocked, deferred, closed)
- `priority` - 0-4 (0 = highest)
- `issue_type` - bug, feature, task, epic, chore, decision, molecule, gate

### Epic

An issue of type `epic` that serves as a container for child issues. Used for tracking larger initiatives.

### Wisp

A lightweight, ephemeral issue (marked `ephemeral: true`). Used for quick notes or temporary tracking.

### Molecule

An issue type representing a self-contained unit of work with clear boundaries. Typically decomposed from larger features.

### Gate

An issue type representing a decision point or checkpoint that blocks progress until resolved.

---

## Gas-Town System

### gt (CLI)

The **Gas-Town** command-line interface for AI agent orchestration. Primary commands:

| Command | Purpose |
|---------|---------|
| `gt status` | Show town/rig status |
| `gt sling` | Dispatch work to an agent |
| `gt launch` | Start a rig |
| `gt park` | Stop a rig |
| `gt dock` | Archive a rig |
| `gt convoy` | Manage convoy groups |

### Gas-Town

An AI agent orchestration system built on top of Beads. Manages multiple agents working on issues across git worktrees.

### Town

A Gas-Town installation managing a collection of rigs. Named after a project (e.g., "dotfiles town").

### Rig

A git worktree with associated agent infrastructure. States:
- `active` - Running agents
- `parked` - Stopped but configured
- `docked` - Archived

### Polecat

An individual AI agent instance running within a rig. Named agents (e.g., "Toast", "Pepper") that work on issues.

### Convoy

A group of related issues being worked on together by agents. Tracked as a unit for progress reporting.

### Witness

A Gas-Town service that monitors agent activity and logs progress.

### Refinery

A Gas-Town service that processes agent outputs and manages merges.

### Sling

The action of dispatching work to an agent. "Slinging" an issue assigns it to a polecat for execution.

---

## Data Layer

### .beads Directory

The local data directory containing:
- `beads.db` - SQLite database
- `issues.jsonl` - Issue data in JSON Lines format
- `memory/` - Agent memory/knowledge files
- `dolt/` - Dolt database files (if using Dolt backend)

### JSONL

JSON Lines format - one JSON object per line. Used for version-controllable issue storage.

### Dolt

A git-like database providing version control for SQL data. Optional backend for Beads (alternative to SQLite).

### ProcessSupervisor

A component that manages CLI execution with:
- Command queuing
- Circuit breaker pattern
- Timeout handling
- Output streaming

### Circuit Breaker

A pattern that prevents cascading failures. Opens (stops execution) after consecutive failures, then gradually resets.

---

## UI Components

### Kanban Board

A visual workflow board with columns representing issue statuses. Cards can be dragged between columns.

### CFD (Cumulative Flow Diagram)

A chart showing the count of issues in each status over time. Used to visualize work-in-progress and flow efficiency.

### Lead Time

The time from issue creation to closure. Measured in hours/days.

### Throughput

The number of issues closed per time period. Measured weekly.

### Aging WIP

Work-in-progress items plotted by their age. Identifies stale issues.

### RAG Status

Red/Amber/Green health indicator:
- **Green** - On track
- **Amber** - At risk
- **Red** - Critical issues

### Terminal Drawer

A collapsible panel showing CLI output and agent activity. Uses xterm.js for terminal emulation.

### Verification Queue

A list of agent-completed work awaiting human review. Actions: Approve, Reject, ReTake.

### ReTake

Sending an issue back to an agent with feedback for revision.

---

## Architecture

### Hybrid Data Access

Pattern where:
- **Reads** - Direct SQL queries (fast)
- **Writes** - Via CLI commands (ensures data integrity)

### File Watching

Using Chokidar to detect changes in `.beads/` directory and trigger UI updates.

### WebSocket Broadcast

Real-time push of changes to all connected browser clients via WebSocket connections.

### Optimistic UI

Updating the UI immediately before CLI commands complete, then reconciling with actual results.

---

## Development

### Runes

Svelte 5's reactivity system using `$state`, `$derived`, `$effect`, and `$props`.

### tailwind-variants

A library for defining variant-based component styles with Tailwind CSS classes.

### MCP (Model Context Protocol)

A protocol for AI assistants to interact with external tools and data sources. Used for development tooling integration.

---

## Abbreviations

| Abbr | Meaning |
|------|---------|
| bd | Beads CLI |
| gt | Gas-Town CLI |
| WIP | Work in Progress |
| CFD | Cumulative Flow Diagram |
| RAG | Red/Amber/Green |
| P0-P4 | Priority levels (0=highest) |
| MVP | Minimum Viable Product |
| ADR | Architecture Decision Record |
| SSR | Server-Side Rendering |
| E2E | End-to-End (testing) |

---

## Issue ID Prefixes

| Prefix | Source |
|--------|--------|
| `bd-` | Beads issue |
| `ubw-` | Unified Beads WebUI (this project) |
| `gt-` | Gas-Town issue |

---

## Status Values

| Status | Description |
|--------|-------------|
| `open` | Not started |
| `in_progress` | Actively being worked on |
| `blocked` | Waiting on dependency |
| `deferred` | Postponed to future date |
| `closed` | Completed |

## Agent States

| State | Description |
|-------|-------------|
| `idle` | Available for work |
| `working` | Processing an issue |
| `stalled` | Stuck, needs intervention |
| `zombie` | Unresponsive, needs restart |
| `nuked` | Terminated |
