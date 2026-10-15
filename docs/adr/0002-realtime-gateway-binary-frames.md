# ADR 0002: Realtime Gateway Architecture and High-Rate Binary Framing

**Status:** Accepted  
**Date:** October 2026  
**Deciders:** NetSync Core Team  
**Consulted:** Network Programming Laboratory (20MSS56), RFC 6455

---

## Context and Problem Statement

NetSync features high-rate telemetry (RTT ping samples, jitter, goodput, packet explorer stream) and distributed state differential synchronization. In high-traffic scenarios (e.g., streaming live packet captures, 20 concurrent client load bursts, or rapid delta diff transmissions), transmitting JSON text frames over WebSockets introduces significant issues:
1. **Serialization & Deserialization Overhead:** JSON string parsing on every packet frame consumes excessive CPU cycles in both Python and JavaScript.
2. **Wire Bloat:** JSON keys and ASCII encoding multiply frame sizes by 3x–6x compared to packed binary representations.
3. **Buffer Bloat and Lag:** Unbounded WebSocket queues cause the browser event loop to stutter when bursts arrive faster than render cycles.
4. **Packet Loss & Gaps:** Network disconnections drop frames silently without sequence resumption.

---

## Decision Drivers

1. **Section 3 & 9.3 Requirement:** Use a first-party WebSocket gateway with binary frames, 50–100 ms batching, per-channel backpressure and drop policies, and resume via `last_seq`.
2. **Low Overhead:** Wire format must be compact, zero-copy or minimal-copy, and fast to unpack in JavaScript.
3. **Reliable Sequencing:** Missing frame detection and gap signaling must be supported without requiring heavy TCP retransmission over WebSocket.

---

## Considered Options

1. **Standard Text-Based JSON Frames:** Continue sending standard JSON strings with text frames.
2. **Protocol Buffers (Protobuf):** High performance, but requires rigid `.proto` compilation toolchains and schema drift management between Python and JavaScript.
3. **MessagePack / CBOR with Batching & Sequence Tracking (Selected):** Standardized, schemaless binary serialization formats that retain dictionary ergonomics while encoding numbers, byte arrays, and timestamps in compact binary representations.

---

## Decision Outcome

Chosen Option: **MessagePack Binary Framing with Micro-Batching and Sequence Resumption**.

### Implementation Details:
1. **Binary Encoding:** High-rate channels (Telemetry, Packet Capture, Delta Sync) transmit binary WebSocket frames encoded using MessagePack (`msgpack-lite` / `msgpack` Python package).
2. **50–100 ms Micro-Batching:** High-frequency event streams (e.g., packet arrival bursts) are batched at 50 ms intervals into a single binary transmission array, drastically reducing frame header overhead and browser re-render cascades.
3. **Monotonic Sequencing (`seq` & `last_seq`):**
   - Every transmitted batch or frame carries a 64-bit monotonically increasing sequence number `seq`.
   - On reconnect, clients supply `last_seq`. The server replays missed events from a rolling circular buffer (up to 1,000 recent events).
   - If the gap exceeds buffer capacity, the server emits a structured `GAP_MARKER` instructing the client to request a full state snapshot.
4. **Per-Channel Backpressure & Drop Policy:**
   - Critical channels (State Sync, Device Pairing) use strict backpressure and never drop frames.
   - Non-critical telemetry channels (Live latency graphs, background packet traces) apply coalescing and LTTB downsampling when the client's `bufferedAmount` exceeds 64 KiB.
5. **Separation of Concerns:** Low-rate presence notifications (device online/offline, pairing prompts) continue to use standard JSON messages for maximum inspection ease.

---

## Consequences

### Positive
- Reduces wire bandwidth by 65%–78% for streaming telemetry and packet events.
- Prevents UI freezes during high-volume packet capture or load test bursts.
- Ensures seamless stream resumption across temporary Wi-Fi blips.

### Negative / Trade-offs
- Binary frames cannot be inspected as plain text directly in the browser Network tab without a hex/MessagePack decoder view.
