# NetSync Ultra — Known Limitations & Unfinished Work

**Document Version:** 1.0.0 (Phase 0 Audit)  
**Date:** October 2026  
**Governing Rule:** Rule 7 (*No stubs on shipped paths. Unfinished work stays behind a flag and is listed in KNOWN_LIMITATIONS.md*)

---

## 1. Operating System & Platform Limitations

### 1.1 Windows Host Networking Constraints
- **Raw Sockets (`SOCK_RAW`):** On Windows (current development host), raw sockets are strictly receive-only via `SIO_RCVALL` and require elevated Administrator privileges. Sending arbitrary raw TCP/UDP packets with custom IP headers via standard Winsock is blocked by the Windows networking stack unless third-party kernel drivers (e.g., Npcap) are installed.
  - *Capability Honest Fallback:* When unprivileged, the platform utilizes userspace synthetic frame decoders or loopback UDP sockets and displays an explicit badge: `[SIMULATION: HOST RESTRICTED (WINDOWS UNPRIVILEGED)]`.
- **I/O Multiplexing Primitives:** Linux `epoll` and BSD/macOS `kqueue` are unavailable on Windows. Python on Windows supports `select.select` (limited to 512 socket descriptors per call) or the Proactor IOCP loop. Concurrency comparisons must explicitly label `select` as the Windows multiplexer and note that `epoll` tests require a Linux container or VM.
- **Kernel Traffic Impairment (`tc netem`):** Linux Traffic Control (`tc`) and Network Emulation (`netem`) are Linux-kernel exclusive. On Windows and macOS, the Impairment Studio must operate as a userspace asyncio proxy adding artificial queuing delay, token-bucket rate limiting, and Gilbert-Elliott loss models.

---

## 2. Architectural & Dependency Limitations

### 2.1 Web Application Framework (Vite vs Next.js)
- **Current State:** The web application is built on Vite 8 and React 19 SPA, using `.jsx` files and client-side routing (`window.history.pushState`).
- **Target Specification:** The target prompt lists Next.js 15 App Router with TypeScript strict.
- **Limitation & Strategy:** Rewriting the working spatial Liquid Glass interface into Next.js from scratch would violate **Rule 2 (Preserve and protect)**. During Phase 1, we will retain the working Vite frontend or establish a dual-mode/BFF setup, while migrating to TypeScript and generating Zod validation schemas from the backend OpenAPI specifications.

### 2.2 Animation Engine Redundancy
- **Current State:** `apps/web/package.json` includes `animejs: "^4.5.0"` alongside `motion: "^14.1.0"` and `gsap: "^3.15.0"`.
- **Target Specification:** Prompt Section 3 explicitly directs: *"Use Framer Motion plus GSAP. Drop Anime.js (a third overlapping library)."*
- **Action:** `animejs` is currently unused or redundant and will be pruned from dependencies in Phase 1.

### 2.3 Database Migrations & Single Source of Truth
- **Current State:** The backend initializes SQLite tables via SQLAlchemy `Base.metadata.create_all()` in `app/main.py`. Alembic is present in `requirements.txt` but has no migration version scripts initialized.
- **Target Specification:** Drizzle migrations or a unified migration schema must serve as the single source of truth, with CI failing on schema drift.

---

## 3. Laboratory Curriculum Gaps (20MSS56 Lab)

The following exercises from the 18-week syllabus are currently absent or partially implemented and will remain disabled behind feature flags until their vertical slice is completed:

| Week | Feature | Flag Name | Current Limitation |
|:---:|:---|:---|:---|
| **2** | Iterative Hangman Arcade | `nsx.lab.hangman` | Protocol framing and game FSM not yet implemented. |
| **4** | RFC 868 Binary Time Server | `nsx.lab.rfc868` | Only RFC 5905 NTP client exists; RFC 868 binary time server is missing. |
| **5** | RFC 867 Daytime Client | `nsx.lab.daytime` | Daytime client querying `time.nist.gov` with caching is not implemented. |
| **6** | Huge-File Server & `sendfile()` | `nsx.lab.hugefile` | Kernel zero-copy `sendfile()` comparison vs read/send loop is missing. |
| **7** | Concurrent Hangman Server | `nsx.lab.hangman_concurrent` | Load-tested concurrent game sessions not implemented. |
| **8** | Directed Broadcast & Socket Errors | `nsx.lab.broadcast_errors` | Demonstration of `SO_REUSEADDR` and `SO_BROADCAST` error paths missing. |
| **9** | Authorized Port Scanner & Rate Caps | `nsx.lab.port_scanner_safe` | Token-based authorization allowlist and rate-limiting missing. |
| **10** | CAT 1 Practice Exam Mode | `nsx.lab.cat1` | Randomized timed quiz/lab engine not implemented. |
| **11** | DHCP FSM & Accelerated Clock | `nsx.lab.dhcp_fsm` | Full state machine renewals at T1/T2 with accelerated virtual clock missing. |
| **12** | Multicast Receiver & IGMP Sniffer | `nsx.lab.multicast_receiver` | Group join (`IP_ADD_MEMBERSHIP`) and IGMP snooping not implemented. |
| **13** | Multicast e-Quiz Arena | `nsx.lab.quiz_arena` | Round-robin question broadcast with unicast response scoring missing. |
| **14** | Live RAW Socket UDP Probe | `nsx.lab.raw_udp` | Live raw capture unprivileged on Windows; needs Local Agent. |
| **15** | Live RAW Socket TCP Sniffer | `nsx.lab.raw_tcp` | Live raw TCP capture unprivileged on Windows; needs Local Agent. |
| **16** | PCAP Import/Export & Flow Table | `nsx.lab.packet_sniffer_pcap` | PCAP/PCAPNG file handling and TCP flow tracking missing. |
| **17** | I/O Multiplexing Ready Set Viewer | `nsx.lab.multiplexing_visualizer`| Interactive ready-set visualization and C10K test missing. |
| **18** | CAT 2 Practice Exam Mode | `nsx.lab.cat2` | Scenario-based practice mode missing. |

---

## 4. Tier A, B, and C Feature Gaps

All Tier A, B, and C features (except basic DNS resolution) are currently absent and will be implemented strictly in accordance with Section 12 phases:

- `nsx.tier_a.request_tracer`: Life-of-a-Request URL tracer (DHCP → ARP → DNS → TCP → TLS → HTTP).
- `nsx.tier_a.congestion_control`: TCP cwnd/ssthresh telemetry from socket options and AIMD simulator.
- `nsx.tier_a.reliable_transport`: Stop-and-wait, GBN, and Selective Repeat sliding window visualizer.
- `nsx.tier_a.impairment_studio`: Artificial delay, jitter, loss, and rate-limiting proxy.
- `nsx.tier_a.dns_studio`: Full RFC 1035 root-to-authoritative iterative resolver.
- `nsx.tier_a.delay_loss_throughput`: Nodal delay decomposition and bufferbloat grader.
- `nsx.tier_b.*`: All Tier B modules (B1–B6) currently flagged off.
- `nsx.tier_c.*`: All Tier C modules (C1–C6) currently flagged off.

---

## 5. UI Provenance & Fallback Data Gaps

- In `apps/web/src/services/api.js`, network failure catches return unbadged simulated records for devices, workspaces, and clipboard items.
- In `TelemetryView.jsx`, default ping latency values are displayed without explicit provenance tags (`measured`, `derived`, `simulated`, or `imported`).
- **Remediation:** During Phase 1, all synthetic data fallbacks will be tagged with `provenance: "simulated"` and rendered with an amber warning badge.
