# Phase 3: Git Integration

**Duration**: 3 weeks
**Theme**: PR management, worktrees, and dependency visualization

## Objectives

1. Implement worktree listing and status
2. Add PR creation and management via `gh` CLI
3. Display CI status on issue cards
4. Build dependency graph visualization
5. Enable batch issue operations

---

## Phase 2 Entry Gate

Before starting Phase 3, verify Phase 2 completion:

- [ ] All Phase 2 Must-Have features complete
- [ ] Metrics engine tested and documented
- [ ] All 4 charts rendering correctly (Lead Time, Throughput, CFD, Aging WIP)
- [ ] Health badges displaying on cards
- [ ] Gantt chart basic functionality working
- [ ] Date prefix parsing implemented
- [ ] Unit test coverage > 70%

---

## Success Criteria

| Criterion | Measurement | Verification |
|-----------|-------------|--------------|
| Worktree listing | Displays all worktrees with status | E2E test with mock git repo |
| PR creation | Creates PR via `gh pr create` | Integration test with GitHub API |
| CI status | Shows pass/fail within 10s of change | WebSocket timing test |
| Dependency graph | Renders 50 nodes in < 500ms | Performance benchmark |
| Batch operations | Updates 10 issues in < 5s | E2E timing test |
| Accessibility | WCAG 2.1 AA compliant | axe-core audit |
| Test coverage | > 70% for git integration | Vitest coverage |

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

### 3.1 Worktree Listing

**Priority**: Must-Have | **Complexity**: 2 | **Source**: Beads-Kanban-UI

Display git worktrees with their associated branches.

```typescript
// src/lib/git/worktrees.ts
interface Worktree {
  path: string;
  branch: string;
  head: string;
  isMain: boolean;
  beadsRedirect: boolean;  // .beads symlinked
  status: WorktreeStatus;
}

interface WorktreeStatus {
  ahead: number;
  behind: number;
  modified: number;
  untracked: number;
}
```

**Deliverables**:
- [ ] `WorktreeList.svelte` component
- [ ] `WorktreeCard.svelte` component
- [ ] Fetch via `bd worktree list --json`
- [ ] Status via `git status --porcelain`
- [ ] Click to open in terminal/editor

**Acceptance Criteria**:
- Lists all worktrees with branch names
- Shows ahead/behind indicators
- Shows modified file count
- Refreshes on file system change

---

### 3.2 Worktree Status (Ahead/Behind)

**Priority**: Should-Have | **Complexity**: 2 | **Source**: Beads-Kanban-UI

Show divergence from main branch.

**Deliverables**:
- [ ] Ahead/behind badge on worktree card
- [ ] Tooltip with commit count
- [ ] Warning for divergent branches
- [ ] Fetch via `git rev-list`

**Acceptance Criteria**:
- Shows "↑3 ↓2" format
- Updates on fetch/pull
- Warning icon for conflicts

---

### 3.3 Dependency Graph (Basic)

**Priority**: Must-Have | **Complexity**: 3 | **Source**: beads-pm-ui, foolery

Visualize issue dependencies as a directed graph.

```typescript
// src/lib/graph/dependency.ts
interface DependencyNode {
  id: string;
  label: string;
  type: IssueType;
  status: IssueStatus;
  x?: number;
  y?: number;
}

interface DependencyEdge {
  source: string;
  target: string;
  type: 'blocks' | 'blocked_by' | 'relates_to';
}
```

**Deliverables**:
- [ ] `DependencyGraph.svelte` component
- [ ] Force-directed layout (D3.js)
- [ ] Node coloring by status
- [ ] Edge styling by type
- [ ] Zoom and pan controls
- [ ] Fetch via `bd dep tree --json`

**Acceptance Criteria**:
- Nodes represent issues
- Edges show dependency direction
- Blocked items highlighted
- Click node to view issue

---

### 3.4 Dependency Arrows

**Priority**: Should-Have | **Complexity**: 3 | **Source**: beads-pm-ui

Show dependency arrows on Kanban cards.

**Deliverables**:
- [ ] Arrow indicators on blocked cards
- [ ] Hover to see blockers
- [ ] Click to navigate to blocker
- [ ] Arrow styling (dashed for relates_to)

**Acceptance Criteria**:
- Blocked cards show red indicator
- Blocking cards show outgoing arrow
- Tooltip shows dependency list

---

### 3.5 PR Listing

**Priority**: Must-Have | **Complexity**: 3 | **Source**: Beads-Kanban-UI

List pull requests via GitHub CLI.

