---
number: 22
title: Federated Data Access Layer for Multi-Source Support
status: proposed
date: 2026-02-25
tags:
  - database
  - federation
  - multi-repo
deciders:
  - aRustyDev
---

# Federated Data Access Layer for Multi-Source Support

## Context and Problem Statement

The Beads WebUI currently supports a single database backend (either SQLite or Dolt server). Users need to work with multiple issue repositories simultaneously—personal planning, team projects, archived data—while maintaining strict data isolation to prevent cross-repository leakage. How can we support multiple heterogeneous data sources with configurable isolation guarantees?

## Decision Drivers

* **Multi-repo workflows**: Users maintain issues across multiple repositories (personal, team, archived)
* **Data isolation requirements**: Sensitive data must not leak between namespaces
* **Backend flexibility**: Different repos may use different backends (SQLite local, Dolt server, JSONL sync)
* **Offline support**: Local SQLite should work when Dolt server is unavailable
* **Future dolt-native**: Architecture should accommodate embedded Dolt when FFI bindings exist

## Considered Options

1. **Federated DAL with namespace isolation** - Multi-source router with configurable isolation
2. **Single-source with replication** - One primary, replicate others into it
3. **Virtual tables/views** - Database-level federation (e.g., SQLite ATTACH, Dolt remotes)
4. **Application-level merging** - Load all sources, merge in memory

## Decision Outcome

Chosen option: **"Federated DAL with namespace isolation"**, because it provides the most flexibility for heterogeneous backends while enforcing data isolation at the application layer where we have full control.

### Consequences

* Good, because supports any combination of SQLite, JSONL, Dolt-native, and Dolt-server
* Good, because isolation rules are explicit and auditable in code
* Good, because each source can have independent connection lifecycle
* Good, because enables gradual migration between backends
* Bad, because adds complexity to the data access layer
* Bad, because cross-source queries require explicit federation (no implicit JOINs)
* Bad, because requires careful namespace management to prevent collisions

### Confirmation

Implementation will be confirmed via:
- Unit tests verifying namespace isolation (writes to wrong source throw errors)
- Integration tests with multiple backends configured simultaneously
- Fuzz testing for namespace extraction edge cases

## Architecture

### Source Adapters

Each data source implements a common `SourceAdapter` interface:

```typescript
interface SourceAdapter {
  readonly id: string;
  readonly config: DataSource;

  connect(): Promise<void>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<boolean>;

  getIssues(filter: IssueFilter): Promise<Issue[]>;
  getIssue(id: string): Promise<Issue | null>;
  createIssue(data: CreateIssueData): Promise<Issue>;
  updateIssue(id: string, data: UpdateIssueData): Promise<Issue>;
  deleteIssue(id: string): Promise<void>;
}
```

Implementations:
- `SqliteAdapter` - better-sqlite3 for local `.db` files
- `JsonlAdapter` - File-based with optional file watching
- `DoltServerAdapter` - mysql2 for Dolt SQL server
- `DoltNativeAdapter` - Future: FFI bindings to embedded Dolt

### Query Router

The `FederatedDAL` routes queries based on:
1. Explicit source selection (`options.source`)
2. Issue ID namespace extraction (`projx-123` → `projx` namespace)
3. Federated query across all sources (when allowed)

### Namespace Enforcer

Data isolation is enforced via:

| Isolation Level | Cross-Namespace Read | Cross-Namespace Write | Cross-Namespace Deps |
|-----------------|---------------------|----------------------|---------------------|
| `strict` | Blocked | Blocked | Blocked |
| `namespaced` | Allowed | Blocked | Warning |
| `open` | Allowed | Allowed | Allowed |

### Configuration

```yaml
# .beads/config.yaml
sources:
  - id: local
    name: "Local Project"
    type: sqlite
    namespace: projx
    mode: readwrite
    connection:
      path: .beads/beads.db

  - id: team
    name: "Team Issues"
    type: dolt-server
    namespace: team
    mode: readwrite
    connection:
      host: localhost
      port: 3307
      database: team_issues

federation:
  allowFederatedReads: true
  isolation: namespaced
  defaultWriteSource: local
```

## Pros and Cons of the Options

### Federated DAL with namespace isolation

* Good, because fully flexible - any backend combination works
* Good, because isolation is explicit and testable
* Good, because graceful degradation when sources are unavailable
* Neutral, because requires namespace prefix conventions
* Bad, because no cross-source JOINs (must query separately and merge)
* Bad, because complexity in routing logic

### Single-source with replication

* Good, because simpler query logic - one database
* Good, because standard SQL operations including JOINs
* Bad, because requires sync mechanism between sources
* Bad, because conflict resolution is complex
* Bad, because doesn't support heterogeneous backends

### Virtual tables/views (database-level)

* Good, because leverages database engine capabilities
* Good, because familiar SQL semantics
* Bad, because SQLite ATTACH has limitations (same schema required)
* Bad, because Dolt remotes don't support arbitrary federation
* Bad, because tight coupling to specific database features

### Application-level merging

* Good, because simple implementation
* Good, because works with any backend
* Bad, because memory-intensive for large datasets
* Bad, because no isolation guarantees
* Bad, because no write routing

## More Information

### Related Documents

- [Federated DAL Reference](../../.claude/plans/unified-beads-webui/references/federated-dal.md) - Detailed implementation guide
- [Dolt Native FFI Research](../../.claude/plans/unified-beads-webui/references/dolt-native-ffi.md) - CGO/FFI approach analysis
- [ADR-0005](./0005-cli-for-writes-and-direct-sql-for-reads.md) - CLI for writes pattern (still applies per-source)

### Future Considerations

1. **Dolt-native adapter**: When FFI bindings are available, add `DoltNativeAdapter`
2. **Cross-source queries**: Could implement via query decomposition and application-level JOIN
3. **Sync engine**: Background sync between sources for offline support
4. **Access control**: Per-source authentication for multi-tenant scenarios
