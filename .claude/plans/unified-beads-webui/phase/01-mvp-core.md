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

**Bead**: `projx-695.1` | **Priority**: Must-Have | **Complexity**: 3 | **Source**: gastown_ui

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
- [ ] **O11y**: `cli.execute` spans with `process.command`, `process.command_args`, `process.exit.code`
- [ ] **O11y**: Metrics for `cli.commands.total`, `cli.commands.duration`, `cli.circuit_breaker.state`
- [ ] **O11y**: Circuit breaker state change logs with trace context

**Acceptance Criteria**:
- Commands execute via `execFile` (no shell)
- Timeout kills long-running processes
- Circuit opens after 5 consecutive failures
- Half-open allows 1 test request after 60s
- All command executions produce spans (per [Constraint 0003](../docs/constraint-0003-cli-instrumentation-patterns.md))

**Testing Requirements**:

*Unit Tests* (`supervisor.test.ts`):
- [ ] Executes commands via execFile (not shell)
- [ ] Resolves with stdout/stderr on success
- [ ] Rejects with error on non-zero exit code
- [ ] Kills process after timeout and rejects
- [ ] Queues commands when max concurrent reached
- [ ] Circuit breaker opens after threshold failures
- [ ] Circuit breaker enters half-open after reset timeout
- [ ] Circuit breaker closes on successful half-open request
- [ ] Emits state change events

*Integration Tests* (`supervisor.integration.test.ts`):
- [ ] Executes real `bd --version` command
- [ ] Handles concurrent command execution
- [ ] Recovers from temporary failures

**Commit**: `feat(cli): add ProcessSupervisor with circuit breaker`

---

### 1.2 Data Access Layer

**Bead**: `projx-695.2` | **Priority**: Must-Have | **Complexity**: 3 | **Source**: New

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
- [ ] **O11y**: `db.query` spans with `db.system`, `db.statement`, `db.operation`
- [ ] **O11y**: Metrics for `db.queries.total`, `db.queries.duration`
- [ ] **O11y**: Query error logs with trace context

**Acceptance Criteria**:
- Auto-detects backend on startup
- Read queries complete in < 50ms for 100 rows
- Handles connection failures gracefully
- Write operations always go through `bd` CLI
- All database queries produce spans (per [observability.md](../spec/observability.md))

**Testing Requirements**:

*Unit Tests* (`dataAccess.test.ts`):
- [ ] Detects SQLite backend from .beads/beads.db
- [ ] Detects Dolt backend from running server
- [ ] Builds parameterized queries correctly
- [ ] Handles query builder for common operations
- [ ] Returns typed results from queries

*Integration Tests* (`dataAccess.integration.test.ts`):
- [ ] Connects to SQLite database
- [ ] Executes read queries and returns results
- [ ] Handles connection failures gracefully
- [ ] Reconnects after temporary failure

*Contract Tests* (`dataAccess.contract.test.ts`):
- [ ] Query results match Issue schema (Zod validation)
- [ ] Database schema matches TypeScript types

**Commit**: `feat(db): add Data Access Layer with backend auto-detection`

---

### 1.3 Issue List View

**Bead**: `projx-695.3` | **Priority**: Must-Have | **Complexity**: 2 | **Source**: All tools
**Wireframe**: [01-issue-list-view.md](../wireframes/01-issue-list-view.md)

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

> **Note**: Column configuration is constant-mapped for MVP. See [12-configuration-view.md](../wireframes/12-configuration-view.md) for future configurability.

**Testing Requirements**:

*Component Tests* (`IssueTable.test.ts`):
- [ ] Renders table with columns (ID, Title, Status, Priority, Assignee)
- [ ] Displays issue data in correct columns
- [ ] Sorts by column when header clicked
- [ ] Shows sort indicator on active column
- [ ] Supports row selection (single click)
- [ ] Supports multi-select (shift+click, ctrl+click)
- [ ] Handles keyboard navigation (j/k, Enter)
- [ ] Shows context menu on right-click
- [ ] Renders empty state when no issues
- [ ] Has accessible table markup (role="grid")

*Integration Tests* (`IssueTable.integration.test.ts`):
- [ ] Renders with real issue store data
- [ ] Updates when store changes
- [ ] Filters integrate with FilterPanel

*E2E Tests* (`e2e/issues/list.spec.ts`) - `@smoke`:
- [ ] Displays issue list on page load
- [ ] Can sort by clicking column headers
- [ ] Can select and open issue detail

**Commit**: `feat(ui): add IssueTable with virtual scrolling and sorting`

---

### 1.4 Filter Panel

**Bead**: `projx-695.4` | **Priority**: Must-Have | **Complexity**: 2 | **Source**: All tools
**Wireframe**: [04-filter-panel.md](../wireframes/04-filter-panel.md)

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

**Testing Requirements**:

*Component Tests* (`FilterPanel.test.ts`):
- [ ] Renders status filter with all status options
- [ ] Renders type filter with all type options
- [ ] Renders priority filter with priority levels
- [ ] Renders assignee dropdown
- [ ] Calls onfilterchange when filter selected
- [ ] Shows filter badges for active filters
- [ ] Removes filter when badge X clicked
- [ ] Clears all filters when "Clear all" clicked
- [ ] Has accessible form markup

*Integration Tests* (`FilterPanel.integration.test.ts`):
- [ ] Filter state syncs with URL params
- [ ] Filters apply to issue list within 50ms
- [ ] Multiple filters combine correctly (AND)

**Commit**: `feat(ui): add FilterPanel with multi-select filters`

---

### 1.5 Text Search

**Bead**: `projx-695.5` | **Priority**: Must-Have | **Complexity**: 1 | **Source**: All tools

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

**Test Acceptance Criteria** (`TextSearch.test.ts`):
```
Rendering:
- [ ] renders search input with placeholder
- [ ] renders clear button when text is present
- [ ] hides clear button when input is empty

Search Behavior:
- [ ] debounces search input by 300ms (vi.useFakeTimers)
- [ ] calls onsearch callback with search term after debounce
- [ ] clears search when clear button is clicked
- [ ] triggers search immediately on Enter key

Text Highlighting:
- [ ] renders SearchHighlight component with matches
- [ ] highlights matching substrings in issue title
- [ ] highlights matching substrings in description
- [ ] handles case-insensitive matching

Accessibility:
- [ ] has role="searchbox"
- [ ] has aria-label for search input
- [ ] clear button has accessible name
```

**Commit**: `feat(ui): add TextSearch with debounce and highlighting`

**ADR**: Record any decisions about search implementation (e.g., client-side vs server-side filtering) using `adrs new`

---

### 1.6 Create Issue

**Bead**: `projx-695.6` | **Priority**: Must-Have | **Complexity**: 2 | **Source**: All tools
**Wireframe**: [05-create-issue-modal.md](../wireframes/05-create-issue-modal.md)

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

**Testing Requirements**:

*Component Tests* (`CreateIssueModal.test.ts`):
- [ ] Renders modal when open is true
- [ ] Does not render when open is false
- [ ] Renders all form fields (title, type, priority, description, assignee, labels)
- [ ] Title field is required (shows validation error)
- [ ] Calls oncreate with form data on submit
- [ ] Calls onclose on Escape key
- [ ] Calls onclose on backdrop click
- [ ] Shows loading state during submission
- [ ] Shows error message on submission failure
- [ ] Has focus trap within modal
- [ ] Has accessible modal markup (role="dialog", aria-modal)

*Integration Tests* (`CreateIssueModal.integration.test.ts`):
- [ ] Submits via ProcessSupervisor to bd create
- [ ] Shows success toast after creation
- [ ] Triggers issue list refresh

*E2E Tests* (`e2e/issues/create.spec.ts`) - `@smoke`:
- [ ] Opens modal with keyboard shortcut (c)
- [ ] Can fill form and submit
- [ ] New issue appears in list

**Commit**: `feat(ui): add CreateIssueModal with validation`

---

### 1.7 Quick Status Change

**Bead**: `projx-695.7` | **Priority**: Must-Have | **Complexity**: 1 | **Source**: All tools

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

