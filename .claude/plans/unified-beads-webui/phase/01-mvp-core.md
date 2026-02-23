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

## Phase 0 Entry Gate

Before starting Phase 1, verify Phase 0 completion:

- [ ] All Phase 0 success criteria met
- [ ] `bd --version` returns valid version
- [ ] `bd sql "SELECT 1"` returns 1
- [ ] CI pipeline passing
- [ ] Storybook running

---

## Success Criteria

| Criterion | Measurement | Verification Method |
|-----------|-------------|---------------------|
| View issues | Issue list renders < 100ms for 100 items | Lighthouse performance audit |
| Create issues | `bd create` executes successfully from UI | E2E test |
| Edit issues | Inline edits persist via `bd update` | E2E test |
| Real-time sync | File changes reflect in UI within 1s | Integration test with timer |
| Kanban board | Drag-and-drop changes status correctly | E2E test |
| Accessibility | WCAG 2.1 AA compliant | axe-core audit with 0 critical violations |
| Test coverage | > 70% unit test coverage | Vitest coverage report |

---

## Complexity Scale

| Score | Effort | Description |
|-------|--------|-------------|
| 1 | 0.5-1 day | Simple component or utility |
| 2 | 1-2 days | Component with state/logic |
| 3 | 2-4 days | Complex component or integration |
| 4 | 4-7 days | Major feature or system |
| 5 | 1-2 weeks | Large cross-cutting feature |

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
- [ ] Conflict detection and resolution UI

**Acceptance Criteria**:
- Click transforms to input
- Enter saves, Escape cancels
- Blur saves changes
- Optimistic update with rollback
- Conflict shown with resolution options

**Conflict Resolution UI**:

When a concurrent modification is detected (`bd update` returns conflict error):

| Approach | Description | Recommendation |
|----------|-------------|----------------|
| **Refresh & Retry** | Show toast "Issue modified, refresh to see changes" with retry button | MVP - simplest |
| **Diff Dialog** | Show side-by-side comparison with merge options | Post-MVP |
| **Last Write Wins** | Force update with `--force` flag (if supported) | Not recommended |

For MVP, implement "Refresh & Retry" pattern:
1. Detect conflict from `bd update` error response
2. Show dismissable toast with "Refresh" and "Retry" buttons
3. Refresh reloads issue from database
4. Retry re-attempts the user's edit

---

### 1.8a Issue Detail View

**Priority**: Must-Have | **Complexity**: 2 | **Source**: All tools

Full issue detail modal/panel for viewing complete issue context.

**Deliverables**:
- [ ] `IssueDetail.svelte` component
- [ ] `IssueDetailModal.svelte` wrapper
- [ ] Full description rendering (markdown)
- [ ] Comments section (read-only for MVP)
- [ ] Activity/event history
- [ ] Related issues/dependencies section
- [ ] Quick action buttons (edit, close, assign)

**Acceptance Criteria**:
- Opens via Enter key on selected issue
- Opens via click on issue ID/title link
- Shows all issue fields
- Markdown description renders correctly
- Escape closes modal
- URL updates to `/issues/[id]` for deep linking

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

| Component | Priority | Complexity | Effort | Status |
|-----------|----------|------------|--------|--------|
| ProcessSupervisor | Must-Have | 3 | 3 days | Pending |
| Data Access Layer | Must-Have | 3 | 3 days | Pending |
| Issue List View | Must-Have | 2 | 2 days | Pending |
| Filter Panel | Must-Have | 2 | 2 days | Pending |
| Text Search | Must-Have | 1 | 1 day | Pending |
| Create Issue Modal | Must-Have | 2 | 2 days | Pending |
| Quick Status Change | Must-Have | 1 | 1 day | Pending |
| Inline Editing | Should-Have | 3 | 2 days | Pending |
| Issue Detail View | Must-Have | 2 | 2 days | Pending |
| Kanban Board | Must-Have | 3 | 3 days | Pending |
| Epics View | Should-Have | 2 | 1 day | Pending |
| File Watching | Must-Have | 2 | 2 days | Pending |
| Keyboard Shortcuts | Should-Have | 2 | 1 day | Pending |
| Owner/Assignee Filter | Should-Have | 1 | 0.5 day | Pending |

