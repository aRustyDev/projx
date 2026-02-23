# API Contract Definition

This document defines the internal API between the Unified Beads WebUI frontend and backend.

## Overview

The API follows REST conventions with JSON payloads. All endpoints are prefixed with `/api/`.

- **Reads**: Served directly from database (SQLite/Dolt)
- **Writes**: Executed via CLI commands through ProcessSupervisor
- **Real-time**: WebSocket for push notifications

---

## Base URL and Versioning

```
Base URL: /api
No version prefix (internal API, single deployment)
```

## Content Types

```
Request:  application/json
Response: application/json
```

---

## Authentication Model

### Local Mode (Default)

No authentication required. Server binds to `127.0.0.1` only.

```typescript
// Server configuration
const server = {
  host: '127.0.0.1',  // Local only
  port: 3000
};
```

### Network Mode (Optional)

When `--network` flag is used, basic session authentication is required.

```typescript
// Session cookie
Set-Cookie: ubw_session=<token>; HttpOnly; SameSite=Strict; Path=/

// Session validation
interface Session {
  id: string;
  created_at: string;
  expires_at: string;
  user: string;
}
```

### Authorization

All users have full access to all operations (single-user tool). No role-based access control.

---

## Error Response Format

All errors follow a consistent format:

```typescript
interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
    request_id?: string;
  };
}

type ErrorCode =
  | 'VALIDATION_ERROR'      // 400 - Invalid input
  | 'NOT_FOUND'             // 404 - Resource doesn't exist
  | 'CONFLICT'              // 409 - Concurrent modification
  | 'CLI_ERROR'             // 500 - bd/gt command failed
  | 'DATABASE_ERROR'        // 500 - Query failed
  | 'TIMEOUT'               // 504 - Operation timed out
  | 'SERVICE_UNAVAILABLE';  // 503 - Circuit breaker open
```

### Example Error Response

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Issue not found",
    "details": {
      "id": "bd-xyz123"
    },
    "request_id": "req_abc123"
  }
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PATCH |
| 201 | Created | Successful POST (create) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Concurrent modification |
| 500 | Internal Server Error | CLI or database error |
| 503 | Service Unavailable | Circuit breaker open |
| 504 | Gateway Timeout | Operation timed out |

---

## TypeScript Types

### Core Types

```typescript
// Issue status values
type IssueStatus = 'open' | 'in_progress' | 'blocked' | 'deferred' | 'closed';

// Issue type values
type IssueType = 'bug' | 'feature' | 'task' | 'epic' | 'chore' | 'decision' | 'molecule' | 'gate';

// Priority values (0 = highest)
type Priority = 0 | 1 | 2 | 3 | 4;

// Dependency types
type DependencyType = 'blocks' | 'blocked_by' | 'relates_to' | 'discovered_from' | 'waits_for';

// Agent states
type AgentState = 'idle' | 'working' | 'stalled' | 'zombie' | 'nuked';
```

### Issue Type

```typescript
interface Issue {
  id: string;
  title: string;
  description: string | null;
  status: IssueStatus;
  priority: Priority;
  issue_type: IssueType;
  assignee: string | null;
  owner: string | null;
  labels: string[];

  // Dates
  created_at: string;        // ISO 8601
  updated_at: string;        // ISO 8601
  closed_at: string | null;  // ISO 8601
  due_at: string | null;     // ISO 8601
  defer_until: string | null; // ISO 8601

  // Hierarchy
  parent_id: string | null;
  children_count: number;

  // Dependencies
  blocks: string[];          // Issue IDs this blocks
  blocked_by: string[];      // Issue IDs blocking this

  // Extended fields
  notes: string | null;
  design: string | null;
  acceptance_criteria: string | null;
  estimated_minutes: number | null;
  external_ref: string | null;
  spec_id: string | null;
  close_reason: string | null;

  // Agent fields (if applicable)
  agent_state: AgentState | null;
  rig: string | null;
  last_activity: string | null;

  // Metadata
  metadata: Record<string, unknown>;
  ephemeral: boolean;
  pinned: boolean;
}
```

### Pagination

```typescript
interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    has_more: boolean;
  };
}
```