**Test Acceptance Criteria** (`StatusDropdown.test.ts`):
```
Rendering:
- [ ] renders current status as button/badge
- [ ] displays all available statuses when opened
- [ ] shows status color coding

Interaction:
- [ ] opens dropdown on click
- [ ] closes dropdown when clicking outside
- [ ] calls onchange with new status when selected
- [ ] closes dropdown after selection

Optimistic Updates:
- [ ] updates UI immediately on selection (before API call)
- [ ] shows loading indicator during update
- [ ] reverts to original status on error
- [ ] shows error toast on failure

Keyboard Navigation:
- [ ] opens dropdown with Enter or Space
- [ ] navigates options with Arrow keys
- [ ] selects option with Enter
- [ ] closes dropdown with Escape

Accessibility:
- [ ] has role="listbox" on dropdown
- [ ] has role="option" on each status option
- [ ] current status indicated with aria-selected
```

*E2E Tests* (`e2e/issues/status.spec.ts`) - `@smoke`:
- [ ] Can change status via dropdown
- [ ] Status persists after page refresh

**Commit**: `feat(ui): add StatusDropdown with optimistic updates`

**ADR**: Record optimistic update pattern decision using `adrs new`

---

### 1.8 Inline Editing

**Bead**: `projx-695.15` | **Priority**: Should-Have | **Complexity**: 3 | **Source**: beads-ui, beads-dashboard

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

**Test Acceptance Criteria** (`InlineEdit.test.ts`):
```
Rendering:
- [ ] renders value as text by default (view mode)
- [ ] renders input when clicked (edit mode)
- [ ] shows save/cancel buttons in edit mode

Edit Mode:
- [ ] enters edit mode on click
- [ ] enters edit mode on Enter key when focused
- [ ] pre-populates input with current value
- [ ] focuses input automatically

Saving:
- [ ] saves on Enter key
- [ ] saves on blur (unless cancelled)
- [ ] calls onsave with new value
- [ ] exits edit mode after save

Cancelling:
- [ ] cancels on Escape key
- [ ] restores original value on cancel
- [ ] exits edit mode on cancel

Optimistic Updates:
- [ ] shows new value immediately
- [ ] reverts on save failure
- [ ] shows error indicator on failure

Conflict Detection:
- [ ] detects concurrent modification error
- [ ] shows conflict toast with Refresh/Retry options
- [ ] Refresh button reloads issue data
- [ ] Retry button re-attempts save

Accessibility:
- [ ] maintains focus after mode transitions
- [ ] input has associated label
```

*E2E Tests* (`e2e/issues/edit.spec.ts`) - `@smoke`:
- [ ] Can edit title inline
- [ ] Edit persists after save
- [ ] Escape cancels edit

**Commit**: `feat(ui): add InlineEdit with conflict resolution`

**ADR**: Record inline editing and conflict resolution decisions using `adrs new`

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

**Bead**: `projx-695.9` | **Priority**: Must-Have | **Complexity**: 2 | **Source**: All tools
**Wireframe**: [03-issue-detail-modal.md](../wireframes/03-issue-detail-modal.md)

Full issue detail modal/panel for viewing complete issue context.

**Deliverables**:
- [ ] `IssueDetail.svelte` component
- [ ] `IssueDetailModal.svelte` wrapper
- [ ] Full description rendering (markdown)
- [ ] Design/Acceptance content tabs
- [ ] Comments section (read-only for MVP)
- [ ] Activity/event history
- [ ] Related issues/dependencies section
- [ ] [Show Dependencies] link to dependencies modal
- [ ] Quick action buttons (edit, close, assign)

**Acceptance Criteria**:
- Opens via Enter key on selected issue
- Opens via click on issue ID/title link
- Shows all issue fields
- Markdown description renders correctly
- Design/Acceptance tabs display content
- [Show Dependencies] opens dependencies modal (1.14)
- Escape closes modal
- URL updates to `/issues/[id]` for deep linking

**Test Acceptance Criteria** (`IssueDetail.test.ts`, `IssueDetailModal.test.ts`):
```
Rendering (IssueDetail):
- [ ] displays issue ID and title
- [ ] displays status badge with correct color
- [ ] displays priority indicator
- [ ] displays assignee (or "Unassigned" placeholder)
- [ ] displays created/updated timestamps
- [ ] renders description as markdown
- [ ] displays issue type badge

Tabs:
- [ ] renders Description tab by default
- [ ] renders Design tab when present
- [ ] renders Acceptance tab when present
- [ ] switches content when tab clicked
- [ ] maintains tab state during re-renders

Comments Section:
- [ ] displays list of comments
- [ ] shows comment author and timestamp
- [ ] renders comment content as markdown
- [ ] shows "No comments" for empty list

Dependencies Section:
- [ ] shows [Show Dependencies] link
- [ ] calls onshowdependencies when clicked
- [ ] displays count of blocking/blocked-by issues

Quick Actions:
- [ ] renders Edit button
- [ ] renders Close/Reopen button based on status
- [ ] renders Assign button
- [ ] calls appropriate handlers when clicked

Modal Behavior (IssueDetailModal):
- [ ] renders modal when open is true
- [ ] does not render when open is false
- [ ] closes on Escape key
- [ ] closes on backdrop click
- [ ] has focus trap
- [ ] has role="dialog" and aria-modal="true"

Accessibility:
- [ ] modal has aria-labelledby pointing to title
- [ ] tabs are keyboard navigable
- [ ] action buttons have accessible names
```

**Commit**: `feat(ui): add IssueDetail with tabs and markdown rendering`

**ADR**: Record any markdown rendering library choice using `adrs new`

---

### 1.9 Kanban Board

**Bead**: `projx-695.10` | **Priority**: Must-Have | **Complexity**: 3 | **Source**: beads-ui, beads-dashboard
**Wireframe**: [02-kanban-board.md](../wireframes/02-kanban-board.md)

Column-based view grouped by status.

**Deliverables**:
- [ ] `KanbanBoard.svelte` component
- [ ] `KanbanColumn.svelte` component
- [ ] `KanbanCard.svelte` component
- [ ] Drag-and-drop between columns (svelte-dnd-action)
- [ ] Column headers with counts
- [ ] Column hide/collapse (constant-mapped for MVP)
- [ ] Card shows: title, type badge, priority indicator, assignee avatar
- [ ] Card context menu with quick actions (right-click)

**Acceptance Criteria**:
- Drag card to column changes status
- Drop triggers `bd update --status`
- Cards render priority as color stripe
- Columns configurable (which statuses to show)
- Card context menu shows: View Details, Change Status, Change Priority, Assign, Copy Link

**Test Acceptance Criteria** (`KanbanBoard.test.ts`, `KanbanColumn.test.ts`, `KanbanCard.test.ts`):
```
KanbanBoard:
- [ ] renders a column for each status
- [ ] distributes issues to correct columns
- [ ] updates when issues prop changes
- [ ] handles empty state (no issues)

KanbanColumn:
- [ ] displays column header with status name
- [ ] displays issue count in header
- [ ] renders KanbanCard for each issue
- [ ] shows empty state when no issues in column
- [ ] can be collapsed/expanded

KanbanCard:
- [ ] displays issue title
- [ ] displays issue type badge
- [ ] displays priority color stripe
- [ ] displays assignee avatar/initials
- [ ] truncates long titles with ellipsis
- [ ] calls onclick when card clicked

Drag and Drop:
- [ ] card is draggable
- [ ] shows drag preview during drag
- [ ] column shows drop indicator when card dragged over
- [ ] calls ondrop with issue and new status
- [ ] shows optimistic status update
- [ ] reverts on drop failure

Context Menu:
- [ ] opens on right-click
- [ ] displays View Details option
- [ ] displays Change Status submenu
- [ ] displays Change Priority submenu
- [ ] displays Assign option
- [ ] displays Copy Link option
- [ ] calls appropriate handlers

Accessibility:
- [ ] columns have role="listbox"
- [ ] cards have role="option"
- [ ] cards are keyboard focusable
- [ ] drag/drop announced to screen readers
```

*E2E Tests* (`e2e/kanban/board.spec.ts`) - `@smoke`:
- [ ] Board displays columns for each status
- [ ] Can drag card between columns
- [ ] Status updates after drop

**Commit**: `feat(kanban): add KanbanBoard with drag-and-drop`

