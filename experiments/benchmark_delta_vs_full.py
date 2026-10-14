"""
NetSync State Evaluation: Full Snapshot vs Delta Sync Benchmark
==============================================================
Empirical comparison of wire transmission size and bandwidth
savings achieved by NetSync's Delta Engine.
"""

import json
from netsync_network.synchronization.delta_engine import DeltaEngine


def run_delta_benchmark():
    engine = DeltaEngine()

    # Scenario: User working on a complex workspace with 15 open tabs and editor buffers
    base_state = {
        "workspace_id": "ws-capstone-alpha",
        "active_tab_id": "tab-1",
        "tabs": [
            {"id": f"tab-{i}", "url": f"https://rfc-editor.org/rfc/rfc{9000 + i}.txt", "title": f"RFC Document {i}", "scroll": 10 * i}
            for i in range(15)
        ],
        "cursor_positions": {f"file_{i}.py": {"line": 10 + i, "col": 5} for i in range(10)},
        "scroll_positions": {f"https://rfc-editor.org/rfc/rfc{9000 + i}.txt": 10 * i for i in range(15)},
        "editor_buffers": {
            "main.py": "def sync_node():\n    return 'connected'\n" * 50,
            "config.json": json.dumps({"port": 9100, "mesh": True, "auth": "hmac_sha256"}, indent=2),
        },
    }

    # User scrolls active tab down by 150px and moves cursor 2 lines
    new_state = json.loads(json.dumps(base_state))
    new_state["scroll_positions"]["https://rfc-editor.org/rfc/rfc9000.txt"] = 350
    new_state["cursor_positions"]["file_0.py"] = {"line": 12, "col": 8}

    # Full State Serialization Size
    full_payload = json.dumps(new_state).encode("utf-8")
    full_size = len(full_payload)

    # Delta Engine Computation
    delta = engine.compute_delta(base_state, new_state, "ws-capstone-alpha", 1, 2)
    delta_payload = delta.to_bytes()
    delta_size = len(delta_payload)

    savings_bytes = full_size - delta_size
    savings_pct = (savings_bytes / full_size) * 100

    print("=" * 60)
    print("NetSync Wire Efficiency Evaluation: Full Snapshot vs Delta Sync")
    print("=" * 60)
    print(f"  Full State Snapshot Size: {full_size:,} bytes")
    print(f"  Delta Diff Payload Size:  {delta_size:,} bytes")
    print(f"  Bandwidth Saved:          {savings_bytes:,} bytes")
    print(f"  Transfer Reduction Ratio: {savings_pct:.2f}%")
    print("=" * 60)


if __name__ == "__main__":
    run_delta_benchmark()
