# Federated Data Access Layer Reference

> Comprehensive implementation guide for multi-source database federation in the Beads WebUI.

**Status**: Proposed
**ADR**: [ADR-0022](../../../../docs/src/adrs/0022-federated-data-access-layer-for-multi-source-support.md)
**Related**: [Dolt Native FFI Research](./dolt-native-ffi.md)

---

## Overview

The Federated DAL enables simultaneous access to multiple heterogeneous data sources with configurable isolation guarantees. This supports multi-repo workflows while preventing data leakage between namespaces.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     DataAccessLayer (DAL)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ QueryRouter │  │ WriteGuard  │  │ NamespaceEnforcer       │  │
│  │             │  │             │  │ (prevents cross-repo)   │  │
│  └──────┬──────┘  └──────┬──────┘  └────────────┬────────────┘  │
│         │                │                      │               │
├─────────┴────────────────┴──────────────────────┴───────────────┤
│                        Source Registry                           │
├──────────┬──────────┬──────────────┬────────────────────────────┤
│ SQLite   │ JSONL    │ Dolt-Native  │ Dolt-Server                │
│ Adapter  │ Adapter  │ Adapter      │ Adapter                    │
└──────────┴──────────┴──────────────┴────────────────────────────┘
     │          │            │                │
     ▼          ▼            ▼                ▼
 beads.db  issues.jsonl  ~/.dolt/...    dolt-server:3307
```

---

## Supported Data Sources

| Type | Description | Mode | Use Case |
|------|-------------|------|----------|
| `sqlite` | Local SQLite database via better-sqlite3 | read/write | Single-user local storage |
| `jsonl` | JSON Lines file with optional watch | read-only* | Git-synced exports, backups |
| `dolt-server` | MySQL-compatible Dolt SQL server | read/write | Team collaboration, versioning |
| `dolt-native` | Embedded Dolt via FFI (future) | read/write | Serverless, offline-first |

*JSONL write support possible but not recommended due to sync complexity.

---

## Type Definitions

### DataSource Configuration

```typescript
// src/lib/db/types.ts

interface DataSource {
  /** Unique identifier for this source */
  id: string;

  /** Human-readable name */
  name: string;

  /** Source type */
  type: 'sqlite' | 'jsonl' | 'dolt-native' | 'dolt-server';

  /** Issue prefix namespace (e.g., "projx", "work") */
  namespace: string;

  /** Connection/path configuration */
  connection: SqliteConfig | JsonlConfig | DoltNativeConfig | DoltServerConfig;

  /** Access mode */
  mode: 'readonly' | 'readwrite';

  /** Priority for conflict resolution (lower = higher priority) */
  priority: number;

  /** Tags for grouping/filtering sources */
  tags?: string[];
}

interface SqliteConfig {
  path: string;  // e.g., ".beads/beads.db"
}

interface JsonlConfig {
  path: string;  // e.g., ".beads/issues.jsonl"
  watchForChanges?: boolean;
}

interface DoltNativeConfig {
  dataDir: string;  // e.g., "~/.dolt-data/beads_projx"
  branch?: string;
}

interface DoltServerConfig {
  host: string;
  port: number;
  database: string;
  user?: string;
  password?: string;
}
```

### Federation Configuration

```typescript
interface FederatedConfig {
  sources: DataSource[];

  /** Default source for writes when namespace is ambiguous */
  defaultWriteSource?: string;

  /** Enable cross-source queries (federated reads) */
  allowFederatedReads?: boolean;

  /** Isolation level for data leakage prevention */
  isolation: 'strict' | 'namespaced' | 'open';
}
```

---

## FederatedDAL Implementation

### Core Class

```typescript
// src/lib/server/db/federated-dal.ts

export class FederatedDAL {
  private sources: Map<string, SourceAdapter> = new Map();
  private namespaceMap: Map<string, string> = new Map(); // namespace -> sourceId
  private config: FederatedConfig;

  static async create(config: FederatedConfig): Promise<FederatedDAL> {
    const dal = new FederatedDAL(config);
    await dal.initializeSources();
    return dal;
  }

  private async initializeSources(): Promise<void> {
    for (const sourceConfig of this.config.sources) {
      const adapter = this.createAdapter(sourceConfig);
      await adapter.connect();
      this.sources.set(sourceConfig.id, adapter);
      this.namespaceMap.set(sourceConfig.namespace, sourceConfig.id);
    }
  }