**ADR**: Record drag-and-drop library choice (svelte-dnd-action vs alternatives) using `adrs new`

---

### 1.10 Epics View

**Bead**: `projx-695.16` | **Priority**: Should-Have | **Complexity**: 2 | **Source**: All tools
**Wireframe**: [06-epics-view.md](../wireframes/06-epics-view.md)

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

**Test Acceptance Criteria** (`EpicsView.test.ts`):
```
Rendering:
- [ ] displays only issues with type="epic"
- [ ] shows epic title and ID
- [ ] shows child count (done/total)
- [ ] shows progress bar with correct percentage

Expandable Rows:
- [ ] renders expand/collapse toggle
- [ ] expands to show child issues on click
- [ ] collapses when toggled again
- [ ] remembers expand state across re-renders

Progress Calculation:
- [ ] calculates progress from child statuses
- [ ] counts "done" and "closed" as complete
- [ ] updates progress when children change

Interaction:
- [ ] calls onselect when epic row clicked
- [ ] expands on Enter key when focused
- [ ] supports keyboard navigation (j/k)

Empty State:
- [ ] shows "No epics" message when empty
- [ ] shows create epic prompt

Accessibility:
- [ ] rows have role="row"
- [ ] expand toggle has aria-expanded
- [ ] progress bar has aria-valuenow/min/max
```

> **Note**: Column configuration is constant-mapped for MVP. See [12-configuration-view.md](../wireframes/12-configuration-view.md) for future configurability.

**Commit**: `feat(ui): add EpicsView with expandable rows`

---

### 1.11 File Watching (Real-time)

**Bead**: `projx-695.12` | **Priority**: Must-Have | **Complexity**: 2 | **Source**: beads-ui, beads-dashboard

Watch `.beads/` directory for changes and broadcast updates.

**Deliverables**:
- [ ] Chokidar watcher for `.beads/*.db`, `.beads/*.jsonl`
- [ ] WebSocket server for broadcasting changes
- [ ] Client subscription to change events
- [ ] Debounce rapid file changes (100ms)
- [ ] **O11y**: `ws.connection`, `ws.disconnection`, `ws.broadcast` spans
- [ ] **O11y**: Metrics for `ws.connections.active`, `ws.messages.sent`
- [ ] **O11y**: File change and connection logs with trace context

**Acceptance Criteria**:
- File change triggers WebSocket event within 1s
- Multiple rapid changes coalesce
- Client reconnects on disconnect
- Server handles multiple clients
- All WebSocket events produce spans (per [observability.md](../spec/observability.md))

**Test Acceptance Criteria** (`FileWatcher.test.ts`, `WebSocketServer.test.ts`, `useRealtime.test.ts`):
```
FileWatcher (Server):
- [ ] watches .beads/*.db files
- [ ] watches .beads/*.jsonl files
- [ ] emits change event when file modified
- [ ] debounces rapid changes (100ms)
- [ ] ignores non-database files
- [ ] handles watcher errors gracefully

WebSocket Server:
- [ ] accepts client connections
- [ ] broadcasts file:changed events to all clients
- [ ] broadcasts issues:changed events
- [ ] handles client disconnection
- [ ] supports multiple concurrent clients

useRealtime Hook (Client):
- [ ] connects to WebSocket server on mount
- [ ] reconnects on disconnect
- [ ] calls onchange when issues:changed received
- [ ] calls onfilechange when file:changed received
- [ ] disconnects on unmount
- [ ] handles connection errors

Integration:
- [ ] file change propagates to client within 1s
- [ ] client receives correct event payload
- [ ] multiple clients receive same event
```

**Commit**: `feat(realtime): add FileWatcher with WebSocket broadcast`

**ADR**: Record WebSocket vs SSE decision using `adrs new`

---

### 1.12 Basic Keyboard Shortcuts

**Bead**: `projx-695.17` | **Priority**: Should-Have | **Complexity**: 2 | **Source**: beads-ui, foolery
**Wireframe**: [12-configuration-view.md](../wireframes/12-configuration-view.md) (Keyboard section)

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

**Test Acceptance Criteria** (`KeyboardShortcuts.test.ts`, `ShortcutManager.test.ts`):
```
ShortcutManager:
- [ ] registers shortcuts with handlers
- [ ] unregisters shortcuts
- [ ] prevents duplicate registrations
- [ ] handles modifier keys (Ctrl, Alt, Shift)
- [ ] supports key sequences (e.g., "g i")

Shortcut Handling:
- [ ] j/k moves selection down/up
- [ ] Enter opens selected issue
- [ ] c opens create issue modal
- [ ] n opens create issue modal (alias)
- [ ] e opens edit mode for selected issue
- [ ] Escape closes modal/cancels operation
- [ ] / focuses search input
- [ ] ? opens help modal

Input Context:
- [ ] ignores shortcuts when typing in input
- [ ] ignores shortcuts when typing in textarea
- [ ] respects editable contenteditable elements

Help Modal:
- [ ] displays all registered shortcuts
- [ ] groups shortcuts by category
- [ ] shows shortcut key and description
- [ ] closes on Escape or click outside

Accessibility:
- [ ] shortcuts don't conflict with screen reader keys
- [ ] help modal is keyboard accessible
```

**Commit**: `feat(ui): add keyboard shortcuts with help modal`

**ADR**: Record keyboard shortcut handling approach using `adrs new`

---

### 1.13 Owner/Assignee Filter

**Bead**: `projx-695.18` | **Priority**: Should-Have | **Complexity**: 1 | **Source**: All tools

Filter by owner or assignee with autocomplete.

**Deliverables**:
- [ ] Autocomplete dropdown with known users
- [ ] "Me" shortcut for current user
- [ ] "Unassigned" filter option

**Acceptance Criteria**:
- Dropdown shows users from recent issues
- Selection filters immediately
- Can combine with other filters

**Test Acceptance Criteria** (`AssigneeFilter.test.ts`):
```
Rendering:
- [ ] renders assignee dropdown/combobox
- [ ] shows "Assignee" placeholder when empty
- [ ] shows selected assignee name when set

Autocomplete:
- [ ] opens dropdown on focus
- [ ] filters users as user types
- [ ] shows matching users from recent issues
- [ ] highlights matching text in suggestions
- [ ] shows "No matches" when filter yields no results

Special Options:
- [ ] includes "Me" option at top
- [ ] "Me" resolves to current user
- [ ] includes "Unassigned" option
- [ ] includes "Any" option to clear filter

Selection:
- [ ] selects user on click
- [ ] selects user on Enter
- [ ] calls onchange with selected user
- [ ] closes dropdown after selection

Keyboard Navigation:
- [ ] Arrow keys navigate options
- [ ] Enter selects highlighted option
- [ ] Escape closes dropdown

Accessibility:
- [ ] has role="combobox"
- [ ] options have role="option"
- [ ] aria-activedescendant tracks highlight
```

**Commit**: `feat(ui): add AssigneeFilter with autocomplete`

---

### 1.14 Issue Dependencies Modal

**Bead**: `projx-695.19` | **Priority**: Must-Have | **Complexity**: 2 | **Source**: New
**Wireframe**: [07-issue-dependencies-modal.md](../wireframes/07-issue-dependencies-modal.md)

Modal showing blocking/blocked-by relationships for a single issue.

**Deliverables**:
- [ ] `DependenciesModal.svelte` component
- [ ] Graph visualization of dependencies
- [ ] Lists: Blocked By, Blocking
- [ ] Add/remove dependency actions
- [ ] Quick navigation to linked issues

**Acceptance Criteria**:
- Opens from [Show Dependencies] link in Issue Detail
- Displays upstream (blocked by) and downstream (blocking) issues
- Graph shows relationship direction with arrows
- Click issue navigates to that issue's detail
- Can add/remove dependencies via `bd update`

