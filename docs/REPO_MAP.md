# NetSync Repository & Architectural Map

**Version:** NetSync Ultra 2.0 (Phase 0 Audit)  
**Date:** October 2026  
**Repository Root:** `c:/My Projects/NetSync-Intelligent Cross-Device State Continuity and Distributed Synchronization Platform`  
**Host Environment:** Windows (x64), Python 3.14.6, Node.js v24.16.0, npm 11.17.0

---

## 1. High-Level Workspace Architecture

The repository is structured as a multi-package mono-repository containing frontend applications, asynchronous network services, low-level protocol engines, empirical benchmark suites, and container infrastructure:

```
NetSync/
├── apps/
│   ├── web/                    # Single-Page Application (Vite 6, React 19, Liquid Glass UI)
│   ├── mobile/                 # React Native mobile client skeleton
│   └── browser-extension/      # Chrome MV3 extension for active tab/scroll tracking
├── services/
│   ├── api/                    # FastAPI REST, WebSockets & Network Lab backend (Python 3.14+)
│   └── networking_engine/      # Low-level NSFP binary framing, TCP/UDP sockets, sync, & crypto
├── experiments/                # Empirical evaluation & benchmarking harness (LAN vs Cloud, Delta, Concurrency)
├── infra/                      # Docker Compose & container configurations (Postgres 16, Redis 7, Nginx)
└── docs/                       # Specifications, baseline audits, ADRs, and syllabus matrices
```

---

## 2. Component Inventory & Directory Map

### 2.1 Web Frontend (`apps/web`)
- **Framework & Runtime:** Vite 8.3.4, React 19.2.8, React DOM 19.2.8.
- **Design System:** Apple/iOS-inspired Liquid Glass spatial computing interface, custom CSS glassmorphic tokens, 3D Canvas mesh background, floating capsule navigation, and command palette (`Cmd+K`).
- **Animation & Graphics:** `motion` (v14.1.0), `gsap` (v3.15.0), `three` (v0.186.1), `lucide-react` (v1.56.0), `animejs` (v4.5.0, slated for deprecation).
- **Core Files:**
  - `src/main.jsx`: Application bootstrap and DOM mount.
  - `src/App.jsx`: Single-Page Application router, global state (devices, metrics, sync audit log, theme toggle), and viewport container.
  - `src/index.css`: Global design tokens, light/dark theme variables, glass surface filters, typography, and responsive media rules.
  - `src/components/design-system/`: Reusable spatial glass components (`FloatingGlassNavbar`, `FloatingGlassDock`, `GlassCommandPalette`, `SpatialGlassSurface`, `LiquidGlassButton`, `LiquidGlassInput`).
  - `src/components/layout/NetSyncFooter.jsx`: iOS-style liquid glass footer with quick links, live engine telemetry, and status badges.
  - `src/components/views/`: 10 core modular page views:
    - `OverviewView.jsx`: System status, active peer cards, real-time latency hero card, recent sync logs.
    - `DevicesView.jsx`: Device mesh management, hardware trust badges, pair modal trigger, revocation.
    - `ContinuityView.jsx`: Cross-device state handoff studio, tab beam controls, scroll position synchronization.
    - `WorkspacesView.jsx`: Spatial workspace canvas, buffer sync, tab clustering.
    - `ClipboardView.jsx`: Universal liquid clipboard, mime-type preview, auto-sync.
    - `FileTransferView.jsx`: High-performance WebRTC P2P file transfer dashboard with chunk progress, drag-and-drop, path diagnosis (direct vs relay), and streaming SHA-256 verification.
    - `TelemetryView.jsx`: Network Intelligence Observatory & host for the 8 Network Programming Lab tabs.
    - `SyncHistoryView.jsx`: Granular state synchronization audit log with diff inspections.
    - `IntegrationsView.jsx`: Browser extension, mobile bridge, and protocol RFC specification viewer.
    - `SettingsView.jsx`: Hardware trust settings, theme configuration, network socket ports.
  - `src/components/network-lab/`: 8 academic lab tabs implementing 20MSS56 exercises:
    - `LiveConnectionsTab.jsx`: Active socket connection monitor and peer ping probes.
    - `SocketToolkitTab.jsx`: High-resolution TCP and UDP socket probes with connect timing and RTT jitter.
    - `ServerConcurrencyTab.jsx`: Concurrency benchmarks comparing Iterative, Multi-Threaded, and I/O Multiplexed models.
    - `PacketExplorerTab.jsx`: Binary packet parser extracting Ethernet, IPv4, IPv6, TCP (9 flags), and UDP headers.
    - `ConnectivityDiagnosticsTab.jsx`: Port scanning (OPEN/CLOSED/FILTERED) and DNS diagnostics.
    - `LanDiscoveryMulticastTab.jsx`: UDP subnet broadcast (:9100) and Class D IP multicast group transmission.
    - `DhcpSimulationTab.jsx`: RFC 2131 DORA cycle simulator and client lease manager.
    - `ExperimentsReportsTab.jsx`: Automated runner for 10 Capstone experiments with report export.
  - `src/services/api.js`: REST client for backend endpoints with fallback handling.
  - `src/services/webrtcTransfer.js`: WebRTC DataChannel engine featuring 64 KiB chunk streaming, strict backpressure, File System Access API streaming, and custom pure streaming SHA-256.

