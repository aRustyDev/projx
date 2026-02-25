# Database module for projx-ui
# Usage: just db <recipe>
#
# This module manages the beads database (Dolt + SQLite ephemeral cache)

set shell := ["bash", "-euo", "pipefail", "-c"]

beads_dir := justfile_directory()
dolt_dir := beads_dir / "dolt"
ephemeral_db := beads_dir / "ephemeral.sqlite3"

# Reset database (clears ephemeral cache, preserves Dolt history)
reset:
    @echo "Resetting ephemeral SQLite cache..."
    rm -f {{ ephemeral_db }}
    @echo "Database reset complete."

# Run database migrations
migrate:
    @echo "Running migrations..."
    @echo "TODO: Implement migration runner"
    @echo "Migrations would run via 'bd sql' or direct Dolt commands"

# Seed database with test data
seed:
    @echo "Seeding database..."
    @echo "TODO: Implement seeder"
    @echo "Would populate issues.jsonl with sample data"

# Backup database
backup:
    #!/usr/bin/env bash
    set -euo pipefail
    timestamp=$(date +%Y%m%d_%H%M%S)
    backup_dir="{{ beads_dir }}/backups"
    mkdir -p "$backup_dir"

    echo "Backing up beads data..."
    cp {{ beads_dir }}/issues.jsonl "$backup_dir/issues_$timestamp.jsonl"
    cp {{ beads_dir }}/interactions.jsonl "$backup_dir/interactions_$timestamp.jsonl"
    cp {{ beads_dir }}/metadata.json "$backup_dir/metadata_$timestamp.json"

    if [[ -f "{{ ephemeral_db }}" ]]; then
        cp {{ ephemeral_db }} "$backup_dir/ephemeral_$timestamp.sqlite3"
    fi

    echo "Backup complete: $backup_dir/*_$timestamp.*"

# List backups
backups:
    @ls -la {{ beads_dir }}/backups/ 2>/dev/null || echo "No backups found"

# Restore from backup
restore timestamp:
    #!/usr/bin/env bash
    set -euo pipefail
    backup_dir="{{ beads_dir }}/backups"

    if [[ ! -f "$backup_dir/issues_{{ timestamp }}.jsonl" ]]; then
        echo "Backup not found: {{ timestamp }}"
        echo "Available backups:"
        ls "$backup_dir" | grep -oE '[0-9]{8}_[0-9]{6}' | sort -u
        exit 1
    fi

    echo "Restoring from backup {{ timestamp }}..."
    cp "$backup_dir/issues_{{ timestamp }}.jsonl" {{ beads_dir }}/issues.jsonl
    cp "$backup_dir/interactions_{{ timestamp }}.jsonl" {{ beads_dir }}/interactions.jsonl
    cp "$backup_dir/metadata_{{ timestamp }}.json" {{ beads_dir }}/metadata.json

    if [[ -f "$backup_dir/ephemeral_{{ timestamp }}.sqlite3" ]]; then
        cp "$backup_dir/ephemeral_{{ timestamp }}.sqlite3" {{ ephemeral_db }}
    fi

    echo "Restore complete!"

# Show database status
status:
    @echo "=== Beads Database Status ==="
    @echo "Issues: $(wc -l < {{ beads_dir }}/issues.jsonl | tr -d ' ') entries"
    @echo "Interactions: $(wc -l < {{ beads_dir }}/interactions.jsonl | tr -d ' ') entries"
    @echo "Ephemeral DB: $(ls -lh {{ ephemeral_db }} 2>/dev/null | awk '{print $5}' || echo 'not found')"
    @echo ""
    @echo "=== Recent Issues ==="
    @tail -5 {{ beads_dir }}/issues.jsonl | jq -r '.id + " - " + .title' 2>/dev/null || echo "No issues"

# Query issues (uses jq)
query filter=".":
    @cat {{ beads_dir }}/issues.jsonl | jq -s '{{ filter }}'

# Open issues in interactive viewer
browse:
    @cat {{ beads_dir }}/issues.jsonl | jq -s '.[] | "\(.id) [\(.status)] \(.title)"' -r | fzf --preview 'id=$(echo {} | cut -d" " -f1); cat {{ beads_dir }}/issues.jsonl | jq -s ".[] | select(.id == \"$id\")"'

# Sync Dolt data to ephemeral SQLite (for offline WebUI access)
sync-sqlite:
    #!/usr/bin/env bash
    set -euo pipefail

    PROJECT_ROOT="$(git rev-parse --show-toplevel)"
    BEADS_DIR="$PROJECT_ROOT/.beads"
    DOLT_DIR="$BEADS_DIR/dolt/beads_projx"
    SQLITE_DB="$BEADS_DIR/ephemeral.sqlite3"

    echo "Syncing Dolt data to SQLite..."

    # Export issues from Dolt
    cd "$DOLT_DIR"
    dolt sql -q "SELECT id, title, description, design, acceptance_criteria, notes, status, priority, issue_type, assignee, owner, created_at, updated_at, closed_at, external_ref, spec_id, due_at FROM issues" --result-format csv > /tmp/dolt_issues.csv

    # Create/reset SQLite schema
    sqlite3 "$SQLITE_DB" "DROP TABLE IF EXISTS issues;"
    sqlite3 "$SQLITE_DB" "CREATE TABLE issues (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        design TEXT,
        acceptance_criteria TEXT,
        notes TEXT,
        status TEXT DEFAULT 'open',
        priority INTEGER DEFAULT 3,
        issue_type TEXT DEFAULT 'task',
        assignee TEXT,
        owner TEXT,
        created_at TEXT,
        updated_at TEXT,
        closed_at TEXT,
        external_ref TEXT,
        spec_id TEXT,
        due_at TEXT
    );"

    # Import CSV (skip header line)
    tail -n +2 /tmp/dolt_issues.csv | sqlite3 "$SQLITE_DB" ".mode csv" ".import /dev/stdin issues"

    count=$(sqlite3 "$SQLITE_DB" "SELECT COUNT(*) FROM issues")
    echo "Synced $count issues to SQLite"

    rm -f /tmp/dolt_issues.csv