**Test Acceptance Criteria** (`DependenciesModal.test.ts`, `DependencyGraph.test.ts`):
```
Modal Behavior (DependenciesModal):
- [ ] renders modal when open is true
- [ ] does not render when open is false
- [ ] displays issue title in header
- [ ] closes on Escape key
- [ ] closes on backdrop click
- [ ] has role="dialog" and aria-modal="true"

Blocked By Section:
- [ ] displays list of blocking issues
- [ ] shows issue ID, title, status for each
- [ ] shows "None" when no blockers
- [ ] clicking issue calls onnavigate

Blocking Section:
- [ ] displays list of blocked issues
- [ ] shows issue ID, title, status for each
- [ ] shows "None" when no blocked issues
- [ ] clicking issue calls onnavigate

Graph Visualization (DependencyGraph):
- [ ] renders SVG graph
- [ ] shows current issue as center node
- [ ] shows blocking issues as upstream nodes
- [ ] shows blocked issues as downstream nodes
- [ ] draws arrows indicating direction
- [ ] nodes are clickable

Add/Remove Dependencies:
- [ ] renders "Add Dependency" button
- [ ] opens search/select dialog when clicked
- [ ] calls onadd with selected issue
- [ ] renders remove button on each dependency
- [ ] calls onremove when remove clicked
- [ ] shows confirmation before remove

Accessibility:
- [ ] graph has role="img" with aria-label
- [ ] interactive nodes are keyboard focusable
- [ ] relationships described for screen readers
```

**Commit**: `feat(ui): add DependenciesModal with graph visualization`

**ADR**: Record graph visualization library choice using `adrs new`

---

### 1.15 Global Navigation Bar

**Bead**: `projx-695.20` | **Priority**: Must-Have | **Complexity**: 2 | **Source**: New
**Wireframe**: [01-issue-list-view.md](../wireframes/01-issue-list-view.md) (Global Navigation Bar section)

Persistent navigation with global actions and settings toggles.

**Deliverables**:
- [ ] `GlobalNav.svelte` component
- [ ] Navigation tabs (Issues, Epics, Board, Dashboard, Graph)
- [ ] Theme toggle (Dark/Light/System)
- [ ] Time format toggle (Days vs Days+Hours)
- [ ] Density selector (Compact/Standard/Wide)
- [ ] Quick action buttons ([+ Issue], [+ Epic])
- [ ] Configuration link
- [ ] User menu

**Acceptance Criteria**:
- Navigation tabs switch views
- Theme toggle applies immediately
- Density affects all list/card views
- [+ Issue] opens Create Issue modal
- [+ Epic] opens Create Epic modal
- Settings persist in localStorage

**Test Acceptance Criteria** (`GlobalNav.test.ts`, `ThemeToggle.test.ts`, `DensitySelector.test.ts`):
```
GlobalNav:
- [ ] renders navigation container
- [ ] renders navigation tabs (Issues, Epics, Board, Dashboard, Graph)
- [ ] highlights active tab
- [ ] calls onnavigate when tab clicked
- [ ] renders [+ Issue] button
- [ ] renders [+ Epic] button
- [ ] calls oncreateissue when [+ Issue] clicked
- [ ] calls oncreateepic when [+ Epic] clicked

ThemeToggle:
- [ ] renders theme toggle button/dropdown
- [ ] shows current theme (Dark/Light/System)
- [ ] cycles theme on click
- [ ] applies theme class to document
- [ ] persists theme to localStorage
- [ ] respects system preference when "System" selected

DensitySelector:
- [ ] renders density selector
- [ ] shows options: Compact, Standard, Wide
- [ ] highlights current density
- [ ] calls ondensitychange when selected
- [ ] persists density to localStorage
- [ ] applies density class to layout

Time Format Toggle:
- [ ] renders time format selector
- [ ] shows options: Days, Days+Hours
- [ ] calls ontimeformatchange when changed
- [ ] persists setting to localStorage

User Menu:
- [ ] renders user avatar/icon
- [ ] opens dropdown on click
- [ ] shows Configuration link
- [ ] shows Sign Out option (if applicable)

Accessibility:
- [ ] navigation has role="navigation"
- [ ] tabs have role="tablist" / role="tab"
- [ ] active tab has aria-selected="true"
- [ ] all buttons have accessible names
```

**ADR**: Record theme system implementation using `adrs new`

> **Note**: For MVP, theme and density options are constant-mapped. Full configurability in Phase 2.

**Commit**: `feat(ui): add GlobalNav with theme and density controls`

**ADR**: Record theme system implementation using `adrs new`

---

## Observability Requirements

All Phase 1 implementations must include telemetry per [ADR-0011](../../../../docs/src/adrs/0011-use-opentelemetry-for-observability.md) and [observability.md](../spec/observability.md).

### Acceptance Criteria

- [ ] CLI command executions traced with span including args, exit code, duration
- [ ] WebSocket connections/disconnections emit spans
- [ ] Circuit breaker state changes logged with trace context
- [ ] Errors include span ID for correlation
- [ ] Metrics: `cli.commands.total`, `ws.connections.active`, `cli.circuit_breaker.state`

### Implementation References

- [Spec: Observability Architecture](../spec/observability.md)
- [Constraint 0001: Bun OTEL Compatibility](../docs/constraint-0001-bun-otel-compatibility.md)
- [Constraint 0002: OTEL Signal Maturity](../docs/constraint-0002-otel-signal-maturity.md)
- [Constraint 0003: CLI Instrumentation Patterns](../docs/constraint-0003-cli-instrumentation-patterns.md)

### Per-Feature Requirements

| Feature | Traces | Metrics | Logs |
|---------|--------|---------|------|
| ProcessSupervisor | `cli.execute` span with args/exit code | `cli.commands.total`, `cli.commands.duration` | Circuit breaker state changes |
| RealtimeServer | `ws.connection`, `ws.broadcast` spans | `ws.connections.active`, `ws.messages.sent` | Connection events |
| FileWatcher | `file.change` span | - | Change events |
| Data Access Layer | `db.query` span | `db.queries.total`, `db.queries.duration` | Query errors |

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

> **Reference**: [ADR-0019: Testing Strategy and Conventions](../../../../docs/src/adrs/0019-testing-strategy-and-conventions.md)

### Test Distribution (Traditional Pyramid)

| Type | Target | Phase 1 Focus |
|------|--------|---------------|
| Unit | 50% | ProcessSupervisor, Data Access Layer, utilities |
| Component | 30% | All UI components per Test Acceptance Criteria |
| Integration | 15% | Issue list + filters, Kanban workflows, real-time |
| E2E | 5% | Create/Edit/Kanban critical paths |

### TDD Approach (Required)

All features must follow Test-Driven Development:

1. **RED**: Write failing tests first based on Test Acceptance Criteria
2. **GREEN**: Implement minimum code to pass tests
3. **REFACTOR**: Clean up while keeping tests green

### Commit Workflow (Required)

**ALL tasks must follow this commit workflow**:

1. All acceptance tests pass
2. All unit/component tests pass
3. Lint and type check pass
4. Atomic commit with conventional format: `{type}({scope}): {description}`
5. Include test files in same commit as implementation
6. Update beads issue status after commit

```bash
# Example after completing a task
bun test src/lib/components/issues/IssueTable.test.ts
bun run check && bun run lint

git add src/lib/components/issues/
git commit -m "feat(ui): add IssueTable component with virtual scrolling"

bd update projx-695.3 --status closed
```

### Architecture Decision Records (ADRs)

Record significant decisions using the `adrs` CLI:

```bash
# Create new ADR
adrs --ng new --format madr "Decision Title" -t tag1,tag2

# List existing ADRs
adrs list

# Reference existing ADRs:
# - ADR-0008: Vitest with Testing Library
# - ADR-0009: Callback Props for Component Events
# - ADR-0010: Dependency Injection for Testability
# - ADR-0019: Testing Strategy and Conventions
```

### Unit Tests
- ProcessSupervisor command execution
- Data access layer query building
- Filter logic
- State store operations
- **All component tests per Test Acceptance Criteria**

### Test Patterns
- Use callback props (`onselect`, `onchange`) instead of `createEventDispatcher`
- Use dependency injection for external dependencies (ADR-0010)
- Configure Vitest with `resolve.conditions: ['browser', 'development']` for Svelte 5
- Use `@faker-js/faker` with fixed seed for test data

### Integration Tests
- API routes with mock `bd` CLI
- WebSocket connection/reconnection
- Database operations
- Issue list with filters and search
- Kanban drag-drop with status update