### 2.2 Backend Service (`services/api`)
- **Framework & Runtime:** FastAPI 0.110+, Python 3.14.6, Pydantic v2.7+, Uvicorn.
- **Database & State:** SQLAlchemy 2.0 ORM, SQLite (`netsync.db`) default fallback, PostgreSQL 16 ready, Redis presence cache integration.
- **Security & Crypto:** PyJWT / python-jose, passlib bcrypt, HMAC-SHA256 device pairing tokens.
- **Core Files:**
  - `app/main.py`: FastAPI application entrypoint, CORS configuration, database table initialization on lifespan startup, and health/readiness endpoints.
  - `app/core/config.py`: Environment configuration via Pydantic `BaseSettings`.
  - `app/core/database.py`: SQLAlchemy session factory and connection pooling.
  - `app/core/deps.py`: Authentication and user dependency injection.
  - `app/core/security.py`: Password hashing and JWT generation/validation.
  - `app/models/`: SQLAlchemy database models (`user.py`, `device.py`, `workspace.py`, `continuity.py`, `clipboard.py`, `transfer.py`, `network_metric.py`, `sync_log.py`).
  - `app/schemas/`: Pydantic input/output schemas for all entities.
  - `app/websocket/manager.py`: Full-duplex WebSocket connection manager with user- and device-partitioned channels.
  - `app/api/v1/api.py`: Aggregated API v1 router.
  - `app/api/v1/endpoints/`:
    - `auth.py`: User registration, token issuance, and profile.
    - `devices.py`: Device registration, pairing token generation, verification, and revocation.
    - `workspaces.py`: Workspace state CRUD and differential revision updates.
    - `continuity.py`: Tab handoff and reading position state syncing.
    - `clipboard.py`: Universal clipboard items push/pull.
    - `network.py`: Telemetry metric ingestion and summary statistics.
    - `sync.py`: Differential state synchronization engine integration.
    - `transfers.py`: WebRTC file transfer session coordination, validation, and completion auditing.
    - `network_lab.py`: Academic laboratory endpoints (TCP/UDP echo, benchmarks, packet parsing, port scanning, DHCP, multicast, and experiment runner).
    - `ws.py`: WebSocket endpoint (`/api/v1/ws`) handling presence, state broadcast, and WebRTC signaling (OFFER, ANSWER, ICE, TRANSFER_*).
  - `app/network_lab/`: Server-side network lab computation and socket engines:
    - `socket_toolkit.py`: Low-level TCP connect/RTT timing, UDP datagram loss probing, and RFC 5905 NTP queries.
    - `concurrency_benchmarks.py`: In-memory multi-model server harness (Iterative, Threaded, Multiplexed `select`).
    - `packet_parser.py`: Pure Python binary decoder for Ethernet frames, IPv4/IPv6, TCP, and UDP headers.
    - `port_diagnostics.py`: TCP connect port scanner with socket error classification and DNS resolver.
    - `discovery_multicast.py`: `SO_BROADCAST` subnet probes and Class D IP multicast socket communications.
    - `dhcp_sandbox.py`: RFC 2131 DHCP state machine and IP lease pool simulation.
    - `experiment_runner.py`: 10 structured experiment recipes with metric collection and summary generation.

