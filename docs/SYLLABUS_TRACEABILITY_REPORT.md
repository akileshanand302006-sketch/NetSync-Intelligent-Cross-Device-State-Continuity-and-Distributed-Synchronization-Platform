# NetSync Ultra — Academic Syllabus Traceability Report

**Curricula:**  
- **20MSS56:** Network Programming Laboratory (Weeks 1–17)  
- **20MSS52:** Computer Networks (Theory Units CO1–CO5)  
**Document Version:** 1.0.0 (Release Hardened)  
**Date:** October 2026

---

## 1. 20MSS56 Network Programming Laboratory Traceability

| Lab Week | Curriculum Concept | Academic Requirement | NetSync Ultra Implementation | Source Files | Provenance Status |
|:---|:---|:---|:---|:---|:---:|
| **Week 1** | Socket API Foundations | TCP/UDP socket creation, bind, listen, connect, accept | Socket Diagnostic Toolkit with empirical RTT & throughput calculation | `SocketToolkitTab.jsx`, `tier_a_labs.py` | `[MEASURED]` |
| **Week 2** | Client-Server Framing | Message framing, state preservation across turns | Framing protocol with CRC32 integrity check & vector clock ordering | `services/networking_engine/src/protocol.py` | `[MEASURED]` |
| **Week 3** | UDP Datagram Probing | Unreliable datagram transmission, packet loss & jitter | Datagram probing engine computing dispersion and sequence drops | `SocketToolkitTab.jsx`, `tier_a_labs.py` | `[MEASURED]` |
| **Week 4** | Time Protocol Client | RFC 868 / RFC 5905 clock synchronization | RFC 5905 NTP client querying atomic clocks with local clock offset estimation | `SocketToolkitTab.jsx`, `TimeClockSyncTab.jsx` | `[MEASURED]` |
| **Week 5** | Daytime & Application Layer | Remote server querying, caching, timeout handling | Application layer tracer decomposing DNS, TLS handshake, and HTTP verbs | `RequestTracerTab.jsx`, `tier_a_labs.py` | `[MEASURED]` |
| **Week 6** | Stream Transport & Zero-Copy | High-volume byte streaming, backpressure, chunking | Direct-to-disk WebRTC DataChannel chunking with sender backpressure | `webrtcTransfer.js`, `FileTransferView.jsx` | `[MEASURED]` |
| **Week 7** | Concurrent Servers | Multi-client concurrency, thread/process/async pooling | Concurrency benchmark comparing iterative vs thread-pool vs asyncio | `ServerConcurrencyTab.jsx`, `endpoints/network_lab.py`| `[MEASURED]` |
| **Week 8** | Directed Broadcast & Errors | UDP broadcast transmission and socket error handling | LAN broadcast announcer with `SO_REUSEADDR` & `SO_BROADCAST` probing | `LanDiscoveryMulticastTab.jsx` | `[MEASURED]` |
| **Week 9** | Port Scanning & Diagnostics | TCP connect scan, half-open SYN scan, timeout limits | Safe LAN port scanner with token allowlists & rate caps | `ConnectivityDiagnosticsTab.jsx` | `[MEASURED]` |
| **Week 11**| DHCP Protocol | DHCP Discover, Offer, Request, Ack (DORA) state machine| Complete DHCP DORA simulator with IP pool allocation & lease timers | `DhcpSimulationTab.jsx` | `[SIMULATED]` |
| **Week 12**| IP Multicast & IGMP | Multicast group join (`IP_ADD_MEMBERSHIP`) & IGMP snooping| Multicast studio streaming state packets to class D `239.255.0.1` | `LanDiscoveryMulticastTab.jsx` | `[MEASURED]` |
| **Week 14**| RAW Sockets & Packet Parsing | RAW IP/UDP frame extraction and custom header decoding| Packet explorer decoding Ethernet II, IPv4, TCP flags, and payload hex | `PacketExplorerTab.jsx`, `tier_a_labs.py` | `[MEASURED/SIMULATED]` |
| **Week 16**| PCAP Analysis | Packet capture file structure and flow tracking | PCAP packet inspector tracking 5-tuple flows, TTL, and checksums | `PacketExplorerTab.jsx` | `[DERIVED]` |
| **Week 17**| I/O Multiplexing | Readiness notifications: `select`, `poll`, `epoll` | Event loop visualizer tracking active and pending socket descriptor sets | `ServerConcurrencyTab.jsx` | `[MEASURED]` |

---

## 2. 20MSS52 Computer Networks Theory Traceability (CO1–CO5)

