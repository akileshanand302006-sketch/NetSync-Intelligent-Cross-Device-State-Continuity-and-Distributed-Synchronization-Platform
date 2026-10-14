"""
Socket Toolkit Module (20MSS56 Network Programming Lab)
=======================================================
Implements TCP and UDP client-server evaluation routines with:
- High-resolution monotonic timing (time.perf_counter)
- Connection establishment time separated from application RTT
- Sequence-numbered UDP datagrams for loss, jitter, and out-of-order detection
- Safe test boundaries and strict timeouts
"""

import socket
import struct
import time
from typing import Any, Dict, List, Optional


def run_tcp_echo_test(
    host: str = "127.0.0.1",
    port: int = 9100,
    payload_size: int = 64,
    count: int = 5,
    timeout_sec: float = 2.0,
) -> Dict[str, Any]:
    """
    Execute TCP client evaluation against an authorized endpoint.
    Measures socket creation, connection-establishment time, and application RTT per frame.
    """
    # Restrict to safe addresses
    if host not in ("127.0.0.1", "localhost", "0.0.0.0") and not host.startswith(("192.168.", "10.")):
        return {"error": "Target host outside authorized local mesh network.", "status": "blocked"}

    payload_size = max(16, min(payload_size, 65536))
    count = max(1, min(count, 50))
    test_payload = b"NETSYNC_TCP_ECHO_" + b"X" * (payload_size - 17)

    connect_time_ms = 0.0
    rtts_ms: List[float] = []
    errors: List[str] = []

    try:
        t_sock_start = time.perf_counter()
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout_sec)
        
        # Measure TCP 3-way handshake completion
        sock.connect((host, port))
        connect_time_ms = round((time.perf_counter() - t_sock_start) * 1000, 3)

        for i in range(count):
            seq_frame = struct.pack("!II", i, payload_size) + test_payload
            t_send = time.perf_counter()
            sock.sendall(seq_frame)

            # Read response
            received = b""
            while len(received) < len(seq_frame):
                chunk = sock.recv(len(seq_frame) - len(received))
                if not chunk:
                    break
                received += chunk

            t_recv = time.perf_counter()
            rtt = round((t_recv - t_send) * 1000, 3)
            rtts_ms.append(rtt)

        sock.close()
    except socket.timeout:
        errors.append("Socket read timed out waiting for peer response.")
    except ConnectionRefusedError:
        errors.append(f"Connection refused on {host}:{port} (no active listener).")
    except Exception as e:
        errors.append(f"TCP socket exception: {str(e)}")

    # Calculate statistics
    avg_rtt = round(sum(rtts_ms) / len(rtts_ms), 3) if rtts_ms else 0.0
    min_rtt = min(rtts_ms) if rtts_ms else 0.0
    max_rtt = max(rtts_ms) if rtts_ms else 0.0
    jitter = round(max_rtt - min_rtt, 3) if len(rtts_ms) > 1 else 0.0

    return {
        "status": "success" if rtts_ms else "failed",
        "transport": "TCP",
        "target": f"{host}:{port}",
        "payload_bytes": payload_size,
        "packets_sent": count,
        "packets_received": len(rtts_ms),
        "connection_time_ms": connect_time_ms,
        "rtt_samples_ms": rtts_ms,
        "avg_rtt_ms": avg_rtt,
        "min_rtt_ms": min_rtt,
        "max_rtt_ms": max_rtt,
        "jitter_ms": jitter,
        "throughput_mbps": round((payload_size * len(rtts_ms) * 8) / (avg_rtt * len(rtts_ms) * 1000), 2) if avg_rtt > 0 else 0.0,
        "errors": errors,
        "timestamp": time.time(),
    }