  private createAdapter(config: DataSource): SourceAdapter {
    switch (config.type) {
      case 'sqlite':
        return new SqliteAdapter(config);
      case 'jsonl':
        return new JsonlAdapter(config);
      case 'dolt-server':
        return new DoltServerAdapter(config);
      case 'dolt-native':
        return new DoltNativeAdapter(config);
      default:
        throw new Error(`Unknown source type: ${config.type}`);
    }
  }
}
```

### Query Routing

```typescript
/**
 * Query issues across sources with namespace enforcement
 */
async getIssues(filter: IssueFilter = {}, options?: QueryOptions): Promise<Issue[]> {
  const targetSources = this.resolveTargetSources(filter, options);

  // Parallel queries to each source
  const results = await Promise.all(
    targetSources.map(async (source) => {
      try {
        return await this.querySource(source, filter);
      } catch (error) {
        // Log but don't fail entire query
        console.error(`Source ${source.id} failed:`, error);
        return [];
      }
    })
  );

  // Merge and deduplicate (by ID, respecting priority)
  return this.mergeResults(results, targetSources);
}

/**
 * Resolve which sources to query based on filter and options
 */
private resolveTargetSources(
  filter: IssueFilter,
  options?: QueryOptions
): SourceAdapter[] {
  // If specific source requested
  if (options?.source) {
    const source = this.sources.get(options.source);
    if (!source) throw new Error(`Unknown source: ${options.source}`);
    return [source];
  }

  // If filter has ID prefix, route to that namespace's source
  if (filter.id && this.config.isolation !== 'open') {
    const namespace = this.extractNamespace(filter.id);
    const sourceId = this.namespaceMap.get(namespace);
    if (sourceId) {
      return [this.sources.get(sourceId)!];
    }
  }

  // Federated query across all sources
  if (this.config.allowFederatedReads) {
    return Array.from(this.sources.values());
  }

  // Strict isolation - require explicit source
  throw new IsolationError('Federated reads disabled; specify source');
}
```

### Write Guard

```typescript
/**
 * Write with namespace validation
 */
async createIssue(data: CreateIssueData): Promise<Issue> {
  const namespace = this.extractNamespace(data.id);
  const sourceId = this.namespaceMap.get(namespace);

  if (!sourceId) {
    if (this.config.defaultWriteSource) {
      sourceId = this.config.defaultWriteSource;
    } else {
      throw new NamespaceError(`No source configured for namespace: ${namespace}`);
    }
  }

  const source = this.sources.get(sourceId);
  if (!source) {
    throw new Error(`Source not found: ${sourceId}`);
  }

  if (source.config.mode === 'readonly') {
    throw new WriteError(`Source ${sourceId} is readonly`);
  }

  // Validate dependencies don't cross isolation boundaries
  this.namespaceEnforcer.validateDependencies(data, sourceId);

  return source.adapter.createIssue(data);
}
```

---

## Namespace Enforcer

### Isolation Levels

| Level | Description |
|-------|-------------|
| `strict` | No cross-namespace operations allowed |
| `namespaced` | Reads allowed across namespaces, writes blocked |
| `open` | All operations allowed (no isolation) |

### Implementation

```typescript
// src/lib/server/db/guards/namespace-enforcer.ts

export class NamespaceEnforcer {
  constructor(private config: FederatedConfig) {}

  /**
   * Extract namespace from issue ID
   * Examples: "projx-123" → "projx", "team-456.1" → "team"
   */
  extractNamespace(issueId: string): string {
    const match = issueId.match(/^([a-z0-9]+)-/i);
    if (!match) {
      throw new NamespaceError(`Cannot extract namespace from: ${issueId}`);
    }
    return match[1].toLowerCase();
  }

  /**
   * Validate that an issue belongs to the correct source
   */
  validateIssueSource(issue: Issue, sourceId: string): void {
    const expectedSource = this.getSourceForNamespace(
      this.extractNamespace(issue.id)
    );

    if (expectedSource !== sourceId) {
      throw new DataLeakageError(
        `Issue ${issue.id} belongs to source ${expectedSource}, ` +
        `not ${sourceId}`
      );
    }
  }

