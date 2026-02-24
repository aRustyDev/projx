"""
Plugin Differ

Detects changes between scrapes and classifies update severity.
Compares against YAML files in references/plugins/ as the source of truth.
"""

import re
import json
import subprocess
from dataclasses import dataclass
from enum import Enum
from typing import Optional

from .state import PluginState, PluginRecord
from .schema import WatchStatus
from .scraper import ScrapedPlugin, PluginScraper


class ChangeType(str, Enum):
    """Type of change detected."""
    NEW = "new"                  # First time seeing this plugin
    UPDATED_MAJOR = "major"     # Significant changes
    UPDATED_MINOR = "minor"     # Small changes
    UNCHANGED = "unchanged"     # No changes
    REMOVED = "removed"         # No longer in scrape


@dataclass
class DiffResult:
    """Result of comparing a plugin."""
    plugin: ScrapedPlugin
    change_type: ChangeType
    previous_record: Optional[PluginRecord] = None

    # For updates
    previous_sha: Optional[str] = None
    current_sha: Optional[str] = None
    compare_url: Optional[str] = None

    # Classification details
    reason: str = ""
    commit_count: int = 0
    files_changed: int = 0

    @property
    def needs_full_review(self) -> bool:
        """Whether this change needs full LLM review."""
        return self.change_type in (ChangeType.NEW, ChangeType.UPDATED_MAJOR)

    @property
    def should_skip(self) -> bool:
        """Whether to skip based on watch status."""
        if self.previous_record is None:
            return False

        status = self.previous_record.watch_status
        if status == WatchStatus.IGNORE:
            return True
        if status == WatchStatus.MAJOR_ONLY and self.change_type == ChangeType.UPDATED_MINOR:
            return True
        return False

    @property
    def category(self) -> str:
        """Get category (from previous record or 'New')."""
        if self.previous_record:
            return self.previous_record.category
        return "New"


