# Sketch Plugin Code Patterns for Wireframing

> Reusable code snippets for creating wireframes programmatically in Sketch via MCP.

---

## Setup and Initialization

### Check Connection and Open Documents

```javascript
const sketch = require('sketch')
const doc = sketch.getSelectedDocument()
const docs = sketch.Document.getDocuments()
console.log('Documents open:', docs.length)
console.log('Selected document:', doc ? doc.path : 'none')
```

### Create New Document

```javascript
const sketch = require('sketch')
const doc = new sketch.Document()
doc.pages[0].name = 'Wireframes'
```

### Save Document

```javascript
doc.save('/path/to/file.sketch', (err) => {
  if (err) console.log('Error:', err)
  else console.log('Saved successfully')
})
```

---

## Design Tokens Pattern

Define a reusable color palette object at the start of each script:

```javascript
const colors = {
  // Backgrounds
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F9FAFB',
  bgTertiary: '#F3F4F6',
  bgOverlay: '#00000080',

  // Borders
  borderLight: '#E5E7EB',
  borderMedium: '#D1D5DB',

  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',

  // Brand
  primary: '#3B82F6',

  // RAG Status
  ragRed: '#EF4444',
  ragAmber: '#F59E0B',
  ragGreen: '#22C55E',
  ragGray: '#6B7280',

  // Semantic
  criticalBg: '#FEF2F2',
  criticalBorder: '#EF4444',
  warningBg: '#FFFBEB',
  warningBorder: '#F59E0B',
  successBg: '#F0FDF4',
  successBorder: '#22C55E'
}
```

---

## Core Element Creation

### Create a Frame (Artboard)

```javascript
const { Group } = require('sketch/dom')

const frame = new Group.Frame({
  name: 'Frame-Name',
  frame: { x: 0, y: 0, width: 1440, height: 900 },
  parent: page,
  style: { fills: [{ color: '#FFFFFF' }] }
})
```

### Create a Rectangle

```javascript
const { Rectangle } = require('sketch/dom')

// Basic rectangle
new Rectangle({
  name: 'RectName',
  frame: { x: 0, y: 0, width: 100, height: 50 },
  parent: frame,
  style: {
    fills: [{ color: '#FFFFFF' }],
    borders: [{ color: '#E5E7EB', thickness: 1 }],
    borderRadius: 8
  }
})
```

### Create Text

```javascript
const { Text } = require('sketch/dom')

new Text({
  name: 'TextName',
  text: 'Hello World',
  frame: { x: 0, y: 0, width: 200, height: 24 },
  parent: frame,
  style: {
    textColor: '#111827',
    fontSize: 14,
    fontWeight: 6,  // 5=regular, 6=medium, 7=bold
    lineHeight: 20,
    alignment: Text.Alignment.center  // left, center, right
  }
})
```

---

## Reusable Component Patterns

### Navigation Bar

```javascript
function createNavBar(frame, colors, activeIndex = 0) {
  const { Rectangle, Text } = require('sketch/dom')

  // Background
  new Rectangle({
    name: 'NavBar',
    frame: { x: 0, y: 0, width: 1440, height: 56 },
    parent: frame,
    style: {
      fills: [{ color: colors.bgPrimary }],
      borders: [{ color: colors.borderLight, thickness: 1 }]
    }
  })

  // Logo
  new Text({
    name: 'Logo',
    text: '◆ AppName',
    frame: { x: 24, y: 16, width: 100, height: 24 },
    parent: frame,
    style: { textColor: colors.primary, fontSize: 16, fontWeight: 7 }
  })

  // Nav items
  const navItems = ['Home', 'Items', 'Board', 'Settings']
  navItems.forEach((item, i) => {
    new Text({
      name: `Nav-${item}`,
      text: item,
      frame: { x: 140 + (i * 80), y: 18, width: 70, height: 20 },
      parent: frame,
      style: {
        textColor: i === activeIndex ? colors.primary : colors.textSecondary,
        fontSize: 14,
        fontWeight: i === activeIndex ? 6 : 5
      }
    })
  })
}
```

