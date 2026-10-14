# NetSync Ultra — Baseline Audit & Feature Classification

**Phase:** Phase 0 (Audit & Baseline)  
**Date:** October 2026  
**Status:** Completed — Pending User Review & Approval  
**Host Architecture:** Windows (x64) • Python 3.14.6 • Node.js v24.16.0 • npm 11.17.0

---

## 1. Executive Summary

This document establishes the empirical execution and quality baseline for NetSync Ultra prior to initiating Phase 1. Every component across the mono-repository has been executed, compiled, linted, and benchmarked. No code refactoring or new feature additions have been made prior to this baseline review, adhering strictly to the **Non-negotiable Rules (Rule 1 & Rule 2)**.

---

## 2. Test Execution & Build Verification Baseline

### 2.1 Backend Unit & Integration Tests

#### A. Networking Engine (`services/networking_engine`)
- **Command:** `python -m pytest tests -v`
- **Result:** **61 passed** in 2.41s (0 failures, 0 errors)
- **Coverage Summary:**
  - `test_protocol.py` (30 tests): Binary framing (`NSYN`), 64-byte fixed header, CRC-32 checksums, bitwise flags, session UUID preservation, corruption rejection, and typed message serialization.
  - `test_reliability.py` (7 tests): Acknowledgement tracker, sliding-window duplicate frame detector, hash verification.
  - `test_security_monitoring.py` (5 tests): 6-digit cryptographic pairing token generation, expiry, validation, HMAC handshakes, and RTT/throughput aggregation.
  - `test_sync.py` (12 tests): State versioning, offline mutation queue, field-level dictionary diffing (`DeltaEngine`), and 4 conflict resolution modes.
  - `test_transport.py` (7 tests): Asynchronous TCP server/client connections, concurrent clients, bidirectional frames, and connection lifecycle metrics.

#### B. FastAPI Application & Network Lab Backend (`services/api`)
- **Command:** `python -m pytest tests -v`
- **Result:** **10 passed** in 6.50s (0 failures, 0 errors, 1 deprecation warning from Starlette testclient `BlockingPortal`)
- **Coverage Summary:**
  - `test_api.py`: `/health` liveness probe and JWT device authentication flow.
  - `test_network_lab.py`: Concurrency benchmarks, binary packet parsing (Ethernet/IP/TCP), DHCP DORA cycle simulation, port reachability/DNS diagnostics, experiment runner, and lab REST endpoints.
  - `test_transfers.py`: WebRTC file transfer session lifecycle, recipient authorization, and transfer rejection/cancellation.

### 2.2 Empirical Benchmark Suite (`experiments`)

All three benchmark scripts were executed against the active codebase:

| Benchmark | Script | Measured Results | Baseline Finding |
|:---|:---|:---|:---|
| **LAN vs Cloud Latency** | `benchmark_lan_vs_cloud.py` | Direct LAN TCP Socket: Mean **15.61 ms**, Min **14.01 ms**, Max **16.80 ms**, Jitter **0.58 ms**.<br/>Cloud Relay Hop: Mean **67.39 ms**, Min **57.18 ms**, Max **83.24 ms**, Jitter **5.64 ms**. | Direct LAN socket is **4.3x faster** than cloud relay, reducing latency by **76.8%**. |
| **Delta Compression** | `benchmark_delta_vs_full.py` | Full Snapshot: **5,027 bytes**.<br/>Delta Payload: **1,293 bytes**. Bandwidth Saved: **3,734 bytes**. | Field-level differential diffing achieves a **74.28% wire reduction**. |
| **TCP Concurrency** | `benchmark_concurrency.py` | 20 concurrent clients exchanging 100 messages in **0.071 seconds**. Mean connect: **5.55 ms**, P95: **7.35 ms**. | Sustained throughput of **1,413.3 framed messages/sec**. |

### 2.3 Frontend Lint & Production Build (`apps/web`)

- **Linter:** `npm run lint` (`oxlint` v1.81.0)
  - Result: **0 errors**, 134 warnings across 40 files in 52ms.
  - Primary warnings: Unused variable/import declarations in tab components (`CheckCircle2`, `Radio`, `Zap`, `Clock`, `Sliders`), calling `new Date()` during render in `NetSyncFooter.jsx`, and synchronous `setState` in `useEffect` in `FileTransferView.jsx`.
- **Production Build:** `npm run build` (`vite` v8.3.4)
  - Result: **Build succeeded in 1.01s**.
  - Output artifacts:
    - `dist/index.html`: 1.11 kB (gzip: 0.57 kB)
    - `dist/assets/index-BjSb5N9D.css`: 15.40 kB (gzip: 3.65 kB)
    - `dist/assets/index-bvH4B-m_.js`: 1,169.31 kB (gzip: 306.20 kB)
  - Chunk warning: Bundle exceeds 500 kB uncompressed due to Three.js and GSAP bundled into a single entry chunk. Code-splitting is required during Phase 6.

---

