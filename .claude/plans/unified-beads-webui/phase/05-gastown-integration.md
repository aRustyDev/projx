# Phase 5: Gas-Town Integration

**Duration**: 4 weeks
**Theme**: Full multi-agent orchestration

## Objectives

1. Integrate Gas-Town detection and configuration
2. Build agent monitoring dashboard with rig/polecat status
3. Implement convoy tracking for grouped work
4. Add mail system for agent communication
5. Create scene/wave orchestration UI

---

## Phase 4 Entry Gate

Before starting Phase 5, verify Phase 4 completion:

- [ ] All Phase 4 Must-Have features complete
- [ ] Terminal drawer functional
- [ ] Agent session launch and monitoring working
- [ ] Verification queue operational
- [ ] Approve/reject workflows tested
- [ ] Security audit passed
- [ ] Unit test coverage > 70%

---

## Success Criteria

| Criterion | Measurement | Verification |
|-----------|-------------|--------------|
| Gas-Town detection | Detects gt CLI and town status | Integration test |
| Agent dashboard | Shows all rigs and polecats | E2E test |
| Convoy tracking | Displays convoy progress | E2E test |
| Mail system | Shows inbox with < 2s latency | Performance benchmark |
| SQL explorer | Executes queries in < 500ms | Performance benchmark |
| Accessibility | WCAG 2.1 AA compliant | axe-core audit |
| Test coverage | > 70% for Gas-Town integration | Vitest coverage |

---

## gt CLI Requirements

**Minimum Version**: gt >= 0.5.0

```bash
# Verify gt CLI version
gt --version  # Must return >= 0.5.0

# Required commands
gt status --json --fast
gt rig list --json
gt polecat list --json
gt convoy list --json
gt mail inbox --json
```

