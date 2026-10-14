# NetSync Ultra — Risk Register & Security Assessment

**Document Version:** 1.0.0 (Phase 0 Audit)  
**Date:** October 2026  
**Governing Rules:** Rule 5 (*Safe by default*) & Section 12 (*Phase 0 Audit and Baseline*)

---

## 1. Risk Register Summary Matrix

| ID | Category | Risk Description | Severity | Likelihood | Impact | Mitigation Strategy |
|:---:|:---|:---|:---:|:---:|:---:|:---|
| **SEC-01** | Security | Default Hardcoded Secret Key in `config.py` | High | High | High | Validate mandatory `SECRET_KEY` in production; fail startup if default key is used in non-dev environments. |
| **SEC-02** | Security | Unrestricted Target Port Scanning | High | Medium | High | Enforce strict target allowlist (Loopback `127.0.0.1`, local subnet, or explicit verification token); apply rate caps. |
| **SEC-03** | Security | DHCP Simulation Broadcasts Leaking onto Physical LAN | Critical | Low | Severe | Sandbox DHCP strictly on loopback UDP sockets or virtual bus; never bind `0.0.0.0` or broadcast to physical NICs. |
| **SEC-04** | Security | Unencrypted Universal Clipboard on Server | Medium | High | High | Implement End-to-End Encryption (E2EE) with WebCrypto/libsodium; server stores ciphertext only; client-side search. |
| **SEC-05** | Security | Wildcard Extension Origin in CORS | Medium | High | Medium | Restrict extension CORS to explicit NetSync extension ID when published; reject wildcard `chrome-extension://*` in prod. |
| **SEC-06** | Privacy | Raw Packet Payload Snooping & Data Leakage | High | Medium | Severe | Packet sniffing defaults to header-only decoding; payload viewing requires explicit per-session user consent and secret redaction. |
| **DEP-01** | Dependencies | Redundant Animation Engines (Anime.js + Motion + GSAP) | Low | High | Low | Prune `animejs` from `apps/web/package.json`; standardize on `motion` and `gsap` as specified in Section 3. |
| **DEP-02** | Dependencies | Python 3.14 Bleeding-Edge Runtime Compatibility | Medium | Medium | Medium | Test all async and C-extension dependencies against Python 3.14; maintain fallback support for Python 3.12/3.13 LTS. |
| **ARCH-01** | Architecture | Framework Divergence (Vite SPA vs Next.js 15) | Medium | High | High | Keep the existing Liquid Glass SPA stable; document architectural rationale via ADR; introduce BFF endpoints where needed. |
| **ARCH-02** | Architecture | Competing Database Schema Migrations | Medium | Medium | High | Adopt Drizzle migrations as the authoritative schema; sync SQLAlchemy/asyncpg to that single source of truth. |
| **PERF-01** | Performance | High-Rate JSON Telemetry Causing Browser Lag | Medium | High | Medium | Implement first-party binary WebSocket gateway (MessagePack/CBOR), 50–100 ms batching, and per-channel backpressure. |
| **PLAT-01** | Platform | Windows OS Lacking Raw Socket Send & `epoll` | High | High | Medium | Provide runtime capability probe matrix; degrade gracefully to userspace simulation with explicit provenance badges. |

---

## 2. Detailed Security Risk Analysis

### SEC-01: Default Secret Key in Configuration
- **Location:** `services/api/app/core/config.py:18`
- **Current Code:**
  ```python
  SECRET_KEY: str = "netsync-insecure-secret-key-change-in-production-2026-distributed"
  ```
- **Vulnerability:** If deployed with default configuration, JWT tokens can be forged by any attacker, leading to arbitrary user and device impersonation.
- **Action Plan (Phase 1):** Add an environment validation check during application lifespan startup: if `ENVIRONMENT == "production"` and `SECRET_KEY` matches the default insecure string, raise a critical startup exception.