```typescript
// src/lib/git/prs.ts
interface PullRequest {
  number: number;
  title: string;
  state: 'open' | 'closed' | 'merged';
  author: string;
  branch: string;
  baseBranch: string;
  url: string;
  checks: CheckStatus;
  reviewStatus: ReviewStatus;
  linkedIssues: string[];
}
```

**Deliverables**:
- [ ] `PRList.svelte` component
- [ ] `PRCard.svelte` component
- [ ] Fetch via `gh pr list --json`
- [ ] Filter by state (open/closed/merged)
- [ ] Link PR to Beads issues

**Acceptance Criteria**:
- Lists open PRs by default
- Shows author, branch, status
- Shows linked issues
- Click to open in browser

---

### 3.6 PR Create

**Priority**: Should-Have | **Complexity**: 3 | **Source**: Beads-Kanban-UI

Create pull requests from the UI.

**Deliverables**:
- [ ] `CreatePRModal.svelte` component
- [ ] Branch selector
- [ ] Title and description fields
- [ ] Auto-link current issue
- [ ] Create via `gh pr create`

**Acceptance Criteria**:
- Pre-fills title from branch/issue
- Description template support
- Creates PR and shows link
- Handles errors (no remote, etc.)

---

### 3.7 PR Merge

**Priority**: Should-Have | **Complexity**: 3 | **Source**: Beads-Kanban-UI

Merge pull requests from the UI.

**Deliverables**:
- [ ] Merge button on PR card
- [ ] Merge strategy selector (merge/squash/rebase)
- [ ] Confirmation dialog
- [ ] Merge via `gh pr merge`
- [ ] Delete branch option

**Acceptance Criteria**:
- Only shown for mergeable PRs
- Shows merge conflicts warning
- Updates PR list after merge
- Closes linked issues (optional)

---

### 3.8 CI Status Display

**Priority**: Must-Have | **Complexity**: 2 | **Source**: Beads-Kanban-UI

Show CI/CD check status on issues and PRs.

```typescript
// src/lib/git/checks.ts
interface CheckStatus {
  state: 'pending' | 'success' | 'failure' | 'error';
  checks: {
    name: string;
    status: string;
    conclusion: string | null;
    url: string;
  }[];
}
```

**Deliverables**:
- [ ] `CIStatusBadge.svelte` component
- [ ] Fetch via `gh pr checks`
- [ ] Status icon (✓/✗/○)
- [ ] Hover to see check details
- [ ] Click to view in GitHub

**Acceptance Criteria**:
- Shows on PR cards
- Shows on linked issue cards
- Updates periodically (30s)
- Color coded (green/red/yellow)

---

### 3.9 Merge Conflict Alerts

**Priority**: Should-Have | **Complexity**: 2 | **Source**: Beads-Kanban-UI

Alert users to merge conflicts.

**Deliverables**:
- [ ] Conflict indicator on PR card
- [ ] Conflict details on hover
- [ ] Notification on conflict detection

**Acceptance Criteria**:
- Red warning icon for conflicts
- Shows conflicting files
- Links to resolution docs

---

### 3.10 Drag-and-Drop (Kanban)

**Priority**: Should-Have | **Complexity**: 3 | **Source**: beads-dashboard, Kanban-UI

Enhanced Kanban drag-and-drop.

**Deliverables**:
- [ ] Multi-card selection
- [ ] Drag multiple cards
- [ ] Drop zone highlighting
- [ ] Keyboard-accessible reorder

**Acceptance Criteria**:
- Shift-click multi-select
- Drag selection changes status
- Visual feedback during drag

---

### 3.11 Batch Issue Creation

**Priority**: Should-Have | **Complexity**: 3 | **Source**: beads-dashboard

Create multiple issues at once.

**Deliverables**:
- [ ] `BatchCreateModal.svelte` component
- [ ] Markdown list input
- [ ] Parse titles from lines
- [ ] Apply common properties
- [ ] Create via `bd create` loop

**Acceptance Criteria**:
- Paste markdown list
- Each line becomes issue title
- Common labels/priority applied
- Progress indicator during creation

---

### 3.12 Related Tasks Links

**Priority**: Should-Have | **Complexity**: 2 | **Source**: Beads-Kanban-UI

Quick links to related/blocked tasks.

**Deliverables**:
- [ ] Related section in issue detail
- [ ] Quick-add related task
- [ ] Navigate to related task
- [ ] Remove relation

**Acceptance Criteria**:
- Shows blocks/blocked_by/relates_to
- Click to view related issue
- Add via `bd dep add`

---

### 3.13 Gantt Drag/Resize

**Priority**: Should-Have | **Complexity**: 4 | **Source**: beads-pm-ui (moved from Phase 2)

Interactive Gantt bar manipulation for date adjustments.