### E2E Tests (Tag critical paths with `@smoke`)
- Create issue flow (`@smoke`)
- Edit issue inline (`@smoke`)
- Filter and search
- Kanban drag-and-drop (`@smoke`)
- Keyboard navigation

---

## Deliverables Checklist

### Components

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
| Issue Dependencies Modal | Must-Have | 2 | 1.5 days | Pending |
| Global Navigation Bar | Must-Have | 2 | 1.5 days | Pending |

**Components Subtotal**: ~28.5 days

### Application Assembly

| Task | Priority | Complexity | Effort | Status |
|------|----------|------------|--------|--------|
| AA.1 Issue Store | Must-Have | 2 | 1.5 days | Pending |
| AA.2 Root Layout Shell | Must-Have | 1 | 0.5 day | Pending |
| AA.3 Issues List Route | Must-Have | 3 | 2 days | Pending |
| AA.4 Kanban Board Route | Must-Have | 2 | 1 day | Pending |
| AA.5 Epics View Route | Should-Have | 1 | 0.5 day | Pending |
| AA.6 Modal Integration | Must-Have | 2 | 1 day | Pending |
| AA.7 CLI Write Integration | Must-Have | 2 | 1 day | Pending |
| AA.8 Real-time Updates | Must-Have | 2 | 1 day | Pending |
| AA.9 URL State Sync | Should-Have | 2 | 0.5 day | Pending |
| AA.10 Error Handling | Must-Have | 2 | 1 day | Pending |

**Assembly Subtotal**: ~10 days

**Total Effort**: ~38.5 days (5-6 weeks with buffer)

---

## Time Estimates

| Week | Focus | Deliverables | Days |
|------|-------|--------------|------|
| 1 | Foundation | ProcessSupervisor (3d), Data Access Layer (3d) | 6 |
| 2 | List View | Issue list (2d), filters (2d), search (1d), create modal (2d), Global Nav (1.5d) | 8.5 |
| 3 | Kanban | Kanban board (3d), Quick Status (1d), File Watching (2d) | 6 |
| 4 | Detail & Polish | Issue Detail (2d), Dependencies Modal (1.5d), Inline editing (2d), epics view (1d), shortcuts (1d) | 7.5 |
| 5 | Assembly | Issue Store (1.5d), Routes (3.5d), Modal/CLI Integration (2d), Error Handling (1d), Real-time (1d) | 9 |
| 6 | Buffer | Integration testing, bug fixes, E2E polish | 3 |

**Note**: Weeks 1-4 can proceed in parallel with some Assembly tasks if components are completed early.

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

## Application Assembly

**Context**: All Phase 1 components have been built and tested in isolation. This section defines the tasks required to wire these components into working SvelteKit routes to achieve a functional MVP.

**MVP Exit Criteria** (these must work after assembly):
- Can view issues in list and Kanban views
- Can create new issues via modal
- Can edit issue fields inline
- Changes persist correctly via `bd` CLI
- Real-time updates work (< 1s latency)

---

### Application Assembly Entry Gate

Before starting Application Assembly, verify component completion:

**Infrastructure (Required)**:
- [x] ProcessSupervisor with circuit breaker (1.1)
- [x] Data Access Layer with backend detection (1.2)
- [x] FileWatcher with WebSocket broadcast (1.11)

**Core UI Components (Required)**:
- [x] IssueTable with virtual scrolling (1.3)
- [x] FilterPanel with multi-select (1.4)
- [x] TextSearch with debounce (1.5)
- [x] CreateIssueModal with validation (1.6)
- [x] StatusDropdown with optimistic updates (1.7)
- [x] KanbanBoard/Column/Card (1.9)
- [x] GlobalNav with theme/density (1.15)

**Supporting Components (Required for full MVP)**:
- [x] InlineEdit with conflict resolution (1.8)
- [x] IssueDetail/IssueDetailModal (1.8a)
- [x] DependenciesModal with graph (1.14)
- [x] EpicsView with expandable rows (1.10)
- [x] KeyboardHelp modal (1.12)
- [x] AssigneeFilter with autocomplete (1.13)

**Verification**:
```bash
# All component tests pass
bun run test:unit

# Type check passes
bun run check

# Lint passes
bun run lint
```

---

### AA.1 Issue Store (State Management)

**Bead**: `projx-695.21` | **Priority**: Must-Have | **Complexity**: 2 | **Depends On**: Data Access Layer (1.2)

Reactive Svelte 5 store for issue state management.

**Files**:
- `src/lib/stores/issues.svelte.ts`
- `src/lib/stores/issues.test.ts`

**Deliverables**:
- [ ] `IssueStore` class with `$state` for issues array
- [ ] `filter` state for current filter criteria
- [ ] `selectedId` state for current selection
- [ ] `filtered` derived getter for filtered issues
- [ ] `selected` derived getter for current issue
- [ ] `load()` method to fetch issues from Data Access Layer
- [ ] `create(issue)` method via ProcessSupervisor → `bd create`
- [ ] `update(id, fields)` method via ProcessSupervisor → `bd update`
- [ ] `refresh()` method for real-time reload

**Acceptance Criteria**:
- Store is singleton exported as `issueStore`
- State is reactive using Svelte 5 runes
- Filter changes immediately update `filtered` getter
- CRUD operations use ProcessSupervisor (never direct DB writes)
- Optimistic updates with rollback on failure

**Test Acceptance Criteria** (`issues.svelte.test.ts`):
```
Initialization:
- [ ] initializes with empty issues array
- [ ] initializes with empty filter
- [ ] initializes with null selectedId

Loading:
- [ ] load() fetches issues from Data Access Layer
- [ ] load() updates issues state
- [ ] load() handles errors gracefully

Filtering:
- [ ] filtered getter returns all issues when no filter
- [ ] filtered getter applies status filter
- [ ] filtered getter applies type filter
- [ ] filtered getter applies priority filter
- [ ] filtered getter applies assignee filter
- [ ] filtered getter applies text search
- [ ] multiple filters combine with AND logic

Selection:
- [ ] selected getter returns null when no selection
- [ ] selected getter returns issue matching selectedId
- [ ] setSelected(id) updates selectedId

CRUD Operations:
- [ ] create() calls ProcessSupervisor with bd create
- [ ] create() adds new issue to store optimistically
- [ ] create() reverts on failure
- [ ] update() calls ProcessSupervisor with bd update
- [ ] update() updates issue in store optimistically
- [ ] update() reverts on failure
- [ ] refresh() reloads all issues from database
```

**Commit**: `feat(stores): add IssueStore with reactive state management`

---

### AA.2 Root Layout Shell

**Bead**: `projx-695.22` | **Priority**: Must-Have | **Complexity**: 1 | **Depends On**: GlobalNav (1.15)

Wire GlobalNav into root layout for persistent navigation.

**Files**:
- `src/routes/+layout.svelte` (modify)
- `src/routes/+layout.ts` (create)
- `src/routes/+layout.test.ts` (create)

**Deliverables**:
- [ ] Import and render `GlobalNav` in layout
- [ ] Set up main content area with proper structure
- [ ] Initialize theme from localStorage/system preference
- [ ] Initialize density from localStorage
- [ ] Add skip link for accessibility
- [ ] Add keyboard shortcut manager at root

**Acceptance Criteria**:
- GlobalNav renders on all pages
- Theme persists across page reloads
- Density persists across page reloads
- Skip link focuses main content
- Keyboard shortcuts work globally

**Test Acceptance Criteria** (`+layout.test.ts`):
```
Rendering:
- [ ] renders GlobalNav component
- [ ] renders children slot
- [ ] renders skip link before main content
- [ ] applies theme class to document

Navigation:
- [ ] GlobalNav receives correct active tab prop
- [ ] navigating updates active tab state

Theme Persistence:
- [ ] reads theme from localStorage on mount
- [ ] falls back to system preference when no stored value
- [ ] updates localStorage when theme changes

Density Persistence:
- [ ] reads density from localStorage on mount
- [ ] defaults to 'standard' when no stored value
- [ ] updates localStorage when density changes

Accessibility:
- [ ] skip link is first focusable element
- [ ] skip link navigates to main content
- [ ] layout has proper landmark structure
```

**Commit**: `feat(routes): add root layout with GlobalNav and theme`

---

### AA.3 Issues List Route

