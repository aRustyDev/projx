"""
Sketch Plugin Tracking Library

Modular components for scraping, tracking, and categorizing Sketch plugins.
Uses YAML files in references/plugins/*.yml as the source of truth.
"""

from .schema import (
    PluginEntry,
    PluginCategory,
    VersionInfo,
    WatchStatus,
    export_json_schema,
)
from .state import PluginState, PluginRecord
from .scraper import PluginScraper, ScrapedPlugin
from .differ import PluginDiffer, ChangeType, DiffResult
from .categorizer import PluginCategorizer, CATEGORIES, to_filename, from_filename
from .reviewer import ReviewQueue, ReviewItem, ReviewAction, create_review_prompt

__all__ = [
    # Schema (pydantic models)
    "PluginEntry",
    "PluginCategory",
    "VersionInfo",
    "WatchStatus",
    "export_json_schema",
    # State management
    "PluginState",
    "PluginRecord",
    # Scraping
    "PluginScraper",
    "ScrapedPlugin",
    # Diffing
    "PluginDiffer",
    "ChangeType",
    "DiffResult",
    # Categorization
    "PluginCategorizer",
    "CATEGORIES",
    "to_filename",
    "from_filename",
    # Review
    "ReviewQueue",
    "ReviewItem",
    "ReviewAction",
    "create_review_prompt",
]
