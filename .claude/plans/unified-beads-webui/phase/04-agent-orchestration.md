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

## Phase 3 Entry Gate

Before starting Phase 4, verify Phase 3 completion:

- [ ] All Phase 3 Must-Have features complete
- [ ] Worktree listing and status working
- [ ] PR integration functional (list, create, merge)
- [ ] CI status badges displaying
- [ ] Dependency graph rendering
- [ ] `gh` CLI authentication documented
- [ ] Unit test coverage > 70%

---

## Success Criteria

| Criterion | Measurement | Verification |
|-----------|-------------|--------------|
| Terminal rendering | Renders 1000 lines without lag | Performance benchmark |
| Session launch | Agent starts within 5s | E2E timing test |
| Output streaming | < 100ms latency to display | WebSocket timing test |
| Verification queue | Lists pending items correctly | Integration test |
| Approve/reject | Action completes within 2s | E2E timing test |
| Security | No command injection, sandboxed execution | Security audit |
| Accessibility | WCAG 2.1 AA compliant | axe-core audit |
| Test coverage | > 70% for agent orchestration | Vitest coverage |

---

## Security Model

See [Terminal Spec Security Section](../spec/terminal.md#security-model) for detailed security requirements:

- PTY process sandboxing
- Command injection prevention
- Output sanitization
- Session isolation
- Rate limiting on session creation

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

### Session Model: Single Focused Session

The WebUI uses a **single focused session** model (like VSCode) rather than multi-session:

- Only one active agent session at a time
- Starting a new session prompts to terminate the current one
- Session history preserved for review
- Simpler UX and resource management

```typescript
// src/lib/agents/manager.ts
class AgentSessionManager {
  private activeSession: AgentSession | null = null;
  private sessionHistory: AgentSession[] = [];
  private supervisor: ProcessSupervisor;

  get current(): AgentSession | null {
    return this.activeSession;
  }

  async launch(options: LaunchOptions): Promise<AgentSession> {
    if (this.activeSession) {
      throw new Error('Session already active. Terminate first.');
    }
    // ... launch logic
  }

  async terminate(): Promise<void>;
  getHistory(): AgentSession[];
  on(event: 'output' | 'status', handler: EventHandler): void;
}
```

### Claude CLI Integration

**CLI**: [Claude Code CLI](https://docs.anthropic.com/en/docs/claude-code)

**Installation Check:**
```typescript
async function checkClaudeInstalled(): Promise<ClaudeStatus> {
  try {
    const result = await supervisor.execute('claude', ['--version']);
    return { installed: true, version: parseVersion(result.stdout) };
  } catch {
    return { installed: false, version: null };
  }
}
```

**Command Syntax:**

| Command | Purpose | Example |
|---------|---------|---------|
| `claude` | Interactive session (default) | `claude` |
| `claude -p "<prompt>"` | Non-interactive with prompt | `claude -p "Fix the bug in auth.ts"` |
| `claude --continue` | Resume last conversation | `claude --continue` |
| `claude --output-format json` | JSON output for parsing | `claude --output-format json -p "..."` |
| `claude --allowedTools` | Restrict available tools | `claude --allowedTools "Read,Grep,Glob"` |
| `claude --model` | Specify model | `claude --model claude-sonnet-4-20250514` |

**Launching Agent Session:**

```typescript
interface ClaudeLaunchOptions {
  prompt: string;
  workingDirectory: string;
  allowedTools?: string[];
  model?: string;
  timeout?: number;
}

async function launchClaudeSession(options: ClaudeLaunchOptions): Promise<AgentSession> {
  const args = ['-p', options.prompt];

  if (options.allowedTools) {
    args.push('--allowedTools', options.allowedTools.join(','));
  }
  if (options.model) {
    args.push('--model', options.model);
  }

  // Launch via PTY for interactive output
  const pty = spawn('claude', args, {
    cwd: options.workingDirectory,
    env: { ...process.env, CLAUDE_CODE_ENTRYPOINT: 'webui' },
  });

  return new AgentSession(pty, options);
}
```

**Parsing Output:**

Claude Code outputs structured markers that can be parsed:

```typescript
// Output patterns to detect
const PATTERNS = {
  toolUse: /^⏺ Using tool: (.+)$/m,
  toolResult: /^⏺ Tool result/m,
  thinking: /^💭 /m,
  error: /^❌ Error: (.+)$/m,
  complete: /^✓ Task completed$/m,
};
```

### WebSocket Server Architecture

**Implementation**: SvelteKit server hooks + native WebSocket

```typescript
// src/hooks.server.ts
import { WebSocketServer } from 'ws';

let wss: WebSocketServer | null = null;

export async function handle({ event, resolve }) {
  // Initialize WebSocket server on first request
  if (!wss && event.platform?.server) {
    wss = new WebSocketServer({ server: event.platform.server });
    setupWebSocketHandlers(wss);
  }
  return resolve(event);
}

// Alternative: Separate WebSocket endpoint
// src/routes/ws/+server.ts
export function GET({ request }) {
  const upgrade = request.headers.get('upgrade');
  if (upgrade !== 'websocket') {
    return new Response('Expected WebSocket', { status: 426 });
  }
  // Handle upgrade...
}
```

**Connection Management:**

```typescript
// src/lib/websocket/server.ts
class WebSocketManager {
  private clients = new Set<WebSocket>();

  addClient(ws: WebSocket): void {
    this.clients.add(ws);
    ws.on('close', () => this.clients.delete(ws));
  }

  broadcast(event: string, payload: unknown): void {
    const message = JSON.stringify({ event, payload, timestamp: Date.now() });
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  // Session-specific events
  sendToSession(sessionId: string, event: string, payload: unknown): void {
    // Route to clients subscribed to this session
  }
}
```

**Client Reconnection:**

```typescript
// src/lib/websocket/client.ts
class WebSocketClient {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  connect(): void {
    this.ws = new WebSocket(`ws://${location.host}/ws`);

    this.ws.onclose = () => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        setTimeout(() => {
          this.reconnectAttempts++;
          this.connect();
        }, this.reconnectDelay * Math.pow(2, this.reconnectAttempts));
      }
    };

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
    };
  }
}
```

### Agent Session Manager

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

| Component | Priority | Complexity | Effort | Status |
|-----------|----------|------------|--------|--------|
| Terminal Drawer | Must-Have | 4 | 4 days | Pending |
| Agent Session Launch | Must-Have | 3 | 3 days | Pending |
| Session Output Streaming | Must-Have | 3 | 2 days | Pending |
| Agent History View | Should-Have | 2 | 1.5 days | Pending |
| Verification Queue | Must-Have | 3 | 2 days | Pending |
| Approve/Reject Workflow | Must-Have | 2 | 2 days | Pending |
| ReTake Workflow | Should-Have | 3 | 2 days | Pending |
| Claude Planning Integration | Should-Have | 4 | 3 days | Pending |
| Session Persistence | Should-Have | 4 | 3 days | Pending |
| Agent Config UI | Should-Have | 3 | 2 days | Pending |
| Interaction History | Should-Have | 2 | 1.5 days | Pending |

**Total Effort**: ~26 days (Must-Have: ~13 days, Should-Have: ~13 days)

---

## Time Estimates

| Week | Focus | Deliverables | Days |
|------|-------|--------------|------|
| 1 | Terminal | Terminal drawer (4d), basic output (1d) | 5 |
| 2 | Sessions | Session launch (3d), output streaming (2d) | 5 |
| 3 | Verification | Queue (2d), approve/reject (2d), history (1.5d) | 5.5 |
| 4 | Polish | Retry (2d), planning (3d) | 5 |

**Note**: Session Persistence and Agent Config may extend into buffer time.

---

## Accessibility Requirements

All terminal and agent components must meet WCAG 2.1 AA standards:

| Requirement | Implementation |
|-------------|----------------|
| Screen reader support | Terminal output announced, queue items labeled |
| Keyboard navigation | All interactive elements focusable |
| Focus management | Focus returns correctly after modal actions |
| Color independence | Status conveyed by icon + text, not color alone |

### Component-Specific A11y

| Component | Requirements |
|-----------|--------------|
| Terminal Drawer | `role="log"`, aria-live for updates, keyboard close |
| Verification Queue | `role="list"`, item status announced |
| Approve/Reject | Clear button labels, confirmation dialogs accessible |
| Session List | `role="list"`, status announced on change |
| Diff Viewer | Line-by-line navigation, change type announced |

---

## Rollback Strategy

### Feature Flags

```bash
# Disable features if issues arise
DISABLE_TERMINAL=true          # Hide terminal drawer
DISABLE_AGENTS=true            # Disable agent launch
DISABLE_VERIFICATION=true      # Auto-approve all (dangerous)
DISABLE_PTY=true               # Fall back to non-interactive output
```

### Component Rollback

| Component | Rollback Procedure |
|-----------|-------------------|
| Terminal Drawer | Show output in plain text div |
| Agent Sessions | Direct users to `claude` CLI |
| Verification | Auto-approve or manual CLI verification |
| PTY | Fall back to spawn with piped stdout |

### Session Recovery

```bash
# If sessions are corrupted
rm -rf .beads/agent-sessions/  # Clear session state
bd sync --force                # Re-sync issue states
```

---

## Test Coverage Targets

| Area | Target | Measurement |
|------|--------|-------------|
| Session Manager | > 85% | Critical path - session lifecycle |
| Verification Service | > 80% | Approve/reject/retry flows |
| Terminal Integration | > 70% | xterm.js wrapper tests |
| API Endpoints | > 75% | Integration tests |
| Overall Phase 4 | > 70% | Vitest coverage report |

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
- [ ] Security audit passes (no command injection)
- [ ] Accessibility audit passes (0 critical violations)
- [ ] Unit test coverage > 70%

---

## Phase 5 Handoff

Before proceeding to Phase 5, provide:

- [ ] Agent session manager documented and tested
- [ ] Terminal integration stable
- [ ] Verification workflows documented
- [ ] Security model implemented and audited
- [ ] PTY fallback working
- [ ] All Must-Have features deployed

---

## References

- [Terminal Spec](../spec/terminal.md)
- [foolery Reference](../references/foolery/README.md)
- [xterm.js Documentation](https://xtermjs.org/)
- [Claude Code CLI](https://claude.ai/claude-code)
