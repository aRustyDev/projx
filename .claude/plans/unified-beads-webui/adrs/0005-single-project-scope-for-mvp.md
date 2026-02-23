# 5. Single project scope for MVP

Date: 2026-02-23

## Status

Accepted

## Context

The Unified Beads WebUI needs to decide whether to support multiple projects (databases) in the MVP or limit to a single project scope.

Looking at the reference implementations:
- **beads-ui**: Supports multi-workspace auto-registration
- **beads-dashboard**: Supports project switching
- **Beads-Kanban-UI**: Supports project switching, cross-project view, project tags
- **foolery**: Supports project switching, cross-project view

Multi-project support requires:
1. Database/workspace discovery and registration
2. Project switcher UI component
3. State management for current project context
4. Potentially different database configurations per project
5. Cross-project queries and aggregations (advanced)

## Decision

MVP (Phases 1-4) will support **single project scope only**.

The application will connect to one `.beads/beads.db` database (or Dolt instance) configured at startup. Multi-project switching will be deferred to Phase 5 (Gastown Integration).

## Consequences

### Positive
- Simplified state management (no project context)
- Faster MVP delivery
- Clearer mental model for initial users
- Easier testing and debugging
- Database connection handling is straightforward

### Negative
- Users with multiple projects must run separate instances
- Cannot aggregate issues across projects
- May need refactoring when adding multi-project in Phase 5

### Implementation Notes

**Startup Configuration**:
```bash
# Single project - default behavior
bun run dev

# Explicit database path
BEADS_DB_PATH=/path/to/.beads/beads.db bun run dev

# Dolt connection
BEADS_BACKEND=dolt DOLT_HOST=localhost bun run dev
```

**Future Multi-Project (Phase 5)**:
```typescript
// Phase 5 will add project context
interface ProjectContext {
  id: string;
  name: string;
  path: string;
  backend: 'sqlite' | 'dolt';
}

// Routes will include project scope
// /projects/[projectId]/issues
// /projects/[projectId]/board
```

### Migration Path

When adding multi-project in Phase 5:
1. Wrap existing data layer with project context
2. Add project discovery/registration
3. Add project switcher to navigation
4. Update all queries to scope by project
5. Add cross-project views as optional feature

## Related

- Phase 5: Gastown Integration (multi-project planned)
- Feature Matrix: Multi-Project section
- ADR-0003: ASCII wireframes (wireframes assume single project)