### Card Component

```javascript
function createCard(frame, colors, options) {
  const { Rectangle, Text } = require('sketch/dom')
  const { x, y, width, height, title, subtitle, meta } = options

  // Card background
  new Rectangle({
    name: `Card-${title}`,
    frame: { x, y, width, height },
    parent: frame,
    style: {
      fills: [{ color: colors.bgPrimary }],
      borders: [{ color: colors.borderLight, thickness: 1 }],
      borderRadius: 8
    }
  })

  // Title
  new Text({
    name: `CardTitle-${title}`,
    text: title,
    frame: { x: x + 16, y: y + 16, width: width - 32, height: 24 },
    parent: frame,
    style: { textColor: colors.textPrimary, fontSize: 15, fontWeight: 6 }
  })

  // Subtitle
  if (subtitle) {
    new Text({
      name: `CardSubtitle-${title}`,
      text: subtitle,
      frame: { x: x + 16, y: y + 44, width: width - 32, height: 20 },
      parent: frame,
      style: { textColor: colors.textSecondary, fontSize: 13 }
    })
  }

  // Meta
  if (meta) {
    new Text({
      name: `CardMeta-${title}`,
      text: meta,
      frame: { x: x + 16, y: y + height - 32, width: width - 32, height: 18 },
      parent: frame,
      style: { textColor: colors.textMuted, fontSize: 12 }
    })
  }
}
```

### Button Component

```javascript
function createButton(frame, colors, options) {
  const { Rectangle, Text } = require('sketch/dom')
  const { x, y, width = 120, height = 40, label, variant = 'primary' } = options

  const isPrimary = variant === 'primary'

  new Rectangle({
    name: `Btn-${label}`,
    frame: { x, y, width, height },
    parent: frame,
    style: {
      fills: [{ color: isPrimary ? colors.primary : colors.bgSecondary }],
      borders: isPrimary ? [] : [{ color: colors.borderLight, thickness: 1 }],
      borderRadius: 6
    }
  })

  new Text({
    name: `BtnText-${label}`,
    text: label,
    frame: { x: x + 12, y: y + 10, width: width - 24, height: 20 },
    parent: frame,
    style: {
      textColor: isPrimary ? '#FFFFFF' : colors.textPrimary,
      fontSize: 14,
      fontWeight: 6,
      alignment: Text.Alignment.center
    }
  })
}
```

### Input Field

```javascript
function createInput(frame, colors, options) {
  const { Rectangle, Text } = require('sketch/dom')
  const { x, y, width, height = 40, label, placeholder, required = false } = options

  let currentY = y

  // Label
  if (label) {
    new Text({
      name: `InputLabel-${label}`,
      text: required ? `${label} *` : label,
      frame: { x, y: currentY, width, height: 20 },
      parent: frame,
      style: { textColor: colors.textPrimary, fontSize: 14, fontWeight: 6 }
    })
    currentY += 28
  }

  // Input box
  new Rectangle({
    name: `Input-${label || placeholder}`,
    frame: { x, y: currentY, width, height },
    parent: frame,
    style: {
      fills: [{ color: colors.bgPrimary }],
      borders: [{ color: colors.borderLight, thickness: 1 }],
      borderRadius: 6
    }
  })

  // Placeholder
  if (placeholder) {
    new Text({
      name: `InputPlaceholder-${label || placeholder}`,
      text: placeholder,
      frame: { x: x + 12, y: currentY + 10, width: width - 24, height: 20 },
      parent: frame,
      style: { textColor: colors.textMuted, fontSize: 14 }
    })
  }

  return currentY + height
}
```

### Modal/Dialog