**Bead**: `projx-695.23` | **Priority**: Must-Have | **Complexity**: 3 | **Depends On**: AA.1, AA.2, Issue List (1.3), Filter Panel (1.4), Text Search (1.5)

Main issues view wiring IssueTable, FilterPanel, and TextSearch.

**Files**:
- `src/routes/(app)/+page.svelte` (create - issues is default view)
- `src/routes/(app)/+page.ts` (create)
- `src/routes/(app)/+layout.svelte` (create - app shell)
- `e2e/issues/list.spec.ts` (update)

**Deliverables**:
- [ ] Create `(app)` route group for authenticated layout
- [ ] Wire `IssueTable` with `issueStore.filtered`
- [ ] Wire `FilterPanel` with `issueStore.filter`
- [ ] Wire `TextSearch` with debounced search
- [ ] Connect filter changes to URL query params
- [ ] Load issues on route mount via `+page.ts`
- [ ] Show loading skeleton during initial load

**Acceptance Criteria**:
- Route loads issues from Data Access Layer
- IssueTable displays filtered issues
- FilterPanel changes update URL and filter state
- TextSearch triggers filtered results
- URL can be shared to restore filter state
- Loading state shown during data fetch

**Test Acceptance Criteria** (`issues/+page.test.ts`):
```
Data Loading:
- [ ] loads issues from Data Access Layer on mount
- [ ] displays loading skeleton while loading
- [ ] displays IssueTable when loaded
- [ ] displays error message on load failure

Component Wiring:
- [ ] passes filtered issues to IssueTable
- [ ] passes filter state to FilterPanel
- [ ] passes search term to TextSearch

Filter Integration:
- [ ] FilterPanel changes update issueStore.filter
- [ ] filter changes update URL query params
- [ ] URL query params restore filter on load
- [ ] clearing filters resets URL

Search Integration:
- [ ] TextSearch input updates search filter
- [ ] search is debounced (300ms)
- [ ] clearing search shows all issues

Selection:
- [ ] clicking row updates selectedId
- [ ] pressing Enter on row opens detail modal
- [ ] j/k navigation moves selection

Empty State:
- [ ] shows "No issues" when no issues exist
- [ ] shows "No matches" when filter yields no results
```

*E2E Tests* (`e2e/issues/list.spec.ts`) - `@smoke`:
- [ ] Page loads and displays issue list
- [ ] Can filter by status
- [ ] Can search by text
- [ ] Filters persist in URL
- [ ] Can navigate between issues with j/k

**Commit**: `feat(routes): add issues list route with filtering`

---

### AA.4 Kanban Board Route

**Bead**: `projx-695.24` | **Priority**: Must-Have | **Complexity**: 2 | **Depends On**: AA.1, Kanban Board (1.9)

Kanban board view route.

**Files**:
- `src/routes/(app)/kanban/+page.svelte` (create)
- `src/routes/(app)/kanban/+page.ts` (create)
- `e2e/kanban/board.spec.ts` (update)

**Deliverables**:
- [ ] Wire `KanbanBoard` with `issueStore.filtered`
- [ ] Connect drag-drop to `issueStore.update()`
- [ ] Show optimistic status update during drag
- [ ] Revert on update failure with toast
- [ ] Sync with URL filter params (same as list view)

**Acceptance Criteria**:
- Route displays KanbanBoard with issues grouped by status
- Drag-drop changes issue status via `bd update`
- Failed updates revert with error toast
- Filter panel state shared with list view
- Real-time updates refresh board

**Test Acceptance Criteria** (`kanban/+page.test.ts`):
```
Data Loading:
- [ ] loads issues from issueStore on mount
- [ ] displays loading skeleton while loading
- [ ] displays KanbanBoard when loaded

Component Wiring:
- [ ] passes filtered issues to KanbanBoard
- [ ] KanbanBoard groups issues by status

Drag and Drop:
- [ ] dropping card calls issueStore.update with new status
- [ ] shows optimistic status update immediately
- [ ] reverts status on update failure
- [ ] shows error toast on failure

Filter Sync:
- [ ] reads filter from URL query params
- [ ] filter changes update URL
- [ ] filters shared with list view route

Real-time Updates:
- [ ] board refreshes when issues:changed received
- [ ] maintains scroll position on refresh
```

*E2E Tests* (`e2e/kanban/board.spec.ts`) - `@smoke`:
- [ ] Board displays columns for each status
- [ ] Can drag card between columns
- [ ] Status persists after drag

**Commit**: `feat(routes): add kanban board route with drag-drop`

---

### AA.5 Epics View Route

**Bead**: `projx-695.25` | **Priority**: Should-Have | **Complexity**: 1 | **Depends On**: AA.1, Epics View (1.10)

Epics hierarchical view route.

**Files**:
- `src/routes/(app)/epics/+page.svelte` (create)
- `src/routes/(app)/epics/+page.ts` (create)

**Deliverables**:
- [ ] Wire `EpicsView` with `issueStore.issues`
- [ ] Connect epic selection to detail modal
- [ ] Show epic children on expand

**Acceptance Criteria**:
- Route displays EpicsView with all epics
- Clicking epic opens detail modal
- Expand shows child issues
- Progress reflects child completion

**Test Acceptance Criteria** (`epics/+page.test.ts`):
```
Data Loading:
- [ ] loads issues from issueStore on mount
- [ ] filters to show only epics
- [ ] displays loading skeleton while loading

Component Wiring:
- [ ] passes issues to EpicsView
- [ ] EpicsView filters to epics

Interaction:
- [ ] clicking epic row opens detail modal
- [ ] expanding epic shows children
- [ ] progress bar reflects child completion
```

**Commit**: `feat(routes): add epics view route`

---

### AA.6 Modal Integration

**Bead**: `projx-695.26` | **Priority**: Must-Have | **Complexity**: 2 | **Depends On**: AA.1, AA.3, Create Issue (1.6), Issue Detail (1.8a), Dependencies Modal (1.14)

Wire modals to routes and keyboard shortcuts.

**Files**:
- `src/routes/(app)/+layout.svelte` (modify)
- `src/lib/stores/modals.svelte.ts` (create)

**Deliverables**:
- [ ] Create `modalStore` for modal state management
- [ ] Wire `CreateIssueModal` to `c`/`n` keyboard shortcut
- [ ] Wire `CreateIssueModal` to GlobalNav [+ Issue] button
- [ ] Wire `IssueDetailModal` to Enter key on selected issue
- [ ] Wire `DependenciesModal` to [Show Dependencies] link
- [ ] Handle modal stacking (detail → dependencies)
- [ ] URL updates to `/issues/[id]` when detail modal opens

**Acceptance Criteria**:
- `c` key opens CreateIssueModal (when not in input)
- Enter on selected issue opens IssueDetailModal
- [Show Dependencies] in detail opens DependenciesModal
- Escape closes topmost modal
- URL reflects open issue detail for deep linking

**Test Acceptance Criteria** (`modals.svelte.test.ts`, `(app)/+layout.test.ts`):
```
Modal Store:
- [ ] tracks isCreateOpen state
- [ ] tracks isDetailOpen state with issueId
- [ ] tracks isDependenciesOpen state with issueId
- [ ] openCreate() sets isCreateOpen true
- [ ] closeCreate() sets isCreateOpen false
- [ ] openDetail(id) sets isDetailOpen and issueId
- [ ] closeDetail() clears state
- [ ] topModal() returns currently open modal

CreateIssueModal Integration:
- [ ] renders when modalStore.isCreateOpen
- [ ] opens on 'c' keypress (not in input)
- [ ] opens on 'n' keypress (not in input)
- [ ] opens when [+ Issue] clicked
- [ ] closes on Escape
- [ ] submitting creates issue and closes
- [ ] created issue appears in list

IssueDetailModal Integration:
- [ ] renders when modalStore.isDetailOpen
- [ ] opens on Enter when issue selected
- [ ] opens when issue row clicked
- [ ] closes on Escape
- [ ] URL updates to /issues/[id]
- [ ] navigating to /issues/[id] opens modal

DependenciesModal Integration:
- [ ] renders when modalStore.isDependenciesOpen
- [ ] opens from [Show Dependencies] link
- [ ] stacks on top of detail modal
- [ ] closes on Escape (reveals detail modal)
```

