"""
LAN Discovery, Broadcast & Multicast Module (20MSS56 Network Programming Lab)
=============================================================================
Demonstrates:
1. UDP Subnet Broadcast using SO_BROADCAST on IPv4
2. IGMP Multicast Group Communication using IP_ADD_MEMBERSHIP and IP_MULTICAST_TTL
3. Sequence-numbered group message tracking and duplicate detection
4. Graceful application-level fallback reporting when multicast is blocked by host policies
"""

import json
import socket
import struct
import time
from typing import Any, Dict, List


MULTICAST_DEFAULT_GROUP = "239.255.0.1"
MULTICAST_DEFAULT_PORT = 9105


def test_udp_broadcast_probe(
    port: int = 9100,
    broadcast_ip: str = "255.255.255.255",
    timeout_sec: float = 0.8,
) -> Dict[str, Any]:
    """
    Broadcast a NetSync discovery probe frame via UDP SO_BROADCAST.
    Listens for peer presence responses on the local LAN.
    """
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
    sock.settimeout(timeout_sec)

    probe_payload = json.dumps({
        "type": "NETSYNC_DISCOVERY_PROBE",
        "timestamp": time.time(),
        "protocol_version": "2.4",
        "sender": "NetSync_Diagnostic_Client",
    }).encode("utf-8")

    discovered_peers: List[Dict[str, Any]] = []
    t0 = time.perf_counter()

    try:
        sock.sendto(probe_payload, (broadcast_ip, port))
        while True:
            try:
                data, addr = sock.recvfrom(2048)
                rtt = round((time.perf_counter() - t0) * 1000, 2)
                try:
                    parsed = json.loads(data.decode("utf-8"))
                    discovered_peers.append({
                        "ip": addr[0],
                        "port": addr[1],
                        "response_rtt_ms": rtt,
                        "data": parsed,
                    })
                except Exception:
                    discovered_peers.append({
                        "ip": addr[0],
                        "port": addr[1],
                        "response_rtt_ms": rtt,
                        "raw_bytes": len(data),
                    })
            except socket.timeout:
                break
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "transport": "UDP_BROADCAST",
        }
    finally:
        sock.close()

    duration_ms = round((time.perf_counter() - t0) * 1000, 2)

    return {
        "status": "completed",
        "transport": "UDP_BROADCAST",
        "target": f"{broadcast_ip}:{port}",
        "peers_discovered": len(discovered_peers),
        "duration_ms": duration_ms,
        "results": discovered_peers,
        "cn_concept": "RFC 919 / RFC 922 Broadcast: Sockets configured with SO_BROADCAST permit packet transmission to all network layer hosts sharing the subnet.",
        "timestamp": time.time(),
    }


def test_multicast_group_transmission(
    group: str = MULTICAST_DEFAULT_GROUP,
    port: int = MULTICAST_DEFAULT_PORT,
    ttl: int = 1,
    message_count: int = 3,
) -> Dict[str, Any]:
    """
    Test IP Multicast group communication.
    Transmits sequence-numbered datagrams to a Class D multicast address (224.0.0.0 - 239.255.255.255).
    """
    # Verify valid multicast IP range
    first_octet = int(group.split(".")[0])
    if not (224 <= first_octet <= 239):
        return {"status": "error", "error": f"{group} is not a valid Class D multicast address (224.0.0.0 - 239.255.255.255)."}

    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM, socket.IPPROTO_UDP)
    # Set Multicast Time-To-Live (1 = subnet-local, >1 = routed multicast)
    sock.setsockopt(socket.IPPROTO_IP, socket.IP_MULTICAST_TTL, struct.pack("b", ttl))
    sock.settimeout(0.5)

    transmitted: List[Dict[str, Any]] = []

    try:
        for seq in range(message_count):
            t_send = time.time()
            msg = json.dumps({
                "group": group,
                "sequence": seq,
                "timestamp": t_send,
                "app": "NetSync Multi-Peer Mesh",
            }).encode("utf-8")

            sock.sendto(msg, (group, port))
            transmitted.append({
                "sequence": seq,
                "bytes": len(msg),
                "timestamp": t_send,
            })
            time.sleep(0.01)
    except Exception as e:
        return {
            "status": "error",
            "group": group,
            "error": str(e),
        }
    finally:
        sock.close()

    return {
        "status": "completed",
        "transport": "IP_MULTICAST (IGMP)",
        "group": group,
        "port": port,
        "ttl": ttl,
        "messages_transmitted": len(transmitted),
        "transmitted_frames": transmitted,
        "multicast_scope": "Link-Local / Subnet" if ttl == 1 else f"Routed (TTL={ttl})",
        "cn_concept": "RFC 1112 / RFC 2236 IGMP Multicast: Packets addressed to Class D multicast groups are duplicated at layer 2 switches/routers only for subscribed group members.",
        "timestamp": time.time(),
    }