```javascript
function createModal(frame, colors, options) {
  const { Rectangle, Text } = require('sketch/dom')
  const { title, width = 700, height = 500 } = options

  const x = (1440 - width) / 2
  const y = (900 - height) / 2

  // Overlay
  new Rectangle({
    name: 'ModalOverlay',
    frame: { x: 0, y: 0, width: 1440, height: 900 },
    parent: frame,
    style: { fills: [{ color: colors.bgOverlay }] }
  })

  // Modal background
  new Rectangle({
    name: 'ModalBg',
    frame: { x, y, width, height },
    parent: frame,
    style: { fills: [{ color: colors.bgPrimary }], borderRadius: 12 }
  })

  // Title
  new Text({
    name: 'ModalTitle',
    text: title,
    frame: { x: x + 32, y: y + 28, width: width - 80, height: 28 },
    parent: frame,
    style: { textColor: colors.textPrimary, fontSize: 20, fontWeight: 7 }
  })

  // Close button
  new Text({
    name: 'ModalClose',
    text: '[×]',
    frame: { x: x + width - 50, y: y + 28, width: 30, height: 28 },
    parent: frame,
    style: { textColor: colors.textSecondary, fontSize: 18 }
  })

  return { x, y, width, height, contentY: y + 72 }
}
```

---

## Layout Helpers

### Grid of Cards

```javascript
function createCardGrid(frame, colors, options) {
  const { startX, startY, cardWidth, cardHeight, gap, columns, items } = options

  items.forEach((item, i) => {
    const col = i % columns
    const row = Math.floor(i / columns)
    const x = startX + (col * (cardWidth + gap))
    const y = startY + (row * (cardHeight + gap))

    createCard(frame, colors, {
      x, y,
      width: cardWidth,
      height: cardHeight,
      ...item
    })
  })
}
```

### Kanban Columns

```javascript
function createKanbanColumns(frame, colors, options) {
  const { Rectangle, Text } = require('sketch/dom')
  const { startX, startY, colWidth, colHeight, gap, columns } = options

  columns.forEach((col, i) => {
    const x = startX + (i * (colWidth + gap))

    // Column background
    new Rectangle({
      name: `Col-${col.name}`,
      frame: { x, y: startY, width: colWidth, height: colHeight },
      parent: frame,
      style: { fills: [{ color: colors.bgSecondary }], borderRadius: 8 }
    })

    // Column header
    new Text({
      name: `ColHeader-${col.name}`,
      text: `${col.icon || ''} ${col.name} (${col.count || 0})`,
      frame: { x: x + 16, y: startY + 16, width: colWidth - 32, height: 24 },
      parent: frame,
      style: { textColor: colors.textPrimary, fontSize: 14, fontWeight: 6 }
    })
  })
}
```

### Progress Bar

```javascript
function createProgressBar(frame, colors, options) {
  const { Rectangle, Text } = require('sketch/dom')
  const { x, y, width, height = 8, progress, showLabel = true } = options

  // Track
  new Rectangle({
    name: 'ProgressTrack',
    frame: { x, y, width, height },
    parent: frame,
    style: { fills: [{ color: colors.bgSecondary }], borderRadius: height / 2 }
  })

  // Fill
  const fillWidth = (progress / 100) * width
  if (fillWidth > 0) {
    new Rectangle({
      name: 'ProgressFill',
      frame: { x, y, width: fillWidth, height },
      parent: frame,
      style: {
        fills: [{ color: progress >= 70 ? colors.ragGreen : colors.ragAmber }],
        borderRadius: height / 2
      }
    })
  }

  // Label
  if (showLabel) {
    new Text({
      name: 'ProgressLabel',
      text: `${progress}%`,
      frame: { x: x + width + 12, y: y - 4, width: 50, height: 16 },
      parent: frame,
      style: { textColor: colors.textSecondary, fontSize: 12 }
    })
  }
}
```

---

## Iteration Patterns

### Create Items from Array

