# Phase 1: MVP Core

**Duration**: 4 weeks
**Theme**: Basic functional UI with issue management

## Objectives

1. Establish core architecture (ProcessSupervisor, Data Access Layer)
2. Implement issue list with filtering and search
3. Build Kanban board with drag-and-drop
4. Enable real-time updates via file watching
5. Implement inline editing with CLI-backed writes

---

## Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| View issues | Issue list renders with < 100ms for 100 items |
| Create issues | `bd create` executes successfully from UI |
| Edit issues | Inline edits persist via `bd update` |
| Real-time sync | File changes reflect in UI within 1s |
| Kanban board | Drag-and-drop changes status correctly |

---

## Features

### 1.1 ProcessSupervisor

**Priority**: Must-Have | **Complexity**: 3 | **Source**: gastown_ui

Centralized CLI execution with circuit breaker protection.

```typescript
// src/lib/cli/supervisor.ts
interface ProcessSupervisorConfig {
  timeout: number;
  maxConcurrent: number;
  circuitBreaker: {
    threshold: number;
    resetTimeout: number;
  };
}
```

**Deliverables**:
- [ ] ProcessSupervisor class implementation
- [ ] Circuit breaker with open/half-open/closed states
- [ ] Command queue for rate limiting
- [ ] Event emitter for state changes
- [ ] Unit tests with mocked processes

**Acceptance Criteria**:
- Commands execute via `execFile` (no shell)
- Timeout kills long-running processes
- Circuit opens after 5 consecutive failures
- Half-open allows 1 test request after 60s

---

### 1.2 Data Access Layer

**Priority**: Must-Have | **Complexity**: 3 | **Source**: New

Unified data access supporting both SQLite and Dolt backends.

```typescript
// src/lib/db/index.ts
interface DataAccessLayer {
  backend: 'sqlite' | 'dolt';
  query<T>(sql: string): Promise<T[]>;
  execute(cmd: string, args: string[]): Promise<CommandResult>;
}
```

**Deliverables**:
- [ ] Backend auto-detection (SQLite vs Dolt)
- [ ] SQLite connection via better-sqlite3
- [ ] Dolt connection via mysql2
- [ ] Query builder for common operations
- [ ] Connection pooling (Dolt only)

**Acceptance Criteria**:
- Auto-detects backend on startup
- Read queries complete in < 50ms for 100 rows
- Handles connection failures gracefully
- Write operations always go through `bd` CLI

---

### 1.3 Issue List View

**Priority**: Must-Have | **Complexity**: 2 | **Source**: All tools

Table view of issues with sorting and filtering.

**Deliverables**:
- [ ] `IssueTable.svelte` component
- [ ] Column sorting (click to toggle)
- [ ] Virtual scrolling for large lists (> 100 items)
- [ ] Row selection (single and multi)
- [ ] Context menu for actions

**Acceptance Criteria**:
- Renders 100 issues in < 100ms
- Virtual scroll renders 1000 issues smoothly
- Sort toggle updates in < 50ms
- Keyboard navigation (j/k, Enter)

---

### 1.4 Filter Panel

**Priority**: Must-Have | **Complexity**: 2 | **Source**: All tools

Multi-faceted filtering for issue list.

**Deliverables**:
- [ ] `FilterPanel.svelte` component
- [ ] Status filter (multi-select checkboxes)
- [ ] Type filter (multi-select)
- [ ] Priority filter (multi-select)
- [ ] Assignee filter (dropdown with search)
- [ ] Text search (debounced, 300ms)
- [ ] Filter badges showing active filters
- [ ] Clear all filters button

**Acceptance Criteria**:
- Filters apply within 50ms (client-side)
- Search debounces to prevent excessive queries
- Filter state persists in URL params
- Active filters shown as removable badges

---

### 1.5 Text Search

**Priority**: Must-Have | **Complexity**: 1 | **Source**: All tools

Full-text search across issue title and description.

**Deliverables**:
- [ ] Search input with clear button
- [ ] Debounced search (300ms)
- [ ] Highlight matching text in results
- [ ] Search via `bd query` for complex queries

**Acceptance Criteria**:
- Search triggers after 300ms of no typing
- Results highlight matching terms
- Empty search shows all issues
- Supports `bd query` syntax for power users

---

### 1.6 Create Issue

**Priority**: Must-Have | **Complexity**: 2 | **Source**: All tools

