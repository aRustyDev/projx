"""
Plugin Review Queue

Manages the queue of plugins that need LLM review.
Supports both programmatic batch processing and interactive MCP-gated review.
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional, Callable
import json

from .differ import DiffResult, ChangeType
from .state import PluginRecord
from .schema import WatchStatus
from .categorizer import PluginCategorizer


class ReviewAction(str, Enum):
    """Action to take after review."""
    ACCEPT = "accept"           # Accept plugin/changes into state
    REJECT = "reject"           # Reject plugin (mark ignored)
    DEFER = "defer"             # Defer review for later
    WATCH = "watch"             # Accept and set to watch
    MAJOR_ONLY = "major_only"   # Accept and set to major-only


@dataclass
class ReviewItem:
    """Single item in the review queue."""
    diff_result: DiffResult
    queue_time: str = field(default_factory=lambda: datetime.utcnow().isoformat())

    # Review context
    suggested_category: Optional[str] = None
    exploration_notes: Optional[str] = None
    github_readme: Optional[str] = None

    # Review outcome
    reviewed: bool = False
    review_time: Optional[str] = None
    action: Optional[ReviewAction] = None
    final_category: Optional[str] = None
    review_summary: Optional[str] = None

    @property
    def plugin_name(self) -> str:
        return self.diff_result.plugin.name

    @property
    def plugin_link(self) -> str:
        return self.diff_result.plugin.link

    @property
    def change_type(self) -> ChangeType:
        return self.diff_result.change_type

    @property
    def is_new(self) -> bool:
        return self.change_type == ChangeType.NEW

    @property
    def is_github(self) -> bool:
        return self.diff_result.plugin.is_github

    def to_dict(self) -> dict:
        """Serialize for JSON storage."""
        return {
            "plugin_name": self.plugin_name,
            "plugin_link": self.plugin_link,
            "change_type": self.change_type.value,
            "queue_time": self.queue_time,
            "suggested_category": self.suggested_category,
            "exploration_notes": self.exploration_notes,
            "reviewed": self.reviewed,
            "review_time": self.review_time,
            "action": self.action.value if self.action else None,
            "final_category": self.final_category,
            "review_summary": self.review_summary,
            # Include diff details
            "reason": self.diff_result.reason,
            "compare_url": self.diff_result.compare_url,
            "commit_count": self.diff_result.commit_count,
            "files_changed": self.diff_result.files_changed,
        }


class ReviewQueue:
    """
    Manages review queue for plugins needing LLM review.

    The queue supports:
    1. Batch processing - populate queue, process items, apply results
    2. MCP-gated review - present items one at a time for interactive review
    3. Persistence - save/load queue state between sessions
    """

    def __init__(self, categorizer: PluginCategorizer = None):
        self.categorizer = categorizer or PluginCategorizer()
        self.items: list[ReviewItem] = []
        self._pending_idx = 0

    def populate_from_diff(self, results: list[DiffResult]) -> int:
        """
        Populate queue from diff results.

        Only adds items that need review (NEW or MAJOR updates, not skipped).

        Returns:
            Number of items added
        """
        added = 0
        for result in results:
            if result.needs_full_review and not result.should_skip:
                item = ReviewItem(diff_result=result)

                # Pre-categorize for new plugins
                if result.change_type == ChangeType.NEW:
                    item.suggested_category = self.categorizer.categorize(
                        result.plugin.name,
                        result.plugin.description
                    )
                else:
                    # Keep existing category for updates
                    item.suggested_category = result.category

                self.items.append(item)
                added += 1

        return added

    def get_pending(self) -> list[ReviewItem]:
        """Get all pending (unreviewed) items."""
        return [item for item in self.items if not item.reviewed]

    def get_next(self) -> Optional[ReviewItem]:
        """Get next item for review."""
        pending = self.get_pending()
        return pending[0] if pending else None

    def mark_reviewed(
        self,
        item: ReviewItem,
        action: ReviewAction,
        category: str = None,
        summary: str = ""
    ):
        """
        Mark an item as reviewed with the given action.

        Args:
            item: The review item
            action: Action taken
            category: Final category (defaults to suggested)
            summary: Review summary/notes
        """
        item.reviewed = True
        item.review_time = datetime.utcnow().isoformat()
        item.action = action
        item.final_category = category or item.suggested_category
        item.review_summary = summary

    def apply_to_state(
        self,
        state,  # PluginState
        on_accept: Callable[[ReviewItem, PluginRecord], None] = None
    ) -> dict:
        """
        Apply reviewed items to plugin state.

        Args:
            state: PluginState to update
            on_accept: Optional callback when item is accepted

        Returns:
            Summary of actions taken
        """
        summary = {
            "accepted": 0,
            "rejected": 0,
            "deferred": 0,
            "errors": []
        }

        for item in self.items:
            if not item.reviewed:
                continue

            try:
                if item.action in (ReviewAction.ACCEPT, ReviewAction.WATCH, ReviewAction.MAJOR_ONLY):
                    # Create/update record
                    plugin = item.diff_result.plugin
                    record = PluginRecord(
                        name=plugin.name,
                        link=plugin.link,
                        description=plugin.description,
                        author=plugin.author,
                        category=item.final_category or "Other",
                        last_updated=plugin.updated,
                        github_sha=item.diff_result.current_sha,
                        is_github=plugin.is_github,
                        open_source=plugin.is_github,
                        tags=[item.final_category.lower().replace(" ", "-").replace("/", "-")]
                        if item.final_category else []
                    )

                    # Set watch status based on action
                    if item.action == ReviewAction.WATCH:
                        record.watch_status = WatchStatus.WATCH
                    elif item.action == ReviewAction.MAJOR_ONLY:
                        record.watch_status = WatchStatus.MAJOR_ONLY

                    # Add review metadata
                    record.last_reviewed = item.review_time
                    record.review_summary = item.review_summary

                    state.add_or_update(record)
                    summary["accepted"] += 1

                    if on_accept:
                        on_accept(item, record)

                elif item.action == ReviewAction.REJECT:
                    # Mark as ignored if exists, otherwise skip
                    existing = state.get_plugin(item.plugin_link)
                    if existing:
                        existing.watch_status = WatchStatus.IGNORE
                    summary["rejected"] += 1

                elif item.action == ReviewAction.DEFER:
                    summary["deferred"] += 1

            except Exception as e:
                summary["errors"].append(f"{item.plugin_name}: {e}")

        return summary

    def get_stats(self) -> dict:
        """Get queue statistics."""
        pending = [i for i in self.items if not i.reviewed]
        reviewed = [i for i in self.items if i.reviewed]

        by_type = {}
        for item in self.items:
            t = item.change_type.value
            by_type[t] = by_type.get(t, 0) + 1

        by_action = {}
        for item in reviewed:
            if item.action:
                a = item.action.value
                by_action[a] = by_action.get(a, 0) + 1

        return {
            "total": len(self.items),
            "pending": len(pending),
            "reviewed": len(reviewed),
            "by_change_type": by_type,
            "by_action": by_action,
        }

    def save(self, filepath: str):
        """Save queue state to JSON file."""
        data = {
            "saved_at": datetime.utcnow().isoformat(),
            "stats": self.get_stats(),
            "items": [item.to_dict() for item in self.items]
        }
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)

    def clear_reviewed(self):
        """Remove reviewed items from queue."""
        self.items = [item for item in self.items if not item.reviewed]

    def clear_all(self):
        """Clear entire queue."""
        self.items = []


def create_review_prompt(item: ReviewItem) -> str:
    """
    Create a prompt for LLM review of a plugin.

    Returns a structured prompt for evaluating the plugin.
    """
    plugin = item.diff_result.plugin

    if item.is_new:
        prompt = f"""# New Plugin Review: {plugin.name}