### SEC-02: Port Scanner Abuse
- **Location:** `services/api/app/network_lab/port_diagnostics.py`
- **Risk:** Unrestricted port scanning tools can be used for unauthorized network reconnaissance, port flooding, or triggering external IDS/IPS alarms.
- **Action Plan (Phase 4):**
  1. Refuse any scan target outside `127.0.0.1`, `::1`, and the detected local subnet CIDR.
  2. For external targets, require an explicit ownership challenge token (e.g., DNS TXT or HTTP verification) before scanning.
  3. Enforce rate caps (maximum 20 ports/second).

### SEC-03: Rogue DHCP Server Hazard
- **Location:** `services/api/app/network_lab/dhcp_sandbox.py`
- **Risk:** A rogue DHCP server listening and broadcasting on a physical network can disrupt IP address allocation for all machines on the user's LAN.
- **Action Plan (Phase 4):**
  1. Bind DHCP server sockets exclusively to `127.0.0.1` on non-standard ports (e.g., port 9167/9168) or use an in-memory virtual bus.
  2. Assert in unit tests that the socket never binds to standard DHCP port 67 on `0.0.0.0`.

### SEC-04: Cleartext Clipboard Storage
- **Location:** `services/api/app/models/clipboard.py`
- **Risk:** Sensitive user data (passwords, OTPs, API keys) copied to the clipboard could be accessed in plaintext by database administrators or compromised servers.
- **Action Plan (Phase 2):**
  1. Implement client-side authenticated encryption (AES-256-GCM / WebCrypto).
  2. Store only ciphertext on the server.
  3. Client-side MiniSearch index over decrypted records.

---

## 3. Dependency & Version Audit

### 3.1 Python Dependencies (`services/api/requirements.txt`)
- All pinned versions are compatible with Python 3.12–3.14:
  - `fastapi>=0.110.0`, `pydantic>=2.7.0`, `sqlalchemy>=2.0.29`, `websockets>=12.0`.
  - `pytest>=8.2.0`, `pytest-asyncio>=0.23.0` (all 71 backend tests pass without errors).
  - Deprecation warning detected in `starlette.testclient:53` regarding `anyio.abc.BlockingPortal`; harmless in test runs, addressed in upcoming Starlette release.

### 3.2 Frontend Dependencies (`apps/web/package.json`)
- `react: "^19.2.8"` and `react-dom: "^19.2.8"`: Production build verified.
- `motion: "^14.1.0"`: Modern Motion library (Framer Motion evolution for React 19).
- `gsap: "^3.15.0"`: High-performance timeline animations.
- `three: "^0.186.1"`: 3D canvas mesh rendering.
- `animejs: "^4.5.0"`: Identified as redundant; to be removed in Phase 1.
- `oxlint: "^1.81.0"`: High-speed linter passing with 0 errors.

---

## 4. Capability Matrix & Graceful Degradation Rules

In accordance with **Non-negotiable Rule 4 ("Capability honesty")**:

| Operating System | Raw TCP/UDP Receive | Raw TCP/UDP Send | Packet Sniffing | I/O Multiplexer | Traffic Impairment |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Linux (with `CAP_NET_RAW`)** | Real Socket | Real Socket | AF_PACKET / Raw | `epoll` | Kernel `tc netem` |
| **Linux (unprivileged)** | Blocked → Sim | Blocked → Sim | Blocked → Sim | `epoll` | Asyncio Proxy |
| **macOS / BSD** | BPF / libpcap | BPF / libpcap | BPF / libpcap | `kqueue` | Asyncio Proxy |
| **Windows (Administrator)** | `SIO_RCVALL` | Blocked by Winsock | `SIO_RCVALL` | `select` / IOCP | Asyncio Proxy |
| **Windows (Standard User)** | Blocked → Sim | Blocked → Sim | Blocked → Sim | `select` / IOCP | Asyncio Proxy |

Every feature attempting these actions will execute an initial host capability probe and display the exact status and fallback reason in the UI.
