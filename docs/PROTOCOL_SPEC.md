# NetSync Framing Protocol (NSFP) Specification — RFC 2026-NSFP

**Status:** Standards Track  
**Category:** Computer Networks Final-Year Capstone Project Specification  
**Version:** 1.0.0  
**Transport:** TCP / IPv4 / IPv6 (Port 9100 / 9400) & UDP (mDNS Broadcast :9401)

---

## 1. Abstract

The NetSync Framing Protocol (NSFP) is a lightweight, low-latency, binary application-layer transport framing protocol designed for distributed cross-device state continuity, peer-to-peer workspace handoffs, and differential synchronization over local area networks (LAN) with automatic cloud relay fallback.

---

## 2. Frame Structure (64-Byte Fixed Header)

Every transmitted transmission frame begins with an immutable, fixed-width 64-byte binary header, followed by an arbitrary-length payload.

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                       Magic Bytes (NSYN)                      |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|    Version    |  Message Type |             Flags             |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                        Payload Length                         |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                        Sequence Number                        |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                         State Version                         |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                       CRC-32 Checksum                         |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
+                    Source Device ID (64-bit)                  +
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
+                 Destination Device ID (64-bit)                +
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                                                               |
+                    Session UUID (128-bit)                     +
|                                                               |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                           Reserved                            |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|                     Payload Data (Variable)                   |
|                              ...                              |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

### 2.1 Header Field Definitions

| Offset (Bytes) | Field Name | Data Type | Encoding | Description |
|:---:|:---|:---:|:---:|:---|
| `0..3` | `Magic` | 4 Bytes | ASCII (`b'NSYN'`) | Identifies protocol stream (`0x4E 0x53 0x59 0x4E`). Rejects unaligned data. |
| `4` | `Version` | `uint8` | Unsigned Int | Protocol specification version (currently `1`). |
| `5` | `MessageType` | `uint8` | Unsigned Int | Opcode designating message semantics (e.g. `HELLO`, `STATE_PUSH`). |
| `6..7` | `Flags` | `uint16` | Bitmask | Bitfield flags (Compression, Encryption, ACK requirement). |
| `8..11` | `PayloadLength` | `uint32` | Big-Endian | Byte length of the ensuing payload (`0 <= N <= 16,777,216`). |
| `12..15` | `SequenceNumber` | `uint32` | Big-Endian | Monotonically increasing counter per socket channel for ACK tracking. |
| `16..19` | `StateVersion` | `uint32` | Big-Endian | Server-assigned monotonic revision of the synchronized state. |
| `20..23` | `Checksum` | `uint32` | CRC-32 | IEEE 802.3 CRC-32 computed over header slice (`bytes[0:20] + bytes[24:64]`) and payload. |
| `24..31` | `SourceDeviceID` | `uint64` | Big-Endian | Hash of the emitting peer device identifier. |
| `32..39` | `DestDeviceID` | `uint64` | Big-Endian | Target peer ID (`0` indicates multicast/broadcast to all mesh nodes). |
| `40..55` | `SessionUUID` | 16 Bytes | Raw UUID bytes | RFC 4122 binary UUID tying frames to an ongoing continuity session. |
| `56..63` | `Reserved` | 8 Bytes | Zero-padded | Reserved for future stream multiplexing or cryptographic nonces. |

---

## 3. Bitwise Frame Flags

| Bit Position | Flag Identifier | Value | Description |
|:---:|:---|:---:|:---|
| `Bit 0` | `FLAG_COMPRESSED` | `0x0001` | Payload is compressed with zlib deflate. |
| `Bit 1` | `FLAG_ENCRYPTED` | `0x0002` | Payload is encrypted with AES-256-GCM using the negotiated shared key. |
| `Bit 2` | `FLAG_REQUIRES_ACK` | `0x0004` | Sender expects an explicit application-layer ACK frame. |
| `Bit 3` | `FLAG_IS_ACK` | `0x0008` | Frame is an acknowledgement responding to a prior sequence number. |
| `Bit 4` | `FLAG_DELTA_DIFF` | `0x0010` | Payload represents a field-level delta rather than a full state snapshot. |
| `Bit 5` | `FLAG_FRAGMENT` | `0x0020` | Payload is a segmented fragment of a larger multi-frame buffer. |

---

## 4. Message Types (Opcodes)

- `0x01` (`HELLO`): Initial capability handshake and peer registration.
- `0x02` (`HELLO_ACK`): Handshake confirmation with peer routing metadata.
- `0x03` (`STATE_PUSH`): Full state snapshot push.
- `0x04` (`STATE_DELTA`): Differential state delta diff.
- `0x05` (`STATE_ACK`): Application-level persistence and application acknowledgement.
- `0x06` (`SYNC_REQUEST`): Solicit state pull from authoritative peer.
- `0x07` (`HEARTBEAT`): Liveness ping containing clock offset.
- `0x08` (`HEARTBEAT_ACK`): Immediate pong response for RTT latency calculation.
- `0x09` (`PAIR_REQUEST`): 6-digit short-lived pairing token submission.
- `0x0A` (`PAIR_RESPONSE`): Pairing approval and HMAC key derivation material.
- `0x0B` (`CLIPBOARD_SYNC`): Universal clipboard push snippet.
- `0x0C` (`HANDOFF_BEAM`): Instant tab and scroll position handoff request.
- `0xFF` (`ERROR`): Error notification with protocol status code.

---

## 5. Reliability & Flow Control

1. **Why Application-Layer ACKs on top of TCP:**
   TCP only confirms that bytes were delivered to the OS socket buffer. An application-level ACK verifies that:
   - The JSON/binary payload was deserialized and validated.
   - The delta or mutation was integrated into the local state store without conflicts.
   - The mutation was committed to disk.

2. **Exponential Backoff Retransmission:**
   Messages with `FLAG_REQUIRES_ACK` are registered in `AcknowledgementTracker`. If no matching ACK arrives within base timeout $T$ ($10.0\text{s}$), retransmission is scheduled with backoff:
   $$T_{\text{timeout}} = T_{\text{base}} \times 2^{\text{retry\_count}}$$
   Max retries is bounded to $5$ before signaling destination peer unreachability.

3. **Sliding Window Duplicate Detection:**
   A sliding window buffer of size $10,000$ hashes prevents double-application of state mutations when retransmitted packets arrive following transient latency spikes.