See [CLI Integration Spec](../spec/cli-integration.md#gt-cli-commands) for full command reference.

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

### 5.1 Gas-Town Detection

**Priority**: Must-Have | **Complexity**: 2 | **Source**: gastown_ui

Detect Gas-Town installation and configuration.

```typescript
// src/lib/gastown/detection.ts
interface GasTownStatus {
  installed: boolean;
  version: string | null;
  townName: string | null;
  daemonRunning: boolean;
  doltServer: boolean;
  config: GasTownConfig | null;
}

async function detectGasTown(): Promise<GasTownStatus>;
```

**Deliverables**:
- [ ] Detection via `gt --version`
- [ ] Town status via `gt status --json --fast`
- [ ] Config parsing
- [ ] Feature flag integration
- [ ] Graceful degradation when not installed

**Acceptance Criteria**:
- Detects presence of `gt` CLI
- Reads town configuration
- Shows Gas-Town features only when available
- Handles missing `gt` gracefully

---

### 5.2 gt CLI Integration

**Priority**: Must-Have | **Complexity**: 3 | **Source**: gastown_ui

Full integration with Gas-Town CLI commands.

```typescript
// src/lib/gastown/cli.ts
class GasTownCLI {
  async status(): Promise<TownStatus>;
  async doctor(): Promise<DoctorResult>;

  async rigList(): Promise<Rig[]>;
  async rigStatus(name: string): Promise<RigStatus>;
  async rigStart(name: string): Promise<void>;
  async rigStop(name: string): Promise<void>;

  async polecatList(rig?: string): Promise<Polecat[]>;
  async polecatStatus(name: string): Promise<PolecatStatus>;

  async sling(issueId: string, rig: string, options?: SlingOptions): Promise<void>;

  async convoyList(): Promise<Convoy[]>;
  async convoyStatus(id: string): Promise<ConvoyStatus>;
  async convoyCreate(title: string, issues: string[]): Promise<Convoy>;

  async mailInbox(): Promise<MailInbox>;
  async mailSend(to: string, subject: string, body: string): Promise<void>;
  async mailRead(id: string): Promise<Mail>;
}
```

**Deliverables**:
- [ ] CLI wrapper class
- [ ] All gt commands mapped
- [ ] JSON output parsing
- [ ] Error handling
- [ ] Command timeout handling

**Acceptance Criteria**:
- All documented gt commands accessible
- JSON output parsed correctly
- Errors surface to UI
- Timeouts handled gracefully

---

### 5.3 Agent Monitoring Dashboard

**Priority**: Must-Have | **Complexity**: 3 | **Source**: gastown_ui

Dashboard showing all agents, rigs, and their status.

```typescript
// Types for dashboard
interface DashboardState {
  rigs: Rig[];
  polecats: Polecat[];
  activeIssues: Map<string, string>;  // polecat -> issue
  health: HealthStatus;
}
```

**Deliverables**:
- [ ] `AgentDashboard.svelte` component
- [ ] `RigCard.svelte` component
- [ ] `PolecatCard.svelte` component
- [ ] Status indicators (working/stalled/zombie)
- [ ] Quick actions (start/stop/nuke)
- [ ] Auto-refresh (30s interval)

**Acceptance Criteria**:
- Shows all rigs and polecats
- Status updates in real-time
- Can start/stop rigs from UI
- Shows current issue per polecat

---

### 5.4 Convoy Tracking

**Priority**: Must-Have | **Complexity**: 3 | **Source**: gastown-frontend

Track grouped work through convoys.

```typescript
// src/lib/gastown/convoy.ts
interface Convoy {
  id: string;
  title: string;
  status: 'active' | 'landed' | 'stranded';
  issues: ConvoyIssue[];
  progress: { done: number; total: number };
  createdAt: Date;
}

interface ConvoyIssue {
  id: string;
  title: string;
  status: IssueStatus;
  assignee: string | null;
}
```

**Deliverables**:
- [ ] `ConvoyList.svelte` component
- [ ] `ConvoyCard.svelte` component
- [ ] `ConvoyDetail.svelte` component
- [ ] Progress visualization
- [ ] Status filtering
- [ ] Create convoy modal

**Acceptance Criteria**:
- Lists all convoys
- Shows progress per convoy
- Can create new convoy
- Links to constituent issues

---

### 5.5 Mail System Integration

**Priority**: Should-Have | **Complexity**: 3 | **Source**: gastown_ui

Agent-to-human communication via mail.

**Deliverables**:
- [ ] `MailInbox.svelte` component
- [ ] `MailMessage.svelte` component
- [ ] `ComposeMail.svelte` component
- [ ] Unread badge in header
- [ ] Mark as read
- [ ] Reply functionality

**Acceptance Criteria**:
- Shows inbox with messages
- Unread count in header
- Can read messages
- Can compose replies
- Real-time updates

---

### 5.6 Scene/Wave Orchestration

**Priority**: Should-Have | **Complexity**: 4 | **Source**: foolery

**⚠️ REQUIRES FURTHER REFINEMENT** - Backend support unclear. This feature needs clarification on whether:
- `gt` CLI supports scenes/waves natively, or
- This is a UI-layer abstraction built on convoys + sling operations

**Decision deferred until Phase 5 implementation begins.** Progress on other features will inform the approach.

---

Orchestrate work across multiple agents in waves.

```typescript
// src/lib/gastown/orchestration.ts
interface Scene {
  id: string;
  name: string;
  waves: Wave[];
  status: 'pending' | 'running' | 'completed';
}

interface Wave {
  id: string;
  sceneId: string;
  order: number;
  issues: string[];
  status: 'pending' | 'running' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
}
```

**Deliverables**:
- [ ] `SceneBuilder.svelte` component
- [ ] `WaveEditor.svelte` component
- [ ] Dependency-aware wave ordering
- [ ] Start/pause/resume scene
- [ ] Progress visualization

**Acceptance Criteria**:
- Can create scenes with waves
- Waves respect dependencies
- Scene progress visible
- Can pause/resume execution

---

### 5.7 Knowledge Panel (Memory)

**Priority**: Should-Have | **Complexity**: 3 | **Source**: Beads-Kanban-UI

Browse agent memory and knowledge base.

**Deliverables**:
- [ ] `KnowledgePanel.svelte` component
- [ ] Memory file browser
- [ ] Content viewer (markdown)
- [ ] Search within memory
- [ ] Link memory to issues

**Acceptance Criteria**:
- Browse `.beads/memory/` directory
- View markdown files
- Search content
- Navigate to related issues

---

### 5.8 SQL Explorer

**Priority**: Should-Have | **Complexity**: 4 | **Source**: New

Advanced SQL query interface for power users.

**Deliverables**:
- [ ] `SQLExplorer.svelte` component
- [ ] Query editor with syntax highlighting
- [ ] Results table with sorting
- [ ] Query history
- [ ] Save favorite queries
- [ ] Export results (CSV, JSON)

**Acceptance Criteria**:
- Execute SELECT queries
- Results render in table
- Can sort/filter results
- Query history preserved
- Export functionality works

---

### 5.9 Multi-rig Support

**Priority**: Should-Have | **Complexity**: 4 | **Source**: gastown_ui

Manage multiple rigs simultaneously.

**Deliverables**:
- [ ] Rig selector dropdown
- [ ] Rig comparison view
- [ ] Cross-rig issue assignment
- [ ] Rig health monitoring
- [ ] Rig configuration UI

**Acceptance Criteria**:
- Switch between rigs
- View status across rigs
- Assign issues to specific rigs
- Monitor all rigs simultaneously

---

### 5.10 Merge Queue Visualization

**Priority**: Should-Have | **Complexity**: 3 | **Source**: gastown_ui

Visualize the merge queue for coordinated merges.

**Deliverables**:
- [ ] `MergeQueue.svelte` component
- [ ] Queue item cards
- [ ] Position indicator
- [ ] ETA calculation
- [ ] Reorder capability

**Acceptance Criteria**:
- Shows items in queue
- Position clearly indicated
- Can reorder (if permitted)
- Shows estimated merge time

---

### 5.11 Project Tags

**Priority**: Should-Have | **Complexity**: 2 | **Source**: Beads-Kanban-UI

Tag-based project organization.

**Deliverables**:
- [ ] Tag management UI
- [ ] Filter by tags
- [ ] Tag colors
- [ ] Bulk tag operations

**Acceptance Criteria**:
- Can create/edit/delete tags
- Filter issues by tag
- Tags visible on cards
- Bulk add/remove tags

---

### 5.12 Cross-Project View

**Priority**: Should-Have | **Complexity**: 4 | **Source**: Beads-Kanban-UI, foolery

View issues across multiple projects (future).

**Deliverables**:
- [ ] Project selector (when enabled)
- [ ] Unified issue view
- [ ] Per-project filtering
- [ ] Cross-project search

**Acceptance Criteria**:
- (Deferred to post-MVP)
- Design supports future multi-project
- Data models are project-aware

---

## Technical Architecture

### Gas-Town Integration Layer

```typescript
// src/lib/gastown/index.ts
class GasTownIntegration {
  private cli: GasTownCLI;
  private status: GasTownStatus;

  constructor(supervisor: ProcessSupervisor);

  async initialize(): Promise<void>;
  isAvailable(): boolean;

  // Delegate to CLI
  get rigs(): GasTownCLI['rigList'];
  get polecats(): GasTownCLI['polecatList'];
  get convoys(): GasTownCLI['convoyList'];
  get mail(): GasTownCLI['mailInbox'];

  // Orchestration
  async slingIssue(issueId: string, rig: string): Promise<void>;
  async createConvoy(title: string, issues: string[]): Promise<Convoy>;
}
```

### Dashboard State Management

```typescript
// src/lib/stores/gastown.svelte.ts
class GasTownStore {
  status = $state<GasTownStatus | null>(null);
  rigs = $state<Rig[]>([]);
  polecats = $state<Polecat[]>([]);
  convoys = $state<Convoy[]>([]);
  mail = $state<MailInbox | null>(null);

  get isAvailable() {
    return this.status?.installed ?? false;
  }

  get activePolecats() {
    return this.polecats.filter(p => p.status === 'working');
  }

  get unreadMailCount() {
    return this.mail?.unread_count ?? 0;
  }
}

export const gasTownStore = new GasTownStore();
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/gastown/status` | GET | Gas-Town status |
| `/api/gastown/rigs` | GET | List rigs |
| `/api/gastown/rigs/[name]` | GET | Rig details |
| `/api/gastown/rigs/[name]/start` | POST | Start rig |
| `/api/gastown/rigs/[name]/stop` | POST | Stop rig |
| `/api/gastown/polecats` | GET | List polecats |
| `/api/gastown/polecats/[name]` | GET | Polecat details |
| `/api/gastown/convoys` | GET | List convoys |
| `/api/gastown/convoys` | POST | Create convoy |
| `/api/gastown/convoys/[id]` | GET | Convoy details |
| `/api/gastown/mail` | GET | Mail inbox |
| `/api/gastown/mail` | POST | Send mail |
| `/api/gastown/mail/[id]` | GET | Read mail |
| `/api/gastown/sling` | POST | Sling issue to rig |
| `/api/sql` | POST | Execute SQL query |

### WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `gastown:status` | Server → Client | `{ status }` |
| `gastown:rig:updated` | Server → Client | `{ rig }` |
| `gastown:polecat:updated` | Server → Client | `{ polecat }` |
| `gastown:convoy:updated` | Server → Client | `{ convoy }` |
| `gastown:mail:new` | Server → Client | `{ message }` |

### WebSocket Subscription Model

Clients subscribe to specific event categories to reduce noise and bandwidth.

**Subscription Protocol:**

```typescript
// Client → Server: Subscribe to events
interface SubscribeMessage {
  type: 'subscribe';
  channels: SubscriptionChannel[];
}

type SubscriptionChannel =
  | 'gastown:status'           // Global Gas-Town status
  | 'gastown:rigs'             // All rig updates
  | `gastown:rig:${string}`    // Specific rig by name
  | 'gastown:polecats'         // All polecat updates
  | `gastown:polecat:${string}` // Specific polecat
  | 'gastown:convoys'          // All convoy updates
  | `gastown:convoy:${string}` // Specific convoy
  | 'gastown:mail';            // Mail notifications

// Server → Client: Subscription confirmation
interface SubscribeAck {
  type: 'subscribed';
  channels: SubscriptionChannel[];
}
```

**Client Usage:**

```typescript
// Subscribe to relevant channels on connect
ws.send(JSON.stringify({
  type: 'subscribe',
  channels: [
    'gastown:status',
    'gastown:rigs',
    'gastown:mail',
    `gastown:convoy:${activeConvoyId}`,  // Specific convoy being viewed
  ]
}));

// Update subscriptions when navigating
function onConvoySelected(convoyId: string) {
  ws.send(JSON.stringify({
    type: 'subscribe',
    channels: [`gastown:convoy:${convoyId}`]
  }));
}
```

**Server Routing:**

```typescript
// src/lib/websocket/gastown.ts
class GasTownWebSocketRouter {
  private subscriptions = new Map<WebSocket, Set<SubscriptionChannel>>();

  subscribe(ws: WebSocket, channels: SubscriptionChannel[]): void {
    const subs = this.subscriptions.get(ws) ?? new Set();
    channels.forEach(ch => subs.add(ch));
    this.subscriptions.set(ws, subs);
  }

  broadcast(channel: SubscriptionChannel, payload: unknown): void {
    for (const [ws, channels] of this.subscriptions) {
      if (this.matchesChannel(channels, channel)) {
        ws.send(JSON.stringify({ event: channel, payload }));
      }
    }
  }

  private matchesChannel(subscribed: Set<string>, event: string): boolean {
    // Direct match
    if (subscribed.has(event)) return true;
    // Wildcard match (e.g., 'gastown:rigs' matches 'gastown:rig:main')
    const wildcard = event.split(':').slice(0, 2).join(':') + 's';
    return subscribed.has(wildcard);
  }
}
```

---

## Dependencies

### From Phase 1-4
- ProcessSupervisor
- Issue Store
- Terminal Drawer
- Agent Session Manager

### External CLIs
| CLI | Commands | Purpose |
|-----|----------|---------|
| `gt` | All gt commands | Gas-Town operations |
| `bd` | Issue operations | Status updates |

### Feature Flags
| Flag | Description |
|------|-------------|
| `gastown` | Enable Gas-Town features |
| `multiProject` | Enable cross-project view |
| `sqlExplorer` | Enable SQL explorer |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| gt CLI not installed | Feature flag, graceful degradation |
| gt CLI version mismatch | Version detection, compatibility layer |
| Dolt server down | Show error, suggest restart |
| Mail system overhead | Lazy loading, polling interval |

---

## Testing Strategy

### Unit Tests
- Gas-Town detection logic
- CLI command parsing
- Store state management

### Integration Tests
- gt CLI command execution
- Mail send/receive
- Convoy creation

### E2E Tests
- Dashboard loads with data
- Start/stop rig
- Create and track convoy
- Send and read mail
- Execute SQL query

---

## Deliverables Checklist

| Component | Priority | Complexity | Effort | Status |
|-----------|----------|------------|--------|--------|
| Gas-Town Detection | Must-Have | 2 | 1.5 days | Pending |
| gt CLI Integration | Must-Have | 3 | 3 days | Pending |
| Agent Monitoring Dashboard | Must-Have | 3 | 3 days | Pending |
| Convoy Tracking | Must-Have | 3 | 2.5 days | Pending |
| Mail System Integration | Should-Have | 3 | 2.5 days | Pending |
| Knowledge Panel | Should-Have | 3 | 2 days | Pending |
| SQL Explorer | Should-Have | 4 | 3 days | Pending |
| Project Tags | Should-Have | 2 | 1.5 days | Pending |
| Scene/Wave Orchestration | Post-MVP | 4 | - | Deferred |
| Multi-rig Support | Post-MVP | 4 | - | Deferred |
| Merge Queue Visualization | Post-MVP | 3 | - | Deferred |
| Cross-Project View | Post-MVP | 4 | - | Deferred |

**Total Effort**: ~19 days (fits in 4-week timeline with buffer)
- Must-Have: ~10 days
- Should-Have: ~9 days
- Post-MVP (deferred): ~12 days

---

## Time Estimates

| Week | Focus | Deliverables | Days |
|------|-------|--------------|------|
| 1 | Foundation | Detection (1.5d), gt CLI (3d) | 4.5 |
| 2 | Dashboard | Agent dashboard (3d), convoy tracking (2.5d) | 5.5 |
| 3 | Communication | Mail system (2.5d), knowledge panel (2d) | 4.5 |
| 4 | Polish | SQL explorer (3d), tags (1.5d), buffer (0.5d) | 5 |

**Post-MVP Features** (estimated ~12 days, to be scheduled after initial release):
- Scene/Wave Orchestration (4 days) - requires backend clarification
- Multi-rig Support (3 days)
- Merge Queue Visualization (2 days)
- Cross-Project View (3 days)

---

## Accessibility Requirements

All Gas-Town components must meet WCAG 2.1 AA standards:

| Requirement | Implementation |
|-------------|----------------|
| Screen reader support | Dashboard items labeled, status announced |
| Keyboard navigation | All interactive elements focusable |
| Focus management | Focus returns correctly after actions |
| Color independence | Status conveyed by icon + text, not color alone |

### Component-Specific A11y

| Component | Requirements |
|-----------|--------------|
| Agent Dashboard | `role="grid"`, status announced on change |
| Rig/Polecat Cards | `role="article"`, action buttons labeled |
| Convoy List | `role="list"`, progress announced |
| Mail Inbox | `role="list"`, unread status announced |
| SQL Explorer | Query editor accessible, results in table with headers |

---

## Rollback Strategy

### Feature Flags

```bash
# Disable features if issues arise
DISABLE_GASTOWN=true           # Hide all Gas-Town features
DISABLE_MAIL=true              # Disable mail integration
DISABLE_CONVOYS=true           # Disable convoy tracking
DISABLE_SQL_EXPLORER=true      # Disable SQL explorer
```

### Component Rollback

| Component | Rollback Procedure |
|-----------|-------------------|
| Gas-Town Detection | Disable feature, show "not available" |
| Agent Dashboard | Direct users to `gt status` CLI |
| Convoy Tracking | Direct users to `gt convoy list` CLI |
| Mail System | Direct users to `gt mail` CLI |
| SQL Explorer | Direct users to `bd sql` CLI |

### Version Compatibility

```bash
# If gt CLI version mismatch
GT_COMPAT_MODE=0.4             # Use older API format
```

---

## Test Coverage Targets

| Area | Target | Measurement |
|------|--------|-------------|
| Gas-Town Detection | > 85% | Critical detection logic |
| gt CLI Integration | > 80% | Command parsing and execution |
| Dashboard Components | > 70% | Component tests |
| API Endpoints | > 75% | Integration tests |
| Overall Phase 5 | > 70% | Vitest coverage report |

---

## Exit Criteria

- [ ] Gas-Town detected and status displayed
- [ ] Agent dashboard shows all rigs/polecats
- [ ] Can sling issues to rigs from UI
- [ ] Convoy tracking functional
- [ ] Mail inbox accessible
- [ ] SQL explorer works for SELECT queries
- [ ] All "Must-Have" features complete
- [ ] Feature-flagged for non-Gas-Town users
- [ ] Accessibility audit passes (0 critical violations)
- [ ] Unit test coverage > 70%

---

## Project Completion Criteria

Phase 5 is the final phase. Upon completion, verify full project readiness:

### All Phases Complete
- [ ] Phase 0: Development environment setup verified
- [ ] Phase 1: MVP Core (issue management, Kanban, real-time sync)
- [ ] Phase 2: Analytics & Timeline (metrics, charts, Gantt)
- [ ] Phase 3: Git Integration (worktrees, PRs, dependencies)
- [ ] Phase 4: Agent Orchestration (terminal, sessions, verification)
- [ ] Phase 5: Gas-Town Integration (multi-agent orchestration)

### Quality Gates
- [ ] Overall test coverage > 70%
- [ ] No critical security vulnerabilities
- [ ] WCAG 2.1 AA accessibility compliance
- [ ] Performance benchmarks met
- [ ] Documentation complete

### Deployment Readiness
- [ ] Docker container builds successfully
- [ ] CI/CD pipeline green
- [ ] Feature flags documented
- [ ] Rollback procedures tested
- [ ] User documentation written

---

## References

- [Gas-Town WebUIs](../references/gastown-webuis.md)
- [gastown_ui Reference](../references/gastown_ui/README.md)
- [gastown-frontend Reference](../references/gastown-frontend/README.md)
- [Glossary: Gas-Town Terms](../glossary.md#gas-town-system)
- [CLI Integration](../spec/cli-integration.md#gt-cli-commands)