class PluginDiffer:
    """
    Compares scraped plugins against YAML state to detect changes.

    Change classification:
    - NEW: Plugin not in YAML files
    - MAJOR: GitHub repo with >10 commits or date changed significantly
    - MINOR: GitHub repo with <=10 commits, no major changes
    - UNCHANGED: No detected changes
    - REMOVED: In YAML but not in scrape
    """

    # Thresholds for major vs minor
    MAJOR_COMMIT_THRESHOLD = 10
    MAJOR_FILES_THRESHOLD = 20

    def __init__(self, state: PluginState):
        self.state = state
        self.scraper = PluginScraper()

    def diff_all(self, scraped: list[ScrapedPlugin]) -> list[DiffResult]:
        """
        Compare all scraped plugins against YAML state.

        Args:
            scraped: List of freshly scraped plugins

        Returns:
            List of DiffResult for all plugins
        """
        results = []
        scraped_keys = set()

        for plugin in scraped:
            key = plugin.link.lower().rstrip("/")
            scraped_keys.add(key)

            existing = self.state.get_plugin(plugin.link)
            result = self._diff_one(plugin, existing)
            results.append(result)

        # Check for removed plugins
        for key, record in self.state.plugins.items():
            if key not in scraped_keys:
                results.append(DiffResult(
                    plugin=ScrapedPlugin(
                        name=record.name,
                        link=record.link,
                        description=record.description,
                        author=record.author,
                        updated=record.last_updated,
                        is_github=record.is_github
                    ),
                    change_type=ChangeType.REMOVED,
                    previous_record=record,
                    reason="Plugin no longer listed on Sketch extensions page"
                ))

        return results

    def _diff_one(self, plugin: ScrapedPlugin, existing: Optional[PluginRecord]) -> DiffResult:
        """Compare single plugin against existing record."""

        # New plugin
        if existing is None:
            return DiffResult(
                plugin=plugin,
                change_type=ChangeType.NEW,
                reason="First time seeing this plugin"
            )

        # Check for date change (Sketch page shows "Updated on DATE")
        if plugin.updated != existing.last_updated and plugin.updated != "Official":
            # Date changed, need to determine severity
            if plugin.is_github:
                return self._diff_github(plugin, existing)
            else:
                return self._diff_non_github(plugin, existing)

        # Check content hash for non-date changes (description changed)
        if plugin.content_hash != self._compute_existing_hash(existing):
            return DiffResult(
                plugin=plugin,
                change_type=ChangeType.UPDATED_MINOR,
                previous_record=existing,
                reason="Description or metadata changed"
            )

        # No changes
        return DiffResult(
            plugin=plugin,
            change_type=ChangeType.UNCHANGED,
            previous_record=existing
        )

    def _compute_existing_hash(self, record: PluginRecord) -> str:
        """Compute content hash for existing record."""
        import hashlib
        content = f"{record.name}|{record.description}|{record.author}"
        return hashlib.sha256(content.encode()).hexdigest()[:16]

    def _diff_github(self, plugin: ScrapedPlugin, existing: PluginRecord) -> DiffResult:
        """Diff a GitHub plugin using commit comparison."""

        previous_sha = existing.github_sha
        current_sha = self.scraper.fetch_github_sha(plugin.link)

        if not current_sha:
            # Couldn't fetch SHA, assume minor update
            return DiffResult(
                plugin=plugin,
                change_type=ChangeType.UPDATED_MINOR,
                previous_record=existing,
                reason="Update detected but couldn't fetch GitHub SHA"
            )

        if previous_sha == current_sha:
            # Same SHA, no real change (date might have been updated by Sketch)
            return DiffResult(
                plugin=plugin,
                change_type=ChangeType.UNCHANGED,
                previous_record=existing,
                previous_sha=previous_sha,
                current_sha=current_sha
            )

        if not previous_sha:
            # First time tracking SHA - treat as update to capture SHA
            return DiffResult(
                plugin=plugin,
                change_type=ChangeType.UPDATED_MINOR,
                previous_record=existing,
                current_sha=current_sha,
                reason="First SHA tracking, capturing current state"
            )

        # Compare commits
        compare_url = self.scraper.get_github_compare_url(
            plugin.link, previous_sha, current_sha
        )

        commit_count, files_changed = self._get_github_diff_stats(
            plugin.link, previous_sha, current_sha
        )

        # Classify severity
        is_major = (
            commit_count >= self.MAJOR_COMMIT_THRESHOLD or
            files_changed >= self.MAJOR_FILES_THRESHOLD
        )

        return DiffResult(
            plugin=plugin,
            change_type=ChangeType.UPDATED_MAJOR if is_major else ChangeType.UPDATED_MINOR,
            previous_record=existing,
            previous_sha=previous_sha,
            current_sha=current_sha,
            compare_url=compare_url,
            commit_count=commit_count,
            files_changed=files_changed,
            reason=f"{commit_count} commits, {files_changed} files changed"
        )

    def _diff_non_github(self, plugin: ScrapedPlugin, existing: PluginRecord) -> DiffResult:
        """Diff a non-GitHub plugin using date change."""

        # For non-GitHub, date change is our only signal
        # Mark as major since we can't assess severity
        return DiffResult(
            plugin=plugin,
            change_type=ChangeType.UPDATED_MAJOR,
            previous_record=existing,
            reason="Non-GitHub plugin updated, full review recommended"
        )

    def _get_github_diff_stats(
        self,
        repo_url: str,
        from_sha: str,
        to_sha: str
    ) -> tuple[int, int]:
        """
        Get commit count and files changed between SHAs.

        Returns:
            Tuple of (commit_count, files_changed)
        """
        match = re.search(r"github\.com/([^/]+)/([^/]+)", repo_url)
        if not match:
            return (0, 0)

        owner, repo = match.groups()
        repo = repo.rstrip(".git")

        # Get compare info from GitHub API
        api_url = f"https://api.github.com/repos/{owner}/{repo}/compare/{from_sha}...{to_sha}"

        try:
            result = subprocess.run(
                ["curl", "-s", api_url],
                capture_output=True,
                text=True,
                timeout=15
            )
            if result.returncode == 0:
                data = json.loads(result.stdout)
                commits = len(data.get("commits", []))
                files = len(data.get("files", []))
                return (commits, files)
        except Exception:
            pass

        return (0, 0)

    def get_summary(self, results: list[DiffResult]) -> dict:
        """Get summary statistics of diff results."""
        return {
            "total": len(results),
            "new": sum(1 for r in results if r.change_type == ChangeType.NEW),
            "major_updates": sum(1 for r in results if r.change_type == ChangeType.UPDATED_MAJOR),
            "minor_updates": sum(1 for r in results if r.change_type == ChangeType.UPDATED_MINOR),
            "unchanged": sum(1 for r in results if r.change_type == ChangeType.UNCHANGED),
            "removed": sum(1 for r in results if r.change_type == ChangeType.REMOVED),
            "needs_review": sum(1 for r in results if r.needs_full_review and not r.should_skip),
            "skipped": sum(1 for r in results if r.should_skip),
        }

    def filter_actionable(self, results: list[DiffResult]) -> list[DiffResult]:
        """Filter to only actionable results (not unchanged, not skipped)."""
        return [
            r for r in results
            if r.change_type != ChangeType.UNCHANGED and not r.should_skip
        ]
