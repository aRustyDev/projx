# Phase 4: Agent Orchestration

**Duration**: 4 weeks
**Theme**: Agent session management and verification workflows

## Objectives

1. Implement terminal drawer with xterm.js
2. Build agent session launch and monitoring
3. Create verification queue for agent outputs
4. Add approve/reject/retry workflows
5. Integrate Claude planning capabilities

---

## Success Criteria

| Criterion | Measurement |
|-----------|-------------|
| Terminal rendering | Renders 1000 lines without lag |
| Session launch | Agent starts within 5s |
| Output streaming | < 100ms latency to display |
| Verification queue | Lists pending items correctly |
| Approve/reject | Action completes within 2s |

---

## Features

### 4.1 Terminal Drawer

**Priority**: Must-Have | **Complexity**: 4 | **Source**: foolery

Embedded terminal using xterm.js for agent output.

```typescript
// src/lib/terminal/drawer.ts
interface TerminalDrawer {
  terminal: Terminal;
  fitAddon: FitAddon;
  webLinksAddon: WebLinksAddon;

  write(data: string): void;
  clear(): void;
  resize(): void;
  focus(): void;
}
```

**Deliverables**:
- [ ] `TerminalDrawer.svelte` component
- [ ] xterm.js integration
- [ ] Auto-fit to container (FitAddon)
- [ ] Clickable links (WebLinksAddon)
- [ ] Searchable output (SearchAddon)
- [ ] Copy/paste support
- [ ] Keyboard shortcut to toggle (`)

**Acceptance Criteria**:
- Terminal renders in bottom drawer
- Resizable drawer height
- Output scrolls automatically
- Can copy text from terminal
- Links are clickable

---

### 4.2 Agent Session Launch

**Priority**: Must-Have | **Complexity**: 3 | **Source**: foolery

Start agent sessions (Claude Code) on issues.

```typescript
// src/lib/agents/session.ts
interface AgentSession {
  id: string;
  issueId: string;
  status: 'starting' | 'running' | 'paused' | 'completed' | 'failed';
  startedAt: Date;
  pid: number | null;
  worktree: string | null;
  output: string[];
}

interface LaunchOptions {
  issueId: string;
  worktree?: string;
  prompt?: string;
  autoApprove?: boolean;
}
```

**Deliverables**:
- [ ] `LaunchAgentModal.svelte` component
- [ ] Session manager service
- [ ] Launch via `claude` CLI or API
- [ ] Worktree selection
- [ ] Custom prompt input
- [ ] Session state tracking

**Acceptance Criteria**:
- Can launch agent on any issue
- Session appears in terminal drawer
- Status updates in real-time
- Can specify working directory

---

### 4.3 Session Output Streaming

**Priority**: Must-Have | **Complexity**: 3 | **Source**: foolery

Stream agent output to terminal in real-time.

**Deliverables**:
- [ ] PTY integration for live output
- [ ] ANSI color support
- [ ] Output buffering for performance
- [ ] Scroll-to-bottom behavior
- [ ] Pause/resume scrolling

**Acceptance Criteria**:
- Output appears < 100ms after generation
- Colors render correctly
- Large outputs don't freeze UI
- Can scroll back while running

---

### 4.4 Agent History View

**Priority**: Should-Have | **Complexity**: 2 | **Source**: foolery

View past agent sessions and their outputs.

**Deliverables**:
- [ ] `AgentHistory.svelte` component
- [ ] Session list with filters
- [ ] View past session output
- [ ] Session metadata (duration, outcome)
- [ ] Link to issue

**Acceptance Criteria**:
- Lists sessions by date
- Filter by status/issue
- View full output of past session
- Shows session duration

---

### 4.5 Verification Queue

**Priority**: Must-Have | **Complexity**: 3 | **Source**: foolery

Queue of agent outputs awaiting human verification.

```typescript
// src/lib/verification/queue.ts
interface VerificationItem {
  id: string;
  sessionId: string;
  issueId: string;
  type: 'code' | 'commit' | 'pr' | 'test';
  status: 'pending' | 'approved' | 'rejected' | 'retake';
  createdAt: Date;
  diff?: string;
  summary?: string;
}
```

**Deliverables**:
- [ ] `VerificationQueue.svelte` component
- [ ] `VerificationItem.svelte` component
- [ ] Queue badge showing pending count
- [ ] Filter by type/status
- [ ] Sort by age

**Acceptance Criteria**:
- Shows all pending verifications
- Badge in header with count
- Can filter by type
- Items link to session

---

### 4.6 Approve/Reject Workflow

**Priority**: Must-Have | **Complexity**: 2 | **Source**: foolery

Actions to approve or reject agent work.

**Deliverables**:
- [ ] Approve button with confirmation
- [ ] Reject button with reason input
- [ ] Diff viewer for code changes
- [ ] Commit message preview
- [ ] Quick approve keyboard shortcut

**Acceptance Criteria**:
- Approve commits/pushes changes
- Reject reverts changes
- Reason captured for analytics
- Updates issue status

---

### 4.7 ReTake (Retry) Workflow

**Priority**: Should-Have | **Complexity**: 3 | **Source**: foolery

Retry failed or rejected agent work.

**Deliverables**:
- [ ] ReTake button on rejected items
- [ ] Modified prompt input
- [ ] Preserve context option
- [ ] New session creation
- [ ] Link old and new sessions

**Acceptance Criteria**:
- Can retry with modified instructions
- Original context preserved
- New session tracks retry count
- Links to original session

---

### 4.8 Claude Planning Integration

**Priority**: Should-Have | **Complexity**: 4 | **Source**: foolery

Integrate with Claude's planning capabilities.

**Deliverables**:
- [ ] Plan viewer component
- [ ] Plan step visualization
- [ ] Step status tracking
- [ ] Manual step override
- [ ] Plan modification

**Acceptance Criteria**:
- Shows plan steps
- Steps update as completed
- Can skip/modify steps
- Saves plan modifications

---

### 4.9 Session Persistence/Resumption

**Priority**: Should-Have | **Complexity**: 4 | **Source**: foolery

Persist and resume agent sessions across restarts.

**Deliverables**:
- [ ] Session state serialization
- [ ] Resume button for paused sessions
- [ ] Context restoration
- [ ] Output history retrieval

**Acceptance Criteria**:
- Sessions survive page refresh
- Can resume paused sessions
- Output history restored
- Context maintained

---

### 4.10 Agent Config UI

**Priority**: Should-Have | **Complexity**: 3 | **Source**: Beads-Kanban-UI

Configure agent behavior and defaults.

**Deliverables**:
- [ ] `AgentConfig.svelte` component
- [ ] Default prompts per issue type
- [ ] Auto-approve rules
- [ ] Timeout settings
- [ ] Worktree preferences

**Acceptance Criteria**:
- Settings persist in local storage
- Per-project configuration
- Default prompt templates
- Timeout configurable

---

### 4.11 Interaction History

**Priority**: Should-Have | **Complexity**: 2 | **Source**: foolery

View history of human-agent interactions.

**Deliverables**:
- [ ] Interaction log viewer
- [ ] Filter by session/issue
- [ ] Approval/rejection history
- [ ] Analytics on approval rate

**Acceptance Criteria**:
- Shows all interactions
- Filterable by date/type
- Shows approval statistics

---

## Technical Architecture

### Agent Session Manager

```typescript
// src/lib/agents/manager.ts
class AgentSessionManager {
  private sessions = new Map<string, AgentSession>();
  private supervisor: ProcessSupervisor;

  async launch(options: LaunchOptions): Promise<AgentSession>;
  async pause(sessionId: string): Promise<void>;
  async resume(sessionId: string): Promise<void>;
  async terminate(sessionId: string): Promise<void>;

  getSession(id: string): AgentSession | undefined;
  getSessionsForIssue(issueId: string): AgentSession[];

  on(event: 'output' | 'status', handler: EventHandler): void;
}
```

### Terminal Integration

```typescript
// src/lib/terminal/integration.ts
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { SearchAddon } from 'xterm-addon-search';

function createTerminal(container: HTMLElement): TerminalInstance;
```

### Verification Service

```typescript
// src/lib/verification/service.ts
class VerificationService {
  async getPending(): Promise<VerificationItem[]>;
  async approve(id: string): Promise<void>;
  async reject(id: string, reason: string): Promise<void>;
  async retake(id: string, modifiedPrompt: string): Promise<AgentSession>;
}
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agents/sessions` | GET | List sessions |
| `/api/agents/sessions` | POST | Launch session |
| `/api/agents/sessions/[id]` | GET | Get session details |
| `/api/agents/sessions/[id]/output` | GET | Get session output |
| `/api/agents/sessions/[id]/pause` | POST | Pause session |
| `/api/agents/sessions/[id]/resume` | POST | Resume session |
| `/api/agents/sessions/[id]/terminate` | POST | Terminate session |
| `/api/verification` | GET | List pending verifications |
| `/api/verification/[id]/approve` | POST | Approve item |
| `/api/verification/[id]/reject` | POST | Reject item |

### WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| `session:output` | Server → Client | `{ sessionId, data }` |
| `session:status` | Server → Client | `{ sessionId, status }` |
| `verification:new` | Server → Client | `{ item }` |
| `verification:updated` | Server → Client | `{ item }` |

---

## Dependencies

### From Phase 1-3
- ProcessSupervisor
- Issue Store
- Terminal concepts from Phase 1

### External CLIs
| CLI | Commands | Purpose |
|-----|----------|---------|
| `claude` | Session management | Claude Code CLI |
| `bd` | Issue updates | Status changes on verify |

### New Libraries
| Library | Purpose |
|---------|---------|
| `xterm` | Terminal emulator |
| `xterm-addon-fit` | Auto-sizing |
| `xterm-addon-web-links` | Clickable links |
| `xterm-addon-search` | Output search |
| `node-pty` | PTY support |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Claude CLI not available | Feature flag, graceful degradation |
| PTY not supported | Fallback to non-interactive mode |
| Session state loss | Periodic state persistence |
| Large output buffers | Circular buffer, pagination |

---

## Testing Strategy

### Unit Tests
- Session state transitions
- Verification queue operations
- Output buffering logic

### Integration Tests
- Session launch via CLI
- Output streaming
- Verification workflow

### E2E Tests
- Launch agent on issue
- View output in terminal
- Approve/reject workflow
- Retry with modified prompt

---

## Deliverables Checklist

| Component | Priority | Status |
|-----------|----------|--------|
| Terminal Drawer | Must-Have | Pending |
| Agent Session Launch | Must-Have | Pending |
| Session Output Streaming | Must-Have | Pending |
| Agent History View | Should-Have | Pending |
| Verification Queue | Must-Have | Pending |
| Approve/Reject Workflow | Must-Have | Pending |
| ReTake Workflow | Should-Have | Pending |
| Claude Planning Integration | Should-Have | Pending |
| Session Persistence | Should-Have | Pending |
| Agent Config UI | Should-Have | Pending |
| Interaction History | Should-Have | Pending |

---

## Time Estimates

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1 | Terminal | Terminal drawer, xterm.js, basic output |
| 2 | Sessions | Session launch, output streaming, status |
| 3 | Verification | Verification queue, approve/reject, diff view |
| 4 | Polish | History, retry, planning integration, config |

---

## Exit Criteria

- [ ] Terminal drawer opens and renders output
- [ ] Can launch agent session on any issue
- [ ] Output streams in real-time
- [ ] Verification queue shows pending items
- [ ] Can approve or reject agent work
- [ ] Rejected work can be retried
- [ ] Session history viewable
- [ ] All "Must-Have" features complete

---

## References

- [Terminal Spec](../spec/terminal.md)
- [foolery Reference](../references/foolery/README.md)
- [xterm.js Documentation](https://xtermjs.org/)
- [Claude Code CLI](https://claude.ai/claude-code)