**Deliverables**:
- [ ] Drag bar to change dates
- [ ] Resize bar to change duration
- [ ] Update issue via `bd update --due`
- [ ] Visual feedback during drag
- [ ] Snap to day/week grid

**Acceptance Criteria**:
- Drag snaps to configurable grid (day/week)
- Resize handles at bar ends
- Update persists via CLI
- Optimistic update with rollback on error
- Undo support (Ctrl+Z)

---

## Technical Architecture

### Git Integration Layer

```typescript
// src/lib/git/index.ts
class GitIntegration {
  private supervisor: ProcessSupervisor;

  async listWorktrees(): Promise<Worktree[]>;
  async getWorktreeStatus(path: string): Promise<WorktreeStatus>;
  async listPRs(filter?: PRFilter): Promise<PullRequest[]>;
  async createPR(options: CreatePROptions): Promise<PullRequest>;
  async mergePR(number: number, options: MergeOptions): Promise<void>;
  async getCheckStatus(prNumber: number): Promise<CheckStatus>;
}
```

### Dependency Graph Renderer

```typescript
// src/lib/graph/renderer.ts
import * as d3 from 'd3';

function renderDependencyGraph(
  container: HTMLElement,
  nodes: DependencyNode[],
  edges: DependencyEdge[],
  options: GraphOptions
): GraphController;
```

### Dependency Graph Performance at Scale

The dependency graph must handle real-world project sizes efficiently.

**Node Limits and Performance Targets:**

| Node Count | Target Render Time | Strategy |
|------------|-------------------|----------|
| ≤ 50 nodes | < 200ms | Full render, smooth animations |
| 51-100 nodes | < 500ms | Full render, reduced animations |
| 101-500 nodes | < 2s | Pagination UI, depth limiting |
| > 500 nodes | N/A | Force filtering, show warning |

**Rendering Strategy:**

```typescript
interface GraphPerformanceConfig {
  // Rendering mode
  renderMode: 'svg' | 'canvas';  // SVG for <100 nodes, Canvas for larger

  // Force simulation
  maxIterations: 300;           // Cap simulation iterations
  alphaDecay: 0.0228;           // Default D3 value
  useWebWorker: boolean;        // Offload to worker for >100 nodes

  // Memory limits
  maxMemoryMB: 50;              // Target memory budget

  // Progressive loading
  initialDepth: 2;              // Start with depth-limited view
  expandOnDemand: boolean;      // Load deeper on user action
}
```

**Progressive Loading:**

1. Initial render: `bd dep tree --depth 2` (limited depth)
2. Click node to expand: fetch children on demand
3. Show "X more dependencies..." indicator for collapsed nodes

**Web Worker Offloading:**

For graphs with >100 nodes, offload force simulation to Web Worker:

```typescript
// Worker handles simulation, main thread handles rendering
const worker = new Worker('graph-layout.worker.ts');
worker.postMessage({ nodes, edges, config });
worker.onmessage = (e) => renderPositions(e.data);
```

**Memory Management:**

- Circular buffer for position history (undo support)
- Dispose D3 simulation on unmount
- Lazy load node details on hover

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/git/worktrees` | GET | List worktrees |
| `/api/git/worktrees/[path]/status` | GET | Worktree status |
| `/api/git/prs` | GET | List PRs |
| `/api/git/prs` | POST | Create PR |
| `/api/git/prs/[number]` | GET | Get PR details |
| `/api/git/prs/[number]/merge` | POST | Merge PR |
| `/api/git/prs/[number]/checks` | GET | Get check status |

### WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `git:worktree:changed` | Server → Client | `{ path: string, status: WorktreeStatus }` |
| `git:pr:updated` | Server → Client | `{ number: number, state: string, checks: CheckStatus }` |
| `git:pr:created` | Server → Client | `{ pr: PullRequest }` |
| `git:pr:merged` | Server → Client | `{ number: number, mergeCommit: string }` |
| `git:checks:changed` | Server → Client | `{ prNumber: number, checks: CheckStatus }` |

---

## Dependencies

### From Phase 1
- ProcessSupervisor
- Issue Store
- Kanban Board

### External CLIs
| CLI | Commands | Purpose |
|-----|----------|---------|
| `bd` | `worktree list`, `dep tree` | Beads operations |
| `gh` | `pr list`, `pr create`, `pr merge`, `pr checks` | GitHub operations |
| `git` | `status`, `rev-list` | Git operations |

### New Libraries
| Library | Purpose |
|---------|---------|
| `d3` | Force-directed graph layout |
| `d3-force` | Physics simulation |

---

## GitHub CLI Authentication

### Authentication Flow

```typescript
// src/lib/git/auth.ts
interface GitHubAuthStatus {
  authenticated: boolean;
  user: string | null;
  scopes: string[];
  method: 'oauth' | 'token' | 'ssh';
}

