"""
NetSync Delta Engine
====================
Generates and applies deltas (diffs) between state snapshots
to reduce transfer size.

Uses field-level diffing for dictionary states, computing only
the changed, added, and removed keys.
"""

from __future__ import annotations

import copy
import json
import logging
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger(__name__)


@dataclass
class StateDelta:
    """A delta between two state versions."""
    state_id: str
    base_version: int
    target_version: int
    added: dict[str, Any] = field(default_factory=dict)
    modified: dict[str, Any] = field(default_factory=dict)
    removed: list[str] = field(default_factory=list)
    base_hash: str = ""
    target_hash: str = ""

    @property
    def is_empty(self) -> bool:
        return not self.added and not self.modified and not self.removed

    @property
    def change_count(self) -> int:
        return len(self.added) + len(self.modified) + len(self.removed)

    def to_dict(self) -> dict[str, Any]:
        return {
            "state_id": self.state_id,
            "base_version": self.base_version,
            "target_version": self.target_version,
            "added": self.added,
            "modified": self.modified,
            "removed": self.removed,
            "base_hash": self.base_hash,
            "target_hash": self.target_hash,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> StateDelta:
        return cls(**data)

    def to_bytes(self) -> bytes:
        return json.dumps(self.to_dict(), separators=(",", ":")).encode("utf-8")

    @classmethod
    def from_bytes(cls, data: bytes) -> StateDelta:
        return cls.from_dict(json.loads(data.decode("utf-8")))


class DeltaEngine:
    """
    Generates and applies field-level deltas between state snapshots.

    For structured dictionary state, this computes:
    - Added fields (present in new, absent in old)
    - Modified fields (present in both, different values)
    - Removed fields (present in old, absent in new)

    Delta vs Full Transfer Decision:
    - If delta size < full state size * threshold, use delta
    - Default threshold: 0.8 (delta must be < 80% of full size)
    """

    def __init__(self, threshold: float = 0.8) -> None:
        self.threshold = threshold

    def compute_delta(
        self,
        old_data: dict[str, Any],
        new_data: dict[str, Any],
        state_id: str = "",
        base_version: int = 0,
        target_version: int = 0,
    ) -> StateDelta:
        """
        Compute a delta between two state snapshots.

        Args:
            old_data: Previous state data.
            new_data: New state data.
            state_id: State identifier.
            base_version: Version of old_data.
            target_version: Version of new_data.

        Returns:
            StateDelta describing the changes.
        """
        added: dict[str, Any] = {}
        modified: dict[str, Any] = {}
        removed: list[str] = []

        old_keys = set(old_data.keys())
        new_keys = set(new_data.keys())

        # Added keys
        for key in new_keys - old_keys:
            added[key] = copy.deepcopy(new_data[key])

        # Removed keys
        for key in old_keys - new_keys:
            removed.append(key)

        # Modified keys
        for key in old_keys & new_keys:
            if old_data[key] != new_data[key]:
                modified[key] = copy.deepcopy(new_data[key])

        from netsync_network.synchronization.state_manager import StateSnapshot

        return StateDelta(
            state_id=state_id,
            base_version=base_version,
            target_version=target_version,
            added=added,
            modified=modified,
            removed=removed,
            base_hash=StateSnapshot.compute_hash(old_data),
            target_hash=StateSnapshot.compute_hash(new_data),
        )

    def apply_delta(
        self,
        base_data: dict[str, Any],
        delta: StateDelta,
    ) -> dict[str, Any]:
        """
        Apply a delta to base state to produce the new state.

        Args:
            base_data: The base state (must match delta.base_version).
            delta: The delta to apply.

        Returns:
            New state data after applying the delta.
        """
        result = copy.deepcopy(base_data)

        # Apply removals
        for key in delta.removed:
            result.pop(key, None)

        # Apply additions
        result.update(copy.deepcopy(delta.added))

        # Apply modifications
        result.update(copy.deepcopy(delta.modified))

        return result

    def should_use_delta(
        self,
        old_data: dict[str, Any],
        new_data: dict[str, Any],
    ) -> bool:
        """
        Decide whether delta transfer is more efficient than full transfer.

        Returns True if delta is smaller than threshold * full_size.
        """
        full_size = len(json.dumps(new_data, separators=(",", ":")).encode("utf-8"))
        if full_size == 0:
            return False

        delta = self.compute_delta(old_data, new_data)
        delta_size = len(delta.to_bytes())

        efficient = delta_size < full_size * self.threshold
        logger.debug(
            "Delta analysis: full=%dB, delta=%dB, ratio=%.2f, use_delta=%s",
            full_size, delta_size, delta_size / max(full_size, 1), efficient,
        )
        return efficient

    @staticmethod
    def compute_savings(full_size: int, delta_size: int) -> dict[str, Any]:
        """Compute transfer savings statistics."""
        saved = full_size - delta_size
        ratio = saved / max(full_size, 1)
        return {
            "full_size_bytes": full_size,
            "delta_size_bytes": delta_size,
            "saved_bytes": saved,
            "savings_ratio": round(ratio, 4),
            "savings_percent": round(ratio * 100, 2),
        }