```javascript
const items = [
  { id: '#1', title: 'First item', status: 'Open' },
  { id: '#2', title: 'Second item', status: 'Done' },
]

items.forEach((item, i) => {
  const yPos = 100 + (i * 80)  // 80px spacing between items

  // Create card at calculated position
  createCard(frame, colors, {
    x: 40,
    y: yPos,
    width: 400,
    height: 70,
    title: `${item.id} ${item.title}`,
    meta: item.status
  })
})
```

### Find and Modify Existing Layers

```javascript
const doc = sketch.getSelectedDocument()
const page = doc.pages[0]

// Find frame by name
const frame = page.layers.find(l => l.name === '01-Issue-List-View')

// Find all frames matching pattern
const wireframes = page.layers.filter(l => l.name.match(/^\d{2}-/))

// Modify layer
if (frame) {
  frame.frame.width = 1920  // Change size
}
```

---

## Complete Wireframe Template

```javascript
const sketch = require('sketch')
const { Group, Text, Rectangle } = require('sketch/dom')

// Get document and page
const doc = sketch.getSelectedDocument()
const page = doc.pages[0]

// Design tokens
const colors = {
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F9FAFB',
  borderLight: '#E5E7EB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  primary: '#3B82F6'
}

// Create frame
const frame = new Group.Frame({
  name: 'XX-Wireframe-Name',
  frame: { x: 0, y: 0, width: 1440, height: 900 },
  parent: page,
  style: { fills: [{ color: colors.bgPrimary }] }
})

// Add navigation bar
new Rectangle({
  name: 'NavBar',
  frame: { x: 0, y: 0, width: 1440, height: 56 },
  parent: frame,
  style: {
    fills: [{ color: colors.bgPrimary }],
    borders: [{ color: colors.borderLight, thickness: 1 }]
  }
})

new Text({
  name: 'Logo',
  text: '◆ AppName',
  frame: { x: 24, y: 16, width: 100, height: 24 },
  parent: frame,
  style: { textColor: colors.primary, fontSize: 16, fontWeight: 7 }
})

// Add page title
new Text({
  name: 'PageTitle',
  text: 'Page Title',
  frame: { x: 40, y: 80, width: 200, height: 32 },
  parent: frame,
  style: { textColor: colors.textPrimary, fontSize: 24, fontWeight: 7 }
})

// Add content here...

console.log('Created wireframe')
```

---

## Tips and Best Practices

1. **Always use design tokens** - Define colors once and reference them throughout
2. **Name layers descriptively** - Makes finding and modifying layers easier
3. **Use consistent spacing** - Define gaps/margins as variables
4. **Create reusable functions** - Extract common patterns into functions
5. **Position frames horizontally** - Place each wireframe at x = 1500 * index for easy viewing
6. **Log progress** - Use `console.log()` to track what's created
7. **Save frequently** - Call `doc.save()` after major changes
8. **Handle errors gracefully** - Check if layers exist before modifying

---

## Common Issues and Solutions

### Style Not Applying
**Wrong**: `shape.style.fills = [...]` (after creation)
**Right**: Pass `style` in constructor options

### Text Overflow
Set explicit `width` and `height` for text layers, and use `lineHeight` for multi-line text.

### Finding Layers
Use `page.layers.find()` or `page.layers.filter()` with name matching.

### Frame Positioning
Place frames side-by-side: `x: frameIndex * (frameWidth + 60)`

---

## Additional Components

### Filter Dropdown