async function checkGitHubAuth(): Promise<GitHubAuthStatus> {
  const result = await supervisor.execute('gh', ['auth', 'status', '--show-token']);
  // Parse output for auth status
}
```

### Browser-Based OAuth Flow

Standard flow for environments with browser access:

```typescript
async function initiateOAuthFlow(): Promise<void> {
  // Opens browser for GitHub OAuth
  await supervisor.execute('gh', ['auth', 'login', '--web']);
}
```

### Headless Environment Flow

For servers, CI, or environments without browser access:

```typescript
interface HeadlessAuthOptions {
  method: 'token' | 'device-code';
}

async function initiateHeadlessAuth(options: HeadlessAuthOptions): Promise<AuthResult> {
  if (options.method === 'token') {
    // User provides existing PAT
    // gh auth login --with-token < token.txt
    return { type: 'token-prompt', instructions: 'Enter GitHub PAT' };
  }

  // Device code flow - works without browser on server
  const result = await supervisor.execute('gh', [
    'auth', 'login',
    '--hostname', 'github.com',
    '--git-protocol', 'https',
    '--web'  // Will output device code if no browser
  ]);

  // Parse device code from output
  // User enters code at https://github.com/login/device
  return {
    type: 'device-code',
    userCode: parseDeviceCode(result.stdout),
    verificationUri: 'https://github.com/login/device',
    expiresIn: 900,  // 15 minutes
  };
}
```

**UI Flow for Headless:**

1. Detect headless environment (no `DISPLAY`, SSH session, etc.)
2. Show device code and verification URL
3. Poll `gh auth status` until authenticated (max 15 min)
4. Show success/failure message

---

## Circuit Breaker for gh CLI

### Configuration

```typescript
// src/lib/git/circuit-breaker.ts
interface GitHubCircuitBreakerConfig {
  // Failure thresholds
  failureThreshold: 5;           // Opens after 5 consecutive failures
  failureWindow: 60_000;         // Within 60 seconds

  // Recovery
  halfOpenTimeout: 30_000;       // Try one request after 30s
  successThreshold: 2;           // Close after 2 successful requests

  // Rate limiting
  requestsPerMinute: 30;         // GitHub API rate limit buffer
  burstLimit: 10;                // Max concurrent requests
}
```

### State Machine

```
┌─────────┐   5 failures    ┌─────────┐
│ CLOSED  │ ─────────────▶  │  OPEN   │
│(normal) │                 │(failing)│
└────┬────┘                 └────┬────┘
     │                           │
     │ success                   │ 30s timeout
     │                           ▼
     │                      ┌─────────┐
     └──────────────────────│HALF-OPEN│
        2 successes         │ (test)  │
                            └─────────┘
```

### Error Categories

```typescript
type GitHubErrorCategory =
  | 'rate-limited'      // 429, triggers immediate OPEN
  | 'auth-failed'       // 401, requires re-auth
  | 'not-found'         // 404, don't count as failure
  | 'server-error'      // 5xx, count toward threshold
  | 'network-error'     // Timeout/connection, count toward threshold
  | 'unknown';

