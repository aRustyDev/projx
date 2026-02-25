---
description: Generate research summaries for Sketch plugins
argument-hint: [category] [--limit N] [--missing]
allowed-tools: Bash, Read, Edit, Grep
---

# Plugin Summary Generator

Generate research summaries for Sketch plugins by fetching README/homepage content and analyzing it.

## Arguments

- `$1` - Category to process (e.g., `colors`, `icons`, `text`)
- `--limit N` - Maximum plugins to process (default: 5)
- `--missing` - Only process plugins without existing summaries

## Workflow

### Step 1: Fetch Plugin Data

Run the generate_summaries.py script to fetch content for plugins in the specified category.

```bash
cd /Users/adam/code/proj/projx-ui/.claude/skills/sketch-dev/scripts/plugins && \
python generate_summaries.py --category "$CATEGORY" --limit $LIMIT $MISSING_FLAG
```

The script outputs JSON to stdout with this structure:

```json
{
  "mode": "interactive",
  "plugins_dir": "/path/to/plugins",
  "count": 5,
  "plugins": [
    {
      "name": "Plugin Name",
      "link": "https://github.com/...",
      "description": "Short description from scrape",
      "category": "colors",
      "filepath": "/path/to/colors.yml",
      "index": 0,
      "readme": "Full README content...",
      "is_github": true
    }
  ],
  "instructions": "..."
}
```

### Step 2: Generate Summaries

For each plugin in the JSON output, generate a research summary that covers:

1. **Main functionality** - What does the plugin do?
2. **Key features** - What capabilities does it offer?
3. **Maintenance status** - Is it actively maintained? When was it last updated?
4. **Technical details** - What frameworks/platforms does it support?

Guidelines:
- Keep summaries to 2-4 sentences
- Be factual, avoid marketing language
- Note if the plugin is deprecated or unmaintained
- Include version/compatibility info if available
- Mention if it's paid vs free

### Step 3: Update YAML Files

For each plugin, add the `summary` field to its entry in the YAML file.

Use the `filepath` and `index` from the JSON to locate the correct entry:

```yaml
- plugin: Plugin Name
  link: https://...
  description: ...
  authors:
  - Author Name
  updated: '2024-01-15'
  version:
    value: abc123...
  open-source: true
  tags:
  - category
  summary: |
    Your generated summary goes here. It should be 2-4 sentences
    covering functionality, features, maintenance status, and
    technical details.
```

### Step 4: Commit Changes

After updating all plugins, commit the changes:

```bash
git add .claude/skills/sketch-dev/references/plugins/*.yml
git commit -m "docs(ui): add summaries to $CATEGORY plugins

Generated research summaries for $COUNT plugins in $CATEGORY category.

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>"
```

## Examples

```bash
# Generate summaries for 5 colors plugins
/plugin-summaries colors

# Generate summaries for 10 text plugins
/plugin-summaries text --limit 10

# Only process plugins missing summaries
/plugin-summaries icons --missing --limit 20

# Process all categories (be careful with rate limits)
/plugin-summaries all --limit 50 --missing
```

## Summary Guidelines

### Good Summaries

```yaml
summary: |
  Imports color variables from CSS custom properties or JSON files directly into Sketch
  as Color Variables (Swatches). Supports hex, RGB, and RGBA formats with nested JSON
  keys joined by `/` separators. Handles duplicate detection with update/skip options.
  Requires Sketch 70+. Recently updated and actively maintained.
```

```yaml
summary: |
  Design system color auditing tool that finds "rogue layers" using colors outside your
  defined palette. Register your palette from selected layers (Cmd+Shift+P), then find all
  non-conforming layers (Cmd+Shift+F) and navigate through them. Essential for maintaining
  color consistency in large design files. Compatible with Sketch v66.1+.
```

### Avoid

- Marketing speak: "The best plugin ever!"
- Vague descriptions: "A useful tool for designers"
- Missing key info: Not mentioning if deprecated
- Too long: More than 4-5 sentences

## Rate Limits

- GitHub API: Uses `gh` CLI (authenticated, 5000 req/hour)
- Delay between fetches: 0.5s per plugin
- For large batches, consider running multiple sessions

## Files

- Script: `.claude/skills/sketch-dev/scripts/plugins/generate_summaries.py`
- Plugin YAML: `.claude/skills/sketch-dev/references/plugins/*.yml`
- Justfile: `.claude/skills/sketch-dev/scripts/plugins/scrape.just`