| Course Outcome | Theoretical Principle | Academic Topic | NetSync Ultra Module | Source Files | Provenance Status |
|:---|:---|:---|:---|:---|:---:|
| **CO1** | Layered Architectures & Models | OSI 7-Layer vs TCP/IP 4-Layer model; Nodal delay decomposition | Life-of-a-Request URL Tracer (DHCP → ARP → DNS → TCP → TLS → HTTP) & Nodal Delay Grader | `RequestTracerTab.jsx`, `DelayLossThroughputTab.jsx` | `[DERIVED/MEASURED]` |
| **CO2** | Datalink & Physical Contention | CSMA/CD exponential backoff, CSMA/CA RTS/CTS, framing & CRC | Link Layer Contention Simulator | `LinkLayerTab.jsx`, `tier_b_labs.py` | `[SIMULATED]` |
| **CO3** | Network Layer & Routing | Dijkstra Shortest Path, Bellman-Ford count-to-infinity, VLSM, IPv6 | Routing Algorithms Lab & Address Architect (CIDR VLSM + EUI-64) | `RoutingLabTab.jsx`, `AddressArchitectTab.jsx` | `[DERIVED/SIMULATED]` |
| **CO3** | Inter-Domain Routing | Autonomous Systems, BGP AS-PATH attribute, BGP peering | Path Observatory & BGP AS Hop Path Inspector | `PathObservatoryTab.jsx`, `tier_b_labs.py` | `[DERIVED]` |
| **CO3** | Internet Control Diagnostics | ICMP Type 8 Echo / Type 0 Echo Reply, RTT dispersion, mdev | Real ICMP Echo Diagnostics with standard deviation & mdev telemetry | `IcmpDiagnosticsTab.jsx`, `tier_c_labs.py` | `[MEASURED]` |
| **CO4** | Transport Layer Congestion | TCP AIMD, Cubic, BBR; cwnd vs ssthresh dynamics | TCP Congestion Control Observatory | `CongestionControlTab.jsx`, `tier_a_labs.py` | `[MEASURED/SIMULATED]` |
| **CO4** | Transport Layer Reliability | ARQ Sliding Windows: Stop-and-Wait, Go-Back-N, Selective Repeat | Reliable Transport Lab with visual ACK/NAK sliding window track | `ReliableTransportTab.jsx`, `tier_a_labs.py` | `[SIMULATED]` |
| **CO4** | Hardware Switching Fabrics | Crossbar fabric, Head-of-Line (HOL) blocking, Virtual Output Queuing | Router Switching Fabric Studio | `RouterArchitectureTab.jsx`, `tier_c_labs.py` | `[SIMULATED]` |
| **CO5** | Datacenter Clos Networks | 2-Tier Leaf-Spine topology, ECMP 5-tuple load hashing | Datacenter Fabric Simulator | `DatacenterFabricTab.jsx`, `tier_c_labs.py` | `[SIMULATED]` |
| **CO5** | Application Layer Architecture | Kademlia DHT, 160-bit XOR metric, routing tables | P2P Swarm & Kademlia Explorer | `P2pSwarmDhtTab.jsx`, `tier_b_labs.py` | `[SIMULATED]` |
| **CO5** | Application Protocol Evolution | HTTP/1.1 pipelining vs HTTP/2 multiplexing vs HTTP/3 QUIC | Protocol Evolution Laboratory | `HttpEvolutionTab.jsx`, `tier_c_labs.py` | `[DERIVED/SIMULATED]` |
| **CO5** | Distributed Time Synchronization | Marzullo's Intersection Algorithm, clock drift, true-time interval | Clock Sync & NTP Observatory | `TimeClockSyncTab.jsx`, `tier_b_labs.py` | `[MEASURED/DERIVED]` |

---

## 3. Provenance & Scientific Honesty Summary

Every single metric, chart, and data table in NetSync Ultra carries an interactive `<ProvenanceBadge />` that classifies data into four strict scientific categories:
1. `[MEASURED]`: Real physical hardware or OS kernel measurement (monotonic clock timer, live socket bind/connect, live ping).
2. `[DERIVED]`: Statistically or mathematically computed from live empirical samples (jitter, throughput, mdev, BGP AS hop count).
3. `[SIMULATED]`: Deterministic algorithm running in memory (Dijkstra SPF, Bellman-Ford count-to-infinity, CSMA backoff, Clos ECMP).
4. `[IMPORTED]`: Data ingested from external authenticated registries (RFC standards, IANA port numbers, public NTP servers).

Zero mock data is passed off as live telemetry.
