# Sketch Plugin Tracking System

A modular system for tracking, categorizing, and monitoring Sketch plugins from the official extensions page.

## Architecture

The system uses **YAML files as the source of truth** for plugin state:
- `references/plugins/*.yml` - 36 category files containing plugin records
- Each entry includes tracking metadata (dates, SHA, watch status)
- Human-readable format that doubles as documentation

### Library Modules

```
lib/
├── __init__.py      # Package exports
├── state.py         # PluginState - YAML-based state management
├── scraper.py       # PluginScraper - Fetch and parse plugins
├── differ.py        # PluginDiffer - Detect changes between scrapes
├── categorizer.py   # PluginCategorizer - Keyword-based categorization
└── reviewer.py      # ReviewQueue - LLM-gated review workflow
```

### Key Classes

| Class | Purpose |
|-------|---------|
| `PluginState` | Load/save plugin state from YAML files |
| `PluginRecord` | Single plugin with tracking metadata |
| `PluginScraper` | Parse Crawl4AI output, fetch GitHub SHAs |
| `PluginDiffer` | Compare scrapes against state, classify changes |
| `ReviewQueue` | Queue items for LLM review |

## Installation

```bash
# Required for direct scraping
pip install crawl4ai

# For first run, install browser
crawl4ai-setup
```

## Workflow

### 1. Scrape

Two options for fetching plugin data:

**Option A: Direct Crawl4AI (Recommended)**

```bash
# Scrape directly using Crawl4AI Python library
python pipeline.py check --scrape
python pipeline.py run --scrape
```

**Option B: MCP-gated (for Claude Code)**

```bash
# Get MCP tool info
python pipeline.py mcp-info

# Use in Claude Code:
# mcp__crawl4ai__md({ url: "https://www.sketch.com/extensions/plugins/#all", f: "raw" })

# Then process the result
python pipeline.py check --mcp-input /tmp/scrape-result.json
```

### 2. Check for Changes

```bash
# Show current state statistics
python pipeline.py stats

# Check for updates (with scraped data)
python pipeline.py check --mcp-input /tmp/scrape-result.json
```

### 3. Run Full Pipeline

```bash
# Creates review queue for NEW and MAJOR updates
python pipeline.py run --mcp-input /tmp/scrape-result.json
```

### 4. Review (LLM-gated)

```bash
# View pending review items
python pipeline.py review --queue /tmp/plugin-review-queue.json
```

Or programmatically:

```python
from lib import ReviewQueue, create_review_prompt

queue = ReviewQueue()
item = queue.get_next()
prompt = create_review_prompt(item)
# ... LLM review ...
queue.mark_reviewed(item, ReviewAction.ACCEPT, category="Icons")
```

### 5. Apply Changes

```bash
python pipeline.py apply --queue /tmp/plugin-review-queue.json
```

Or programmatically:

```python
from lib import PluginState, ReviewQueue

state = PluginState()
queue = ReviewQueue()
# ... populate and review queue ...
results = queue.apply_to_state(state)
state.save()
```

## Change Detection

### Classification

| Type | Trigger | Action |
|------|---------|--------|
| NEW | Plugin not in YAML | Full review pipeline |
| MAJOR | GitHub: >10 commits or >20 files | Full review pipeline |
| MINOR | GitHub: ≤10 commits | Skip or brief review |
| UNCHANGED | No detected changes | Skip |
| REMOVED | In YAML but not scraped | Flag for removal |

### Watch Status

Each plugin can have a watch status that affects processing:

| Status | Behavior |
|--------|----------|
| `default` | Normal processing |
| `watch` | Track all updates, always review |
| `major_only` | Only review major updates |
| `ignore` | Skip all updates |

Set watch status:

```python
state = PluginState()
state.set_watch_status("https://github.com/...", WatchStatus.WATCH)
state.save()
```

## YAML Entry Format

```yaml
- plugin: Plugin Name
  link: https://github.com/owner/repo
  description: Plugin description text
  authors:
    - Author Name
    - Another Author
  updated: "2026-01-15"  # YYYY-MM-DD format
  version:
    value: "abc123def456789..."  # SHA for GitHub, semver for others
    url: https://github.com/owner/repo/releases  # Optional
  open-source: true
  tags:
    - icons
  # Optional tracking fields (only written when set):
  watch_status: watch
  last_reviewed: "2026-02-24"
  review_summary: "Useful icon library, actively maintained"
```

### Schema Validation

The schema is defined using Pydantic and can be exported as JSON Schema:

```bash
# Export JSON schema
just scrape export-schema

# Validate all YAML files against schema
just scrape validate
```

### Schema Migration

To migrate from old schema (with `summary` field) to new schema:

```bash
# Preview changes
just scrape migrate --dry-run

# Apply migration
just scrape migrate

# Optionally fetch GitHub SHAs (slow)
just scrape migrate --fetch-sha
```

## Legacy Scripts

The original one-shot scripts are still available:

- `scrape-plugins.js` - Documents MCP approach
- `extract-plugins.py` - Parse markdown to JSON
- `categorize-plugins.py` - Categorize and write YAML

These are kept for reference but the new `lib/` modules and `pipeline.py` are recommended for ongoing tracking.

## Statistics

As of February 2026:
- **663 plugins** tracked
- **36 categories**
- **~90%** open source (GitHub hosted)
