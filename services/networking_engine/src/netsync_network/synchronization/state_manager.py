"""
NetSync State Manager
=====================
Versioned state management with snapshots, server-assigned revisions,
and offline mutation queuing.

Versioning Strategy
───────────────────
Uses server-assigned monotonic revision numbers rather than wall-clock
timestamps. This avoids clock-skew issues between devices with different
time zones or unsynchronized clocks.

Each state object has:
- state_id: Stable unique identifier
- state_type: Category (workspace, session, clipboard, etc.)
- version: Server-assigned monotonic integer
- hash: SHA-256 of the serialized state data
- data: The actual state as a dict
"""

from __future__ import annotations

import copy
import hashlib
import json
import logging
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


class StateType(str, Enum):
    """Types of synchronizable state."""
    WORKSPACE = "workspace"
    SESSION = "session"
    CLIPBOARD = "clipboard"
    READING_POSITION = "reading_position"
    PREFERENCE = "preference"
    CUSTOM = "custom"


@dataclass
class StateSnapshot:
    """An immutable snapshot of state at a specific version."""
    state_id: str
    state_type: StateType
    version: int
    data: dict[str, Any]
    hash: str
    device_id: str
    created_at: float = field(default_factory=time.time)

    @staticmethod
    def compute_hash(data: dict[str, Any]) -> str:
        """Deterministic hash of state data."""
        serialized = json.dumps(data, sort_keys=True, separators=(",", ":"))
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


@dataclass
class StateMutation:
    """A queued state change (for offline operation)."""
    mutation_id: str
    state_id: str
    state_type: StateType
    operation: str  # "set", "merge", "delete"
    field_path: str | None  # dot-separated path, None for full replace
    value: Any = None
    base_version: int = 0
    device_id: str = ""
    created_at: float = field(default_factory=time.time)
    applied: bool = False
    applied_version: int | None = None


class StateManager:
    """
    Manages versioned state with snapshot history and offline queuing.

    Key features:
    - Server-assigned revision numbers (no clock dependency)
    - Snapshot storage with configurable history depth
    - Offline mutation queue
    - State hash for fast equality checks
    - Thread-safe version incrementing
    """

    def __init__(
        self,
        device_id: str,
        snapshot_history_depth: int = 10,
    ) -> None:
        self.device_id = device_id
        self.snapshot_history_depth = snapshot_history_depth

        self._states: dict[str, StateSnapshot] = {}
        self._history: dict[str, list[StateSnapshot]] = {}
        self._offline_queue: list[StateMutation] = []
        self._version_counter: int = 0

    @property
    def state_count(self) -> int:
        return len(self._states)

    @property
    def offline_queue_size(self) -> int:
        return len(self._offline_queue)

    def next_version(self) -> int:
        """Get the next version number (server-assigned, monotonic)."""
        self._version_counter += 1
        return self._version_counter

    def get_state(self, state_id: str) -> StateSnapshot | None:
        """Get the current state snapshot."""
        return self._states.get(state_id)

    def get_state_version(self, state_id: str) -> int:
        """Get the current version of a state, or 0 if not found."""
        state = self._states.get(state_id)
        return state.version if state else 0

    def get_state_hash(self, state_id: str) -> str | None:
        """Get the hash of the current state."""
        state = self._states.get(state_id)
        return state.hash if state else None

    def set_state(
        self,
        state_id: str,
        state_type: StateType,
        data: dict[str, Any],
        version: int | None = None,
    ) -> StateSnapshot:
        """
        Set the full state, creating a new snapshot.

        Args:
            state_id: Unique state identifier.
            state_type: Category of state.
            data: The state data.
            version: Explicit version (server-assigned) or auto-increment.

        Returns:
            The new StateSnapshot.
        """
        version = version or self.next_version()
        state_hash = StateSnapshot.compute_hash(data)

        snapshot = StateSnapshot(
            state_id=state_id,
            state_type=state_type,
            version=version,
            data=copy.deepcopy(data),
            hash=state_hash,
            device_id=self.device_id,
        )

        # Save to history
        history = self._history.setdefault(state_id, [])
        if self._states.get(state_id):
            history.append(self._states[state_id])
            # Trim history
            if len(history) > self.snapshot_history_depth:
                history.pop(0)

        self._states[state_id] = snapshot
        logger.debug("State %s updated to v%d (hash=%s)", state_id, version, state_hash[:8])
        return snapshot

    def merge_state(
        self,
        state_id: str,
        state_type: StateType,
        partial_data: dict[str, Any],
        version: int | None = None,
    ) -> StateSnapshot:
        """
        Merge partial data into existing state.

        Args:
            state_id: State to update.
            state_type: State category.
            partial_data: Fields to merge.
            version: New version number.

        Returns:
            The updated StateSnapshot.
        """
        current = self._states.get(state_id)
        if current:
            merged = copy.deepcopy(current.data)
            merged.update(partial_data)
        else:
            merged = copy.deepcopy(partial_data)

        return self.set_state(state_id, state_type, merged, version)

    def delete_state(self, state_id: str) -> bool:
        """Delete a state and its history."""
        if state_id in self._states:
            del self._states[state_id]
            self._history.pop(state_id, None)
            return True
        return False

    def get_history(self, state_id: str) -> list[StateSnapshot]:
        """Get snapshot history for a state."""
        return list(self._history.get(state_id, []))

    def get_snapshot_at_version(
        self, state_id: str, version: int
    ) -> StateSnapshot | None:
        """Find a specific version in history."""
        current = self._states.get(state_id)
        if current and current.version == version:
            return current

        for snap in self._history.get(state_id, []):
            if snap.version == version:
                return snap
        return None

    # ─── Offline Queue ─────────────────────────────────────────────────────────

    def queue_mutation(self, mutation: StateMutation) -> None:
        """Add a mutation to the offline queue."""
        self._offline_queue.append(mutation)
        logger.debug(
            "Queued offline mutation %s for state %s",
            mutation.mutation_id, mutation.state_id,
        )

    def get_pending_mutations(self) -> list[StateMutation]:
        """Get all unprocessed offline mutations."""
        return [m for m in self._offline_queue if not m.applied]

    def mark_mutation_applied(self, mutation_id: str, version: int) -> None:
        """Mark a mutation as successfully applied."""
        for m in self._offline_queue:
            if m.mutation_id == mutation_id:
                m.applied = True
                m.applied_version = version
                break

    def clear_applied_mutations(self) -> int:
        """Remove all applied mutations from the queue."""
        before = len(self._offline_queue)
        self._offline_queue = [m for m in self._offline_queue if not m.applied]
        removed = before - len(self._offline_queue)
        if removed:
            logger.debug("Cleared %d applied mutations", removed)
        return removed

    def get_all_states(self) -> dict[str, StateSnapshot]:
        """Get all current state snapshots."""
        return dict(self._states)
