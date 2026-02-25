# Unified Beads WebUI Plan

> A comprehensive WebUI combining the best features from all existing Beads/Gas-Town tools.

## Status: Planning

**Created**: 2026-02-21
**Last Updated**: 2026-02-22

---

## Quick Links

| Document | Purpose |
|----------|---------|
| [PRD Index](./prds/index.md) | Product Requirements |
| [Spec Index](./spec/index.md) | Technical Specifications |
| [Roadmap](./ROADMAP.md) | Phased delivery plan |
| [ADRs](../../../../docs/src/adrs/) | Architecture Decision Records |
| [Glossary](./glossary.md) | Terminology definitions |
| [Phase 0: Dev Setup](./phase/00-development-setup.md) | Development environment setup |
| [Operations Runbook](./docs/operations-runbook.md) | Troubleshooting and operations |
| [Key References](./references/key-references.md) | Curated summary of reference materials |

---

## Phase Documents

| Phase | Title | Status |
|-------|-------|--------|
| [Phase 01](./phase/01-mvp-core.md) | MVP Core | Pending |
| [Phase 02](./phase/02-analytics.md) | Analytics & Metrics | Pending |
| [Phase 03](./phase/03-git-integration.md) | Git Integration | Pending |
| [Phase 04](./phase/04-agent-orchestration.md) | Agent Orchestration | Pending |
| [Phase 05](./phase/05-gastown-integration.md) | Gas-Town Integration | Pending |

---

## Reference Documents

| Document | Description |
|----------|-------------|
| [Existing WebUI Comparison](./references/existing-webui-comparison.md) | Analysis of 5 Beads WebUIs |
| [Feature Matrix](./references/feature-matrix.md) | Complete feature comparison |
| [Tech Stack Analysis](./references/tech-stack-analysis.md) | Framework/library evaluation |
| [Beads Schema](./references/beads-schema.md) | Database schema reference |
| [Gas-Town WebUIs](./references/gastown-webuis.md) | Gas-Town specific UIs |
| [Dolt Hooks](./references/dolt-hooks.md) | Dolt synchronization hooks |
| [Borrowable Components](./references/borrowable-components.md) | Reusable code from existing tools |
| [Requirements](./references/requirements.md) | Full requirements list |
| [MCP Servers](./references/mcp-servers.md) | Development MCP servers for AI-assisted coding |
| [Federated DAL](./references/federated-dal.md) | Multi-source database architecture |
| [Dolt Native FFI](./references/dolt-native-ffi.md) | Embedded Dolt research |

---

## Key Decisions

### Data Access Strategy
- **Reads**: Direct SQL via `bd sql` or native drivers
- **Writes**: Always via `bd` CLI to maintain sync

### Database Backend
- **Support multiple backends simultaneously** via Federated DAL ([ADR-0022](../../docs/src/adrs/0022-federated-data-access-layer-for-multi-source-support.md))
- Backends: SQLite, Dolt-server, JSONL, future Dolt-native (FFI)
- Namespace-based isolation prevents cross-repo data leakage
- Dolt-only features: version history, branching, time travel queries
- SQLite-only features: simpler setup, no server process

### Multi-Project Support
- **MVP**: Single project only (project selector hidden)
- **Future**: Multi-project in Phase 5+ (design decisions should not prevent this)

### Agent Framework
- **Prefer AI-client agnostic**, but Claude Code is the primary target
- Design decisions favor Claude Code user experience when trade-offs arise
- `foolery` references are Claude-specific but patterns should be adaptable

### Deployment Model
- **MVP**: Localhost only (bind to 127.0.0.1)
- **Future**: Hosted/shared deployments are out of scope but should not be blocked
- Design for localhost, don't optimize for hosted yet

### Tech Stack (Finalized)
- **Runtime**: Bun
- **Frontend**: SvelteKit 2.x with Svelte 5 runes
- **Styling**: Tailwind CSS 4 + tailwind-variants
- **Charts**: Recharts (or Svelte equivalent)
- **Terminal**: xterm.js
- **Drag-and-Drop**: @dnd-kit (or svelte-dnd-action)

---

## Beads Epics

Tracked in Beads under prefix `ubw-` (Unified Beads WebUI):

- Feature Prioritization Matrix
- Architecture Decision Records
- Data Flow Diagrams
- Component Wireframes
- API Contract Definition
- CLI Integration Specification

Use `bd list --label ubw` to view all related issues.
