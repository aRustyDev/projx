Penpot Diagrams - Value:
- Visual fidelity for stakeholder review/approval
- Design token extraction (colors, spacing, typography) → code
- Interactive prototypes (clickable flows)
- Standard designer workflow if collaborating with designers
- The read-only penpot MCP still works for extracting design info later

ASCII Wireframes - Value:
- Version controlled in git alongside code
- AI can read/modify directly (no MCP issues)
- Fast iteration, no context switching
- Works offline, no external dependencies
- Good enough for structure/layout planning

What we lose without visual prototypes:
- Stakeholder visual approval before coding
- Precise spacing/sizing reference
- Color/typography decisions documented visually
- Interactive flow validation

My recommendation given the MCP issues:
┌─────────────────────────┬─────────────────────────────────────────────────────┐
│        Approach         │                      Best For                       │
├─────────────────────────┼─────────────────────────────────────────────────────┤
│ ASCII wireframes → Code │ Solo dev, fast iteration, structure-focused         │
├─────────────────────────┼─────────────────────────────────────────────────────┤
│ Manual Penpot           │ Need stakeholder approval, visual precision matters │
├─────────────────────────┼─────────────────────────────────────────────────────┤
│ Skip to Storybook       │ Component-driven, visual docs in code               │
└─────────────────────────┴─────────────────────────────────────────────────────┘
For this project, since you're building a beads UI and likely the primary user:

1. ASCII wireframes for layout structure (quick, in-repo)
2. Go straight to code with Tailwind + Svelte components
3. Use Storybook (projx-13y.6) as the visual documentation

This avoids the Penpot MCP pain while still having visual component docs. Want me to proceed with ASCII wireframes for the key views instead?