```javascript
function createFilterDropdown(frame, colors, options) {
  const { Rectangle, Text } = require('sketch/dom')
  const { x, y, width = 160, items, title } = options

  // Dropdown container
  new Rectangle({
    name: `Dropdown-${title}`,
    frame: { x, y, width, height: items.length * 28 + 70 },
    parent: frame,
    style: {
      fills: [{ color: colors.bgPrimary }],
      borders: [{ color: colors.borderMedium, thickness: 1 }],
      borderRadius: 6
    }
  })

  // Items with checkboxes
  items.forEach((item, i) => {
    const checked = item.checked ? '☑' : '☐'
    new Text({
      name: `DropdownItem-${i}`,
      text: `${checked} ${item.label}`,
      frame: { x: x + 12, y: y + 12 + (i * 28), width: width - 24, height: 24 },
      parent: frame,
      style: { textColor: colors.textPrimary, fontSize: 14 }
    })
  })

  // Divider
  const dividerY = y + 12 + (items.length * 28)
  new Rectangle({
    name: 'DropdownDivider',
    frame: { x: x + 12, y: dividerY, width: width - 24, height: 1 },
    parent: frame,
    style: { fills: [{ color: colors.borderLight }] }
  })

  // Actions
  new Text({
    name: 'SelectAll',
    text: '[Select All]',
    frame: { x: x + 12, y: dividerY + 10, width: width - 24, height: 24 },
    parent: frame,
    style: { textColor: colors.primary, fontSize: 13 }
  })

  new Text({
    name: 'Clear',
    text: '[Clear]',
    frame: { x: x + 12, y: dividerY + 35, width: width - 24, height: 24 },
    parent: frame,
    style: { textColor: colors.primary, fontSize: 13 }
  })
}
```

### Filter Chips Row

```javascript
function createFilterChips(frame, colors, options) {
  const { Rectangle, Text } = require('sketch/dom')
  const { x, y, chips } = options

  // Chip colors
  const chipBg = '#E0F2FE'
  const chipText = '#0369A1'

  let currentX = x
  chips.forEach((chip, i) => {
    const chipWidth = chip.length * 7 + 24

    new Rectangle({
      name: `Chip-${i}`,
      frame: { x: currentX, y, width: chipWidth, height: 28 },
      parent: frame,
      style: { fills: [{ color: chipBg }], borderRadius: 4 }
    })

    new Text({
      name: `ChipText-${i}`,
      text: `${chip} [×]`,
      frame: { x: currentX + 8, y: y + 6, width: chipWidth - 16, height: 16 },
      parent: frame,
      style: { textColor: chipText, fontSize: 12 }
    })

    currentX += chipWidth + 8
  })
}
```

### Configuration Modal

```javascript
function createConfigModal(frame, colors, options) {
  const { Rectangle, Text } = require('sketch/dom')
  const { title, width = 560, height = 500 } = options

  const x = (1440 - width) / 2
  const y = (900 - height) / 2

  // Overlay
  new Rectangle({
    name: 'ModalOverlay',
    frame: { x: 0, y: 0, width: 1440, height: 900 },
    parent: frame,
    style: { fills: [{ color: colors.bgOverlay }] }
  })

  // Modal background
  new Rectangle({
    name: 'ModalBg',
    frame: { x, y, width, height },
    parent: frame,
    style: { fills: [{ color: colors.bgPrimary }], borderRadius: 12 }
  })

  // Title
  new Text({
    name: 'ModalTitle',
    text: title,
    frame: { x: x + 32, y: y + 24, width: width - 80, height: 28 },
    parent: frame,
    style: { textColor: colors.textPrimary, fontSize: 20, fontWeight: 7 }
  })

  // Close button
  new Text({
    name: 'ModalClose',
    text: '[×]',
    frame: { x: x + width - 50, y: y + 24, width: 30, height: 28 },
    parent: frame,
    style: { textColor: colors.textSecondary, fontSize: 18 }
  })

  return { x, y, width, height, contentY: y + 64 }
}
```

### Form Input with Label