**Total Effort**: ~25.5 days (fits in 4 weeks with buffer)

---

## Time Estimates

| Week | Focus | Deliverables | Days |
|------|-------|--------------|------|
| 1 | Foundation | ProcessSupervisor (3d), Data Access Layer (3d) | 6 |
| 2 | List View | Issue list (2d), filters (2d), search (1d), create modal (2d) | 7 |
| 3 | Kanban | Kanban board (3d), Quick Status (1d), File Watching (2d) | 6 |
| 4 | Polish | Inline editing (2d), epics view (1d), shortcuts (1d), buffer (1d) | 5 |

---

## Accessibility Requirements

All UI components must meet WCAG 2.1 AA standards:

| Requirement | Implementation |
|-------------|----------------|
| Keyboard navigation | All interactive elements focusable via Tab |
| Focus indicators | Visible focus ring (2px solid) on all focusable elements |
| Screen reader support | Semantic HTML, ARIA labels where needed |
| Color contrast | Minimum 4.5:1 for normal text, 3:1 for large text |
| Motion | Respect `prefers-reduced-motion` media query |
| Error messages | Associated with inputs via `aria-describedby` |

### Component-Specific A11y

| Component | Requirements |
|-----------|--------------|
| Issue Table | `role="grid"`, sortable headers with `aria-sort` |
| Filter Panel | `role="search"`, checkboxes with labels |
| Kanban Board | `role="listbox"` for columns, `role="option"` for cards |
| Create Modal | Focus trap, `role="dialog"`, `aria-modal="true"` |
| Status Dropdown | `role="listbox"`, arrow key navigation |

### Testing

```bash
# Run accessibility audit
bun test:e2e --project=a11y

# Lighthouse CI (in CI pipeline)
lhci autorun --collect.url=http://localhost:3000
```

---

## Rollback Strategy

### Feature Flags

Each major feature can be disabled via environment variable:

```bash
# Disable features if issues arise
DISABLE_KANBAN_DND=true      # Disable drag-and-drop (fall back to dropdown)
DISABLE_INLINE_EDIT=true     # Disable inline editing (use modal only)
DISABLE_REALTIME=true        # Disable file watching (manual refresh)
DISABLE_WEBSOCKET=true       # Disable WebSocket (polling fallback)
```

### Component Rollback

| Component | Rollback Procedure |
|-----------|-------------------|
| ProcessSupervisor | Revert to direct `execa` calls without circuit breaker |
| Data Access Layer | Hard-code backend type, disable auto-detection |
| Kanban Board | Replace with list view + status dropdown |
| File Watching | Disable and add manual refresh button |
| WebSocket | Fall back to 5s polling interval |

### Database Rollback

```bash
# If database issues occur
cp .beads/beads.db .beads/beads.db.backup
bd sync --force  # Re-sync from JSONL source of truth
```

### Full Phase Rollback

If Phase 1 cannot be completed:

1. Tag current state: `git tag phase1-incomplete`
2. Create `phase1-retry` branch
3. Document blockers in `BLOCKERS.md`
4. Reduce scope to Must-Have only
5. Extend timeline by 1 week

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
- [ ] Accessibility audit passes (0 critical violations)

---

## Phase 2 Handoff

Before proceeding to Phase 2, provide:

- [ ] ProcessSupervisor documented and tested
- [ ] Data Access Layer supports both backends
- [ ] Issue Store API stable
- [ ] WebSocket infrastructure working
- [ ] All Must-Have features deployed

---

## References

- [Phase 0: Development Setup](./00-development-setup.md)
- [API Contract](../spec/api-contract.md)
- [CLI Integration](../spec/cli-integration.md)
- [Data Flow](../spec/data-flow.md)
- [Wireframes](../spec/wireframes.md)
- [Component Library](../spec/component-library.md)
- [ADR-0005: CLI for Writes](../../../../../docs/src/adrs/0005-cli-for-writes-and-direct-sql-for-reads.md)
- [ADR-0006: File Watching](../../../../../docs/src/adrs/0006-use-file-watching-with-websocket-broadcast.md)
