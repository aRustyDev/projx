# Sketch Symbols Reference

> Reusable design components that maintain consistency across documents.

## Core Concepts

### Symbol Master
The **source definition** of a Symbol. Changes to the master propagate to all instances.

- Lives on a dedicated Symbols page or anywhere in document
- Has a unique `symbolId` identifier
- Contains the "ground truth" for the component's structure
- Naming convention: `Category/Subcategory/Name` (e.g., `Components/Buttons/Primary`)

### Symbol Instance
A **reference** to a Symbol Master placed in your design.

- Inherits all properties from its master
- Can have **overrides** to customize specific properties
- Automatically updates when master changes
- Multiple instances can exist across pages

## Creating Symbols

### From Existing Layers (UI Method)
1. Select layers to convert
2. Right-click → Create Symbol
3. Or use Layer → Create Symbol (Cmd+Shift+K)

### Programmatically via MCP

```javascript
// Create a SymbolMaster directly
const symbolMaster = new SymbolMaster({
  name: 'Components/Button/Primary',
  frame: { x: 0, y: 0, width: 200, height: 48 },
  parent: symbolsPage
});

// Add children to the master
const background = new Rectangle({
  name: 'Background',
  frame: { x: 0, y: 0, width: 200, height: 48 },
  parent: symbolMaster,
  style: {
    fills: [{ color: '#3B82F6FF' }],
    borders: []
  }
});

// ⚠️ Note: SymbolMaster.fromGroup() is NOT a valid method
// Always create SymbolMaster directly with constructor
```

## Inserting Symbol Instances

### Programmatically
```javascript
// Find the master symbol
const masters = document.getSymbolMasterWithID(symbolId);
// OR search by name
const allMasters = document.getSymbols();
const master = allMasters.find(s => s.name === 'Components/NavBar');

// Create instance
const instance = master.createNewInstance();
instance.frame = { x: 100, y: 100, width: 200, height: 48 };
instance.parent = targetArtboard;
```

## Overrides

Overrides allow customizing instances without affecting the master.

### Override Types
| Type | Description | Example |
|------|-------------|---------|
| Text | Change text content | Button label |
| Image | Swap fill images | Avatar photos |
| Nested Symbol | Swap nested symbols | Icon variations |
| Color | Override fill/border colors | Theme variants |
| Style | Override text/layer styles | Bold vs regular |

### Accessing Overrides Programmatically
```javascript
// Get available overrides
const overrides = instance.overrides;

// Set text override
instance.setOverrideValue(overrides[0], 'New Label');

// Set nested symbol override
instance.setOverrideValue(overrides[1], anotherSymbolId);
```

## Nesting Symbols

Symbols can contain other Symbol instances, enabling:
- **Atomic design**: Build complex components from simple ones
- **Swap variations**: Change nested symbols via overrides
- **Consistent updates**: Changes cascade through hierarchy

### Example Structure
```
Button/Primary (Master)
├── Icon (Symbol Instance → Icons/Arrow)
├── Label (Text)
└── Background (Rectangle)
```

## Organizing Symbols

### Naming Convention
Use forward slashes to create hierarchy in the Insert menu:

```
Components/
├── Buttons/
│   ├── Primary
│   ├── Secondary
│   └── Ghost
├── Forms/
│   ├── Input
│   ├── Checkbox
│   └── Select
└── Navigation/
    ├── NavBar
    ├── Sidebar
    └── Breadcrumbs
```

### Symbol Sources
Symbols can come from:
1. **Local document** - Defined in current file
2. **Linked libraries** - Shared across documents
3. **Sketch Cloud** - Team-synced components

## Symbol Libraries

### Creating a Library
1. Create a document with Symbol Masters
2. Save and add to Sketch via Preferences → Libraries
3. Symbols appear in Insert menu for all documents

### Updating Libraries
When a library updates:
- Sketch shows notification badge
- Choose to update individual symbols or all
- Review changes before applying

## Best Practices

### Do
- Use consistent naming conventions
- Keep masters organized on dedicated page
- Design for common override scenarios
- Create size variations as separate symbols

### Don't
- Nest symbols too deeply (max 3-4 levels)
- Create overly complex symbols with many overrides
- Forget to organize symbols into categories
- Use vague names like "Component 1"

## Detaching Instances

To break the link between instance and master:

```javascript
// Programmatically detach
instance.detach();
// Instance becomes a regular Group
```

Use cases:
- One-off customizations
- Breaking inheritance for specific needs
- Converting to static layers for export

## Symbol Page Layout

Recommended organization for Symbol Masters:

```
Symbol Page Layout:
x: -2000 (left of main canvas)
┌─────────────────────────────────┐
│ ═══ COMPONENT LIBRARY ═══       │
│                                 │
│ ── Buttons ──                   │
│ [Primary] [Secondary] [Ghost]   │
│                                 │
│ ── Forms ──                     │
│ [Input] [Select] [Checkbox]     │
│                                 │
│ ── Navigation ──                │
│ [NavBar] [Sidebar] [Tabs]       │
└─────────────────────────────────┘
```

## Related References
- [Overrides Deep Dive](./overrides.md)
- [Libraries & Sharing](./workflow.md#libraries)
- [MCP API Patterns](./mcp-api.md)
