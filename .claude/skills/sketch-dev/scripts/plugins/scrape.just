# Sketch Plugin Scraper module
# Usage: just scrape <recipe>
#
# Manages plugin tracking, scraping, and categorization for Sketch plugins

set shell := ["bash", "-euo", "pipefail", "-c"]

# Note: justfile_directory() returns the directory of the importing justfile,
# not this module's directory. We use source_directory() for the module location.
plugins_dir := source_directory()
refs_dir := plugins_dir / "../../references/plugins"
venv_dir := plugins_dir / ".venv"
# Use venv python if exists, otherwise system python3
python := if path_exists(venv_dir / "bin/python") == "true" { venv_dir / "bin/python" } else { "python3" }

# ─────────────────────────────────────────────────────────────────────────────
# Setup
# ─────────────────────────────────────────────────────────────────────────────

# Initialize the plugin tracking environment
init:
    #!/usr/bin/env bash
    set -euo pipefail
    cd "{{ plugins_dir }}"

    echo "Creating virtual environment..."
    python3 -m venv .venv

    echo "Installing dependencies..."
    .venv/bin/pip install -q -e .

    echo "Setting up Crawl4AI browser..."
    .venv/bin/crawl4ai-setup || echo "Note: Run 'crawl4ai-setup' manually if browser setup failed"

    echo ""
    echo "Setup complete! Available commands:"
    echo "  just scrape stats      - Show plugin statistics"
    echo "  just scrape crawl      - Scrape plugins from Sketch"
    echo "  just scrape diff       - Check for plugin changes"
    echo "  just scrape pipeline   - Run full tracking pipeline"

# ─────────────────────────────────────────────────────────────────────────────
# Core Operations
# ─────────────────────────────────────────────────────────────────────────────

# Run full tracking pipeline (scrape, diff, queue review)
pipeline:
    cd "{{ plugins_dir }}" && {{ python }} pipeline.py run --scrape

# Check for plugin changes (dry run)
diff:
    cd "{{ plugins_dir }}" && {{ python }} pipeline.py check --scrape

# Scrape plugins from Sketch extensions page (saves JSON)
crawl output="/tmp/sketch-plugins-scrape.json":
    cd "{{ plugins_dir }}" && {{ python }} helpers.py crawl "{{ output }}"

# Categorize plugins from JSON input
categorize input="/tmp/sketch-plugins-scrape.json":
    cd "{{ plugins_dir }}" && {{ python }} categorize-plugins.py "{{ input }}" "{{ refs_dir }}"

# ─────────────────────────────────────────────────────────────────────────────
# Review Queue
# ─────────────────────────────────────────────────────────────────────────────

# Show review queue status
review queue="/tmp/plugin-review-queue.json":
    cd "{{ plugins_dir }}" && {{ python }} pipeline.py review --queue "{{ queue }}"

# Apply reviewed changes to state
apply queue="/tmp/plugin-review-queue.json":
    cd "{{ plugins_dir }}" && {{ python }} pipeline.py apply --queue "{{ queue }}"

# ─────────────────────────────────────────────────────────────────────────────
# State Management
# ─────────────────────────────────────────────────────────────────────────────

# Show plugin state statistics
stats:
    cd "{{ plugins_dir }}" && {{ python }} pipeline.py stats

# Load state from YAML files (show current state)
load-state:
    cd "{{ plugins_dir }}" && {{ python }} helpers.py load-state

# Save state (commit YAML changes)
save-state message="Update plugin state":
    #!/usr/bin/env bash
    set -euo pipefail
    cd "{{ plugins_dir }}/../.."

    if git diff --quiet references/plugins/; then
        echo "No changes to save."
        exit 0
    fi

    echo "Changes detected in plugin YAML files:"
    git diff --stat references/plugins/

    echo ""
    read -p "Commit these changes? [y/N] " confirm
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        git add references/plugins/
        git commit -m "{{ message }}"
        echo "Changes committed."
    else
        echo "Aborted."
    fi

# ─────────────────────────────────────────────────────────────────────────────
# Utilities
# ─────────────────────────────────────────────────────────────────────────────

# Show MCP tool info for scraping
mcp-info:
    cd "{{ plugins_dir }}" && {{ python }} pipeline.py mcp-info

# List plugins by category
list-category category:
    cd "{{ plugins_dir }}" && {{ python }} helpers.py list-category "{{ category }}"

# Search plugins by name or description
search query:
    cd "{{ plugins_dir }}" && {{ python }} helpers.py search "{{ query }}"

# Set watch status for a plugin
watch link status="watch":
    cd "{{ plugins_dir }}" && {{ python }} helpers.py watch "{{ link }}" "{{ status }}"

# ─────────────────────────────────────────────────────────────────────────────
# Schema Management
# ─────────────────────────────────────────────────────────────────────────────

# Migrate YAML files from old schema to new schema
migrate *args:
    cd "{{ plugins_dir }}" && {{ python }} migrate_schema.py {{ args }}

# Export JSON schema for plugin entries
export-schema output="plugin.schema.json":
    cd "{{ plugins_dir }}" && {{ python }} helpers.py export-schema "{{ output }}"

# Validate YAML files against schema
validate:
    cd "{{ plugins_dir }}" && {{ python }} helpers.py validate
