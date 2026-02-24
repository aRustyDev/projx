# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the Unified Beads WebUI project.

## ADR Index

| ID | Title | Status | Tags |
|----|-------|--------|------|
| [0001](./0001-record-architecture-decisions.md) | Record architecture decisions | Accepted | - |
| [0002](./0002-use-bun-as-primary-runtime.md) | Use Bun as Primary Runtime | Proposed | runtime, infrastructure |
| [0003](./0003-use-sveltekit-as-frontend-framework.md) | Use SvelteKit as Frontend Framework | Proposed | frontend, framework |
| [0004](./0004-use-svelte-stores-for-state-management.md) | Use Svelte Stores for State Management | Proposed | state, architecture |
| [0005](./0005-cli-for-writes-and-direct-sql-for-reads.md) | CLI for Writes and Direct SQL for Reads | Proposed | data, architecture |
| [0006](./0006-use-file-watching-with-websocket-broadcast.md) | Use File Watching with WebSocket Broadcast | Proposed | realtime, architecture |
| [0007](./0007-borrow-components-from-gastown-ui-with-custom-extensions.md) | Borrow Components from gastown_ui | Proposed | ui, components |
| [0008](./0008-use-vitest-with-testing-library-for-component-testing.md) | Use Vitest with Testing Library | Proposed | testing, infrastructure |
| [0009](./0009-use-callback-props-for-component-events.md) | Use Callback Props for Component Events | Proposed | components, patterns |
| [0010](./0010-use-dependency-injection-for-testability.md) | Use Dependency Injection for Testability | Proposed | testing, architecture |
| [0011](./0011-use-opentelemetry-for-observability.md) | Use OpenTelemetry for Observability | Proposed | observability, infrastructure |
| [0012](./0012-use-just-as-command-runner.md) | Use Just as Command Runner | Proposed | tooling, developer-experience |
| [0013](./0013-justfile-patterns-and-conventions.md) | Justfile Patterns and Conventions | Proposed | tooling, conventions |
| [0014](./0014-use-adrs-cli-for-adr-management.md) | Use adrs CLI for ADR Management | Proposed | tooling, conventions |
| [0015](./0015-use-xterm-js-with-node-pty-for-terminal-integration.md) | Use xterm.js with node-pty for Terminal | Proposed | terminal, ui, infrastructure |
| [0016](./0016-use-gh-cli-for-github-operations.md) | Use gh CLI for GitHub Operations | Proposed | git, infrastructure, cli |
| [0017](./0017-use-layerchart-for-charts-and-d3-for-dependency-graphs.md) | Use Layerchart + D3 for Visualizations | Accepted | charts, visualization, ui |
| [0018](./0018-use-storybook-for-visual-component-documentation.md) | Use Storybook for Component Documentation | Accepted | tooling, documentation, ui |
| [0019](./0019-testing-strategy-and-conventions.md) | Testing Strategy and Conventions | Accepted | testing, conventions, infrastructure |

## Summary

### Decisions Made

1. **Runtime**: Bun (with Node.js fallback)
2. **Frontend**: SvelteKit 2.x with Svelte 5
3. **State**: Svelte stores with runes
4. **Data Access**: CLI for writes, direct SQL for reads
5. **Real-time**: File watching + WebSocket broadcast
6. **Components**: Borrow from gastown_ui, extend as needed
7. **Testing**: Vitest + Testing Library with callback props and DI
8. **Observability**: OpenTelemetry for tracing and metrics
9. **Tooling**: Just command runner with modular structure
10. **ADR Management**: adrs CLI for all ADR operations
11. **Terminal**: xterm.js + node-pty for agent sessions
12. **GitHub**: gh CLI for PR/CI operations
13. **Charts**: Layerchart for analytics, D3 for dependency graphs
14. **Docs**: Storybook for visual component documentation
15. **Testing**: Traditional pyramid (50/30/15/5), co-located tests, 70% coverage

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Unified Beads WebUI                      │
├─────────────────────────────────────────────────────────────┤
│  Frontend: SvelteKit 2.x                                    │
│  Components: gastown_ui + custom                            │
│  State: Svelte stores                                       │
├─────────────────────────────────────────────────────────────┤
│  Server: SvelteKit (Bun runtime)                            │
│  Real-time: Chokidar + WebSocket                            │
│  CLI: ProcessSupervisor                                     │
├─────────────────────────────────────────────────────────────┤
│  Data: SQLite/Dolt (reads) + bd CLI (writes)                │
└─────────────────────────────────────────────────────────────┘
```

## ADR Format

All ADRs use MADR 4.0.0 format with YAML frontmatter (NextGen mode):

```yaml
---
number: N
title: Title of Decision
status: proposed | accepted | deprecated | superseded
date: YYYY-MM-DD
tags:
  - tag1
  - tag2
deciders:
  - name
---
```

## Usage

```bash
# List all ADRs
adrs list

# Create new ADR
adrs --ng new --format madr "Title" -t tag1,tag2

# Change status
adrs status 2 accepted

# Link ADRs
adrs link 3 "Amends" 2
```