Modal dialog for creating new issues.

**Deliverables**:
- [ ] `CreateIssueModal.svelte` component
- [ ] Form fields: title, type, priority, description, assignee, labels
- [ ] Validation (title required)
- [ ] Submit via `bd create`
- [ ] Keyboard shortcut (c or n)

**Acceptance Criteria**:
- Modal opens with keyboard shortcut
- Tab order is logical
- Escape closes modal
- Success shows toast and closes modal
- Error shows inline validation

---

### 1.7 Quick Status Change

**Priority**: Must-Have | **Complexity**: 1 | **Source**: All tools

Inline status dropdown for rapid workflow.

**Deliverables**:
- [ ] Status dropdown in table row
- [ ] Status dropdown on card
- [ ] Optimistic update with rollback
- [ ] Status change via `bd update`

**Acceptance Criteria**:
- Dropdown opens on click
- Selection updates UI immediately
- Failed update shows error and reverts
- Keyboard accessible (Enter to select)

---

### 1.8 Inline Editing

**Priority**: Should-Have | **Complexity**: 3 | **Source**: beads-ui, beads-dashboard

Edit issue fields directly in the table/card.

**Deliverables**:
- [ ] Editable title (click to edit)
- [ ] Editable priority (dropdown)
- [ ] Editable assignee (dropdown with search)
- [ ] Edit via `bd update`
- [ ] Cancel on Escape

**Acceptance Criteria**:
- Click transforms to input
- Enter saves, Escape cancels
- Blur saves changes
- Optimistic update with rollback

---

### 1.9 Kanban Board

**Priority**: Must-Have | **Complexity**: 3 | **Source**: beads-ui, beads-dashboard

Column-based view grouped by status.

**Deliverables**:
- [ ] `KanbanBoard.svelte` component
- [ ] `KanbanColumn.svelte` component
- [ ] `KanbanCard.svelte` component
- [ ] Drag-and-drop between columns (svelte-dnd-action)
- [ ] Column headers with counts
- [ ] Card shows: title, type badge, priority indicator, assignee avatar

**Acceptance Criteria**:
- Drag card to column changes status
- Drop triggers `bd update --status`
- Cards render priority as color stripe
- Columns configurable (which statuses to show)

---

### 1.10 Epics View

**Priority**: Should-Have | **Complexity**: 2 | **Source**: All tools

Hierarchical view of epics and their children.

**Deliverables**:
- [ ] `EpicsView.svelte` component
- [ ] Expandable epic rows
- [ ] Progress indicator (done/total children)
- [ ] Filter to show only epics

**Acceptance Criteria**:
- Epics show child count
- Expand shows nested children
- Progress bar reflects completion
- Click epic to see details

---

### 1.11 File Watching (Real-time)

**Priority**: Must-Have | **Complexity**: 2 | **Source**: beads-ui, beads-dashboard

Watch `.beads/` directory for changes and broadcast updates.

**Deliverables**:
- [ ] Chokidar watcher for `.beads/*.db`, `.beads/*.jsonl`
- [ ] WebSocket server for broadcasting changes
- [ ] Client subscription to change events
- [ ] Debounce rapid file changes (100ms)

**Acceptance Criteria**:
- File change triggers WebSocket event within 1s
- Multiple rapid changes coalesce
- Client reconnects on disconnect
- Server handles multiple clients

---

### 1.12 Basic Keyboard Shortcuts

**Priority**: Should-Have | **Complexity**: 2 | **Source**: beads-ui, foolery

Essential keyboard navigation.

| Shortcut | Action |
|----------|--------|
| `j` / `k` | Move selection down/up |
| `Enter` | Open selected issue |
| `c` / `n` | Create new issue |
| `e` | Edit selected issue |
| `Escape` | Close modal/cancel |
| `/` | Focus search |
| `?` | Show keyboard shortcuts |

**Deliverables**:
- [ ] Keyboard shortcut manager
- [ ] Help modal showing shortcuts
- [ ] Shortcuts configurable (future)

**Acceptance Criteria**:
- Shortcuts work when not in input
- Help modal shows all shortcuts
- No conflicts with browser shortcuts

---

### 1.13 Owner/Assignee Filter

**Priority**: Should-Have | **Complexity**: 1 | **Source**: All tools

Filter by owner or assignee with autocomplete.

