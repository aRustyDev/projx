# Future Enhancements (Post Phase 5)

> Ideas for features beyond the initial 5-phase roadmap.
> These are not committed to any timeline and serve as a backlog for future consideration.

---

## Content & Linking

### Link/Include Syntax
- Support for local/external file references in issue creation/editing
- Syntax: `@include(path/to/file.md)` or similar
- Preview inline or as expandable sections

### Wiki-Style Linking
- `[[wiki-links]]` for cross-referencing issues/epics
- `@at-syntax` for mentions
- `/slash-commands` for quick actions
- Auto-complete and predictive typing

### Link Aggregations
- Aggregate all links from issues
- Show link graph (like Obsidian)
- Bidirectional link tracking

---

## Agent & Automation

### Agent Context
- Add preferred/agent/role field to issues
- Agent context links and notes
- Track which agent worked on which issue
- Agent capability matching

### Predictive Features
- Predictive typing for titles/descriptions
- Auto-suggest labels, assignees, priorities
- Smart defaults based on context

---

## Labels & Dictionary

### Labels Library
- Centralized label management
- Label aggregation across issues
- Label usage analytics
- Suggested labels based on content

### Dictionary Building
- Project-specific terminology dictionary
- Descriptions and scoping for terms
- Spellcheck integration
- Custom validation rules

---

## GitHub Integration (Extended)

### Milestone Mapping
- Epic ↔ GitHub Milestone synchronization
- Bidirectional sync status

### Projects Integration
- GitHub Projects board sync
- Labels synchronization
- Custom field mapping

### Configuration UI
- Visual configuration for GitHub integration
- Sync rules and conflict resolution
- Webhook management

---

## Configuration & Customization

### Keyboard Mapping
- Custom + configurable hotkeys
- Vim/Emacs mode options
- Chord bindings support

### Config File Support
- `.beadsrc` or `beads.config.js`
- UI-based interactive configuration
- Export/import settings

### Validation Rules
- Configurable validation rules per field
- Custom validators
- MarkdownLint integration (Rumdl CLI or library)

---

## UI/UX Enhancements

### Display Toggles (MVP has constants)
- RAG indicator configuration
- Dark/Light color scheme configuration
- Aging thresholds configuration
- Card displayed content configuration

### TUI vs WebUI
- CLI option to launch TUI instead of WebUI
- Consistent feature parity
- Shared configuration

---

## API & Schema

### Structured Data API
- Fully-defined WebUI structured data schema
- OpenAPI specification
- GraphQL support consideration
- Versioned API

### Static Generation
- Static HTML generation of filtered issue subsets
- SEO support for public instances
- Sitemap generation

---

## Authentication & Hosting

### Better-Auth Integration
- Multi-user support
- Shared instance hosting
- Role-based access control
- OAuth providers

### Custom Properties
- Custom property support for issues/epics
- Property templates
- Computed properties

---

## Documentation

### Built-in Docs
- In-app documentation
- Contextual help
- Keyboard shortcut reference
- API documentation browser

---

## Responsive UI (Extended)

### Window Modes
- Half screen optimization
- Full screen mode
- Quarter screen / 1/3 screen layouts
- Floating window support
- Mobile-first responsive
- Tablet support (per model, 3-year lookback)

### Cross-Browser Support
| Browser | Priority | Notes |
|---------|----------|-------|
| Chrome | High | Primary target |
| Firefox | High | |
| Safari | High | macOS/iOS |
| Chromium | Medium | Edge, Brave |
| Zen | Medium | Privacy-focused |
| Opera | Low | |
| Brave | Low | Chromium-based |
| Qutey | Low | Keyboard-focused |
| Lynx | Low | Text-only (TUI alternative) |

---

## Priority Matrix

| Category | Impact | Effort | Priority |
|----------|--------|--------|----------|
| Wiki-links & @mentions | High | Medium | High |
| Custom keyboard mapping | Medium | Low | High |
| GitHub Projects sync | High | High | Medium |
| Better-Auth integration | High | High | Medium |
| Static HTML generation | Medium | Medium | Medium |
| TUI alternative | Medium | High | Low |
| Lynx support | Low | High | Low |

---

## Notes

- These features should be revisited after Phase 5 completion
- Prioritization should be based on user feedback
- Some features may be contributed by community
- Breaking changes should be avoided where possible