*E2E Tests* (`e2e/issues/create.spec.ts`) - `@smoke`:
- [ ] Opens modal with keyboard shortcut (c)
- [ ] Can fill form and submit
- [ ] New issue appears in list

**Commit**: `feat(routes): add modal integration with keyboard shortcuts`

---

### AA.7 CLI Write Integration

**Bead**: `projx-695.27` | **Priority**: Must-Have | **Complexity**: 2 | **Depends On**: AA.1, ProcessSupervisor (1.1)

Connect all write operations to `bd` CLI via ProcessSupervisor.

**Files**:
- `src/lib/services/issueService.ts` (create)
- `src/lib/services/issueService.test.ts` (create)

**Deliverables**:
- [ ] `createIssue(data)` → `bd create --title "..." --type ...`
- [ ] `updateIssue(id, fields)` → `bd update [id] --field value`
- [ ] `closeIssue(id)` → `bd close [id]`
- [ ] `reopenIssue(id)` → `bd reopen [id]`
- [ ] `addDependency(id, blockedBy)` → `bd update [id] --blocked-by [blockedBy]`
- [ ] `removeDependency(id, blockedBy)` → `bd update [id] --remove-blocked-by [blockedBy]`
- [ ] Error handling with user-friendly messages
- [ ] Conflict detection from CLI output

**Acceptance Criteria**:
- All write operations go through ProcessSupervisor
- Circuit breaker protects against CLI failures
- Errors surface to UI with actionable messages
- Conflict errors show "Refresh & Retry" toast

**Test Acceptance Criteria** (`issueService.test.ts`):
```
createIssue:
- [ ] calls ProcessSupervisor with bd create command
- [ ] passes title as required argument
- [ ] passes optional fields (type, priority, assignee)
- [ ] returns created issue ID from CLI output
- [ ] throws on CLI failure with error message

updateIssue:
- [ ] calls ProcessSupervisor with bd update command
- [ ] passes issue ID as first argument
- [ ] passes changed fields as flags
- [ ] handles multiple field updates in one call
- [ ] detects conflict error from CLI output
- [ ] throws ConflictError for conflicts

closeIssue:
- [ ] calls ProcessSupervisor with bd close command
- [ ] passes issue ID

reopenIssue:
- [ ] calls ProcessSupervisor with bd reopen command
- [ ] passes issue ID

addDependency:
- [ ] calls ProcessSupervisor with bd update --blocked-by
- [ ] passes both issue IDs correctly

removeDependency:
- [ ] calls ProcessSupervisor with bd update --remove-blocked-by

Error Handling:
- [ ] circuit breaker open returns ServiceUnavailableError
- [ ] timeout returns TimeoutError
- [ ] parse error returns descriptive error
```

**Commit**: `feat(services): add issueService for CLI write operations`

---

### AA.8 Real-time Updates Integration

**Bead**: `projx-695.28` | **Priority**: Must-Have | **Complexity**: 2 | **Depends On**: AA.1, File Watching (1.11)

Wire FileWatcher/WebSocket to automatically refresh issue data.

**Files**:
- `src/routes/(app)/+layout.svelte` (modify)
- `src/lib/hooks/useRealtime.svelte.ts` (verify/create)

**Deliverables**:
- [ ] Connect `useRealtime` hook in app layout
- [ ] On `issues:changed` event → `issueStore.refresh()`
- [ ] Debounce rapid refreshes (100ms)
- [ ] Show toast on refresh completion
- [ ] Reconnect on WebSocket disconnect

**Acceptance Criteria**:
- External changes appear in UI within 1s
- Multiple rapid changes coalesce
- Connection loss shows warning indicator
- Automatic reconnection on disconnect

**Test Acceptance Criteria** (`useRealtime.integration.test.ts`):
```
WebSocket Connection:
- [ ] connects to WebSocket server on mount
- [ ] handles connection errors gracefully
- [ ] reconnects automatically on disconnect
- [ ] shows connection warning when disconnected

Event Handling:
- [ ] calls issueStore.refresh on issues:changed
- [ ] debounces rapid refresh calls (100ms)
- [ ] shows "Updated" toast after refresh
- [ ] maintains current selection after refresh

File Change Propagation:
- [ ] file change triggers issues:changed within 1s
- [ ] multiple file changes coalesce
- [ ] UI updates reflect database changes
```

**Commit**: `feat(realtime): integrate real-time updates with issue store`

---

### AA.9 URL State Synchronization

**Bead**: `projx-695.29` | **Priority**: Should-Have | **Complexity**: 2 | **Depends On**: AA.3

Synchronize filter state with URL query parameters for shareable links.

**Files**:
- `src/lib/utils/urlState.ts` (create)
- `src/lib/utils/urlState.test.ts` (create)

**Deliverables**:
- [ ] `serializeFilter(filter)` → URL query string
- [ ] `deserializeFilter(searchParams)` → filter object
- [ ] Hook to sync filter with `$page.url.searchParams`
- [ ] Deep link support: `/issues?status=open&priority=high`
- [ ] Handle invalid/stale URL params gracefully

**Acceptance Criteria**:
- Filter changes update URL without page reload
- Loading URL with params restores filter
- Invalid params are ignored (not error)
- Browser back/forward updates filter

**Test Acceptance Criteria** (`urlState.test.ts`):
```
Serialization:
- [ ] serializes empty filter to empty string
- [ ] serializes status filter to ?status=open
- [ ] serializes multiple statuses to ?status=open,in_progress
- [ ] serializes type filter to ?type=bug
- [ ] serializes priority filter to ?priority=high
- [ ] serializes assignee filter to ?assignee=alice
- [ ] serializes search to ?q=search+term
- [ ] combines multiple filters correctly

Deserialization:
- [ ] deserializes empty string to empty filter
- [ ] deserializes ?status=open to status filter
- [ ] deserializes multiple statuses from comma-separated
- [ ] deserializes all filter types
- [ ] ignores unknown params
- [ ] handles invalid values gracefully

URL Sync Hook:
- [ ] reads filter from URL on mount
- [ ] updates URL when filter changes
- [ ] handles browser back/forward
- [ ] debounces URL updates (100ms)
```

**Commit**: `feat(utils): add URL state synchronization for filters`

---

### AA.10 Error Handling & Loading States

**Bead**: `projx-695.210` | **Priority**: Must-Have | **Complexity**: 2 | **Depends On**: AA.1

Global error handling and consistent loading states.

**Files**:
- `src/routes/(app)/+error.svelte` (create)
- `src/lib/components/common/LoadingSkeleton.svelte` (create)
- `src/lib/components/common/Toast.svelte` (create if not exists)
- `src/lib/stores/toast.svelte.ts` (create)

**Deliverables**:
- [ ] Error boundary component for route errors
- [ ] Loading skeleton for issue list
- [ ] Loading skeleton for kanban board
- [ ] Toast notification system for feedback
- [ ] `bd` CLI unavailable detection with setup instructions

**Acceptance Criteria**:
- Unhandled errors show user-friendly error page
- Loading states prevent content flash
- Toasts auto-dismiss after 5s (configurable)
- CLI unavailable shows setup instructions link

**Test Acceptance Criteria** (`error.test.ts`, `Toast.test.ts`, `toast.svelte.test.ts`):
```
Error Boundary:
- [ ] renders error message from thrown error
- [ ] shows "Go back" button
- [ ] shows "Try again" button
- [ ] logs error for debugging

Loading Skeleton:
- [ ] renders placeholder rows for issue list
- [ ] renders placeholder cards for kanban
- [ ] matches approximate layout of real content

Toast Store:
- [ ] show(message, type) adds toast to queue
- [ ] dismiss(id) removes toast
- [ ] toasts auto-dismiss after duration
- [ ] supports success, error, warning, info types

Toast Component:
- [ ] renders toast message
- [ ] applies type-based styling
- [ ] shows dismiss button
- [ ] calls dismiss on button click
- [ ] has role="alert" for screen readers
```

**Commit**: `feat(ui): add error handling and loading states`

---

## Application Assembly Summary

