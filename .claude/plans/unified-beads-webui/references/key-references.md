# Key References Summary

This document provides a curated summary of the most important reference materials. For deep dives, see the linked full documents.

---

## Quick Navigation

| Topic | Key Document |
|-------|--------------|
| Database schema | [beads-schema.md](./beads-schema.md) |
| Existing tools comparison | [existing-webui-comparison.md](./existing-webui-comparison.md) |
| Feature matrix | [feature-matrix.md](./feature-matrix.md) |
| Borrowable code | [borrowable-components.md](./borrowable-components.md) |
| Gas-Town specifics | [gastown-webuis.md](./gastown-webuis.md) |
| MCP servers | [mcp-servers.md](./mcp-servers.md) |
| **Multi-source federation** | [federated-dal.md](./federated-dal.md) |
| **Dolt native FFI** | [dolt-native-ffi.md](./dolt-native-ffi.md) |

---

## Existing WebUI Tools

### Summary

| Tool | Stack | Strengths | Borrow? |
|------|-------|-----------|---------|
| **beads-ui** | SvelteKit + Rust | Real-time sync, WebSocket | Yes |
| **beads-dashboard** | Remix + Prisma | Metrics, Kanban | Partial |
| **foolery** | Tauri + Vue | Agent terminal, Claude integration | Yes |
| **gastown_ui** | SvelteKit | 70+ components, dark theme | Yes |
| **beads-kanban-ui** | Next.js | Worktree visualization | Patterns |

### Key Patterns to Borrow

1. **beads-ui**: File watching → WebSocket broadcast pattern
2. **beads-dashboard**: ProcessSupervisor circuit breaker
3. **foolery**: xterm.js terminal integration
4. **gastown_ui**: Component library, design tokens

See: [existing-webui-comparison.md](./existing-webui-comparison.md)

---

## Database Schema

### Core Tables

```sql
-- Issues (primary)
issues (
  id TEXT PRIMARY KEY,        -- bd-xxx format
  title TEXT NOT NULL,
  description TEXT,
  status TEXT,                -- open|in_progress|blocked|deferred|closed
  priority INTEGER,           -- 0-4 (0=critical)
  issue_type TEXT,            -- bug|feature|task|epic|...
  assignee TEXT,
  owner TEXT,
  parent_id TEXT,
  created_at DATETIME,
  updated_at DATETIME,
  closed_at DATETIME
);

-- Labels (many-to-many)
issue_labels (
  issue_id TEXT,
  label TEXT
);

-- Dependencies
dependencies (
  source_id TEXT,
  target_id TEXT,
  dep_type TEXT               -- blocks|blocked_by|relates_to
);

-- Comments
comments (
  id INTEGER PRIMARY KEY,
  issue_id TEXT,
  author TEXT,
  body TEXT,
  created_at DATETIME
);
```

See: [beads-schema.md](./beads-schema.md)

---

## Multi-Source Database Support

### Supported Backends

| Type | Description | Mode | Status |
|------|-------------|------|--------|
| `sqlite` | Local SQLite via better-sqlite3 | read/write | Implemented |
| `dolt-server` | MySQL-compatible Dolt server | read/write | Implemented |
| `jsonl` | JSON Lines file with watch | read-only | Planned |
| `dolt-native` | Embedded Dolt via FFI | read/write | Research |

### Federation Architecture

```
┌─────────────────────────────────────────────────────┐
│                  FederatedDAL                        │
├────────────┬────────────┬────────────┬──────────────┤
│  SQLite    │   JSONL    │Dolt-Native │ Dolt-Server  │
│  Adapter   │  Adapter   │  Adapter   │   Adapter    │
└────────────┴────────────┴────────────┴──────────────┘
```

### Isolation Levels

| Level | Cross-NS Read | Cross-NS Write | Use Case |
|-------|---------------|----------------|----------|
| `strict` | ❌ | ❌ | Sensitive data |
| `namespaced` | ✅ | ❌ | Team + personal |
| `open` | ✅ | ✅ | Single-user dev |

See: [federated-dal.md](./federated-dal.md), [dolt-native-ffi.md](./dolt-native-ffi.md)

---

## Feature Matrix (Priority)

### Phase 1 (MVP) Must-Have

| Feature | Value | Complexity | Source |
|---------|-------|------------|--------|
| Issue List/Table | 5 | 2 | All tools |
| Basic Filters | 5 | 2 | All tools |
| Create Issue (via bd) | 5 | 2 | - |
| Quick Status Change | 4 | 1 | All tools |
| Kanban Board | 4 | 3 | beads-ui/dashboard |

### Phase 2 (Analytics) Must-Have

