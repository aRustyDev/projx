# Sketch Workflow Reference

> Document organization, collaboration, libraries, and project structure.

## Document Structure

### Page Organization

Sketch documents contain multiple pages for organizing work:

```
Document: project-ui.sketch
├── 📄 Cover
├── 📄 Wireframes
├── 📄 Components
├── 📄 Symbols
├── 📄 Archive
└── 📄 Exploration
```

### Recommended Page Structure

| Page | Purpose |
|------|---------|
| **Cover** | Document title, version, table of contents |
| **Wireframes** or **Screens** | Main design frames |
| **Components** | UI component specifications |
| **Symbols** | Symbol Masters (auto-created) |
| **Styles** | Color swatches, typography samples |
| **Archive** | Old versions, deprecated designs |

### Frame Layout on Canvas

```
Frames organized left-to-right by flow:

       100px gap           100px gap
          ↓                   ↓
┌──────────┐  ┌──────────┐  ┌──────────┐
│ 01-List  │  │ 02-Board │  │ 03-Modal │
│          │  │          │  │          │
│ y: 0     │  │ y: 0     │  │ y: 0     │
└──────────┘  └──────────┘  └──────────┘
x: 0        x: 1540       x: 3080

Modals/overlays below their parent:

┌──────────┐     ┌──────────┐
│ 01-List  │     │ 02-Board │
└──────────┘     └──────────┘
     ↓
┌──────────┐
│ 03-Detail│
│   Modal  │
└──────────┘
y: 1000
```

## Component Library Organization

### Symbol Masters Location

Keep Symbol Masters in a dedicated area:

```javascript
// Symbol library area (left of main canvas)
const SYMBOL_AREA = {
  x: -2000,  // Left of wireframes
  y: 0,
  labelOffset: 50  // Space for category labels
};

// Organize by category with spacing
const categories = [
  { name: 'Navigation', y: 0 },
  { name: 'Forms', y: 400 },
  { name: 'Buttons', y: 800 },
  { name: 'Cards', y: 1200 }
];
```

### Visual Organization

```
x: -2000                           x: 0
│                                  │
│  ╔═══════════════════════════╗  │  ┌──────────────────┐
│  ║   COMPONENT LIBRARY       ║  │  │  01-List-View    │
│  ╚═══════════════════════════╝  │  │                  │
│                                  │  │                  │
│  ── Navigation ──                │  └──────────────────┘
│  [NavBar] [Sidebar] [Tabs]      │
│                                  │  ┌──────────────────┐
│  ── Forms ──                     │  │  02-Board-View   │
│  [Input] [Select] [Checkbox]    │  │                  │
│                                  │  │                  │
│  ── Buttons ──                   │  └──────────────────┘
│  [Primary] [Secondary] [Icon]   │
│                                  │
```

## Libraries

### Types of Libraries

1. **Local Symbols** - Within current document
2. **Linked Libraries** - External .sketch files
3. **Sketch Cloud Libraries** - Team-synced via cloud

### Creating a Library

1. Create a .sketch file with Symbol Masters
2. Sketch → Preferences → Libraries
3. Click "Add Library..." and select file
4. Symbols now available in all documents

### Library Updates

When a library is updated:
- Badge appears on document icon
- Review changes before applying
- Choose per-symbol or update all

### Library Best Practices

```
team-design-system.sketch
├── 📄 Buttons
│   └── Primary, Secondary, Ghost, Icon
├── 📄 Forms
│   └── Input, Select, Checkbox, Radio
├── 📄 Navigation
│   └── NavBar, Sidebar, Tabs, Breadcrumbs
├── 📄 Feedback
│   └── Alert, Toast, Modal, Tooltip
└── 📄 Data Display
    └── Table, Card, List, Badge
```

## Version Control

### Sketch File Versioning

Sketch files are binary - Git shows them as changed but can't diff.

**Strategies:**

1. **Git LFS** - Store binary files efficiently
   ```bash
   git lfs track "*.sketch"
   ```

2. **Sketch Cloud** - Built-in version history
   - Automatic saves
   - Restore previous versions
   - No merge conflicts