### 2.3 Networking Engine (`services/networking_engine`)
- **Package:** `netsync_network` (Python package installable via `pyproject.toml`).
- **Core Modules:**
  - `protocol/frame.py`: NetSync Framing Protocol (NSFP) 64-byte binary header encoder/decoder, magic byte check (`NSYN`), CRC-32 checksum calculation, and frame boundaries.
  - `protocol/codec.py`: Message serialization and deserialization across typed payloads.
  - `protocol/messages.py`: Structured binary message payloads (Hello, StateSync, Clipboard, Pair, Heartbeat).
  - `transport/tcp_server.py`: Asynchronous TCP server with partial frame buffering, connection tracking, and statistics.
  - `transport/tcp_client.py`: Asynchronous TCP client with automatic reconnection and keepalive pinging.
  - `transport/udp_transport.py`: UDP transport for broadcast discovery and low-latency datagrams.
  - `transport/connection_manager.py`: TCP connection lifecycle, peer registry, and throughput tracking.
  - `synchronization/delta_engine.py`: Field-level state diffing, patch generation, and application.
  - `synchronization/conflict_resolution.py`: 4 conflict strategies (Server-Wins, Client-Wins, Field-Merge, Monotonic Vector Clock).
  - `synchronization/state_manager.py`: State revisioning, version bump, and offline mutation outbox queue.
  - `reliability/acknowledgements.py`: Application-level ACK tracking, duplicate frame detector (sliding window), and hash verification.
  - `security/pairing.py`: Ephemeral 6-digit cryptographic pairing tokens and HMAC-SHA256 authenticated peer handshakes.
  - `monitoring/latency.py`: RTT latency calculation, jitter variance, and wire throughput aggregation.
  - `discovery/mdns.py`: Local zero-config service discovery via mDNS / zeroconf.

### 2.4 Empirical Experiments (`experiments`)
- `benchmark_lan_vs_cloud.py`: Compares direct LAN TCP socket latency (mean 15.6 ms) against simulated cloud relay hops (mean 67.4 ms).
- `benchmark_delta_vs_full.py`: Evaluates wire efficiency of field-level delta diffs (1,293 bytes) vs full state snapshots (5,027 bytes), showing 74.28% bandwidth savings.
- `benchmark_concurrency.py`: Measures connection time and message throughput under 20 concurrent TCP clients (1,413 framed msgs/sec).

### 2.5 Infrastructure & Auxiliary Apps
- `docker-compose.yml`: Multi-container composition of PostgreSQL 16, Redis 7, FastAPI API, and Web frontend.
- `infra/docker/Dockerfile.api`: Python 3.12+ container build for FastAPI service.
- `infra/docker/Dockerfile.web`: Node/Nginx production container build for Web frontend.
- `apps/browser-extension/`: Manifest V3 Chrome extension with background worker and active tab scroll tracking.
- `apps/mobile/`: Standalone React Native continuity client.

---

## 3. Technology Stack Comparison: Target vs Current State

| Component | Target Architecture (Master Prompt) | Current Repository State | Alignment Strategy |
|:---|:---|:---|:---|
| **Web Frontend** | Next.js 15 App Router, React 19, TypeScript strict, Tailwind, Radix/shadcn, CVA | Vite 8, React 19, JavaScript (.jsx), Vanilla CSS design tokens, custom glass components | Maintain the working Liquid Glass SPA; add TypeScript/Zod schemas; migrate to Next.js or keep Vite as high-performance client with generated API client. |
| **Animation Stack** | Framer Motion + GSAP; Drop Anime.js; Rive only for icons | `motion` (v14.1.0) + `gsap` (v3.15.0) + `animejs` (v4.5.0) | Drop `animejs` dependency; standardize on `motion` and `gsap`. |
| **API Backend** | Python 3.12+, FastAPI, asyncio (uvloop), Pydantic v2 | Python 3.14.6, FastAPI 0.110+, asyncio, Pydantic v2.7+ | Aligned. |
| **Database** | Postgres 16 (Neon/Supabase) with Drizzle as single source of truth | SQLAlchemy 2.0 with SQLite default + Postgres docker | Create Drizzle schema migration path as single source of truth; sync SQLAlchemy or asyncpg models. |
| **Realtime Gateway** | Binary WebSocket (MessagePack/CBOR), 50-100ms batching, backpressure, `last_seq` | FastAPI WebSocket with JSON payloads (`OFFER`, `ANSWER`, `TRANSFER_*`) | Extend WebSocket gateway to support binary framing and sequence tracking (`last_seq`). |
| **Local Agent** | Dedicated local agent daemon, raw sockets, libpcap, mDNS, drops privileges | `services/networking_engine` package in-tree | Package agent into a standalone daemon with capability probing and loopback/mTLS socket. |
| **P2P Transfer** | WebRTC DataChannels, STUN/TURN (coturn), direct-to-disk, chunk bitmap resume | RTCDataChannel, 64 KiB chunks, streaming SHA-256, File System Access API, fallback relay | Add chunk bitmap resume, NAT type transfer forecaster, and coturn credentials. |

---

*Verified by automated audit, October 2026.*
