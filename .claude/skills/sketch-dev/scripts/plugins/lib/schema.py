"""
Plugin Schema

Pydantic models for plugin data validation and serialization.
"""

from datetime import date
from enum import Enum
from typing import Optional, Annotated
from pydantic import BaseModel, Field, HttpUrl, field_validator, model_validator
import re


class WatchStatus(str, Enum):
    """Watch status for tracking updates."""
    WATCH = "watch"           # Track all updates
    IGNORE = "ignore"         # Skip all updates
    MAJOR_ONLY = "major_only" # Only track major updates
    DEFAULT = "default"       # Use default behavior


class VersionInfo(BaseModel):
    """Version information for a plugin."""
    # For GitHub: commit SHA (40 chars)
    # For others: semver string with optional URL
    value: str = Field(..., description="Version string (SHA for GitHub, semver for others)")
    url: Optional[HttpUrl] = Field(None, description="URL to version info (changelog, release page)")

    @field_validator("value")
    @classmethod
    def validate_version(cls, v: str) -> str:
        # Allow SHA (40 hex chars) or semver-like strings
        if re.match(r"^[0-9a-f]{40}$", v.lower()):
            return v.lower()  # Normalize SHA to lowercase
        # Basic semver pattern (loose)
        if re.match(r"^v?\d+(\.\d+)*", v):
            return v
        # Allow "unknown" for plugins without version info
        if v.lower() in ("unknown", "n/a", ""):
            return "unknown"
        return v


class PluginEntry(BaseModel):
    """
    Schema for a single plugin entry in YAML files.

    Example:
        plugin: Phosphor Icons
        link: https://phosphoricons.com
        description: A flexible icon family for interfaces
        authors:
          - Tobias Fried
        updated: 2026-01-06
        version:
          value: "2.1.0"
          url: https://github.com/phosphor-icons/homepage/releases
        open-source: false
        tags:
          - icons
    """
    plugin: str = Field(..., description="Plugin name")
    link: HttpUrl = Field(..., description="Plugin URL (GitHub repo or homepage)")
    description: str = Field(..., description="Plugin description")
    authors: list[str] = Field(default_factory=list, description="List of author names")
    updated: date = Field(..., description="Last update date (YYYY-MM-DD)")
    version: VersionInfo = Field(..., description="Version information")
    open_source: bool = Field(alias="open-source", description="Whether plugin is open source")
    tags: list[str] = Field(default_factory=list, description="Category tags")

    # Optional tracking metadata
    watch_status: Optional[WatchStatus] = Field(None, description="Update tracking status")
    last_reviewed: Optional[date] = Field(None, description="Last review date")
    review_summary: Optional[str] = Field(None, description="Summary from last review")

    model_config = {
        "populate_by_name": True,  # Allow both 'open_source' and 'open-source'
        "json_schema_extra": {
            "examples": [{
                "plugin": "Phosphor Icons",
                "link": "https://phosphoricons.com",
                "description": "A flexible icon family for interfaces",
                "authors": ["Tobias Fried"],
                "updated": "2026-01-06",
                "version": {"value": "2.1.0", "url": "https://github.com/phosphor-icons/homepage/releases"},
                "open-source": False,
                "tags": ["icons"]
            }]
        }
    }

    @property
    def is_github(self) -> bool:
        """Check if plugin is hosted on GitHub."""
        return "github.com" in str(self.link).lower()

    @property
    def tracking_key(self) -> str:
        """Unique key for this plugin (normalized link)."""
        return str(self.link).lower().rstrip("/")

    def to_yaml_dict(self) -> dict:
        """Convert to dict for YAML serialization (excludes None values)."""
        d = {
            "plugin": self.plugin,
            "link": str(self.link),
            "description": self.description,
            "authors": self.authors,
            "updated": self.updated.isoformat(),
            "version": {
                "value": self.version.value,
            },
            "open-source": self.open_source,
            "tags": self.tags,
        }

        # Only include version URL if set
        if self.version.url:
            d["version"]["url"] = str(self.version.url)

        # Only include optional tracking fields if set
        if self.watch_status and self.watch_status != WatchStatus.DEFAULT:
            d["watch_status"] = self.watch_status.value
        if self.last_reviewed:
            d["last_reviewed"] = self.last_reviewed.isoformat()
        if self.review_summary:
            d["review_summary"] = self.review_summary

        return d


class PluginCategory(BaseModel):
    """A category file containing multiple plugin entries."""
    plugins: list[PluginEntry] = Field(default_factory=list)

    @classmethod
    def from_yaml_list(cls, entries: list[dict]) -> "PluginCategory":
        """Parse from YAML list format."""
        plugins = []
        for entry in entries:
            try:
                plugins.append(PluginEntry.model_validate(entry))
            except Exception as e:
                # Log but continue - don't fail on single bad entry
                print(f"Warning: Invalid entry '{entry.get('plugin', 'unknown')}': {e}")
        return cls(plugins=plugins)


def export_json_schema(output_path: str = None) -> dict:
    """
    Export JSON Schema for plugin entries.

    Args:
        output_path: Optional path to write schema file

    Returns:
        JSON Schema dict
    """
    schema = PluginEntry.model_json_schema()

    if output_path:
        import json
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(schema, f, indent=2)

    return schema
