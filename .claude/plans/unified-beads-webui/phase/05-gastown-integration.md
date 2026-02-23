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

## Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| Gas-Town detection | Detects gt CLI and town status |
| Agent dashboard | Shows all rigs and polecats |
| Convoy tracking | Displays convoy progress |
| Mail system | Shows inbox with < 2s latency |
| SQL explorer | Executes queries in < 500ms |

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

| Component | Priority | Status |
|-----------|----------|--------|
| Gas-Town Detection | Must-Have | Pending |
| gt CLI Integration | Must-Have | Pending |
| Agent Monitoring Dashboard | Must-Have | Pending |
| Convoy Tracking | Must-Have | Pending |
| Mail System Integration | Should-Have | Pending |
| Scene/Wave Orchestration | Should-Have | Pending |
| Knowledge Panel | Should-Have | Pending |
| SQL Explorer | Should-Have | Pending |
| Multi-rig Support | Should-Have | Pending |
| Merge Queue Visualization | Should-Have | Pending |
| Project Tags | Should-Have | Pending |
| Cross-Project View | Should-Have | Pending |

---

## Time Estimates

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1 | Foundation | Gas-Town detection, gt CLI integration |
| 2 | Dashboard | Rig/polecat dashboard, sling UI |
| 3 | Convoys & Mail | Convoy tracking, mail system |
| 4 | Advanced | SQL explorer, orchestration, polish |

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

---

## References

- [Gas-Town WebUIs](../references/gastown-webuis.md)
- [gastown_ui Reference](../references/gastown_ui/README.md)
- [gastown-frontend Reference](../references/gastown-frontend/README.md)
- [Glossary: Gas-Town Terms](../glossary.md#gas-town-system)
- [CLI Integration](../spec/cli-integration.md#gt-cli-commands)