3. **Abstract/Plant** - Design version control tools

### Manual Versioning

Name files with version suffix when not using version control:

```
project-wireframes-v1.sketch
project-wireframes-v2.sketch
project-wireframes-v2-alice-review.sketch
```

### Change Documentation

Keep a changelog within the document:

```
Cover Page:
┌─────────────────────────────────────┐
│ Project Wireframes                  │
│ Version: 2.3                        │
│ Last Updated: 2024-01-15            │
│                                     │
│ Changelog:                          │
│ v2.3 - Added filter panel           │
│ v2.2 - Updated nav component        │
│ v2.1 - Fixed modal styling          │
│ v2.0 - Major restructure            │
└─────────────────────────────────────┘
```

## Collaboration

### Sketch Cloud Sharing

1. Upload document to Sketch Cloud
2. Share link with team
3. Viewers can inspect and comment
4. Editors can make changes (with cloud subscription)

### Handoff to Developers

#### Inspect Mode
Developers can view:
- Dimensions and spacing
- Colors (hex, RGB)
- Typography specs
- Asset exports

#### Export Options

| Format | Use Case |
|--------|----------|
| PNG | Raster images, icons |
| SVG | Vector graphics, icons |
| PDF | Print, documentation |
| WebP | Web-optimized images |

#### CSS Code Generation

Sketch generates CSS for selected layers:
- Right-click → Copy → Copy CSS Attributes
- Or use Export dialog

```css
/* Generated CSS */
.button-primary {
  width: 120px;
  height: 40px;
  background: #3B82F6;
  border-radius: 6px;
  font-family: Inter;
  font-size: 14px;
  color: #FFFFFF;
}
```

## Project Templates

### Creating Templates

1. Set up document structure
2. Add placeholder content
3. Save as template: File → Save as Template

### Template Contents

```
project-template.sketch
├── 📄 Cover (project info placeholder)
├── 📄 Wireframes (blank with grid guides)
├── 📄 Components (common UI patterns)
├── 📄 Symbols (reusable components)
├── 📄 Styles (color/typography reference)
└── 📄 Archive (empty)

Pre-configured:
- Color Variables
- Text Styles
- Layer Styles
- Grid settings
- Export presets
```

## Asset Management

### Image Organization

```
Assets folder structure:
project/
├── sketch/
│   └── wireframes.sketch
└── assets/
    ├── icons/
    ├── images/
    └── exports/
```

### Linked vs Embedded Images

| Linked | Embedded |
|--------|----------|
| Smaller file size | Self-contained |
| Updates with source | Snapshot in time |
| Can break if moved | Always available |

## Plugins & Extensions

### Useful Plugins

| Plugin | Purpose |
|--------|---------|
| **Runner** | Quick actions keyboard |
| **Rename It** | Batch layer renaming |
| **Stark** | Accessibility checker |
| **Content Generator** | Placeholder data |
| **Automate** | Batch operations |

### MCP Integration

Sketch MCP server enables programmatic control:
- Script-based design generation
- Batch modifications
- Automated exports

See [MCP API Patterns](./mcp-api.md) for details.

## File Management

### Reduce File Size

1. Remove unused symbols
2. Flatten complex paths
3. Optimize images (TinyPNG)
4. Delete hidden layers
5. Purge unused styles

### Performance Tips

- Keep single document under 100MB
- Split large projects into multiple files
- Use linked libraries over duplicating symbols
- Rasterize complex effects for preview

## Review Workflow

### Design Review Process

```
1. Designer creates/updates
       ↓
2. Push to Sketch Cloud
       ↓
3. Share link with reviewers
       ↓
4. Reviewers add comments
       ↓
5. Designer addresses feedback
       ↓
6. Mark comments as resolved
       ↓
7. Final approval
```

### Comment Best Practices

- Pin comments to specific elements
- Use @mentions for assignments
- Mark resolved when addressed
- Archive old comment threads

## Related References
- [Naming Conventions](./naming.md)
- [Version History](./versioning.md)
- [MCP API Patterns](./mcp-api.md)
