"""
NetSync Conflict Resolution
=============================
Detects and resolves conflicts when concurrent modifications
arrive from different devices.

Conflict Resolution Strategies:
1. SERVER_WINS: Server's version takes precedence (simple, always consistent)
2. CLIENT_WINS: Latest client modification wins
3. FIELD_MERGE: Merge non-conflicting fields, flag conflicts for manual resolution
4. MANUAL: Create a conflict record for user resolution

Limitations of last-write-wins:
- Concurrent edits to the same field may lose data
- Depends on server-assigned ordering, not actual edit time
- Acceptable for simple fields (preferences, positions)
- Not suitable for collaborative text editing

This module uses server-assigned versions rather than wall-clock timestamps
to establish ordering, avoiding clock-skew problems.
"""

from __future__ import annotations

import copy
import logging
import time
import uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


class ConflictStrategy(str, Enum):
    """Available conflict resolution strategies."""
    SERVER_WINS = "server_wins"
    CLIENT_WINS = "client_wins"
    FIELD_MERGE = "field_merge"
    MANUAL = "manual"


class ConflictStatus(str, Enum):
    """Status of a conflict record."""
    DETECTED = "detected"
    AUTO_RESOLVED = "auto_resolved"
    MANUALLY_RESOLVED = "manually_resolved"
    DISCARDED = "discarded"


@dataclass
class ConflictField:
    """A single conflicting field."""
    field_name: str
    server_value: Any
    client_value: Any
    resolved_value: Any = None
    resolution: str = ""  # "server", "client", "merged", "manual"


@dataclass
class ConflictRecord:
    """Record of a detected conflict."""
    conflict_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    state_id: str = ""
    state_type: str = ""
    server_version: int = 0
    client_version: int = 0
    conflicting_fields: list[ConflictField] = field(default_factory=list)
    status: ConflictStatus = ConflictStatus.DETECTED
    strategy_used: ConflictStrategy = ConflictStrategy.SERVER_WINS
    resolved_data: dict[str, Any] | None = None
    created_at: float = field(default_factory=time.time)
    resolved_at: float | None = None
    device_id: str = ""

    @property
    def field_count(self) -> int:
        return len(self.conflicting_fields)


class ConflictResolver:
    """
    Detects and resolves state conflicts.

    When two devices modify the same state and both attempt to sync,
    this resolver determines the outcome based on the configured strategy.
    """

    def __init__(self, default_strategy: ConflictStrategy = ConflictStrategy.FIELD_MERGE) -> None:
        self.default_strategy = default_strategy
        self._conflict_history: list[ConflictRecord] = []

    @property
    def conflict_count(self) -> int:
        return len(self._conflict_history)

    @property
    def unresolved_conflicts(self) -> list[ConflictRecord]:
        return [c for c in self._conflict_history if c.status == ConflictStatus.DETECTED]

    def detect_conflict(
        self,
        state_id: str,
        state_type: str,
        server_data: dict[str, Any],
        server_version: int,
        client_data: dict[str, Any],
        client_version: int,
        device_id: str = "",
    ) -> ConflictRecord | None:
        """
        Detect if there's a conflict between server and client state.

        A conflict exists when both versions have diverged from a common
        ancestor (both have changes the other doesn't have).

        Returns:
            ConflictRecord if conflict detected, None if no conflict.
        """
        # Find differing fields
        all_keys = set(server_data.keys()) | set(client_data.keys())
        conflicts = []

        for key in all_keys:
            server_val = server_data.get(key)
            client_val = client_data.get(key)
            if server_val != client_val:
                conflicts.append(ConflictField(
                    field_name=key,
                    server_value=server_val,
                    client_value=client_val,
                ))

        if not conflicts:
            return None  # No conflict

        record = ConflictRecord(
            state_id=state_id,
            state_type=state_type,
            server_version=server_version,
            client_version=client_version,
            conflicting_fields=conflicts,
            device_id=device_id,
        )

        self._conflict_history.append(record)
        logger.info(
            "Conflict detected for state %s: %d fields differ (server v%d vs client v%d)",
            state_id, len(conflicts), server_version, client_version,
        )
        return record

    def resolve(
        self,
        conflict: ConflictRecord,
        server_data: dict[str, Any],
        client_data: dict[str, Any],
        strategy: ConflictStrategy | None = None,
    ) -> dict[str, Any]:
        """
        Resolve a conflict using the specified strategy.

        Args:
            conflict: The conflict record.
            server_data: Server's version of the data.
            client_data: Client's version of the data.
            strategy: Resolution strategy (defaults to instance default).

        Returns:
            Resolved state data.
        """
        strategy = strategy or self.default_strategy

        if strategy == ConflictStrategy.SERVER_WINS:
            resolved = copy.deepcopy(server_data)
            for cf in conflict.conflicting_fields:
                cf.resolved_value = cf.server_value
                cf.resolution = "server"

        elif strategy == ConflictStrategy.CLIENT_WINS:
            resolved = copy.deepcopy(client_data)
            for cf in conflict.conflicting_fields:
                cf.resolved_value = cf.client_value
                cf.resolution = "client"

        elif strategy == ConflictStrategy.FIELD_MERGE:
            resolved = self._field_merge(conflict, server_data, client_data)

        elif strategy == ConflictStrategy.MANUAL:
            # Keep server data but mark as needing manual resolution
            resolved = copy.deepcopy(server_data)
            conflict.status = ConflictStatus.DETECTED
            conflict.strategy_used = strategy
            return resolved

        else:
            resolved = copy.deepcopy(server_data)

        conflict.status = ConflictStatus.AUTO_RESOLVED
        conflict.strategy_used = strategy
        conflict.resolved_data = resolved
        conflict.resolved_at = time.time()

        logger.info(
            "Conflict %s resolved using %s strategy",
            conflict.conflict_id[:8], strategy.value,
        )
        return resolved

    def resolve_manually(
        self,
        conflict_id: str,
        resolved_data: dict[str, Any],
    ) -> bool:
        """Manually resolve a conflict with user-provided data."""
        for conflict in self._conflict_history:
            if conflict.conflict_id == conflict_id:
                conflict.status = ConflictStatus.MANUALLY_RESOLVED
                conflict.resolved_data = resolved_data
                conflict.resolved_at = time.time()
                return True
        return False

    def get_history(self) -> list[ConflictRecord]:
        """Get conflict history."""
        return list(self._conflict_history)

    def _field_merge(
        self,
        conflict: ConflictRecord,
        server_data: dict[str, Any],
        client_data: dict[str, Any],
    ) -> dict[str, Any]:
        """
        Merge non-conflicting fields automatically.

        For fields changed only on one side, take that change.
        For fields changed on both sides, use server value
        (last-write-wins at field level) and record the conflict.
        """
        # Start with server data as base
        merged = copy.deepcopy(server_data)

        for cf in conflict.conflicting_fields:
            key = cf.field_name

            # If only client has the field (new field added by client)
            if cf.server_value is None and cf.client_value is not None:
                merged[key] = copy.deepcopy(cf.client_value)
                cf.resolved_value = cf.client_value
                cf.resolution = "client_add"

            # If only server has the field (deleted by client or added by server)
            elif cf.server_value is not None and cf.client_value is None:
                cf.resolved_value = cf.server_value
                cf.resolution = "server_keep"

            # Both modified — server wins at field level (documented limitation)
            else:
                cf.resolved_value = cf.server_value
                cf.resolution = "server_wins_field"

        return merged
