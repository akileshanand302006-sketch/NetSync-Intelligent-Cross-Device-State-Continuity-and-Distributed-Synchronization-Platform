"""
NetSync State Synchronization Tests
====================================
Tests for StateManager, DeltaEngine, and ConflictResolver.
"""

import copy
import pytest

from netsync_network.synchronization.state_manager import (
    StateManager,
    StateSnapshot,
    StateType,
    StateMutation,
)
from netsync_network.synchronization.delta_engine import DeltaEngine, StateDelta
from netsync_network.synchronization.conflict_resolution import (
    ConflictResolver,
    ConflictStrategy,
    ConflictStatus,
)


# ─── StateManager Tests ──────────────────────────────────────────────────────

class TestStateManager:
    """Test versioned state snapshots, version monotonic progression, and mutations."""

    def test_state_creation_and_versioning(self):
        sm = StateManager(device_id="dev-101")
        data = {"cursor_pos": 42, "file": "index.ts"}
        snapshot = sm.set_state("workspace-1", StateType.WORKSPACE, data)

        assert snapshot.state_id == "workspace-1"
        assert snapshot.state_type == StateType.WORKSPACE
        assert snapshot.version == 1
        assert snapshot.data == data
        assert sm.get_state_version("workspace-1") == 1
        assert sm.get_state_hash("workspace-1") == snapshot.hash

    def test_state_updates_and_history(self):
        sm = StateManager(device_id="dev-101", snapshot_history_depth=5)
        sm.set_state("workspace-1", StateType.WORKSPACE, {"count": 1})
        sm.set_state("workspace-1", StateType.WORKSPACE, {"count": 2})
        sm.set_state("workspace-1", StateType.WORKSPACE, {"count": 3})

        latest = sm.get_state("workspace-1")
        assert latest is not None
        assert latest.version == 3
        assert latest.data == {"count": 3}

        # Check history retention
        history = sm._history.get("workspace-1", [])
        assert len(history) == 2  # previous 2 versions

    def test_offline_mutation_queue(self):
        sm = StateManager(device_id="dev-101")
        mutation = StateMutation(
            mutation_id="mut-1",
            state_id="workspace-1",
            state_type=StateType.WORKSPACE,
            operation="merge",
            field_path=None,
            value={"editor": "vscode"},
            base_version=1,
        )
        sm._offline_queue.append(mutation)
        assert sm.offline_queue_size == 1


# ─── DeltaEngine Tests ───────────────────────────────────────────────────────

class TestDeltaEngine:
    """Test field-level state diffing, delta application, and decision threshold."""

    def test_delta_computation_add_modify_remove(self):
        engine = DeltaEngine()
        old_data = {"a": 1, "b": "hello", "c": [1, 2]}
        new_data = {"b": "world", "c": [1, 2], "d": 99}

        delta = engine.compute_delta(
            old_data, new_data, state_id="doc-1", base_version=1, target_version=2
        )

        assert delta.state_id == "doc-1"
        assert delta.base_version == 1
        assert delta.target_version == 2
        assert delta.added == {"d": 99}
        assert delta.modified == {"b": "world"}
        assert delta.removed == ["a"]
        assert not delta.is_empty
        assert delta.change_count == 3

    def test_delta_application(self):
        engine = DeltaEngine()
        base_data = {"a": 1, "b": "hello", "c": [1, 2]}
        target_data = {"b": "world", "c": [1, 2], "d": 99}

        delta = engine.compute_delta(base_data, target_data, "doc-1", 1, 2)
        applied = engine.apply_delta(base_data, delta)

        assert applied == target_data
        # Ensure base_data was not mutated in-place
        assert base_data == {"a": 1, "b": "hello", "c": [1, 2]}

    def test_empty_delta_when_no_change(self):
        engine = DeltaEngine()
        data = {"theme": "dark", "fontSize": 14}
        delta = engine.compute_delta(data, data, "settings", 1, 1)

        assert delta.is_empty
        assert delta.change_count == 0
        assert delta.added == {}
        assert delta.modified == {}
        assert delta.removed == []

    def test_delta_serialization_roundtrip(self):
        engine = DeltaEngine()
        old_data = {"x": 10}
        new_data = {"x": 20, "y": 30}
        delta = engine.compute_delta(old_data, new_data, "coords", 1, 2)

        raw = delta.to_bytes()
        restored = StateDelta.from_bytes(raw)

        assert restored.state_id == delta.state_id
        assert restored.base_version == delta.base_version
        assert restored.target_version == delta.target_version
        assert restored.added == delta.added
        assert restored.modified == delta.modified
        assert restored.removed == delta.removed


