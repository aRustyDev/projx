# Unified Beads WebUI - Technical Specification

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (SvelteKit)                     │
├─────────────────────────────────────────────────────────────┤
│  Components    │  State (Runes)    │  WebSocket Client      │
└────────┬───────┴─────────┬─────────┴──────────┬─────────────┘
         │                 │                    │
         ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                   SvelteKit Server                          │
├─────────────────────────────────────────────────────────────┤
│  API Routes    │  ProcessSupervisor │  File Watcher         │
│  /api/*        │  (CLI execution)   │  (Chokidar)           │
└────────┬───────┴─────────┬──────────┴──────────┬────────────┘
         │                 │                     │
         ▼                 ▼                     ▼
┌──────────────┐  ┌──────────────┐  ┌─────────────────────────┐
│  Direct SQL  │  │   bd CLI     │  │   File System           │
│  (read-only) │  │   gt CLI     │  │   .beads/issues.jsonl   │
└──────┬───────┘  └──────────────┘  │   .beads/memory/        │
       │                            └─────────────────────────┘
       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
├──────────────────┬──────────────────┬───────────────────────┤
│  SQLite          │  Dolt            │  JSONL Files          │
│  (.beads/*.db)   │  (MySQL proto)   │  (issues, memory)     │
└──────────────────┴──────────────────┴───────────────────────┘
```

---

## Component Specifications

| Component | Spec Document |
|-----------|---------------|
| ProcessSupervisor | [process-supervisor.md](./process-supervisor.md) |
| Data Access Layer | [data-access.md](./data-access.md) |
| Kanban Board | [kanban.md](./kanban.md) |
| Metrics Engine | [metrics.md](./metrics.md) |
| Gantt Chart | [gantt.md](./gantt.md) |
| Terminal Integration | [terminal.md](./terminal.md) |
| Git Integration | [git.md](./git.md) |
| Real-time Sync | [realtime.md](./realtime.md) |
| Test Strategy | [test-strategy.md](./test-strategy.md) |
| **Observability** | [observability.md](./observability.md) |

---

## Tech Stack

### Runtime
- **Bun** (primary) - Fastest, native SQLite
- Node.js 18+ (fallback)

### Frontend
- **SvelteKit 2.x** with **Svelte 5** - SSR + API routes
- Tailwind CSS 4 - Styling
- Svelte 5 Runes - State management (see below)
- Lucide Svelte - Icons
- tailwind-variants - Component styling

### Visualization
- Recharts - Charts (CFD, scatterplots)
- D3.js - Custom visualizations
- @dnd-kit - Drag-and-drop

### Terminal
- xterm.js - Terminal emulation
- xterm-addon-fit - Auto-sizing
- xterm-addon-web-links - Clickable links

### Real-time
- Native WebSocket - Client-server
- Chokidar - File watching

---

## Data Access Patterns

### Read Operations

```typescript
// Option 1: Via bd sql (works with SQLite and Dolt)
const result = await supervisor.execute('bd', [
  'sql', '--json',
  'SELECT * FROM issues WHERE status = "open"'
]);

// Option 2: Direct SQLite (SQLite backend only)
import Database from 'better-sqlite3';
const db = new Database('.beads/beads.db', { readonly: true });
const issues = db.prepare('SELECT * FROM issues').all();

// Option 3: Direct Dolt (Dolt backend only)
import mysql from 'mysql2/promise';
const conn = await mysql.createConnection({
  host: '127.0.0.1',
  port: 3307,
  user: 'root',
  database: 'beads_project'
});
const [rows] = await conn.query('SELECT * FROM issues');
```

### Write Operations

```typescript
// ALWAYS via bd CLI
await supervisor.execute('bd', ['create', title, '--description', desc]);
await supervisor.execute('bd', ['update', id, '--status', 'in_progress']);
await supervisor.execute('bd', ['close', id]);
```

---

## API Contract

### Issues

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/issues` | GET | List issues with filters |
| `/api/issues/:id` | GET | Get single issue |
| `/api/issues` | POST | Create issue (via bd) |
| `/api/issues/:id` | PATCH | Update issue (via bd) |
| `/api/issues/:id/close` | POST | Close issue (via bd) |

### Metrics

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/metrics/cfd` | GET | Cumulative flow data |
| `/api/metrics/lead-time` | GET | Lead time statistics |
| `/api/metrics/throughput` | GET | Throughput data |
| `/api/metrics/aging-wip` | GET | Aging WIP data |

### Git

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/git/worktrees` | GET | List worktrees |
| `/api/git/prs` | GET | List PRs |
| `/api/git/prs` | POST | Create PR |
| `/api/git/prs/:id/merge` | POST | Merge PR |

### WebSocket

| Event | Direction | Payload |
|-------|-----------|---------|
| `issues:changed` | Server→Client | `{ type, issue }` |
| `file:changed` | Server→Client | `{ path }` |
| `metrics:updated` | Server→Client | `{ metrics }` |

---

## Security Considerations

1. **No shell execution**: Use `execFile` only
2. **Command whitelisting**: Only allow known `bd`/`gt` commands
3. **Input sanitization**: Validate all user input
4. **Read-only DB connections**: For direct SQL access
5. **Local-only by default**: Bind to 127.0.0.1

---

## Performance Targets

| Operation | Target | Measurement |
|-----------|--------|-------------|
| Issue list (1000 items) | < 100ms | Time to interactive |
| Metrics calculation | < 500ms | Server response |
| File change → UI update | < 1s | End-to-end |
| CLI command | < 2s | Execution time |
| Initial page load | < 2s | First contentful paint |

---

## Svelte 5 Patterns

This project uses **Svelte 5 with runes** (not legacy `$:` reactive statements or `writable()` stores).

### State Management with Runes

```svelte
<script lang="ts">
  // Local reactive state
  let count = $state(0);
  let issues = $state<Issue[]>([]);

  // Derived state (replaces $:)
  let openIssues = $derived(issues.filter(i => i.status === 'open'));
  let totalCount = $derived(issues.length);

  // Effects (replaces $: with side effects)
  $effect(() => {
    console.log('Issue count changed:', totalCount);
  });
</script>
```

### Shared State (replaces stores)

```typescript
// src/lib/stores/issues.svelte.ts
class IssueStore {
  issues = $state<Issue[]>([]);
  filter = $state<IssueFilter>({});

  // Derived values
  get filtered() {
    return this.issues.filter(issue => {
      if (this.filter.status?.length) {
        return this.filter.status.includes(issue.status);
      }
      return true;
    });
  }

  // Actions
  setIssues(issues: Issue[]) {
    this.issues = issues;
  }

  setFilter(filter: IssueFilter) {
    this.filter = filter;
  }
}

export const issueStore = new IssueStore();
```

### Props (replaces `export let`)

```svelte
<script lang="ts">
  // Props with defaults
  let { title, priority = 2, onClose }: {
    title: string;
    priority?: number;
    onClose?: () => void;
  } = $props();
</script>
```

### Bindable Props

```svelte
<script lang="ts">
  // Two-way bindable prop
  let { value = $bindable() }: { value: string } = $props();
</script>
```

### Migration Notes

| Legacy Svelte 4 | Svelte 5 Runes |
|-----------------|----------------|
| `let x = 0;` (reactive) | `let x = $state(0);` |
| `$: doubled = x * 2;` | `let doubled = $derived(x * 2);` |
| `$: console.log(x);` | `$effect(() => console.log(x));` |
| `export let prop;` | `let { prop } = $props();` |
| `writable(0)` | `$state(0)` in class |
| `derived(store, ...)` | `$derived(...)` |

### File Naming

- Components: `ComponentName.svelte`
- Shared state files: `*.svelte.ts` (enables runes outside components)
- Server-only: `+page.server.ts`, `+server.ts`

### References

- [Svelte 5 Runes Documentation](https://svelte.dev/docs/svelte/$state)
- [ADR-0003: Use SvelteKit](../../../../../docs/src/adrs/0003-use-sveltekit-as-frontend-framework.md)
- [ADR-0004: Svelte Stores](../../../../../docs/src/adrs/0004-use-svelte-stores-for-state-management.md)

---

## Performance Budgets

### Bundle Size

| Bundle | Target | Max | Measurement |
|--------|--------|-----|-------------|
| Initial JS | < 80KB | 120KB | gzip compressed |
| Initial CSS | < 20KB | 40KB | gzip compressed |
| Total initial | < 100KB | 150KB | gzip compressed |
| Route chunk (avg) | < 30KB | 50KB | gzip compressed |

### Render Performance

| Metric | Target | Max | Measurement |
|--------|--------|-----|-------------|
| First Contentful Paint | < 1.5s | 2.5s | Lighthouse |
| Largest Contentful Paint | < 2.0s | 3.0s | Lighthouse |
| Time to Interactive | < 2.5s | 4.0s | Lighthouse |
| Cumulative Layout Shift | < 0.1 | 0.25 | Lighthouse |
| First Input Delay | < 100ms | 200ms | Lighthouse |

### Runtime Performance

| Operation | Target | Max | Notes |
|-----------|--------|-----|-------|
| Issue list render (100 items) | < 50ms | 100ms | Virtual scroll for > 100 |
| Issue list render (1000 items) | < 100ms | 200ms | Must use virtual scroll |
| Kanban board render | < 100ms | 200ms | All columns |
| Chart render (CFD, 30 days) | < 200ms | 500ms | SVG rendering |
| Filter change response | < 50ms | 100ms | Client-side filtering |
| WebSocket message process | < 10ms | 50ms | Parse + update store |

### API Response Times

| Endpoint | Target | Max | Notes |
|----------|--------|-----|-------|
| GET /api/issues (50 items) | < 50ms | 100ms | Paginated |
| GET /api/issues/:id | < 30ms | 50ms | Single issue |
| POST /api/issues | < 500ms | 2s | CLI execution |
| GET /api/metrics/* | < 200ms | 500ms | Aggregate queries |

---

## Observability

> **Full specification**: [observability.md](./observability.md)

The observability stack is built on **OpenTelemetry** with **Pino** for structured logging:

- **Traces**: Distributed tracing via `@opentelemetry/sdk-node`
- **Metrics**: Counters, histograms via `@opentelemetry/sdk-metrics`
- **Logs**: Pino with OTEL trace context correlation

### Key References

- [ADR-0011: Use OpenTelemetry for Observability](../../../../docs/src/adrs/0011-use-opentelemetry-for-observability.md)
- [Constraint 0001: Bun OTEL Compatibility](../docs/constraint-0001-bun-otel-compatibility.md)
- [Constraint 0002: OTEL Signal Maturity](../docs/constraint-0002-otel-signal-maturity.md)
- [Constraint 0003: CLI Instrumentation Patterns](../docs/constraint-0003-cli-instrumentation-patterns.md)

### Acceptance Criteria (All Phases)

- [ ] CLI command executions traced with span including args, exit code, duration
- [ ] WebSocket connections/disconnections emit spans
- [ ] Circuit breaker state changes logged with trace context
- [ ] Errors include span ID for correlation
- [ ] Metrics: `cli.commands.total`, `ws.connections.active`, `cli.circuit_breaker.state`

### Health Endpoint

```typescript
// GET /api/health
interface HealthResponse {
  status: 'ok' | 'degraded' | 'error';
  version: string;
  uptime: number;
  checks: {
    database: 'ok' | 'error';
    cli: 'ok' | 'error';
    fileWatcher: 'ok' | 'error';
    telemetry: 'ok' | 'error';
  };
}
```

---

## Feature Flags

### Configuration

```typescript
// src/lib/features.ts
interface FeatureFlags {
  // Phase-based features
  gastown: boolean;           // Gas-Town integration
  networkMode: boolean;       // Network deployment
  multiProject: boolean;      // Multiple projects

  // Experimental
  ganttDragResize: boolean;   // Gantt drag to resize
  terminalTabs: boolean;      // Multiple terminal tabs
  agentStreaming: boolean;    // Stream agent output
}

// Default flags
const defaultFlags: FeatureFlags = {
  gastown: false,
  networkMode: false,
  multiProject: false,
  ganttDragResize: false,
  terminalTabs: false,
  agentStreaming: false,
};
```

### Environment-Based Flags

```typescript
function loadFeatureFlags(): FeatureFlags {
  return {
    ...defaultFlags,
    gastown: env.ENABLE_GASTOWN === 'true',
    networkMode: env.ENABLE_NETWORK_MODE === 'true',
    multiProject: env.ENABLE_MULTI_PROJECT === 'true',
    // Experimental flags from localStorage in dev
    ...loadDevFlags(),
  };
}
```

### Usage in Components

```svelte
<script lang="ts">
  import { features } from '$lib/features';
</script>

{#if features.gastown}
  <AgentPanel />
{/if}

<Button disabled={!features.gastown}>
  Sling to Agent
</Button>
```

### Dev Mode Override

```typescript
// In browser console (dev only)
window.__setFeatureFlag('ganttDragResize', true);

// Stored in localStorage
// Prefix: ubw_feature_
```

### Graceful Degradation

```typescript
// Features that depend on Gas-Town
function canSlingToAgent(): boolean {
  return features.gastown && gtCliAvailable();
}

// Show appropriate UI
{#if canSlingToAgent()}
  <SlingButton />
{:else if features.gastown}
  <DisabledButton tooltip="gt CLI not available" />
{:else}
  <!-- Don't show at all -->
{/if}
```
