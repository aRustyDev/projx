---
number: 23
title: Search Architecture for Issue Filtering
status: accepted
date: 2026-02-25
tags:
  - search
  - architecture
  - filtering
deciders:
  - adam
---

# Search Architecture for Issue Filtering

## Context and Problem Statement

The application needs advanced search capabilities to filter issues and epics. Users want to use operators like `status:open`, `priority:>=2`, `-wontfix`, and date ranges like `created:<7d`. The question is whether to implement filtering client-side, server-side, or use a hybrid approach combining both.

## Decision Drivers

* **Performance**: Search must feel instant (<100ms) for common queries
* **Scalability**: Architecture should handle growth from hundreds to tens of thousands of issues
* **Consistency**: Query results must be predictable and match user expectations
* **Simplicity**: Avoid over-engineering for current scale while planning for growth
* **Offline capability**: Local-first architecture (beads uses SQLite) should be preserved

## Considered Options

* **Option A: Client-side only** - Load all issues, filter in browser
* **Option B: Server-side only** - All queries go to SQLite/FTS5
* **Option C: Hybrid with cache window** - Cache recent issues client-side, server query for rest

## Decision Outcome

Chosen option: **"Hybrid with cache window"**, because it provides instant filtering for 90% of common queries while maintaining the ability to search the full dataset when needed. The architecture scales gracefully and avoids premature optimization.

### Implementation Strategy

```
┌─────────────────────────────────────────────────────────┐
│  Phase 1 (Current scale < 5,000 issues):                │
│    - Load all issues client-side                        │
│    - Filter entirely in browser (instant)               │
│    - Same query parser for both client/server           │
│                                                         │
│  Phase 2 (Scale 5,000 - 50,000 issues):                 │
│    - Cache window: recent 2,000 issues client-side      │
│    - Server endpoint for full-dataset queries           │
│    - UI indicates when results may be incomplete        │
│                                                         │
│  Phase 3 (Scale > 50,000 issues):                       │
│    - Server-side with FTS5 becomes primary              │
│    - Client cache for instant re-filtering of results   │
└─────────────────────────────────────────────────────────┘
```

### Query Classification

| Query Type | Execution | Rationale |
|------------|-----------|-----------|
| Field filters (`status:`, `priority:`, `type:`) | Cache-first | Common, instant |
| Sorting | Cache-only | Always on loaded data |
| Full-text search (`description:"term"`) | Server | Needs FTS5 index |
| Date ranges beyond cache window | Server | Data not in cache |
| Regex patterns | Server | Expensive, rare |

### Consequences

* Good, because common queries are instant (no round-trip)
* Good, because architecture scales with data growth
* Good, because same query parser works for both executors
* Good, because offline-capable for cached data
* Neutral, because requires clear UI indication when results may be incomplete
* Bad, because two execution paths increase complexity
* Bad, because cache invalidation needs careful handling

### Confirmation

* Unit tests verify query parser produces identical AST for both executors
* Integration tests confirm client and server executors return same results for overlapping queries
* Performance benchmarks ensure <100ms client-side filtering for 5,000 issues

## Pros and Cons of the Options

### Option A: Client-side only

Load all issues into browser memory, filter using JavaScript.

* Good, because instant filtering with no network latency
* Good, because works offline
* Good, because simple implementation
* Neutral, because memory usage scales with issue count
* Bad, because initial load time grows with dataset
* Bad, because not viable beyond ~10,000 issues
* Bad, because no full-text search optimization

### Option B: Server-side only

All queries translated to SQL and executed against SQLite with FTS5.

* Good, because scales to millions of issues
* Good, because FTS5 provides optimized full-text search
* Good, because single source of truth
* Neutral, because requires network round-trip for every query
* Bad, because perceived latency for simple filters
* Bad, because requires server availability
* Bad, because over-engineered for small datasets

### Option C: Hybrid with cache window

Cache recent/relevant issues client-side, server query for full dataset.

* Good, because 90% of queries hit cache (instant)
* Good, because full dataset searchable when needed
* Good, because graceful scaling path
* Good, because preserves offline capability for common operations
* Neutral, because requires cache invalidation strategy
* Bad, because potential for inconsistent results if not handled carefully
* Bad, because more complex than single-executor approaches

## Search Operator Syntax

The following operators will be supported by the query parser:

| Category | Syntax | Example |
|----------|--------|---------|
| Field match | `field:value` | `status:open` |
| Negation | `-term` or `!term` | `-wontfix` |
| Boolean | `&&`, `\|\|` | `bug && urgent` |
| Comparison | `>`, `>=`, `<`, `<=` | `priority:>=2` |
| Contains | `field:"phrase"` | `title:"login form"` |
| Regex | `field:re:/pattern/` | `id:re:/PROJ-\d+/` |
| Date relative | `field:<Nd` | `created:<7d` |
| Range | `field:min..max` | `priority:1..3` |
| Exists | `has:field` | `has:assignee` |
| Multiple | `field:a\|b\|c` | `type:bug\|task` |

## More Information

Related issues:
- Advanced search operators feature
- Query parser implementation
- Client executor implementation
- Server executor with FTS5
- Search UI with autocomplete

The query parser should be implemented as a standalone module that produces an AST, allowing both client and server executors to consume the same parsed query structure.