# ─── ConflictResolver Tests ──────────────────────────────────────────────────

class TestConflictResolver:
    """Test conflict detection and resolution strategies (server wins, client wins, field merge)."""

    def test_no_conflict_when_data_identical(self):
        resolver = ConflictResolver()
        state = {"user": "Alice", "tab": "dashboard"}

        record = resolver.detect_conflict(
            state_id="s1",
            state_type="session",
            server_data=state,
            client_data=state,
            server_version=2,
            client_version=1,
        )
        assert record is None

    def test_detect_conflict_when_data_diverges(self):
        resolver = ConflictResolver()
        server_data = {"tab": "editor", "scroll": 500}
        client_data = {"tab": "settings", "scroll": 100}

        record = resolver.detect_conflict(
            state_id="s1",
            state_type="session",
            server_data=server_data,
            client_data=client_data,
            server_version=3,
            client_version=2,
            device_id="mobile-1",
        )

        assert record is not None
        assert record.state_id == "s1"
        assert record.server_version == 3
        assert record.client_version == 2
        assert len(record.conflicting_fields) == 2
        field_names = {f.field_name for f in record.conflicting_fields}
        assert field_names == {"tab", "scroll"}

    def test_server_wins_resolution(self):
        resolver = ConflictResolver()
        server_data = {"color": "blue", "cursor": 10}
        client_data = {"color": "red", "cursor": 25}

        record = resolver.detect_conflict(
            state_id="s1",
            state_type="theme",
            server_data=server_data,
            client_data=client_data,
            server_version=2,
            client_version=1,
        )
        assert record is not None

        resolved = resolver.resolve(
            conflict=record,
            server_data=server_data,
            client_data=client_data,
            strategy=ConflictStrategy.SERVER_WINS,
        )

        assert resolved == server_data
        assert record.status == ConflictStatus.AUTO_RESOLVED
        assert record.strategy_used == ConflictStrategy.SERVER_WINS

    def test_client_wins_resolution(self):
        resolver = ConflictResolver()
        server_data = {"color": "blue", "cursor": 10}
        client_data = {"color": "red", "cursor": 25}

        record = resolver.detect_conflict(
            state_id="s1",
            state_type="theme",
            server_data=server_data,
            client_data=client_data,
            server_version=2,
            client_version=1,
        )
        assert record is not None

        resolved = resolver.resolve(
            conflict=record,
            server_data=server_data,
            client_data=client_data,
            strategy=ConflictStrategy.CLIENT_WINS,
        )

        assert resolved == client_data
        assert record.status == ConflictStatus.AUTO_RESOLVED
        assert record.strategy_used == ConflictStrategy.CLIENT_WINS

    def test_field_merge_resolution(self):
        resolver = ConflictResolver()
        # Server changed zoom, client changed theme
        server_data = {"zoom": 1.5, "theme": "light"}
        client_data = {"zoom": 1.0, "theme": "dark"}

        record = resolver.detect_conflict(
            state_id="s1",
            state_type="theme",
            server_data=server_data,
            client_data=client_data,
            server_version=2,
            client_version=1,
        )
        assert record is not None

        resolved = resolver.resolve(
            conflict=record,
            server_data=server_data,
            client_data=client_data,
            strategy=ConflictStrategy.FIELD_MERGE,
        )

        # In field merge, non-conflicting fields are merged and conflicting fields are logged
        assert isinstance(resolved, dict)
        assert record.status == ConflictStatus.AUTO_RESOLVED