  /**
   * Validate dependency references don't cross isolation boundaries
   */
  validateDependencies(issue: CreateIssueData, sourceId: string): void {
    if (this.config.isolation === 'open') return;

    const sourceNamespace = this.getNamespaceForSource(sourceId);

    for (const dep of issue.dependencies ?? []) {
      const depNamespace = this.extractNamespace(dep.depends_on_id);

      if (depNamespace !== sourceNamespace) {
        if (this.config.isolation === 'strict') {
          throw new CrossNamespaceDependencyError(
            `Cannot reference ${dep.depends_on_id} from ${issue.id}: ` +
            `cross-namespace dependency in strict isolation mode`
          );
        } else {
          // namespaced mode - warn but allow
          console.warn(
            `Cross-namespace dependency: ${issue.id} → ${dep.depends_on_id}`
          );
        }
      }
    }
  }
}
```

---

## Source Adapters

### Base Interface

```typescript
// src/lib/server/db/adapters/base.ts

export interface SourceAdapter {
  readonly id: string;
  readonly config: DataSource;

  // Lifecycle
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<boolean>;

  // Read operations
  getIssues(filter: IssueFilter): Promise<Issue[]>;
  getIssue(id: string): Promise<Issue | null>;
  getIssueCount(filter?: IssueFilter): Promise<number>;

  // Write operations (throw if readonly)
  createIssue(data: CreateIssueData): Promise<Issue>;
  updateIssue(id: string, data: UpdateIssueData): Promise<Issue>;
  deleteIssue(id: string): Promise<void>;

  // Sync operations
  sync(): Promise<SyncResult>;
  getLastSyncTime(): Promise<Date | null>;
}
```

### SQLite Adapter

```typescript
// src/lib/server/db/adapters/sqlite.ts

export class SqliteAdapter implements SourceAdapter {
  private db: Database | null = null;

  constructor(public readonly config: DataSource) {
    if (config.type !== 'sqlite') {
      throw new Error('SqliteAdapter requires sqlite config');
    }
  }

  async connect(): Promise<void> {
    const Database = (await import('better-sqlite3')).default;
    const conn = this.config.connection as SqliteConfig;
    this.db = new Database(conn.path, {
      readonly: this.config.mode === 'readonly'
    });
  }

  async getIssues(filter: IssueFilter): Promise<Issue[]> {
    const { sql, params } = this.buildQuery(filter);
    return this.db!.prepare(sql).all(...params) as Issue[];
  }

  // ... other methods
}
```

### JSONL Adapter

```typescript
// src/lib/server/db/adapters/jsonl.ts

export class JsonlAdapter implements SourceAdapter {
  private issues: Map<string, Issue> = new Map();
  private watcher: FSWatcher | null = null;

  async connect(): Promise<void> {
    await this.loadFile();

    const conn = this.config.connection as JsonlConfig;
    if (conn.watchForChanges) {
      this.watcher = watch(conn.path, () => this.loadFile());
    }
  }

  private async loadFile(): Promise<void> {
    const conn = this.config.connection as JsonlConfig;
    const content = await readFile(conn.path, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);

    this.issues.clear();
    for (const line of lines) {
      const issue = JSON.parse(line) as Issue;
      this.issues.set(issue.id, issue);
    }
  }

  async getIssues(filter: IssueFilter): Promise<Issue[]> {
    let issues = Array.from(this.issues.values());
    // Apply filters in memory
    if (filter.status) {
      const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
      issues = issues.filter(i => statuses.includes(i.status));
    }
    // ... other filters
    return issues;
  }
}
```

### Dolt Server Adapter

```typescript
// src/lib/server/db/adapters/dolt-server.ts

export class DoltServerAdapter implements SourceAdapter {
  private pool: Pool | null = null;

  async connect(): Promise<void> {
    const mysql = await import('mysql2/promise');
    const conn = this.config.connection as DoltServerConfig;

    this.pool = mysql.createPool({
      host: conn.host,
      port: conn.port,
      database: conn.database,
      user: conn.user ?? 'root',
      password: conn.password ?? '',
      waitForConnections: true,
      connectionLimit: 10
    });

    // Verify connection
    const testConn = await this.pool.getConnection();
    testConn.release();
  }

  async getIssues(filter: IssueFilter): Promise<Issue[]> {
    const { sql, params } = this.buildQuery(filter);
    const [rows] = await this.pool!.execute(sql, params);
    return rows as Issue[];
  }
}
```

---

## Configuration Examples

### Single Local Project

```yaml
# .beads/config.yaml
sources:
  - id: local
    name: "My Project"
    type: sqlite
    namespace: projx
    mode: readwrite
    priority: 1
    connection:
      path: .beads/beads.db