**Deliverables**:
- [ ] Autocomplete dropdown with known users
- [ ] "Me" shortcut for current user
- [ ] "Unassigned" filter option

**Acceptance Criteria**:
- Dropdown shows users from recent issues
- Selection filters immediately
- Can combine with other filters

---

## Technical Architecture

### State Management

```typescript
// src/lib/stores/issues.svelte.ts
class IssueStore {
  issues = $state<Issue[]>([]);
  filter = $state<IssueFilter>({});
  selectedId = $state<string | null>(null);

  get filtered() {
    return this.issues.filter(issue => this.matchesFilter(issue));
  }

  get selected() {
    return this.issues.find(i => i.id === this.selectedId);
  }
}

export const issueStore = new IssueStore();
```

### API Routes

| Endpoint | Method | Handler |
|----------|--------|---------|
| `/api/issues` | GET | List issues with filters |
| `/api/issues` | POST | Create issue (via `bd`) |
| `/api/issues/[id]` | GET | Get single issue |
| `/api/issues/[id]` | PATCH | Update issue (via `bd`) |
| `/api/issues/[id]/close` | POST | Close issue (via `bd`) |

### WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `issues:changed` | Server → Client | `{ type: 'update' | 'create' | 'delete', issue }` |
| `file:changed` | Server → Client | `{ path: string }` |

---

## Dependencies

### External
- `bd` CLI (required, tested in Phase 0)
- SQLite database (`.beads/beads.db`) OR Dolt server

### Libraries
| Library | Purpose |
|---------|---------|
| `better-sqlite3` | SQLite access |
| `mysql2` | Dolt access |
| `chokidar` | File watching |
| `svelte-dnd-action` | Drag-and-drop |
| `execa` | Process execution |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| `bd` CLI not installed | Show setup instructions, graceful degradation |
| SQLite locked | Retry with backoff, show warning |
| Dolt server down | Fall back to SQLite if available, show error |
| File watcher overwhelmed | Debounce, batch updates |

---

## Testing Strategy

### Unit Tests
- ProcessSupervisor command execution
- Data access layer query building
- Filter logic
- State store operations

### Integration Tests
- API routes with mock `bd` CLI
- WebSocket connection/reconnection
- Database operations

### E2E Tests
- Create issue flow
- Filter and search
- Kanban drag-and-drop
- Keyboard navigation

---

## Deliverables Checklist

| Component | Priority | Status |
|-----------|----------|--------|
| ProcessSupervisor | Must-Have | Pending |
| Data Access Layer | Must-Have | Pending |
| Issue List View | Must-Have | Pending |
| Filter Panel | Must-Have | Pending |
| Text Search | Must-Have | Pending |
| Create Issue Modal | Must-Have | Pending |
| Quick Status Change | Must-Have | Pending |
| Inline Editing | Should-Have | Pending |
| Kanban Board | Must-Have | Pending |
| Epics View | Should-Have | Pending |
| File Watching | Must-Have | Pending |
| Keyboard Shortcuts | Should-Have | Pending |
| Owner/Assignee Filter | Should-Have | Pending |

---

## Time Estimates

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1 | Foundation | ProcessSupervisor, Data Access Layer, API routes |
| 2 | List View | Issue list, filters, search, create modal |
| 3 | Kanban | Kanban board, drag-and-drop, status changes |
| 4 | Polish | Inline editing, epics view, file watching, shortcuts |

---

## Exit Criteria

- [ ] Can view all issues in list and Kanban views
- [ ] Can create new issues via modal
- [ ] Can edit issue fields inline
- [ ] Changes persist correctly via `bd` CLI
- [ ] Real-time updates work (< 1s latency)
- [ ] Keyboard navigation functional
- [ ] All "Must-Have" features complete
- [ ] Unit test coverage > 70%
- [ ] E2E tests pass

---

## References

- [API Contract](../spec/api-contract.md)
- [CLI Integration](../spec/cli-integration.md)
- [Data Flow](../spec/data-flow.md)
- [Wireframes](../spec/wireframes.md)
- [Component Library](../spec/component-library.md)
- [ADR-0005: CLI for Writes](../../../../../docs/src/adrs/0005-cli-for-writes-and-direct-sql-for-reads.md)
- [ADR-0006: File Watching](../../../../../docs/src/adrs/0006-use-file-watching-with-websocket-broadcast.md)
