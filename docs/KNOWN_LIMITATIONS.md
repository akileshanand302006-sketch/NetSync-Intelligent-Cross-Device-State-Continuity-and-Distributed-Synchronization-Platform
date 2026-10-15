# NetSync Ultra — Known Limitations & Host Platform Constraints

**Document Version:** 2.0.0 (Post Phase 6 & 7 Release Hardening)  
**Date:** October 2026  
**Governing Rule:** Rule 7 (*No stubs on shipped paths. Real or honestly labeled.*)

---

## 1. Operating System & Platform Boundaries

### 1.1 Windows Host Networking Constraints
- **Raw Sockets (`SOCK_RAW`):** On Windows hosts without Npcap or elevated kernel privileges, raw IP packet creation with custom IP headers is restricted by the Windows TCP/IP stack (`WSAEACCES`).
  - *Honest Capability Handling:* When unprivileged, the platform probes `capabilities.raw_sockets_enabled` and falls back gracefully to userspace packet assembly and structured frame decoders, explicitly tagged with `<ProvenanceBadge provenance="simulated" label="SYNTHETIC FRAME" />`.
- **Kernel Traffic Control (`tc netem`):** Linux kernel `tc netem` is native only on Linux kernels. On Windows, NetSync's Impairment Studio operates via a high-performance asyncio token-bucket rate limiter and delay queue proxy, accurately modeling bandwidth bottlenecks, buffer queue delays, and Gilbert-Elliott burst losses.
- **I/O Multiplexing Primitives:** Linux `epoll` and BSD `kqueue` are POSIX-exclusive. On Windows, Python asyncio runs atop the `ProactorEventLoop` (I/O Completion Ports / IOCP) with `select.select` fallback for raw socket polling. The Server Concurrency tab accurately compares these event loops.

### 1.2 WebRTC LAN Direct vs NAT Traversal
- **Direct LAN Sockets Priority:** Devices on the same subnet (`192.168.x.x` or `10.x.x.x`) communicate directly over TCP/UDP sockets on port 9100.
- **WebRTC DataChannels:** Cross-subnet transfers negotiate via the FastAPI signaling server (`/api/v1/transfers/signal`) and STUN (`stun:stun.l.google.com:19302`). In strict symmetric NAT enterprise firewalls, a configured TURN relay server is required.

---

## 2. Lab Syllabus Traceability & Intentional Design Decisions

Per directive (*"dont implement lab exercises that just for concept reference only"*), classroom student arcade games (Hangman, Quiz Arena, CAT practice exams) were intentionally excluded. The underlying networking mechanisms from 20MSS56 and 20MSS52 are instead fully embedded into production-grade systems:

| Syllabus Mechanism | Traditional Student Assignment | NetSync Ultra Production Implementation | Status |
|:---|:---|:---|:---:|
| TCP Framing & State Machine | Week 2 Iterative Hangman | Socket Diagnostic Toolkit (`runTcpProbe`, 3-way handshake) | **Active** |
| RFC 5905 Time Synchronization | Week 4 RFC 868 Binary Time | Marzullo Intersection Filter & NTP Client (`TimeClockSyncTab.jsx`) | **Active** |
| Concurrent Sockets & Epoll | Week 7 Concurrent Server | Server Concurrency Benchmark (`runConcurrencyBenchmark`) | **Active** |
| Directed Broadcast & Multicast | Week 8 & 12 Multicast Receiver | LAN Discovery & Multicast Studio (`LanDiscoveryMulticastTab.jsx`) | **Active** |
| DHCP Discovery & Lease FSM | Week 11 DHCP Simulation | DHCP DORA Sandbox (`DhcpSimulationTab.jsx`) | **Active** |
| Sliding Window Flow Control | 20MSS52 Unit 2 Transport | Reliable Transport Lab: Stop-and-Wait, GBN, SR (`ReliableTransportTab.jsx`) | **Active** |
| Shortest Path & Distance Vector | 20MSS52 Unit 3 Routing | Dijkstra SPF & Bellman-Ford Count-to-Infinity (`RoutingLabTab.jsx`) | **Active** |
| Addressing & VLSM Subnetting | 20MSS52 Unit 3 Network | Address Architect: IPv4 VLSM & IPv6 EUI-64 (`AddressArchitectTab.jsx`) | **Active** |
| MAC Contention & CSMA/CD/CA | 20MSS52 Unit 2 Datalink | Link Layer Simulator: 1-Persistent CSMA & RTS/CTS (`LinkLayerTab.jsx`) | **Active** |
| P2P Swarms & XOR Metric | 20MSS52 Unit 5 Application | Kademlia DHT 160-bit XOR Routing (`P2pSwarmDhtTab.jsx`) | **Active** |
| Router Switching Fabrics | 20MSS52 Unit 4 Hardware | Crossbar VOQ Virtual Output Queuing (`RouterArchitectureTab.jsx`) | **Active** |
| Datacenter Clos Topology | Advanced Networking | 2-Tier Leaf-Spine ECMP 5-Tuple Hashing (`DatacenterFabricTab.jsx`) | **Active** |
| Protocol Evolution & HOL Blocking | 20MSS52 Unit 5 Application | HTTP/1.1 vs HTTP/2 vs HTTP/3 QUIC (`HttpEvolutionTab.jsx`) | **Active** |
| ICMP Diagnostics & mdev | 20MSS52 Unit 3 Network | Real ICMP Echo Burst & Dispersion (`IcmpDiagnosticsTab.jsx`) | **Active** |

---

## 3. UI Provenance & Honesty Status

- **Zero Mock Telemetry Unlabeled:** All synthetic fallbacks across `apps/web/src/services/api.js` return explicit `provenance: "simulated"` records.
- **Interactive Provenance Badges:** All 16 Network Intelligence Lab tabs, File Transfer route, and telemetry views render `<ProvenanceBadge />` with tooltips identifying RFC numbers, empirical formulas, and execution context.
- **Hardware Acceleration Fallback:** Both `NetSync3DScene.jsx` and `NetworkMesh3D.jsx` include automatic WebGL availability detection with graceful 2D SVG/Canvas fallbacks for low-power mobile devices.
