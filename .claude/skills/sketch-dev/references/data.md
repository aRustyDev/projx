# Sketch Data Reference

> Linked data, data suppliers, and dynamic content population.

## Overview

Sketch's Data feature allows you to populate designs with realistic placeholder content from various sources. This includes text, images, and custom data formats.

## Data Sources

### Built-in Data

Sketch includes default data sources:
- Names (first, last, full)
- Cities
- Lorem ipsum text
- Dates
- Email addresses
- Phone numbers
- Stock photos

### Custom Data

You can add your own data sources:

1. **Text file**: One item per line
2. **Image folder**: Directory of images
3. **JSON file**: Structured data format

## Using Data (UI)

### Apply Data to Selection

1. Select text layers or shapes with image fills
2. Layer → Data → Choose data type
3. Or right-click → Data → Choose source

### Refresh Data

To randomize data:
- Layer → Data → Refresh Data
- Or Cmd+Shift+D

### Link Custom Data

1. Sketch → Settings → Data
2. Click "Add Data..."
3. Select text file, image folder, or JSON

## JSON Data Format

```json
{
  "users": [
    {
      "name": "Alice Johnson",
      "email": "alice@example.com",
      "avatar": "images/alice.png"
    },
    {
      "name": "Bob Smith",
      "email": "bob@example.com",
      "avatar": "images/bob.png"
    }
  ]
}
```

### JSON Path Syntax

When linking JSON data, use path notation:
- `users/name` - Access name field in users array
- `users/email` - Access email field
- `users/avatar` - Access image path (relative to JSON file)

## Data Supplier API (Plugins)

For plugin developers, Sketch provides a DataSupplier API.

### Registering a Data Supplier

```javascript
// manifest.json
{
  "suppliesData": true
}

// Plugin code
const sketch = require('sketch');
const DataSupplier = sketch.DataSupplier;

// Register for text data
DataSupplier.registerDataSupplier(
  'public.text',
  'My Text Data',
  'SupplyRandomText'
);

// Register for image data
DataSupplier.registerDataSupplier(
  'public.image',
  'My Image Data',
  'SupplyRandomImage'
);
```

### Supplying Data

```javascript
function SupplyRandomText(context) {
  const dataKey = context.data.key;
  const dataCount = context.data.requestCount;

  for (let i = 0; i < dataCount; i++) {
    const randomText = generateText();
    DataSupplier.supplyDataAtIndex(dataKey, randomText, i);
  }
}

function SupplyRandomImage(context) {
  const dataKey = context.data.key;
  const dataCount = context.data.requestCount;

  for (let i = 0; i < dataCount; i++) {
    const imageUrl = 'https://example.com/image.png';
    DataSupplier.supplyImageAtIndex(dataKey, imageUrl, i);
  }
}
```

## MCP API Considerations

> ⚠️ Note: Direct Data manipulation via MCP may be limited.

### Setting Text Content Directly

Instead of using Data, you can set text content programmatically:

```javascript
// Find text layers and update content
const textLayers = findLayersByType(page, 'Text');

const sampleNames = ['Alice', 'Bob', 'Carol', 'David'];

textLayers.forEach((text, i) => {
  if (text.name.includes('Username')) {
    text.text = sampleNames[i % sampleNames.length];
  }
});
```

### Image Fills

```javascript
// Apply image to a shape
// Note: Image must be loaded first
const shape = selection[0];
shape.style.fills = [{
  fillType: 'Pattern',
  patternFillType: 'Fill',
  image: loadedImageData
}];
```

## Data Patterns for Wireframes

### User Lists

```javascript
const SAMPLE_USERS = [
  { name: 'Alice Johnson', role: 'Product Manager' },
  { name: 'Bob Smith', role: 'Developer' },
  { name: 'Carol White', role: 'Designer' },
  { name: 'David Brown', role: 'QA Engineer' }
];

function populateUserList(userCardInstances) {
  userCardInstances.forEach((card, i) => {
    const user = SAMPLE_USERS[i % SAMPLE_USERS.length];
    // Set text overrides
    const nameOverride = card.overrides.find(o => o.affectedLayer.name === 'Name');
    const roleOverride = card.overrides.find(o => o.affectedLayer.name === 'Role');

    if (nameOverride) card.setOverrideValue(nameOverride, user.name);
    if (roleOverride) card.setOverrideValue(roleOverride, user.role);
  });
}
```

### Issue/Task Data

```javascript
const SAMPLE_ISSUES = [
  { title: 'Fix login bug', status: 'In Progress', priority: 'High' },
  { title: 'Add dark mode', status: 'Open', priority: 'Medium' },
  { title: 'Update API docs', status: 'Review', priority: 'Low' }
];
```

## Disconnecting Data

To unlink data from layers:
- Select layers
- Layer → Data → Disconnect from Data

This converts dynamic data to static content.

## Best Practices

### Do
- Use realistic sample data for client presentations
- Organize custom data files by category
- Keep JSON data files with your Sketch document
- Use consistent naming for data-linked layers

### Don't
- Use obviously fake data in demos
- Hardcode sensitive information
- Forget to refresh data after structure changes
- Over-rely on Lorem Ipsum for UX testing

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Data not appearing | Wrong layer selected | Ensure text/image layer is selected |
| "No data available" | Path not found | Check JSON path syntax |
| Images not loading | Invalid path | Use paths relative to JSON file |
| Data not refreshing | Cache issue | Restart Sketch |

## Related References

- [Symbols & Overrides](./symbols.md) - Data in symbol instances
- [Styling](./styling.md) - Image fills
- [MCP API Patterns](./mcp-api.md) - Programmatic content
- [Troubleshooting](./troubleshooting.md) - Common data issues
- [Glossary](./glossary.md) - Data terminology