| Task | Priority | Complexity | Depends On | Status |
|------|----------|------------|------------|--------|
| AA.1 Issue Store | Must-Have | 2 | 1.2 (DAL) | Pending |
| AA.2 Root Layout Shell | Must-Have | 1 | 1.15 (GlobalNav) | Pending |
| AA.3 Issues List Route | Must-Have | 3 | AA.1, AA.2 | Pending |
| AA.4 Kanban Board Route | Must-Have | 2 | AA.1, 1.9 | Pending |
| AA.5 Epics View Route | Should-Have | 1 | AA.1, 1.10 | Pending |
| AA.6 Modal Integration | Must-Have | 2 | AA.1, AA.3 | Pending |
| AA.7 CLI Write Integration | Must-Have | 2 | AA.1, 1.1 | Pending |
| AA.8 Real-time Updates | Must-Have | 2 | AA.1, 1.11 | Pending |
| AA.9 URL State Sync | Should-Have | 2 | AA.3 | Pending |
| AA.10 Error Handling | Must-Have | 2 | AA.1 | Pending |

**Recommended Order**:
1. AA.1 (Issue Store) - Foundation for all routes
2. AA.2 (Root Layout) - App shell
3. AA.10 (Error Handling) - Need loading/error states early
4. AA.3 (Issues List Route) - Primary view
5. AA.7 (CLI Write Integration) - Enable mutations
6. AA.6 (Modal Integration) - Create/edit workflows
7. AA.4 (Kanban Board Route) - Alternative view
8. AA.8 (Real-time Updates) - Live sync
9. AA.9 (URL State Sync) - Polish
10. AA.5 (Epics View Route) - Nice-to-have

**Total Effort**: ~17 complexity points ≈ 8-10 days

---

### Application Assembly Dependency Graph

```
                    ┌─────────────────────────────────────────────────────────────┐
                    │                    INFRASTRUCTURE                           │
                    │  ProcessSupervisor (1.1)   Data Access Layer (1.2)          │
                    │  FileWatcher (1.11)        WebSocket Server                 │
                    └───────────────────────────────┬─────────────────────────────┘
                                                    │
                    ┌───────────────────────────────▼─────────────────────────────┐
                    │                    AA.1 ISSUE STORE                         │
                    │  State management, CRUD operations, filtering               │
                    └───────────────────────────────┬─────────────────────────────┘
                                                    │
          ┌─────────────────────────────────────────┼─────────────────────────────┐
          │                                         │                             │
          ▼                                         ▼                             ▼
┌─────────────────────┐              ┌─────────────────────┐           ┌──────────────────┐
│  AA.2 ROOT LAYOUT   │              │ AA.10 ERROR HANDLING│           │AA.7 CLI WRITES   │
│  GlobalNav, Theme   │              │ Toast, Loading, etc │           │ issueService     │
└─────────┬───────────┘              └──────────┬──────────┘           └────────┬─────────┘
          │                                     │                               │
          └─────────────────────────────────────┼───────────────────────────────┘
                                                │
          ┌─────────────────────────────────────▼─────────────────────────────────┐
          │                       AA.3 ISSUES LIST ROUTE                          │
          │  IssueTable + FilterPanel + TextSearch + Selection                    │
          └─────────────────────────────────────┬─────────────────────────────────┘
                                                │
     ┌──────────────────────────────────────────┼───────────────────────────────────┐
     │                                          │                                   │
     ▼                                          ▼                                   ▼
┌────────────────┐                    ┌─────────────────────┐            ┌──────────────────┐
│ AA.4 KANBAN    │                    │  AA.6 MODALS        │            │ AA.5 EPICS VIEW  │
│ Drag-drop      │                    │  Create, Detail,    │            │ Hierarchical     │
│ Status update  │                    │  Dependencies       │            │                  │
└────────────────┘                    └─────────────────────┘            └──────────────────┘
     │                                          │
     └──────────────────────────────────────────┼───────────────────────────────────┐
                                                │                                   │
                                                ▼                                   ▼
                                    ┌─────────────────────┐            ┌──────────────────┐
                                    │ AA.8 REAL-TIME      │            │ AA.9 URL STATE   │
                                    │ WebSocket refresh   │            │ Filter persistence│
                                    └─────────────────────┘            └──────────────────┘
```

---

### Implementation Notes

**Svelte 5 Patterns**:
- Use `$state` for reactive state in stores (not `writable`)
- Use `$derived` for computed values (not `$:`)
- Use callback props (`onselect`, `onchange`) not `createEventDispatcher`
- Use `SvelteSet`/`SvelteMap` for reactive collections

**Store Pattern**:
```typescript
// src/lib/stores/issues.svelte.ts
class IssueStore {
  issues = $state<Issue[]>([]);
  filter = $state<IssueFilter>({});

  get filtered() {
    return this.issues.filter(i => this.matchesFilter(i));
  }

  async load() {
    this.issues = await dataAccess.query<Issue>('SELECT * FROM issues');
  }
}

export const issueStore = new IssueStore();
```

**Route Data Loading Pattern**:
```typescript
// src/routes/(app)/+page.ts
export const load = async () => {
  await issueStore.load();
  return {};
};
```

**Modal State Pattern**:
```typescript
// src/lib/stores/modals.svelte.ts
class ModalStore {
  createOpen = $state(false);
  detailOpen = $state(false);
  detailIssueId = $state<string | null>(null);

  openCreate() { this.createOpen = true; }
  closeCreate() { this.createOpen = false; }
  openDetail(id: string) { this.detailOpen = true; this.detailIssueId = id; }
  closeDetail() { this.detailOpen = false; this.detailIssueId = null; }
}

export const modalStore = new ModalStore();
```

**Testing Routes**:
- Use `@testing-library/svelte` for component tests
- Use `vi.mock` to mock stores and services
- Test routes with mock data, not real database

---

### Gaps Identified (Future Consideration)

| Gap | Description | Recommendation |
|-----|-------------|----------------|
| Pagination | Large issue lists not paginated | Defer to Phase 2 - virtual scroll handles MVP |
| Offline Support | No offline capability | Out of scope for MVP |
| Multi-project | Single project only | Per spec, deferred to Phase 5+ |
| Undo/Redo | No undo for operations | Consider for Phase 2 |
| Bulk Operations | No multi-select bulk actions | Consider for Phase 2 |
| Export | No export to CSV/JSON | Consider for Phase 2 |

---

### Rollback for Application Assembly

If assembly fails:

1. **Route Issues**: Revert to placeholder pages, add error boundary
2. **Store Issues**: Fall back to direct DAL queries in components
3. **Real-time Issues**: Disable WebSocket, add manual refresh button
4. **Modal Issues**: Use full-page routes instead of modals

```bash
# Quick disable flags
DISABLE_REALTIME=true    # Manual refresh only
DISABLE_MODALS=true      # Use page routes for create/detail
```

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
- [Component Library](../spec/component-library.md)
- **Observability**:
  - [ADR-0011: Use OpenTelemetry for Observability](../../../../docs/src/adrs/0011-use-opentelemetry-for-observability.md)
  - [Spec: Observability Architecture](../spec/observability.md)
  - [Constraint 0001: Bun OTEL Compatibility](../docs/constraint-0001-bun-otel-compatibility.md)
  - [Constraint 0002: OTEL Signal Maturity](../docs/constraint-0002-otel-signal-maturity.md)
  - [Constraint 0003: CLI Instrumentation Patterns](../docs/constraint-0003-cli-instrumentation-patterns.md)
- **Wireframes**:
  - [01-issue-list-view.md](../wireframes/01-issue-list-view.md)
  - [02-kanban-board.md](../wireframes/02-kanban-board.md)
  - [03-issue-detail-modal.md](../wireframes/03-issue-detail-modal.md)
  - [04-filter-panel.md](../wireframes/04-filter-panel.md)
  - [05-create-issue-modal.md](../wireframes/05-create-issue-modal.md)
  - [06-epics-view.md](../wireframes/06-epics-view.md)
  - [07-issue-dependencies-modal.md](../wireframes/07-issue-dependencies-modal.md)
- [ADR-0005: CLI for Writes](../../../../../docs/src/adrs/0005-cli-for-writes-and-direct-sql-for-reads.md)
- [ADR-0006: File Watching](../../../../../docs/src/adrs/0006-use-file-watching-with-websocket-broadcast.md)
