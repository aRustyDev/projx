# Sketch Versioning Reference

> File versions, history, exports, and change management.

## Built-in Version History

### Sketch Cloud Versioning

When saving to Sketch Cloud:
- Automatic version snapshots on save
- View history in web interface
- Restore any previous version
- No merge conflicts (single-writer model)

### Local Version History

macOS Versions integration:
- File → Revert To → Browse All Versions
- Time Machine-style interface
- Automatic snapshots on save

## Manual Versioning

### File Naming Convention

```
project-wireframes-v1.0.sketch    ← Initial release
project-wireframes-v1.1.sketch    ← Minor update
project-wireframes-v2.0.sketch    ← Major revision

project-wireframes-v1.0-draft.sketch    ← Work in progress
project-wireframes-v1.0-review.sketch   ← Under review
project-wireframes-v1.0-final.sketch    ← Approved version
```

### Semantic Versioning

Apply semver principles to design files:

| Version | Meaning |
|---------|---------|
| **1.0.0** | Initial release |
| **1.0.1** | Bug fix (typo, alignment) |
| **1.1.0** | New feature/screen added |
| **2.0.0** | Major redesign |

### Date-Based Versioning

Alternative for rapid iteration:

```
project-wireframes-2024-01-15.sketch
project-wireframes-2024-01-16.sketch
project-wireframes-2024-01-16-v2.sketch  ← Multiple same day
```

## Version Documentation

### In-Document Changelog

Add a Cover page with version info:

```
┌─────────────────────────────────────────────────┐
│  Project: Beads UI Wireframes                   │
│  Version: 2.1.0                                 │
│  Last Updated: 2024-01-15                       │
│  Author: Design Team                            │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  CHANGELOG                                      │
│                                                 │
│  v2.1.0 (2024-01-15)                           │
│  • Added filter panel wireframe                 │
│  • Updated navigation component                 │
│  • Fixed modal spacing issues                   │
│                                                 │
│  v2.0.0 (2024-01-10)                           │
│  • Major restructure of information arch        │
│  • New dashboard view                           │
│  • Renamed frames for consistency               │
│                                                 │
│  v1.0.0 (2024-01-05)                           │
│  • Initial wireframe release                    │
│  • 8 core screens                               │
└─────────────────────────────────────────────────┘
```

### External Changelog

Maintain a separate CHANGELOG.md:

```markdown
# Design Changelog

## [2.1.0] - 2024-01-15

### Added
- Filter panel wireframe (04-Filter-Panel)
- Advanced search options
- Saved filter presets

### Changed
- Navigation component updated with new icons
- Modal overlay darkened for better contrast

### Fixed
- Spacing in issue detail modal
- Text alignment in cards

## [2.0.0] - 2024-01-10

### Breaking Changes
- Renamed all frames with numeric prefixes
- Restructured symbol library

### Added
- Dashboard view with metrics
- Graph view for dependencies
```

## Git Integration

### Git LFS Setup

Sketch files are binary; use Git LFS:

```bash
# Initialize LFS
git lfs install

# Track Sketch files
git lfs track "*.sketch"

# Commit tracking file
git add .gitattributes
git commit -m "Track Sketch files with LFS"
```

### .gitattributes

```
*.sketch filter=lfs diff=lfs merge=lfs -text
*.png filter=lfs diff=lfs merge=lfs -text
*.jpg filter=lfs diff=lfs merge=lfs -text
```

### Commit Messages for Design

```bash
# Feature
git commit -m "design: add filter panel wireframe"

# Fix
git commit -m "design: fix modal spacing in detail view"

# Update
git commit -m "design: update navigation component"

# Refactor
git commit -m "design: reorganize symbol library"
```

## Export Workflows

### Exporting Assets

```javascript
// Export all frames as PNG
const frames = page.layers.filter(l => l.type === 'Artboard');
frames.forEach(frame => {
  frame.exportFormats = [{
    fileFormat: 'png',
    scale: 2  // @2x
  }];
});
```

### Export Presets

| Preset | Use Case | Settings |
|--------|----------|----------|
| **iOS** | Mobile assets | @1x, @2x, @3x PNG |
| **Android** | Mobile assets | mdpi, hdpi, xhdpi, xxhdpi |
| **Web** | Web assets | @1x, @2x PNG/WebP |
| **SVG** | Vector icons | SVG |
| **PDF** | Documentation | PDF |