federation:
  allowFederatedReads: false
  isolation: strict
```

### Team + Personal Repos

```yaml
sources:
  - id: team
    name: "Team Project"
    type: dolt-server
    namespace: team
    mode: readwrite
    priority: 1
    connection:
      host: localhost
      port: 3307
      database: team_issues

  - id: personal
    name: "Personal Planning"
    type: jsonl
    namespace: me
    mode: readonly
    priority: 10
    connection:
      path: ~/planning/issues.jsonl
      watchForChanges: true

federation:
  allowFederatedReads: true
  isolation: namespaced
  defaultWriteSource: team
```

### Multi-Project with Archive

```yaml
sources:
  - id: current
    name: "Current Sprint"
    type: dolt-server
    namespace: sprint
    mode: readwrite
    priority: 1
    connection:
      host: localhost
      port: 3307
      database: sprint_q1

  - id: backlog
    name: "Product Backlog"
    type: sqlite
    namespace: backlog
    mode: readwrite
    priority: 2
    connection:
      path: .beads/backlog.db

  - id: archive
    name: "Archived Issues"
    type: dolt-native  # Future
    namespace: archive
    mode: readonly
    priority: 100
    connection:
      dataDir: ~/.dolt-data/archive

federation:
  allowFederatedReads: true
  isolation: namespaced
  defaultWriteSource: current
```

---

## Query Flow Examples

### Federated Read

```typescript
// User queries "all P1 issues"
const issues = await dal.getIssues({ priority: 1 });

// Internally:
// 1. QueryRouter sees no namespace filter → federated query
// 2. Parallel queries to all sources
// 3. Results merged by priority, deduplicated by ID
// 4. Each issue tagged with source metadata
```

### Namespaced Write

```typescript
// User creates issue with team prefix
await dal.createIssue({
  id: 'team-123',  // Explicit namespace
  title: 'Fix bug'
});

// Internally:
// 1. WriteGuard extracts namespace: "team"
// 2. Routes to team source (Dolt server)
// 3. NamespaceEnforcer validates no cross-references
// 4. Write executed on correct source
```

### Cross-Namespace Blocked

```typescript
// Attempt to create cross-namespace dependency
await dal.createIssue({
  id: 'team-123',
  title: 'New feature',
  dependencies: [
    { depends_on_id: 'personal-456', type: 'blocks' }  // Different namespace!
  ]
});

// In strict mode: throws CrossNamespaceDependencyError
// In namespaced mode: logs warning, allows operation
// In open mode: proceeds normally
```

---

## Migration Path

### Phase 1: Single Source (Current)

Current `DataAccessLayer` remains unchanged. Single backend selection.

### Phase 2: Multi-Source Foundation

1. Implement `SourceAdapter` interface
2. Create adapters for SQLite and Dolt-server
3. Implement basic `FederatedDAL` with source registry
4. Add namespace extraction logic

### Phase 3: Isolation and Guards

1. Implement `NamespaceEnforcer`
2. Add isolation levels
3. Implement write guards
4. Add cross-namespace dependency validation

### Phase 4: JSONL and Sync

1. Implement `JsonlAdapter` with file watching
2. Add sync operations between sources
3. Implement conflict resolution strategies

### Phase 5: Dolt Native (Future)

1. Build CGO wrapper for dolthub/driver
2. Create N-API bindings
3. Implement `DoltNativeAdapter`
4. Add offline-first capabilities

---

## Testing Strategy

### Unit Tests

- Namespace extraction for various ID formats
- Isolation level enforcement
- Write guard blocking
- Query routing logic

### Integration Tests

- Multiple adapters connected simultaneously
- Federated queries returning merged results
- Write operations to correct source
- Error handling when source is unavailable

### Fuzz Tests

- Malformed issue IDs
- Invalid namespace references
- Race conditions in concurrent writes

---

## Related Documents

- [ADR-0022](../../../../docs/src/adrs/0022-federated-data-access-layer-for-multi-source-support.md) - Architecture decision
- [Dolt Native FFI Research](./dolt-native-ffi.md) - CGO/FFI approach for embedded Dolt
- [Beads Schema](./beads-schema.md) - Database schema reference
- [Tech Stack Analysis](./tech-stack-analysis.md) - Framework evaluation
