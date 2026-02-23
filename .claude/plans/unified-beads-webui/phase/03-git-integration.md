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

## Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| Worktree listing | Displays all worktrees with status |
| PR creation | Creates PR via `gh pr create` |
| CI status | Shows pass/fail within 10s of change |
| Dependency graph | Renders 50 nodes in < 500ms |
| Batch operations | Updates 10 issues in < 5s |

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

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| `gh` CLI not authenticated | Check auth status, show login prompt |
| No git remote | Graceful degradation, show setup help |
| Large dependency graph | Limit depth, lazy loading |
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

| Component | Priority | Status |
|-----------|----------|--------|
| Worktree Listing | Must-Have | Pending |
| Worktree Status | Should-Have | Pending |
| Dependency Graph | Must-Have | Pending |
| Dependency Arrows | Should-Have | Pending |
| PR Listing | Must-Have | Pending |
| PR Create | Should-Have | Pending |
| PR Merge | Should-Have | Pending |
| CI Status Display | Must-Have | Pending |
| Merge Conflict Alerts | Should-Have | Pending |
| Drag-and-Drop (Enhanced) | Should-Have | Pending |
| Batch Issue Creation | Should-Have | Pending |
| Related Tasks Links | Should-Have | Pending |

---

## Time Estimates

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1 | Worktrees & Git | Worktree list, status, basic git operations |
| 2 | PRs | PR listing, create, merge, CI status |
| 3 | Dependencies | Dependency graph, arrows, batch operations |

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

---

## References

- [Git Integration Spec](../spec/git.md)
- [API Contract](../spec/api-contract.md)
- [Beads-Kanban-UI Reference](../references/beads-kanban-ui/README.md)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