## 3. Syllabus Traceability Matrix Status (20MSS56 Lab)

Each of the 18 laboratory curriculum exercises is classified according to current operational status:

| Wk | Exercise | NetSync Target Module | Current Status | Detailed Audit Assessment |
|:---:|:---|:---|:---:|:---|
| **1** | TCP iterative client-server echo; connection time & echo time; cross-machine | Playground → TCP Echo | **Partially Working** | `SocketToolkitTab.jsx` and `socket_toolkit.py` measure connect time and RTT using `perf_counter_ns`. However, it currently runs against localhost or a user-specified host without distributed Agent coordination or histogram aggregation over N runs. |
| **2** | TCP iterative Hangman server and client; lose on timeout or chances used | Playground → Hangman Arcade | **Absent** | Not implemented in UI or backend. |
| **3** | UDP echo on two machines | Playground → UDP Echo | **Partially Working** | `run_udp_echo_test` handles datagram send/receive with sequence tracking and loss/jitter calculation, but cross-machine distributed runs need Agent coordination. |
| **4** | UDP time server | Time & Clock Lab | **Partially Working** | NTP query (RFC 5905) client exists in `socket_toolkit.py`, but RFC 868 binary time server/client is not yet implemented. |
| **5** | TCP DayTime client to `time.nist.gov` | Time & Clock Lab | **Absent** | RFC 867 Daytime protocol client is not yet implemented. |
| **6** | TCP concurrent server; request a huge file | Server Performance Lab | **Partially Working** | Concurrency benchmark exists in `concurrency_benchmarks.py`, but huge file transfer comparing `sendfile()` vs buffered read/send loops with CPU/RSS profiling is missing. |
| **7** | Concurrent Hangman | Arcade + Server Lab | **Absent** | Not implemented. |
| **8** | Broadcast with `SO_BROADCAST` and `SO_REUSEADDR` | LAN Lab → Broadcast | **Partially Working** | `LanDiscoveryMulticastTab.jsx` sends UDP probes to `255.255.255.255`. Subnet directed broadcast calculation from netmask and demonstration of socket option errors (`EACCES`, `EADDRINUSE`) are not yet implemented. |
| **9** | Port scanner: open, closed, blocked | Connectivity & Port Diagnostics | **Partially Working** | `port_diagnostics.py` classifies TCP connect attempts into OPEN, CLOSED, and FILTERED. Lacks target allowlist enforcement, token proofing, rate caps, and SYN-scan mode. |
| **10** | Continuous Assessment Test 1 (CAT 1) | Lab Mode | **Absent** | Timed practice mode with randomized scenario generator is not implemented. |
| **11** | DHCP server simulation and client state machine | DHCP Studio | **Partially Working** | `dhcp_sandbox.py` implements RFC 2131 DORA cycle and IP pool leasing. Full FSM transitions (`INIT` → `SELECTING` → `REQUESTING` → `BOUND` → `RENEWING` at T1 → `REBINDING` at T2) and virtual acceleration clock need enhancement. |
| **12** | Multicast message to a group | LAN Lab → Multicast | **Partially Working** | `discovery_multicast.py` transmits Class D multicast datagrams. Receiver group join (`IP_ADD_MEMBERSHIP`), IGMP sniffer, and AP isolation drop detection are not implemented. |
| **13** | Multicast e-Quiz, 5 teams, round robin | Quiz Arena | **Absent** | Not implemented. |
| **14** | RAW socket: send UDP, receive it, print IP header | Raw Socket Workbench | **Partially Working / Blocked** | `packet_parser.py` decodes IPv4 headers. True raw socket transmission/capture on Windows is blocked without Administrator rights and `SIO_RCVALL`; requires Local Agent capability probe and fallback. |
| **15** | RAW socket: capture all TCP packets, print TCP and IP fields | Raw Socket Workbench | **Partially Working / Blocked** | Packet decoder decodes all 9 TCP flags and options from sample bytes. Live raw capture requires Local Agent. |
| **16** | Packet sniffer | Packet Explorer | **Partially Working** | Decodes Ethernet, IPv4, IPv6, TCP, and UDP from sample packets or hex payloads. Live sniffing, PCAP/PCAPNG import/export, BPF filtering, and flow tables are not implemented. |
| **17** | TCP echo with I/O multiplexing | Server Lab → `select`/`poll`/`epoll` | **Partially Working** | `select.select` model is implemented in `concurrency_benchmarks.py`. Visualizing the ready set, `poll`/`epoll` models, and C10K load tests are not implemented. |
| **18** | Continuous Assessment Test 2 (CAT 2) | Lab Mode | **Absent** | Not implemented. |

---

## 4. Existing Platform Features Status (Section 5)

