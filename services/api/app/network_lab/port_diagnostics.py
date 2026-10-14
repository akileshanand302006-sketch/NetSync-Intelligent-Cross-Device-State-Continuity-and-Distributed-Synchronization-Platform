"""
Port & Connectivity Diagnostics Module (20MSS56 Network Programming Lab)
========================================================================
Implements authorized host reachability and port classification diagnostics:
- OPEN: TCP SYN-ACK received, 3-way handshake established.
- CLOSED: TCP RST received (reliable connection refusal).
- FILTERED: Connection timed out without TCP response (firewall drop).
- ERROR: Host unreachable or socket routing exception.

Includes DNS resolution diagnostics and strict target allowlist security controls.
"""

import socket
import time
from typing import Any, Dict, List, Optional


AUTHORIZED_PORT_NAMES = {
    21: "FTP",
    22: "SSH",
    53: "DNS",
    80: "HTTP",
    123: "NTP",
    443: "HTTPS",
    5353: "mDNS Multicast",
    8000: "NetSync FastAPI Core",
    9100: "NetSync Direct P2P Sockets",
    5173: "NetSync Web UI (Vite Dev)",
}


def scan_single_port(host: str, port: int, timeout_sec: float = 0.5) -> Dict[str, Any]:
    """Test a single TCP port on an authorized target."""
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(timeout_sec)
    t0 = time.perf_counter()

    state = "UNKNOWN"
    rtt_ms = 0.0

    try:
        res = sock.connect_ex((host, port))
        rtt_ms = round((time.perf_counter() - t0) * 1000, 2)
        if res == 0:
            state = "OPEN"
        elif res in (10061, 111):  # WSAECONNREFUSED / ECONNREFUSED
            state = "CLOSED"
        else:
            state = "FILTERED"
    except socket.timeout:
        rtt_ms = round((time.perf_counter() - t0) * 1000, 2)
        state = "FILTERED"
    except Exception as e:
        state = f"ERROR: {str(e)[:30]}"
    finally:
        sock.close()

    return {
        "port": port,
        "service": AUTHORIZED_PORT_NAMES.get(port, "Custom Service"),
        "state": state,
        "rtt_ms": rtt_ms,
    }


def scan_authorized_target(
    host: str = "127.0.0.1",
    ports: Optional[List[int]] = None,
    timeout_sec: float = 0.4,
) -> Dict[str, Any]:
    """
    Scan authorized ports on a target host.
    Enforces security boundaries preventing unrestricted arbitrary scanning.
    """
    # Security allowlist: local device or private network only
    is_local = host in ("127.0.0.1", "localhost", "0.0.0.0")
    is_private = host.startswith(("192.168.", "10.", "172.16.", "172.17.", "172.18.", "172.19.", "172.20.", "172.31."))

    if not is_local and not is_private:
        return {
            "status": "blocked",
            "error": "Target outside authorized local/RFC-1918 mesh boundaries. Public scanning is prohibited.",
        }

    target_ports = ports or [80, 443, 8000, 9100, 5173, 5353]
    # Bound port count to max 25 ports to prevent resource exhaustion
    target_ports = list(dict.fromkeys(target_ports))[:25]

    t_start = time.perf_counter()
    results = [scan_single_port(host, p, timeout_sec) for p in target_ports]
    duration_ms = round((time.perf_counter() - t_start) * 1000, 2)

    open_count = sum(1 for r in results if r["state"] == "OPEN")
    closed_count = sum(1 for r in results if r["state"] == "CLOSED")
    filtered_count = sum(1 for r in results if r["state"] == "FILTERED")

    return {
        "status": "completed",
        "target": host,
        "ports_tested": len(results),
        "open_count": open_count,
        "closed_count": closed_count,
        "filtered_count": filtered_count,
        "duration_ms": duration_ms,
        "results": results,
        "timestamp": time.time(),
    }


def run_dns_diagnostics(hostname: str = "localhost") -> Dict[str, Any]:
    """
    Perform DNS resolution diagnostics:
    - Measures resolution latency
    - Resolves IPv4 and IPv6 addresses via getaddrinfo
    - Tests reverse PTR record via gethostbyaddr
    """
    t0 = time.perf_counter()
    resolved_ips: List[str] = []
    canonical_name = ""
    error = None

    try:
        addr_info = socket.getaddrinfo(hostname, None)
        for item in addr_info:
            ip = item[4][0]
            if ip not in resolved_ips:
                resolved_ips.append(ip)
            if not canonical_name and item[3]:
                canonical_name = item[3]
    except Exception as e:
        error = str(e)

    duration_ms = round((time.perf_counter() - t0) * 1000, 2)

    # Reverse PTR
    reverse_host = None
    if resolved_ips and not error:
        try:
            reverse_host, _, _ = socket.gethostbyaddr(resolved_ips[0])
        except Exception:
            reverse_host = "No PTR record found"

    return {
        "status": "success" if resolved_ips else "failed",
        "hostname": hostname,
        "duration_ms": duration_ms,
        "resolved_ips": resolved_ips,
        "canonical_name": canonical_name or hostname,
        "reverse_ptr": reverse_host,
        "error": error,
        "timestamp": time.time(),
    }
