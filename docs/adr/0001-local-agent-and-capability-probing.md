# ADR 0001: Local Agent Architecture and Host Capability Probing

**Status:** Accepted  
**Date:** October 2026  
**Deciders:** NetSync Core Team  
**Consulted:** Network Programming Laboratory (20MSS56), Computer Networks (20MSS52)

---

## Context and Problem Statement

Modern web browsers operate within strict security sandboxes that prohibit direct operating-system socket access. Web browsers cannot create raw sockets (`SOCK_RAW`), sniff packets promiscuously, inspect Ethernet or IP headers directly, join multicast groups via IGMP, or manipulate low-level socket options like `TCP_INFO`, `SO_REUSEADDR`, or `IP_MULTICAST_TTL`. Furthermore, cloud-hosted backends (e.g., Fly.io, Railway, AWS) reside outside the user's Local Area Network (LAN) and cannot discover or interact with devices on the user's physical subnet (`192.168.x.x`).

NetSync requires real network measurement, packet inspection, local P2P discovery, and network diagnostics to fulfill its mission as an academic showcase and daily-use platform.

---

## Decision Drivers

1. **Non-Negotiable Rule 3 & 4:** Every metric and packet must be real or honestly labeled; unsupported capabilities must visibly explain the host reason and provide the safest fallback without silent failure.
2. **Non-Negotiable Rule 5:** Privileged networking must be safe by default, requiring explicit user consent, target allowlists, and local confinement.
3. **Low Latency:** Cross-device sync on the same Wi-Fi network should not route through an external cloud hop when direct LAN communication is possible.

---

## Considered Options

1. **Browser-Only with Emulation:** Rely solely on browser APIs (WebSockets, WebRTC DataChannels) and simulate all lower-layer phenomena (raw sockets, packet sniffing, IP headers) with synthetic mock data.
2. **Cloud Server Probe Only:** Execute all scans, socket probes, and packet parsing on the remote API server.
3. **Local Agent Daemon with Dual-Channel Reachability (Selected):** Provide a local Python daemon running on the user's machine that interacts with the OS networking stack, exposes a host capability probe, and communicates securely with the web UI via Core or an authenticated loopback WebSocket.

---

## Decision Outcome

Chosen Option: **Local Agent Daemon with Dual-Channel Reachability**.

### Architectural Design:
1. **Host Capability Probe:** Upon initialization, the Agent probes the operating system, privilege level (e.g. Administrator / `CAP_NET_RAW`), available I/O multiplexers (`epoll`, `kqueue`, `select`), and network interfaces.
2. **Dual-Channel Reachability:**
   - **Outbound mTLS WebSocket to Core:** The Agent maintains an authenticated outbound TLS connection to the central Core API, enabling remote telemetry relay when the browser is off-LAN.
   - **Loopback WebSocket (`127.0.0.1`):** For lowest latency, the web UI can connect directly to the Local Agent on loopback. The Agent validates the browser's `Origin` header, requires an ephemeral pairing token, and rejects cross-origin requests.
3. **Privilege Demotion:** Where privileged sockets are necessary (e.g., promiscuous packet capture on Linux), the Agent opens the socket descriptor during startup and drops root privileges immediately thereafter.
4. **Graceful Degradation:** If the host environment does not support a feature (e.g., raw TCP sending on Windows), the capability probe advertises the limitation, and the UI marks any fallback data with an explicit badge: `[SIMULATION: HOST RESTRICTED (WINDOWS UNPRIVILEGED)]`.

---

## Consequences

### Positive
- Allows genuine local packet capture, subnet broadcast, and low-latency Wi-Fi continuity.
- Eliminates fake mock numbers; ensures absolute capability honesty.
- Secures the user's machine by enforcing origin validation and token authorization.

### Negative / Trade-offs
- Requires the user to run or install a local Python service to enable privileged networking features.
- Different operating systems exhibit differing kernel behaviors (e.g. Windows `SIO_RCVALL` vs Linux `AF_PACKET`), requiring platform-specific adapters.