| Subsystem | Feature | Status | Notes & Gaps |
|:---|:---|:---:|:---|
| **5.1 Continuity** | State Adapter SDK & Handoff | **Partially Working** | Basic tab and scroll sync via REST/WS. Lacks CRDTs (Yjs/Automerge), Hybrid Logical Clocks, and browser MV3 full state capture. |
| **5.2 P2P Transfer** | WebRTC File Transfer | **Partially Working** | 64 KiB chunk streaming, RTCDataChannel, File System Access API, and streaming SHA-256 implemented in `webrtcTransfer.js`. Lacks Merkle root, chunk bitmap resume, coturn time-limited HMAC credentials, and Transfer Forecaster. |
| **5.3 Pairing** | Device Discovery & Pairing | **Partially Working** | 6-digit token generation and HMAC handshake exist. Ephemeral X25519 exchange, Short Authentication String (SAS) confirmation, and mDNS agent integration are missing. |
| **5.4 Workspace** | Universal Clipboard & Workspaces | **Partially Working** | Clipboard and workspace REST endpoints and UI exist. End-to-end encryption (XChaCha20-Poly1305 / WebCrypto) and client-side MiniSearch are absent. |
| **5.5 Observatory** | Network Intelligence Observatory | **Partially Working** | RTT latency and jitter tracking exist. 3D topology globe, LTTB downsampling, EWMA/MAD anomaly detection, and OpenMetrics export are absent. |
| **5.6 Packet Explorer** | Custom Struct Parser | **Partially Working** | Basic pure Python header parsing for Ethernet, IP, TCP, UDP. Needs Scapy differential testing, flow tables, TCP stream reassembly, and PCAP import/export. |
| **5.7 Diagnostics** | Port Scanner | **Partially Working** | Connect-based scanner exists. Needs strict allowlist, rate limits, banner grab, and SYN-scan mode. |
| **5.8 Server Lab** | Multi-Model Concurrency | **Partially Working** | Benchmarks iterative vs threaded vs select. Needs open-loop load generator, psutil CPU/RSS tracking, and ramp tests. |
| **5.9 LAN/Multicast** | Broadcast & Multicast | **Partially Working** | Broadcast probe and multicast sender work. Needs interface subnet calculation, IGMP snooping, and AP isolation fallback. |
| **5.10 Playground** | Protocol Playground | **Partially Working** | Sockets and benchmarks exist. Interactive Hangman, Quiz Arena, and live sequence diagrams need implementation. |
| **5.11 Reports** | Experiments & Reports | **Partially Working** | 10 experiments runnable from UI with JSON metrics. Needs PDF/Markdown export, Lab Record Studio, and Viva Coach. |

---

## 5. Tier A, B, and C Features Status (Section 6)

### Tier A (Mandatory Real Implementation)
- **A1. Life-of-a-Request Tracer:** **Absent** (needs URL waterfall: DHCP → ARP → DNS → TCP → TLS → HTTP with layer encapsulation).
- **A2. Congestion Control Observatory:** **Absent** (needs TCP_INFO / SIO_TCP_INFO cwnd/ssthresh, AIMD simulator, Jain's fairness index).
- **A3. Reliable Transport Lab:** **Absent** (needs Stop-and-Wait, Go-Back-N, and Selective Repeat over real UDP sockets with animated window buffers).
- **A4. Impairment Studio:** **Absent** (needs asyncio UDP/TCP proxy with latency, jitter, Gilbert-Elliott loss, and token-bucket bandwidth caps).
- **A5. DNS Studio:** **Partially Working** (basic `gethostbyname_ex` exists; needs RFC 1035 iterative root walk, TTL cache, and zone editor).
- **A6. Delay, Loss & Throughput Lab:** **Absent** (needs nodal delay decomposition, packet-pair bandwidth estimation, and bufferbloat grader).

### Tier B & Tier C (Secondary Features — Behind Feature Flags)
- **B1 through B6:** **Absent** (Path Observatory, Routing Lab, Address Architect, Link-Layer Lab, P2P Swarm & DHT, Time & Clock Lab).
- **C1 through C6:** **Absent** (Router Architecture, Data-Center Switching, Email Lab, HTTP Request Lab, Mail Lab, ICMP Lab).

---

## 6. Provenance & Data Integrity Audit (Rule 3)

In accordance with **Non-negotiable Rule 3 ("Real or labeled")**:
- **Critical Finding 1:** In `apps/web/src/services/api.js`, when backend endpoints are unreachable, functions catch errors and return synthetic fallback data (e.g., hardcoded devices, workspaces, and clipboard items) without labeling them as simulated.
- **Critical Finding 2:** In `TelemetryView.jsx`, the default ping array contains hardcoded entries (`DIRECT_LAN`) before running a live burst.
- **Remediation Plan:** In Phase 1, introduce a standardized provenance badge system (`measured`, `derived`, `simulated`, `imported`) across all UI cards, charts, and tables. No unlabeled mock data will be permitted.

---

## 7. Next Actions & Gate

In accordance with Section 12:
- Complete `docs/KNOWN_LIMITATIONS.md` and `docs/RISK_REGISTER.md`.
- Present Phase 0 findings to user and **stop to request formal approval** before executing Phase 1 (Foundations).
