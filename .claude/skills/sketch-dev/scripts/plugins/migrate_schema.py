#!/usr/bin/env python3
"""
Schema Migration Script

Migrates existing YAML files from old schema to new schema:
- Parses 'summary' field to extract authors and date
- Converts date to YYYY-MM-DD format
- Adds version field (fetches SHA for GitHub, 'unknown' for others)
- Removes 'summary' field

Usage:
    python migrate_schema.py [--dry-run] [--fetch-sha]
"""

import argparse
import re
import yaml
from datetime import datetime
from pathlib import Path
from typing import Optional


# Month name to number mapping
MONTHS = {
    "jan": 1, "january": 1,
    "feb": 2, "february": 2,
    "mar": 3, "march": 3,
    "apr": 4, "april": 4,
    "may": 5,
    "jun": 6, "june": 6,
    "jul": 7, "july": 7,
    "aug": 8, "august": 8,
    "sep": 9, "sept": 9, "september": 9,
    "oct": 10, "october": 10,
    "nov": 11, "november": 11,
    "dec": 12, "december": 12,
}


def parse_summary(summary: str) -> tuple[list[str], Optional[str]]:
    """
    Parse summary field to extract authors and date.

    Input: "By Tobias Fried. Last updated 6 Jan 2026."
    Output: (["Tobias Fried"], "2026-01-06")
    """
    authors = []
    date_str = None

    # Extract author(s)
    # Pattern: "By Author Name." or "By Author1, Author2."
    author_match = re.match(r"By\s+([^.]+)\.", summary)
    if author_match:
        author_text = author_match.group(1).strip()
        # Split by comma or "and"
        authors = [a.strip() for a in re.split(r",\s*|\s+and\s+", author_text)]

    # Extract date
    # Pattern: "Last updated DD Mon YYYY." or just the date
    date_match = re.search(r"(\d{1,2})\s+(\w+)\s+(\d{4})", summary)
    if date_match:
        day = int(date_match.group(1))
        month_name = date_match.group(2).lower()
        year = int(date_match.group(3))

        month = MONTHS.get(month_name)
        if month:
            try:
                d = datetime(year, month, day)
                date_str = d.strftime("%Y-%m-%d")
            except ValueError:
                pass

    return authors, date_str


def fetch_github_sha(repo_url: str) -> Optional[str]:
    """Fetch latest commit SHA for a GitHub repo."""
    import subprocess
    import json

    match = re.search(r"github\.com/([^/]+)/([^/]+)", repo_url)
    if not match:
        return None

    owner, repo = match.groups()
    repo = repo.rstrip(".git")

    api_url = f"https://api.github.com/repos/{owner}/{repo}/commits?per_page=1"

    try:
        result = subprocess.run(
            ["curl", "-s", api_url],
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.returncode == 0:
            data = json.loads(result.stdout)
            if isinstance(data, list) and len(data) > 0:
                return data[0].get("sha")
    except Exception:
        pass

    return None


def migrate_entry(entry: dict, fetch_sha: bool = False) -> dict:
    """Migrate a single plugin entry to new schema."""
    new_entry = {}

    # Copy basic fields
    new_entry["plugin"] = entry.get("plugin", "")
    new_entry["link"] = entry.get("link", "")
    new_entry["description"] = entry.get("description", "")

    # Parse summary to get authors and date
    summary = entry.get("summary", "")
    authors, date_str = parse_summary(summary)

    new_entry["authors"] = authors if authors else ["Unknown"]
    new_entry["updated"] = date_str if date_str else "1970-01-01"

    # Determine version
    link = entry.get("link", "")
    is_github = "github.com" in link.lower()

    if is_github and fetch_sha:
        sha = fetch_github_sha(link)
        new_entry["version"] = {"value": sha if sha else "unknown"}
    else:
        new_entry["version"] = {"value": "unknown"}

    # Copy other fields
    new_entry["open-source"] = entry.get("open-source", is_github)
    new_entry["tags"] = entry.get("tags", [])

    # Preserve any existing tracking fields
    if "watch_status" in entry:
        new_entry["watch_status"] = entry["watch_status"]
    if "github_sha" in entry:
        # Migrate old github_sha to version
        new_entry["version"] = {"value": entry["github_sha"]}
    if "last_reviewed" in entry:
        new_entry["last_reviewed"] = entry["last_reviewed"]
    if "review_summary" in entry:
        new_entry["review_summary"] = entry["review_summary"]

    return new_entry


def migrate_file(filepath: Path, dry_run: bool = True, fetch_sha: bool = False) -> int:
    """
    Migrate a single YAML file.

    Returns number of entries migrated.
    """
    with open(filepath, "r", encoding="utf-8") as f:
        entries = yaml.safe_load(f)

    if not entries:
        return 0

    migrated = []
    for entry in entries:
        # Skip if already migrated (has 'authors' field)
        if "authors" in entry:
            migrated.append(entry)
            continue

        new_entry = migrate_entry(entry, fetch_sha=fetch_sha)
        migrated.append(new_entry)

    if not dry_run:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write("---\n")
            yaml.dump(migrated, f, default_flow_style=False,
                      allow_unicode=True, sort_keys=False)

    return len(migrated)


def main():
    parser = argparse.ArgumentParser(description="Migrate plugin YAML schema")
    parser.add_argument("--dry-run", action="store_true",
                        help="Show what would be changed without modifying files")
    parser.add_argument("--fetch-sha", action="store_true",
                        help="Fetch GitHub SHAs for version info (slow)")
    parser.add_argument("--file", type=str,
                        help="Migrate single file instead of all")
    args = parser.parse_args()

    # Find plugins directory
    # Path: migrate_schema.py -> plugins -> scripts -> sketch-dev -> references/plugins
    skill_root = Path(__file__).parent.parent.parent
    plugins_dir = skill_root / "references" / "plugins"

    if not plugins_dir.exists():
        print(f"Error: Plugins directory not found: {plugins_dir}")
        return 1

    if args.file:
        files = [Path(args.file)]
    else:
        files = sorted(plugins_dir.glob("*.yml"))

    total_entries = 0
    total_files = 0

    print(f"{'[DRY RUN] ' if args.dry_run else ''}Migrating plugin schemas...")
    print(f"Fetch SHA: {args.fetch_sha}")
    print()

    for filepath in files:
        count = migrate_file(filepath, dry_run=args.dry_run, fetch_sha=args.fetch_sha)
        if count > 0:
            print(f"  {filepath.name}: {count} entries")
            total_entries += count
            total_files += 1

    print()
    print(f"Total: {total_entries} entries in {total_files} files")

    if args.dry_run:
        print()
        print("Run without --dry-run to apply changes")

    return 0


if __name__ == "__main__":
    exit(main())