def run_udp_echo_test(
    host: str = "127.0.0.1",
    port: int = 9100,
    payload_size: int = 64,
    count: int = 10,
    interval_sec: float = 0.02,
    timeout_sec: float = 1.0,
) -> Dict[str, Any]:
    """
    Execute UDP datagram evaluation.
    Measures packet loss, jitter, and detects out-of-order sequence numbers.
    """
    if host not in ("127.0.0.1", "localhost", "0.0.0.0") and not host.startswith(("192.168.", "10.")):
        return {"error": "Target host outside authorized local mesh network.", "status": "blocked"}

    payload_size = max(16, min(payload_size, 1400))  # bounded MTU
    count = max(1, min(count, 100))
    raw_padding = b"NETSYNC_UDP_" + b"U" * (payload_size - 12)

    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(timeout_sec)

    rtts_ms: List[float] = []
    received_seqs: List[int] = []
    errors: List[str] = []

    for seq in range(count):
        # Header: 4-byte sequence + 8-byte timestamp
        t_sent = time.perf_counter()
        header = struct.pack("!Id", seq, t_sent)
        packet = header + raw_padding

        try:
            sock.sendto(packet, (host, port))
            data, _ = sock.recvfrom(2048)
            t_recv = time.perf_counter()

            if len(data) >= 12:
                recv_seq, _ = struct.unpack("!Id", data[:12])
                received_seqs.append(recv_seq)
                rtts_ms.append(round((t_recv - t_sent) * 1000, 3))
        except socket.timeout:
            pass  # Expected potential UDP loss
        except Exception as e:
            errors.append(str(e))

        if interval_sec > 0:
            time.sleep(interval_sec)

    sock.close()

    # Analyze UDP packet loss & sequence ordering
    packets_received = len(received_seqs)
    loss_rate = round((count - packets_received) / count, 4)
    out_of_order = sum(1 for i in range(1, len(received_seqs)) if received_seqs[i] < received_seqs[i - 1])

    avg_rtt = round(sum(rtts_ms) / len(rtts_ms), 3) if rtts_ms else 0.0
    min_rtt = min(rtts_ms) if rtts_ms else 0.0
    max_rtt = max(rtts_ms) if rtts_ms else 0.0
    jitter = round(max_rtt - min_rtt, 3) if len(rtts_ms) > 1 else 0.0

    return {
        "status": "success" if packets_received > 0 else "failed",
        "transport": "UDP",
        "target": f"{host}:{port}",
        "payload_bytes": payload_size,
        "packets_sent": count,
        "packets_received": packets_received,
        "packet_loss_rate": loss_rate,
        "out_of_order_count": out_of_order,
        "avg_rtt_ms": avg_rtt,
        "min_rtt_ms": min_rtt,
        "max_rtt_ms": max_rtt,
        "jitter_ms": jitter,
        "rtt_samples_ms": rtts_ms,
        "errors": errors,
        "timestamp": time.time(),
    }


def query_network_time_service(host: str = "time.cloudflare.com", port: int = 123) -> Dict[str, Any]:
    """
    Query an authorized external NTP/time service to compare monotonic elapsed time vs wall-clock time.
    Uses RFC 5905 NTP client framing (48 bytes).
    """
    # NTP client packet: LI=0, VN=3, Mode=3 (client) -> 0x1b
    ntp_req = b"\x1b" + 47 * b"\0"
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.settimeout(2.5)

    try:
        t_send = time.perf_counter()
        sock.sendto(ntp_req, (host, port))
        data, addr = sock.recvfrom(1024)
        t_recv = time.perf_counter()
        sock.close()

        rtt_ms = round((t_recv - t_send) * 1000, 3)

        # Transmit timestamp starts at offset 40 in 48-byte packet
        if len(data) >= 48:
            secs, frac = struct.unpack("!II", data[40:48])
            # NTP epoch is 1900-01-01; Unix epoch is 1970-01-01 (70 years = 2208988800 sec)
            unix_time = secs - 2208988800 + (frac / 2**32)
            time_offset_ms = round((unix_time - time.time()) * 1000, 2)
            return {
                "status": "success",
                "server": host,
                "rtt_ms": rtt_ms,
                "ntp_timestamp": unix_time,
                "system_time": time.time(),
                "time_offset_ms": time_offset_ms,
                "stratum": data[1],
                "precision_exp": data[3] if data[3] < 128 else data[3] - 256,
            }
    except Exception as e:
        return {
            "status": "failed",
            "server": host,
            "error": f"NTP query failed: {str(e)}",
            "system_time": time.time(),
        }
    finally:
        sock.close()