**Link**: {plugin.link}
**Author**: {plugin.author}
**Description**: {plugin.description}
**Suggested Category**: {item.suggested_category}
**Is GitHub**: {plugin.is_github}

## Review Tasks

1. **Verify Description**: Is the description accurate based on the plugin link?
2. **Confirm Category**: Is "{item.suggested_category}" the best category?
3. **Assess Relevance**: Is this plugin useful for Sketch development workflows?
4. **Check Status**: Is the plugin maintained and functional?

## Decision

Choose one:
- ACCEPT: Add to tracked plugins
- WATCH: Add and track all updates
- MAJOR_ONLY: Add but only track major updates
- REJECT: Do not track (mark ignored)
- DEFER: Need more information
"""
    else:
        diff = item.diff_result
        prompt = f"""# Plugin Update Review: {plugin.name}

**Link**: {plugin.link}
**Change Type**: {diff.change_type.value.upper()}
**Reason**: {diff.reason}
**Current Category**: {item.suggested_category}

## Change Details
"""
        if diff.compare_url:
            prompt += f"**Compare URL**: {diff.compare_url}\n"
        if diff.commit_count:
            prompt += f"**Commits**: {diff.commit_count}\n"
        if diff.files_changed:
            prompt += f"**Files Changed**: {diff.files_changed}\n"

        prompt += """
## Review Tasks

1. **Assess Impact**: Are these changes significant for users?
2. **Check Breaking Changes**: Any breaking changes that need documentation?
3. **Verify Functionality**: Is the plugin still working correctly?

## Decision

Choose one:
- ACCEPT: Update the tracked record
- WATCH: Update and track future updates closely
- MAJOR_ONLY: Update but reduce tracking frequency
- REJECT: Remove from tracking
- DEFER: Need more investigation
"""

    return prompt