```javascript
function createFormField(frame, colors, options) {
  const { Rectangle, Text } = require('sketch/dom')
  const { x, y, label, value, unit, description } = options

  let currentY = y

  // Label
  new Text({
    name: `Label-${label}`,
    text: label,
    frame: { x, y: currentY, width: 200, height: 24 },
    parent: frame,
    style: { textColor: colors.textPrimary, fontSize: 15, fontWeight: 6 }
  })
  currentY += 28

  // Description
  if (description) {
    new Text({
      name: `Desc-${label}`,
      text: description,
      frame: { x, y: currentY, width: 400, height: 18 },
      parent: frame,
      style: { textColor: colors.textSecondary, fontSize: 13 }
    })
    currentY += 24
  }

  // Value input
  new Rectangle({
    name: `Input-${label}`,
    frame: { x, y: currentY, width: 100, height: 40 },
    parent: frame,
    style: {
      fills: [{ color: colors.bgPrimary }],
      borders: [{ color: colors.borderMedium, thickness: 1 }],
      borderRadius: 6
    }
  })

  new Text({
    name: `Value-${label}`,
    text: value,
    frame: { x: x + 36, y: currentY + 10, width: 28, height: 20 },
    parent: frame,
    style: { textColor: colors.textPrimary, fontSize: 16 }
  })

  // Unit dropdown (if provided)
  if (unit) {
    new Rectangle({
      name: `Unit-${label}`,
      frame: { x: x + 116, y: currentY, width: 120, height: 40 },
      parent: frame,
      style: {
        fills: [{ color: colors.bgPrimary }],
        borders: [{ color: colors.borderMedium, thickness: 1 }],
        borderRadius: 6
      }
    })

    new Text({
      name: `UnitText-${label}`,
      text: `${unit}        ▼`,
      frame: { x: x + 132, y: currentY + 10, width: 88, height: 20 },
      parent: frame,
      style: { textColor: colors.textPrimary, fontSize: 14 }
    })
  }

  return currentY + 56
}
```

### Preview Section

```javascript
function createPreviewSection(frame, colors, options) {
  const { Rectangle, Text } = require('sketch/dom')
  const { x, y, width, items } = options

  // Background
  new Rectangle({
    name: 'PreviewBg',
    frame: { x, y, width, height: items.length * 40 + 20 },
    parent: frame,
    style: { fills: [{ color: colors.bgSecondary }], borderRadius: 6 }
  })

  // Items with status indicators
  items.forEach((item, i) => {
    const icon = item.status === 'critical' ? '🔴' :
                 item.status === 'warning' ? '🟡' : '✅'
    const textColor = item.status === 'critical' ? colors.ragRed :
                      item.status === 'warning' ? colors.ragAmber :
                      colors.ragGreen

    new Text({
      name: `Preview-${i}`,
      text: `${icon} ${item.text}`,
      frame: { x: x + 16, y: y + 12 + (i * 40), width: width - 32, height: 20 },
      parent: frame,
      style: { textColor, fontSize: 13 }
    })

    if (item.detail) {
      new Text({
        name: `PreviewDetail-${i}`,
        text: item.detail,
        frame: { x: x + 36, y: y + 32 + (i * 40), width: width - 52, height: 16 },
        parent: frame,
        style: { textColor: colors.textMuted, fontSize: 12 }
      })
    }
  })
}
```

---

## Extended Design Tokens

```javascript
const extendedColors = {
  // Base (from original)
  bgPrimary: '#FFFFFF',
  bgSecondary: '#F9FAFB',
  bgTertiary: '#F3F4F6',
  bgOverlay: '#00000080',
  borderLight: '#E5E7EB',
  borderMedium: '#D1D5DB',
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  primary: '#3B82F6',

  // RAG Status
  ragRed: '#EF4444',
  ragAmber: '#F59E0B',
  ragGreen: '#22C55E',

  // Filter chips
  filterChipBg: '#E0F2FE',
  filterChipText: '#0369A1',

  // Status backgrounds
  criticalBg: '#FEF2F2',
  warningBg: '#FFFBEB',
  successBg: '#F0FDF4'
}
```