---

## Issues API

### List Issues

```
GET /api/issues
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | - | Filter by status (comma-separated) |
| `type` | string | - | Filter by type (comma-separated) |
| `priority` | string | - | Filter by priority (comma-separated) |
| `assignee` | string | - | Filter by assignee |
| `label` | string | - | Filter by label (comma-separated, AND logic) |
| `label_any` | string | - | Filter by label (comma-separated, OR logic) |
| `parent` | string | - | Filter by parent ID |
| `search` | string | - | Full-text search in title/description |
| `ready` | boolean | false | Show only ready issues |
| `overdue` | boolean | false | Show only overdue issues |
| `sort` | string | 'priority' | Sort field |
| `order` | string | 'asc' | Sort order (asc/desc) |
| `limit` | number | 50 | Results per page (max 1000) |
| `offset` | number | 0 | Pagination offset |

**Response:**

```typescript
type ListIssuesResponse = PaginatedResponse<Issue>;
```

**Example Request:**

```http
GET /api/issues?status=open,in_progress&priority=0,1&limit=20
```

**Example Response:**

```json
{
  "data": [
    {
      "id": "bd-abc123",
      "title": "Implement authentication",
      "status": "in_progress",
      "priority": 1,
      "issue_type": "feature",
      "assignee": "alice",
      "labels": ["auth", "security"],
      "created_at": "2026-02-20T10:00:00Z",
      "updated_at": "2026-02-22T14:30:00Z",
      "blocks": ["bd-def456"],
      "blocked_by": [],
      ...
    }
  ],
  "pagination": {
    "total": 42,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

---

### Get Issue

```
GET /api/issues/:id
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Issue ID (e.g., bd-abc123) |

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `include` | string | - | Related data to include (comments,events,children) |

**Response:**

```typescript
interface GetIssueResponse extends Issue {
  comments?: Comment[];
  events?: Event[];
  children?: Issue[];
}

interface Comment {
  id: number;
  issue_id: string;
  author: string;
  body: string;
  created_at: string;
}

interface Event {
  id: number;
  issue_id: string;
  event_type: string;
  actor: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}
```

**Example Request:**

```http
GET /api/issues/bd-abc123?include=comments,events
```

---

### Create Issue

```
POST /api/issues
```

**Request Body:**

```typescript
interface CreateIssueRequest {
  title: string;                    // Required
  type?: IssueType;                 // Default: 'task'
  priority?: Priority;              // Default: 2
  description?: string;
  assignee?: string;
  labels?: string[];
  parent?: string;                  // Parent issue ID
  dependencies?: {
    type: DependencyType;
    id: string;
  }[];
  due?: string;                     // ISO date or relative (+7d, tomorrow)
  defer?: string;                   // ISO date or relative
  ephemeral?: boolean;              // Create as wisp
}
```

**Response:**

```typescript
interface CreateIssueResponse {
  id: string;
  issue: Issue;
}
```

**Example Request:**

```json
{
  "title": "Add user profile page",
  "type": "feature",
  "priority": 2,
  "description": "Create a user profile page with avatar and settings",
  "labels": ["frontend", "user-facing"],
  "parent": "bd-epic123"
}
```

**Example Response:**

```json
{
  "id": "bd-xyz789",
  "issue": {
    "id": "bd-xyz789",
    "title": "Add user profile page",
    "status": "open",
    ...
  }
}
```

---

### Update Issue

```
PATCH /api/issues/:id
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Issue ID |

**Request Body:**

```typescript
interface UpdateIssueRequest {
  title?: string;
  status?: IssueStatus;
  priority?: Priority;
  description?: string;
  assignee?: string | null;         // null to unassign
  add_labels?: string[];
  remove_labels?: string[];
  set_labels?: string[];            // Replace all labels
  parent?: string | null;           // null to remove parent
  due?: string | null;              // null to clear
  defer?: string | null;            // null to clear
  notes?: string;
  claim?: boolean;                  // Atomic claim (assignee + in_progress)
}
```

**Response:**

```typescript
interface UpdateIssueResponse {
  issue: Issue;
}
```

**Example Request:**

```json
{
  "status": "in_progress",
  "assignee": "bob",
  "add_labels": ["reviewed"]
}
```

---

### Close Issue

```
POST /api/issues/:id/close
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Issue ID |

**Request Body:**

```typescript
interface CloseIssueRequest {
  reason?: string;
  suggest_next?: boolean;           // Return newly unblocked issues
}
```

**Response:**

```typescript
interface CloseIssueResponse {
  issue: Issue;
  unblocked?: Issue[];              // If suggest_next=true
}
```

---

### Reopen Issue

```
POST /api/issues/:id/reopen
```

**Response:**

```typescript
interface ReopenIssueResponse {
  issue: Issue;
}
```

---

### Batch Update Issues

```
PATCH /api/issues
```

**Request Body:**

```typescript
interface BatchUpdateRequest {
  ids: string[];
  updates: {
    status?: IssueStatus;
    priority?: Priority;
    assignee?: string | null;
    add_labels?: string[];
    remove_labels?: string[];
  };
}
```

**Response:**

```typescript
interface BatchUpdateResponse {
  updated: number;
  issues: Issue[];
}
```

---

## Dependencies API

### List Dependencies

```
GET /api/issues/:id/dependencies
```

**Response:**

```typescript
interface DependenciesResponse {
  blocks: Dependency[];
  blocked_by: Dependency[];
  relates_to: Dependency[];
}

interface Dependency {
  id: string;
  type: DependencyType;
  issue: Issue;                     // The related issue
  created_at: string;
}
```

---

### Add Dependency

```
POST /api/issues/:id/dependencies
```

**Request Body:**

```typescript
interface AddDependencyRequest {
  type: DependencyType;
  target_id: string;
}
```

---

### Remove Dependency

```
DELETE /api/issues/:id/dependencies/:target_id
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Dependency type (required) |

---

### Dependency Tree

```
GET /api/issues/:id/tree
```

**Response:**

```typescript
interface DependencyTreeResponse {
  root: TreeNode;
}

interface TreeNode {
  issue: Issue;
  children: TreeNode[];
  depth: number;
}
```

---

## Metrics API

### Cumulative Flow Diagram

```
GET /api/metrics/cfd
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | number | 30 | Number of days to include |
| `group_by` | string | 'day' | Grouping (day, week, month) |

**Response:**

```typescript
interface CFDResponse {
  data: CFDDataPoint[];
  statuses: IssueStatus[];
}

interface CFDDataPoint {
  date: string;                     // ISO date
  values: Record<IssueStatus, number>;
}
```

**Example Response:**

```json
{
  "data": [
    {
      "date": "2026-02-20",
      "values": {
        "open": 15,
        "in_progress": 5,
        "blocked": 2,
        "closed": 42
      }
    },
    ...
  ],
  "statuses": ["open", "in_progress", "blocked", "deferred", "closed"]
}
```

---

### Lead Time

```
GET /api/metrics/lead-time
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | number | 30 | Analysis period |
| `type` | string | - | Filter by issue type |

**Response:**

```typescript
interface LeadTimeResponse {
  summary: {
    average_hours: number;
    median_hours: number;
    p85_hours: number;
    p95_hours: number;
    total_closed: number;
  };
  distribution: {
    range: string;              // e.g., "0-24h", "1-3d"
    count: number;
  }[];
  trend: {
    date: string;
    average_hours: number;
  }[];
}
```

---

### Throughput

```
GET /api/metrics/throughput
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | number | 30 | Analysis period |
| `group_by` | string | 'day' | Grouping (day, week) |

**Response:**

```typescript
interface ThroughputResponse {
  summary: {
    total: number;
    average_per_day: number;
    average_per_week: number;
  };
  data: {
    date: string;
    count: number;
  }[];
}
```

---

### Aging WIP

```
GET /api/metrics/aging-wip
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | 'open,in_progress,blocked' | Statuses to include |

**Response:**

```typescript
interface AgingWIPResponse {
  issues: {
    id: string;
    title: string;
    status: IssueStatus;
    priority: Priority;
    assignee: string | null;
    age_days: number;
    created_at: string;
  }[];
  summary: {
    total: number;
    average_age_days: number;
    over_7_days: number;
    over_14_days: number;
    over_30_days: number;
  };
}
```

---

### Health Dashboard

```
GET /api/metrics/health
```

**Response:**

```typescript
interface HealthResponse {
  rag_status: 'green' | 'amber' | 'red';
  indicators: {
    name: string;
    status: 'green' | 'amber' | 'red';
    value: number;
    threshold: { amber: number; red: number };
    description: string;
  }[];
  summary: {
    open_count: number;
    in_progress_count: number;
    blocked_count: number;
    overdue_count: number;
    stale_count: number;
  };
}
```

---

## Git API

### List Worktrees

```
GET /api/git/worktrees
```

**Response:**

```typescript
interface WorktreesResponse {
  worktrees: {
    path: string;
    branch: string;
    head: string;
    beads_redirect: boolean;
    is_main: boolean;
  }[];
}
```

---

### Create Worktree

```
POST /api/git/worktrees
```

**Request Body:**

```typescript
interface CreateWorktreeRequest {
  name: string;
  branch?: string;                  // Default: name
  base_branch?: string;             // Default: main
}
```

---

### List Pull Requests

```
GET /api/git/prs
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `state` | string | 'open' | Filter by state (open, closed, merged) |
| `limit` | number | 20 | Max results |

**Response:**

```typescript
interface PRsResponse {
  prs: {
    number: number;
    title: string;
    state: 'open' | 'closed' | 'merged';
    author: string;
    branch: string;
    base_branch: string;
    created_at: string;
    updated_at: string;
    ci_status: 'pending' | 'success' | 'failure' | null;
    linked_issues: string[];
  }[];
}
```

---

### Get CI Status

```
GET /api/git/ci/:ref
```

**Path Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `ref` | string | Branch name or commit SHA |

**Response:**

```typescript
interface CIStatusResponse {
  ref: string;
  status: 'pending' | 'success' | 'failure';
  checks: {
    name: string;
    status: 'pending' | 'success' | 'failure' | 'skipped';
    conclusion: string | null;
    url: string | null;
  }[];
}
```

---

## Agent API (Gas-Town)

### Town Status

```
GET /api/agents/status
```

**Response:**

```typescript
interface TownStatusResponse {
  name: string;
  daemon_running: boolean;
  dolt_server: boolean;
  rigs: RigStatus[];
}

interface RigStatus {
  name: string;
  prefix: string;
  status: 'active' | 'parked' | 'docked';
  witness_running: boolean;
  refinery_running: boolean;
  open_issues: number;
  active_polecats: number;
}
```

---

### List Polecats

```
GET /api/agents/polecats
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `rig` | string | Filter by rig name |
| `status` | string | Filter by status |

**Response:**

```typescript
interface PolecatsResponse {
  polecats: {
    name: string;
    rig: string;
    status: AgentState;
    current_issue: string | null;
    session_id: string | null;
    last_activity: string | null;
  }[];
}
```

---

### Dispatch Work

```
POST /api/agents/sling
```

**Request Body:**

```typescript
interface SlingRequest {
  issue_id: string;
  target: string;                   // Rig name or polecat path
  args?: string;                    // Natural language instructions
  merge_strategy?: 'direct' | 'mr' | 'local';
  create_polecat?: boolean;
}
```

**Response:**

```typescript
interface SlingResponse {
  success: boolean;
  polecat: string;
  convoy_id?: string;
}
```

---

### List Convoys

```
GET /api/agents/convoys
```

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | 'active' | Filter by status |
| `limit` | number | 20 | Max results |

**Response:**

```typescript
interface ConvoysResponse {
  convoys: {
    id: string;
    title: string;
    status: 'active' | 'landed' | 'stranded';
    issues: { id: string; status: IssueStatus }[];
    progress: { done: number; total: number };
    created_at: string;
  }[];
}
```

---

### Get Convoy

```
GET /api/agents/convoys/:id
```

**Response:**

```typescript
interface ConvoyResponse {
  id: string;
  title: string;
  status: 'active' | 'landed' | 'stranded';
  issues: {
    id: string;
    title: string;
    status: IssueStatus;
    assignee: string | null;
    polecat: string | null;
  }[];
  progress: { done: number; total: number };
  created_at: string;
  landed_at: string | null;
}
```

---

### Health Check

```
GET /api/agents/health
```

**Response:**

```typescript
interface AgentHealthResponse {
  overall: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    name: string;
    status: 'pass' | 'warn' | 'fail';
    message: string;
    fixable: boolean;
  }[];
}
```

---

## WebSocket API

### Connection

```
WebSocket URL: ws://localhost:3000/api/ws
```

### Authentication

Include session cookie if in network mode.

### Message Format

All messages are JSON with a `type` field:

```typescript
interface WSMessage {
  type: string;
  payload: unknown;
  timestamp: string;
}
```

### Client → Server Messages

#### Subscribe

```typescript
interface SubscribeMessage {
  type: 'subscribe';
  payload: {
    topics: Topic[];
  };
}

type Topic =
  | 'issues'           // All issue changes
  | 'issues:open'      // Open issues only
  | 'metrics'          // Metrics updates
  | 'agents'           // Agent status
  | 'convoys'          // Convoy updates
  | `issue:${string}`; // Specific issue
```

#### Unsubscribe

```typescript
interface UnsubscribeMessage {
  type: 'unsubscribe';
  payload: {
    topics: Topic[];
  };
}
```

#### Ping

```typescript
interface PingMessage {
  type: 'ping';
}
```

### Server → Client Messages

#### Connected

Sent immediately after connection:

```typescript
interface ConnectedMessage {
  type: 'connected';
  payload: {
    client_id: string;
    server_time: string;
  };
}
```

#### Pong

Response to ping:

```typescript
interface PongMessage {
  type: 'pong';
  payload: {
    server_time: string;
  };
}
```

#### Issue Events

```typescript
interface IssueCreatedMessage {
  type: 'issue:created';
  payload: {
    issue: Issue;
  };
}

interface IssueUpdatedMessage {
  type: 'issue:updated';
  payload: {
    issue: Issue;
    changes: {
      field: string;
      old_value: unknown;
      new_value: unknown;
    }[];
  };
}

interface IssueClosedMessage {
  type: 'issue:closed';
  payload: {
    issue: Issue;
    reason: string | null;
    unblocked: string[];    // Newly unblocked issue IDs
  };
}

interface IssueDeletedMessage {
  type: 'issue:deleted';
  payload: {
    id: string;
  };
}
```

#### Metrics Events

```typescript
interface MetricsUpdatedMessage {
  type: 'metrics:updated';
  payload: {
    summary: {
      open_count: number;
      in_progress_count: number;
      blocked_count: number;
      closed_today: number;
    };
  };
}
```

#### Agent Events

```typescript
interface PolecatStatusMessage {
  type: 'polecat:status';
  payload: {
    name: string;
    rig: string;
    status: AgentState;
    issue_id: string | null;
  };
}

interface ConvoyProgressMessage {
  type: 'convoy:progress';
  payload: {
    id: string;
    progress: { done: number; total: number };
    status: 'active' | 'landed';
  };
}
```

#### File Change Events

```typescript
interface FileChangedMessage {
  type: 'file:changed';
  payload: {
    path: string;
    type: 'issues' | 'memory' | 'config';
  };
}
```

#### Error Events

```typescript
interface ErrorMessage {
  type: 'error';
  payload: {
    code: ErrorCode;
    message: string;
  };
}
```

### Heartbeat Protocol

- Client sends `ping` every 30 seconds
- Server responds with `pong`
- If no pong received within 5 seconds, reconnect
- Server disconnects clients with no ping for 60 seconds

### Reconnection Strategy

```typescript
const reconnectionConfig = {
  baseDelay: 1000,        // 1 second
  maxDelay: 30000,        // 30 seconds max
  jitter: 0.2,            // 20% random jitter
  maxAttempts: Infinity   // Keep trying forever
};

// Delay calculation
function getReconnectDelay(attempt: number): number {
  const delay = Math.min(
    baseDelay * Math.pow(2, attempt),
    maxDelay
  );
  const jitterAmount = delay * jitter * Math.random();
  return delay + jitterAmount;
}
```

---

## OpenAPI Specification

The full OpenAPI 3.0 specification is available at:

```
GET /api/openapi.json
GET /api/openapi.yaml
```

Interactive documentation (Swagger UI) is available at:

```
GET /api/docs
```

---

## Rate Limiting

No rate limiting for local mode. In network mode:

| Endpoint Type | Limit |
|---------------|-------|
| Read (GET) | 100 req/s |
| Write (POST/PATCH/DELETE) | 20 req/s |
| WebSocket messages | 50 msg/s |

Rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1708617600
```

### Client-Side Rate Limit Handling

```typescript
async function fetchWithRateLimit(url: string, options?: RequestInit): Promise<Response> {
  const response = await fetch(url, options);

  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    const waitMs = retryAfter
      ? parseInt(retryAfter, 10) * 1000
      : 1000; // Default 1s

    toast.warning(`Rate limited. Retrying in ${waitMs / 1000}s...`);

    await sleep(waitMs);
    return fetchWithRateLimit(url, options); // Retry
  }

  return response;
}

// Track rate limit state
class RateLimitTracker {
  remaining = $state(100);
  resetAt = $state<Date | null>(null);

  update(response: Response) {
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const reset = response.headers.get('X-RateLimit-Reset');

    if (remaining) this.remaining = parseInt(remaining, 10);
    if (reset) this.resetAt = new Date(parseInt(reset, 10) * 1000);
  }

  get isLow(): boolean {
    return this.remaining < 10;
  }
}
```

---

## CORS Policy

In network mode:

```
Access-Control-Allow-Origin: <configured origins>
Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

---

## Security Model (Network Mode)

### CSRF Protection

When `--network` mode is enabled, CSRF protection is required:

```typescript
// Server-side: Generate token
function generateCSRFToken(sessionId: string): string {
  return crypto.createHmac('sha256', SECRET_KEY)
    .update(sessionId)
    .digest('hex');
}

// Set token in cookie
Set-Cookie: csrf_token=<token>; HttpOnly=false; SameSite=Strict; Path=/

// Client must include in header
X-CSRF-Token: <token>
```

### Request Validation

```typescript
// Server-side middleware
function validateCSRF(request: Request): boolean {
  // Skip for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return true;
  }

  const cookieToken = getCookie(request, 'csrf_token');
  const headerToken = request.headers.get('X-CSRF-Token');

  return cookieToken && headerToken && cookieToken === headerToken;
}
```

### Session Security

```typescript
interface SessionConfig {
  // Cookie settings
  cookie: {
    name: 'ubw_session';
    httpOnly: true;
    secure: boolean;       // true if HTTPS
    sameSite: 'strict';
    maxAge: 86400;         // 24 hours
    path: '/';
  };

  // Session settings
  session: {
    idleTimeout: 3600;     // 1 hour of inactivity
    absoluteTimeout: 86400; // 24 hours max
    renewThreshold: 1800;  // Renew if < 30 min left
  };
}
```

### Secure Headers

```typescript
// Applied to all responses in network mode
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "connect-src 'self' ws://localhost:* wss://localhost:*",
    "img-src 'self' data:",
  ].join('; '),
};
```

### Input Sanitization

All user input is sanitized before:
- Database queries (parameterized queries only)
- CLI arguments (shell-safe escaping)
- HTML rendering (XSS prevention)

```typescript
// CLI argument sanitization
function sanitizeArg(arg: string): string {
  // Remove shell metacharacters
  return arg.replace(/[;&|`$(){}[\]<>\\]/g, '');
}

// Validate issue ID format
function isValidIssueId(id: string): boolean {
  return /^[a-z]+-[a-z0-9]+$/i.test(id);
}
```

---

## References

- [Data Flow Diagrams](./data-flow.md)
- [CLI Integration Specification](./cli-integration.md)
- [Beads Database Schema](../references/beads-schema.md)
- [ADR-0005: CLI for Writes](../../../../../docs/src/adrs/0005-cli-for-writes-and-direct-sql-for-reads.md)
- [ADR-0006: WebSocket Broadcast](../../../../../docs/src/adrs/0006-use-file-watching-with-websocket-broadcast.md)
