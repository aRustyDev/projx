# CONSTRAINT-002: REST API Cannot Create Pages

## Constraint
The Penpot REST API can create projects and files, but **cannot create pages**. Pages can only be created through the Plugin API (penpot-plugin MCP).

## API Capabilities Matrix

| Operation | REST API Endpoint | Plugin API |
|-----------|-------------------|------------|
| Create project | `create-project` | N/A |
| Create file | `create-file` | N/A |
| Create page | **Not available** | `penpot.createPage()` |
| List projects | `get-all-projects` | N/A |
| Get file | `get-file` | `penpot.getFile()` |
| Get pages | Via `get-file` response | `penpotUtils.getPages()` |

## REST API Endpoints (Documented)

### Available Creation Endpoints
```
create-project    - Creates a new project in a team
create-file       - Creates a new file in a project
```

### Not Available
```
create-page       - Does not exist in REST API
add-page          - Does not exist
```

## Plugin API for Page Creation

Using `penpot-plugin` MCP's `execute_code`:
```javascript
// Create a new page in the current file
const page = penpot.createPage();
page.name = "My New Page";

// Or with options
const page = penpot.createPage({ name: "Wireframes" });
```

## Impact on Automation

### What Can Be Automated (REST API)
- Project structure creation
- File creation within projects
- Reading/exporting designs
- Design token extraction

### What Requires Manual/Browser Interaction
- Page creation within files
- Shape creation and modification
- Component manipulation
- Any write operations to design content

## Recommended Workflow

```
1. Use REST API (scripted)          2. Use Browser + Plugin (manual)
   ├── Create project                  ├── Open each file
   ├── Create files                    ├── Connect plugin
   └── Done                            ├── Create pages
                                       └── Add content
```

## Script: penpot-setup.sh

The project includes `scripts/penpot-setup.sh` which automates step 1:
- Creates project via REST API
- Creates all design files via REST API
- Outputs file IDs for reference

Pages must then be created manually or via penpot-plugin (when working).

## Penpot Hierarchy

```
Team
└── Project (REST: create-project)
    └── File (REST: create-file)
        └── Page (Plugin API only)
            └── Shapes (Plugin API only)
```

## Related
- constraint-001-per-file-browser-connection.md
- See scripts/penpot-setup.sh for REST API automation