function categorizeError(error: ExecError): GitHubErrorCategory;
```

### UI Feedback

| State | UI Indicator | User Action |
|-------|--------------|-------------|
| CLOSED | None (normal operation) | - |
| OPEN | Banner: "GitHub temporarily unavailable" | Show retry timer |
| HALF-OPEN | Subtle indicator, testing | - |
| Rate Limited | Banner with reset time | Wait or use cached data |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| `gh` CLI not authenticated | Check auth status, show login prompt with headless support |
| No git remote | Graceful degradation, show setup help |
| Large dependency graph | Limit depth, lazy loading, Web Worker offload |
| GitHub API rate limiting | Circuit breaker, request queuing, caching |
| gh CLI unavailable | Feature flag, graceful degradation to web links |
| PR rate limiting | Cache results, respect rate limits |

---

## Testing Strategy

### Unit Tests
- Worktree data parsing
- PR data transformation
- Dependency graph layout
- Check status parsing

### Integration Tests
- `gh` CLI command execution
- Worktree status updates
- PR creation flow

### E2E Tests
- View worktree list
- Create and merge PR
- Navigate dependency graph
- Batch issue creation

---

## Deliverables Checklist

| Component | Priority | Complexity | Effort | Status |
|-----------|----------|------------|--------|--------|
| Worktree Listing | Must-Have | 2 | 2 days | Pending |
| Worktree Status | Should-Have | 2 | 1.5 days | Pending |
| Dependency Graph | Must-Have | 3 | 3 days | Pending |
| Dependency Arrows | Should-Have | 3 | 2 days | Pending |
| PR Listing | Must-Have | 3 | 2 days | Pending |
| PR Create | Should-Have | 3 | 2 days | Pending |
| PR Merge | Should-Have | 3 | 2 days | Pending |
| CI Status Display | Must-Have | 2 | 1.5 days | Pending |
| Merge Conflict Alerts | Should-Have | 2 | 1 day | Pending |
| Drag-and-Drop (Enhanced) | Should-Have | 3 | 2 days | Pending |
| Batch Issue Creation | Should-Have | 3 | 2 days | Pending |
| Related Tasks Links | Should-Have | 2 | 1.5 days | Pending |
| Gantt Drag/Resize | Should-Have | 4 | 3 days | Pending |

**Total Effort**: ~25.5 days (Must-Have: ~8.5 days, Should-Have: ~17 days)

---

## Time Estimates

| Week | Focus | Deliverables | Days |
|------|-------|--------------|------|
| 1 | Worktrees & Git | Worktree list (2d), status (1.5d), CI Status (1.5d) | 5 |
| 2 | PRs | PR listing (2d), create (2d), merge (2d) | 6 |
| 3 | Dependencies | Graph (3d), arrows (2d), conflict alerts (1d) | 6 |

**Note**: Enhanced Drag-and-Drop, Batch Creation, and Related Links may extend into buffer time.

---

## Accessibility Requirements

All git and PR components must meet WCAG 2.1 AA standards:

| Requirement | Implementation |
|-------------|----------------|
| Screen reader support | Status badges include text alternatives |
| Keyboard navigation | All interactive elements focusable |
| Focus indicators | Visible focus ring on all focusable elements |
| Color independence | Status conveyed by icon shape + text, not color alone |

### Component-Specific A11y

| Component | Requirements |
|-----------|--------------|
| Worktree List | `role="list"`, keyboard navigation |
| PR Cards | `role="article"`, status announced |
| Dependency Graph | Text alternative listing, keyboard node navigation |
| CI Status Badge | Tooltip text, `aria-label` with status |
| Merge Dialogs | `role="dialog"`, `aria-modal="true"`, focus trap |

---

## Rollback Strategy

### Feature Flags

```bash
# Disable features if issues arise
DISABLE_WORKTREES=true         # Hide worktree panel
DISABLE_PR_INTEGRATION=true    # Disable PR features, link to GitHub instead
DISABLE_DEP_GRAPH=true         # Hide dependency graph, show list view
DISABLE_CI_STATUS=true         # Hide CI badges
```

### Component Rollback

| Component | Rollback Procedure |
|-----------|-------------------|
| Worktree Listing | Direct users to `git worktree list` command |
| PR Integration | Link to GitHub web interface |
| Dependency Graph | Show dependency list in table format |
| CI Status | Show "View on GitHub" link instead |

### CLI Fallback

```bash
# If gh CLI issues occur
FORCE_GH_BROWSER=true  # Open GitHub in browser instead of CLI operations
```

---

## Test Coverage Targets

| Area | Target | Measurement |
|------|--------|-------------|
| Git Integration Layer | > 80% | Critical path with mocked git/gh |
| PR Components | > 70% | Component tests with mock data |
| Dependency Graph | > 75% | Layout algorithm + rendering |
| Worktree Components | > 70% | Component tests |
| Overall Phase 3 | > 70% | Vitest coverage report |

---

## Exit Criteria

- [ ] Worktrees displayed with branch and status
- [ ] PRs listed with CI status badges
- [ ] Can create PR from UI
- [ ] Can merge PR from UI (with checks passing)
- [ ] Dependency graph renders correctly
- [ ] Blocked issues show dependency indicators
- [ ] All "Must-Have" features complete
- [ ] `gh` CLI integration tested
- [ ] Accessibility audit passes (0 critical violations)
- [ ] Unit test coverage > 70%

---

## Phase 4 Handoff

Before proceeding to Phase 4, provide:

- [ ] Git integration layer documented and tested
- [ ] PR operations stable (list, create, merge)
- [ ] CI status WebSocket updates working
- [ ] Dependency graph component reusable
- [ ] `gh` CLI authentication flow documented
- [ ] All Must-Have features deployed

---

## References

- [Git Integration Spec](../spec/git.md)
- [API Contract](../spec/api-contract.md)
- [Beads-Kanban-UI Reference](../references/beads-kanban-ui/README.md)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