### Batch Export Script

```javascript
// Export configuration
const exportConfig = {
  format: 'png',
  scales: [1, 2],
  prefix: '',
  suffix: ''
};

// Export all frames
document.pages.forEach(page => {
  page.layers
    .filter(l => l.type === 'Artboard')
    .forEach(frame => {
      frame.exportFormats = exportConfig.scales.map(scale => ({
        fileFormat: exportConfig.format,
        scale: scale,
        name: `${exportConfig.prefix}${frame.name}${exportConfig.suffix}`
      }));
    });
});
```

## Branching Strategies

### For Design Tools

Unlike code, Sketch files can't merge. Strategies:

1. **Single Source of Truth**
   - One main file, one editor at a time
   - Use Sketch Cloud for serialized editing

2. **Component Isolation**
   - Separate files for different areas
   - Link via Libraries
   - Reduces conflicts

3. **Duplicate for Experiments**
   - Copy file for exploration
   - Manually merge approved changes
   - Delete experimental files

### Branch Naming (for Git)

```
design/feature/filter-panel
design/fix/modal-spacing
design/exploration/new-nav
design/update/component-library
```

## Backup Strategies

### Local Backups

```bash
# Automated backup script
cp project.sketch "backups/project-$(date +%Y%m%d-%H%M%S).sketch"

# Keep last 10 backups
ls -t backups/*.sketch | tail -n +11 | xargs rm -f
```

### Cloud Backups

- **Sketch Cloud**: Automatic with paid plan
- **Dropbox/iCloud**: Sync folder location
- **Time Machine**: macOS automatic backups

### Recovery Points

Create explicit recovery points before major changes:

```
project-wireframes-v1.2.sketch                    ← Current
project-wireframes-v1.2-before-restructure.sketch ← Recovery point
project-wireframes-v1.2-after-restructure.sketch  ← After change
```

## Comparing Versions

### Visual Diff Tools

- **Sketch itself**: Open two versions side-by-side
- **Kaleidoscope**: Visual file diff (supports Sketch)
- **Abstract**: Built-in visual diff

### Manual Comparison

```
Side-by-side comparison:
┌──────────────────┐    ┌──────────────────┐
│     v1.0         │    │     v2.0         │
│                  │    │                  │
│  [Old Header]    │ vs │  [New Header]    │
│  [Old Layout]    │    │  [New Layout]    │
│                  │    │                  │
└──────────────────┘    └──────────────────┘
```

## Deprecation

### Archiving Old Versions

1. Move to Archive page within document
2. Prefix with `[DEPRECATED]`
3. Add note explaining replacement

```
Archive Page:
┌─────────────────────────────────────────────────┐
│  [DEPRECATED] Old Navigation                    │
│  Replaced by: Components/Navigation/NavBar v2   │
│  Deprecated: 2024-01-15                         │
│  Remove after: 2024-02-15                       │
└─────────────────────────────────────────────────┘
```

### Symbol Deprecation

```
Symbol naming for deprecated:
Components/[DEPRECATED] Old Button
Components/Buttons/Primary  ← Current version
```

## Release Process

### Design Release Checklist

```markdown
## Pre-Release Checklist

- [ ] All frames named consistently
- [ ] Symbols organized in library
- [ ] No orphaned layers
- [ ] Version number updated
- [ ] Changelog documented
- [ ] Exports generated
- [ ] Prototype links working
- [ ] Shared with stakeholders
- [ ] Feedback addressed
- [ ] Final approval received
```

### Release Artifact Generation

```bash
# Generate release artifacts
mkdir -p releases/v2.1.0

# Export final Sketch file
cp project-wireframes.sketch releases/v2.1.0/

# Export PNG previews
# (via Sketch export)

# Generate changelog excerpt
head -50 CHANGELOG.md > releases/v2.1.0/CHANGES.md

# Create release notes
cat > releases/v2.1.0/README.md << EOF
# Design Release v2.1.0

## What's New
- Filter panel wireframe
- Updated navigation

## Files
- project-wireframes.sketch - Main design file
- exports/ - PNG exports of all screens
EOF
```

## Related References
- [Workflow & Organization](./workflow.md)
- [Naming Conventions](./naming.md)
- [MCP API Patterns](./mcp-api.md)
