# 3. Use ASCII wireframes instead of Penpot for prototyping

Date: 2026-02-23

## Status

Accepted

## Context

We evaluated Penpot as a design-first prototyping tool for the Unified Beads WebUI project. The goal was to create visual wireframes before code implementation, with the ability to extract design tokens and generate code from designs using MCP (Model Context Protocol) integration.

Two Penpot MCP servers are available:
- `penpot` (REST API-based): Read-only access to designs
- `penpot-plugin` (Browser plugin-based): Read-write access via execute_code

During investigation, we discovered critical issues with the `penpot-plugin` MCP:
1. **BUG-001**: All API calls hang indefinitely (>4 minutes) without returning results
2. **BUG-002**: WebSocket connections drop silently without reconnection
3. **CONSTRAINT-001**: Requires per-file browser connection (no batch operations)
4. **CONSTRAINT-002**: REST API cannot create pages (only plugin API can)

These issues block the design-first workflow since we cannot:
- Create pages programmatically
- Execute code in Penpot designs
- Automate any write operations

Full documentation: `.claude/plans/penpot-mcp/`

## Decision

We will use ASCII wireframes for UI structure and layout planning instead of Penpot visual designs.

ASCII wireframes provide:
- Version control in git alongside code
- Direct AI readability and modification
- No external tool dependencies
- Fast iteration without context switching
- Sufficient detail for structure/layout decisions

Example ASCII wireframe:
```
┌─────────────────────────────────────────────────────────┐
│ [Logo]  Issues  Board  Dashboard        [Search] [User] │
├─────────────────────────────────────────────────────────┤
│ Filters: [Status ▼] [Priority ▼] [Assignee ▼] [+ More]  │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ #123 Fix login bug                    [P1] [Open]   │ │
│ │ Assigned: @alice  |  Updated: 2h ago               │ │
│ └─────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ #124 Add dark mode                    [P2] [Review] │ │
│ │ Assigned: @bob    |  Updated: 1d ago               │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## Consequences

### Positive
- No blocking dependencies on external tools
- Faster iteration on structure/layout
- AI can directly read and suggest changes
- No MCP configuration or debugging needed
- Works offline

### Negative
- No visual fidelity for stakeholder review
- No interactive prototypes
- Design tokens must be defined in code (not extracted from designs)
- Cannot leverage Penpot's component library features

### Mitigation
- Use Storybook for visual component documentation (see ADR-0004)
- Define design tokens directly in CSS/Tailwind configuration
- Create interactive prototypes in code if needed
- Revisit Penpot integration when MCP issues are resolved

## Related

- ADR-0004: Use Storybook for visual component documentation
- `.claude/plans/penpot-mcp/README.md`: Penpot MCP investigation findings
- `.claude/plans/penpot-mcp/bug-001-penpot-plugin-api-calls-hang.md`: Critical blocking bug