| Feature | Value | Complexity | Source |
|---------|-------|------------|--------|
| Metrics Engine | 5 | 3 | beads-dashboard |
| Lead Time Chart | 4 | 3 | beads-dashboard |
| CFD Chart | 4 | 3 | beads-dashboard |
| Gantt (basic) | 4 | 4 | beads-pm-ui |

See: [feature-matrix.md](./feature-matrix.md), [prds/feature-prioritization-matrix.md](../prds/feature-prioritization-matrix.md)

---

## Borrowable Components

### From gastown_ui (SvelteKit)

| Component | Status | Notes |
|-----------|--------|-------|
| Button, Badge, Input | Ready | Use directly |
| StatusIndicator | Ready | Adapt colors |
| HealthBadge | Ready | RAG status |
| DashboardLayout | Ready | Sidebar + main |
| Spinner, Skeleton | Ready | Loading states |
| FocusTrap | Ready | Accessibility |

### From beads-dashboard (Remix → Adapt)

| Pattern | Effort | Notes |
|---------|--------|-------|
| ProcessSupervisor | Medium | TypeScript, adapt for Bun |
| Metrics calculations | Low | Pure functions |
| Recharts configs | Low | Chart configurations |

### From foolery (Vue → Rewrite)

| Pattern | Effort | Notes |
|---------|--------|-------|
| xterm.js setup | Medium | Terminal integration |
| Claude session | High | Agent communication |

See: [borrowable-components.md](./borrowable-components.md)

---

## Gas-Town Integration

### Key Concepts

- **Town**: Project installation
- **Rig**: Git worktree + agent infrastructure
- **Polecat**: Individual agent instance
- **Convoy**: Group of related issues
- **Witness/Refinery**: Monitoring services

### CLI Commands

```bash
gt status          # Town and rig status
gt sling <issue>   # Dispatch to agent
gt launch <rig>    # Start rig
gt park <rig>      # Stop rig
gt convoy list     # List convoys
```

### UI Requirements

- Agent monitoring dashboard
- Convoy progress tracking
- Verification queue (approve/reject)
- Sling dialog (dispatch work)

See: [gastown-webuis.md](./gastown-webuis.md)

---

## MCP Servers for Development

### Essential

| Server | Purpose |
|--------|---------|
| `svelte` | Svelte docs and autofixer |
| `shadcn-svelte` | Component examples |
| `sqlite` | Database queries |
| `penpot-plugin` | Design integration |

### Full Setup

```json
{
  "svelte": { "command": "npx", "args": ["-y", "@sveltejs/mcp"] },
  "shadcn-svelte": { "command": "npx", "args": ["-y", "shadcn-ui-mcp-server", "--framework", "svelte"] },
  "sqlite": { "command": "npx", "args": ["-y", "mcp-server-sqlite-npx", ".beads/beads.db"] }
}
```

See: [mcp-servers.md](./mcp-servers.md)

---

## Architecture Decisions

| ADR | Decision |
|-----|----------|
| [0002](../../../../../docs/src/adrs/0002-use-bun-as-primary-runtime.md) | Use Bun as runtime |
| [0003](../../../../../docs/src/adrs/0003-use-sveltekit-as-frontend-framework.md) | Use SvelteKit + Svelte 5 |
| [0005](../../../../../docs/src/adrs/0005-cli-for-writes-and-direct-sql-for-reads.md) | CLI for writes, SQL for reads |
| [0006](../../../../../docs/src/adrs/0006-use-file-watching-with-websocket-broadcast.md) | File watching + WebSocket |
| [0007](../../../../../docs/src/adrs/0007-borrow-components-from-gastown-ui-with-custom-extensions.md) | Borrow gastown_ui components |
| [0022](../../../../../docs/src/adrs/0022-federated-data-access-layer-for-multi-source-support.md) | Federated DAL for multi-source |

---

## Reference Source Projects

The `references/` directory contains documentation from:

| Source | Files | Key Content |
|--------|-------|-------------|
| beads-ui | 15 | Protocol, architecture, ADRs |
| beads-dashboard | 6 | Scripts, workflows |
| beads-kanban-ui | 20 | Agents, skills, designs |
| beads-pm-ui | 10 | Wireframes, views |
| foolery | 8 | Dolt hooks, manifest |
| gastown_ui | 5 | Contracts, testing |
| gastown-frontend | 1 | README |

For full details, browse individual directories or use `grep` to search.

---

## Quick Commands

```bash
# Search all references
grep -r "keyword" .claude/plans/unified-beads-webui/references/

# Find files by name
find .claude/plans/unified-beads-webui/references/ -name "*.md" | head -20

# Count files per project
ls -la .claude/plans/unified-beads-webui/references/*/
```
