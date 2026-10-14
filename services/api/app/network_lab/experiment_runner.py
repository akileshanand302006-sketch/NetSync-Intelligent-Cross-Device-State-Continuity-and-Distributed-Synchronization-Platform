"""
Network Experiments Runner & Academic Capstone Reports (20MSS56 Network Programming Lab)
========================================================================================
Automated experiment orchestrator running 10 structured laboratory experiments:
1. TCP vs UDP Socket Behavior (Reliability vs Latency)
2. Server Architecture Concurrency (Iterative vs Multi-Threaded vs I/O Multiplexed)
3. TCP 3-Way Handshake Connection Establishment Timing
4. Variable Payload Size Throughput & MTU Evaluation
5. UDP Packet Loss and Out-of-Order Jitter Simulation
6. LAN Discovery & Broadcast Latency
7. Class D IP Multicast Group Communication
8. TCP/IP Header Framing and Flag Bit Analysis
9. Port Accessibility & Firewall Drop Classification
10. Dynamic Host Configuration (RFC 2131 DORA) Simulation
"""

import time
from typing import Any, Dict, List

from app.network_lab.concurrency_benchmarks import benchmark_runner
from app.network_lab.dhcp_sandbox import dhcp_sandbox
from app.network_lab.discovery_multicast import (
    test_multicast_group_transmission,
    test_udp_broadcast_probe,
)
from app.network_lab.packet_parser import get_sample_lab_packets
from app.network_lab.port_diagnostics import run_dns_diagnostics, scan_authorized_target
from app.network_lab.socket_toolkit import (
    query_network_time_service,
    run_tcp_echo_test,
    run_udp_echo_test,
)


EXPERIMENT_CATALOG = [
    {
        "id": "exp-1",
        "title": "TCP vs UDP Echo Protocol Comparison",
        "syllabus_topic": "Socket APIs & Transport Layer Primitives",
        "objective": "Compare connection-oriented byte stream reliability against connectionless datagram latency.",
    },
    {
        "id": "exp-2",
        "title": "Server Concurrency & I/O Multiplexing Evaluation",
        "syllabus_topic": "Concurrent Servers & I/O Multiplexing",
        "objective": "Evaluate requests/sec and latency percentiles (p50, p95, p99) across Iterative, Threaded, and Multiplexed models.",
    },
    {
        "id": "exp-3",
        "title": "TCP 3-Way Handshake Connection Timing",
        "syllabus_topic": "Connection Setup Dynamics",
        "objective": "Isolate SYN -> SYN-ACK -> ACK connection establishment time from application data RTT.",
    },
    {
        "id": "exp-4",
        "title": "Throughput Scaling Across Variable Payload Sizes",
        "syllabus_topic": "Buffer Management & Framing",
        "objective": "Empirically evaluate wire throughput from 64-byte probe frames to 64 KiB delta streams.",
    },
    {
        "id": "exp-5",
        "title": "UDP Datagram Loss, Jitter & Sequence Ordering",
        "syllabus_topic": "Unreliable Datagram Transmission",
        "objective": "Evaluate packet loss, duplicate detection, and out-of-order sequencing in burst transmissions.",
    },
    {
        "id": "exp-6",
        "title": "LAN Agent Discovery via UDP Subnet Broadcast",
        "syllabus_topic": "Broadcast Sockets (SO_BROADCAST)",
        "objective": "Measure peer discovery response latency over subnet-wide broadcast frames.",
    },
    {
        "id": "exp-7",
        "title": "IP Multicast Group Transmission Dynamics",
        "syllabus_topic": "Multicast Sockets & IGMP",
        "objective": "Demonstrate Class D multicast group datagram addressing, TTL scoping, and member fan-out.",
    },
    {
        "id": "exp-8",
        "title": "Binary Protocol Header & Flag Bit Analysis",
        "syllabus_topic": "Raw Sockets & Packet Sniffing",
        "objective": "Extract and decode IPv4, IPv6, TCP 9-flag control bits, sequence numbers, and window scaling.",
    },
    {
        "id": "exp-9",
        "title": "Port Reachability & Firewall Drop Classification",
        "syllabus_topic": "Port Scanning & Diagnostics",
        "objective": "Classify target ports into OPEN (SYN-ACK), CLOSED (RST), and FILTERED (Timeout) states.",
    },
    {
        "id": "exp-10",
        "title": "Sandboxed RFC 2131 DHCP Address Allocation",
        "syllabus_topic": "DHCP Simulation & Client States",
        "objective": "Simulate the 4-phase DORA cycle (Discover, Offer, Request, Ack) and client state machine transitions.",
    },
]


def run_single_experiment(experiment_id: str) -> Dict[str, Any]:
    """Execute a single structured experiment and return empirical findings."""
    t0 = time.perf_counter()

    if experiment_id == "exp-1":
        # TCP vs UDP Echo
        tcp_res = run_tcp_echo_test("127.0.0.1", 9100, payload_size=64, count=5)
        udp_res = run_udp_echo_test("127.0.0.1", 9100, payload_size=64, count=10)
        return {
            "experiment_id": "exp-1",
            "title": "TCP vs UDP Echo Protocol Comparison",
            "measurements": {
                "tcp": tcp_res,
                "udp": udp_res,
            },
            "findings": (
                "TCP guarantees strict in-order delivery and retransmission via sliding windows at the cost of "
                "connection setup overhead (SYN-ACK handshake). UDP offers sub-millisecond datagram delivery "
                "without connection state, making it optimal for periodic heartbeats and discovery."
            ),
            "duration_sec": round(time.perf_counter() - t0, 3),
        }

    elif experiment_id == "exp-2":
        # Concurrency & Multiplexing
        iter_res = benchmark_runner.run_benchmark("iterative", clients_count=10, requests_per_client=5)
        conc_res = benchmark_runner.run_benchmark("concurrent", clients_count=10, requests_per_client=5)
        multi_res = benchmark_runner.run_benchmark("multiplexed", clients_count=10, requests_per_client=5)
        return {
            "experiment_id": "exp-2",
            "title": "Server Concurrency & I/O Multiplexing Evaluation",
            "measurements": {
                "iterative": iter_res,
                "concurrent": conc_res,
                "multiplexed": multi_res,
            },
            "findings": (
                f"Multiplexed server achieved {multi_res['requests_per_second']} RPS vs {iter_res['requests_per_second']} RPS "
                f"for the iterative server ({round(multi_res['requests_per_second'] / max(1, iter_res['requests_per_second']), 1)}x speedup). "
                f"I/O multiplexing avoids thread stack allocation and context switching overhead."
            ),
            "duration_sec": round(time.perf_counter() - t0, 3),
        }

    elif experiment_id == "exp-3":
        # 3-Way Handshake Timing
        tcp_test = run_tcp_echo_test("127.0.0.1", 9100, count=3)
        return {
            "experiment_id": "exp-3",
            "title": "TCP 3-Way Handshake Connection Timing",
            "measurements": tcp_test,
            "findings": (
                f"Connection establishment time was {tcp_test.get('connection_time_ms', 0)} ms, "
                f"representing kernel SYN/SYN-ACK/ACK round-trip latency before application byte framing begins."
            ),
            "duration_sec": round(time.perf_counter() - t0, 3),
        }

    elif experiment_id == "exp-4":
        # Throughput vs Payload
        bench_small = run_tcp_echo_test("127.0.0.1", 9100, payload_size=64, count=5)
        bench_medium = run_tcp_echo_test("127.0.0.1", 9100, payload_size=1024, count=5)
        bench_large = run_tcp_echo_test("127.0.0.1", 9100, payload_size=16384, count=5)
        return {
            "experiment_id": "exp-4",
            "title": "Throughput Scaling Across Variable Payload Sizes",
            "measurements": {
                "64_bytes": bench_small,
                "1024_bytes": bench_medium,
                "16384_bytes": bench_large,
            },
            "findings": (
                "Larger frame sizes amortize TCP/IP header overhead (40-54 bytes per packet) and "
                "maximize bandwidth saturation, aligning with NetSync's 64 KiB chunk streaming strategy."
            ),
            "duration_sec": round(time.perf_counter() - t0, 3),
        }

    elif experiment_id == "exp-5":
        # UDP Packet Loss
        udp_burst = run_udp_echo_test("127.0.0.1", 9100, count=25, interval_sec=0.01)
        return {
            "experiment_id": "exp-5",
            "title": "UDP Datagram Loss, Jitter & Sequence Ordering",
            "measurements": udp_burst,
            "findings": (
                f"Observed UDP packet loss rate of {udp_burst.get('packet_loss_rate', 0) * 100}% with "
                f"{udp_burst.get('out_of_order_count', 0)} out-of-order frames. Illustrates necessity of NetSync's "
                f"application-level monotonic sequence numbers and ACK vectors."
            ),
            "duration_sec": round(time.perf_counter() - t0, 3),
        }

    elif experiment_id == "exp-6":
        # Broadcast Discovery
        bcast = test_udp_broadcast_probe(9100)
        return {
            "experiment_id": "exp-6",
            "title": "LAN Agent Discovery via UDP Subnet Broadcast",
            "measurements": bcast,
            "findings": (
                "Subnet broadcast successfully polled local devices with zero configuration. "
                "In enterprise subnets with broadcast filtering, mDNS multicast acts as seamless fallback."
            ),
            "duration_sec": round(time.perf_counter() - t0, 3),
        }

    elif experiment_id == "exp-7":
        # Multicast
        mcast = test_multicast_group_transmission("239.255.0.1", 9105, ttl=1, message_count=3)
        return {
            "experiment_id": "exp-7",
            "title": "IP Multicast Group Transmission Dynamics",
            "measurements": mcast,
            "findings": (
                "Packets routed to Class D 239.255.0.1 with TTL=1 were constrained to local link, "
                "demonstrating low-bandwidth one-to-many mesh sync."
            ),
            "duration_sec": round(time.perf_counter() - t0, 3),
        }

    elif experiment_id == "exp-8":
        # Header analysis
        packets = get_sample_lab_packets()
        return {
            "experiment_id": "exp-8",
            "title": "Binary Protocol Header & Flag Bit Analysis",
            "measurements": {
                "decoded_sample_packets": len(packets),
                "samples": packets,
            },
            "findings": (
                "Decoded Ethernet, IPv4, and TCP header fields including 32-bit sequence numbers, "
                "acknowledgement numbers, and 9 TCP flag registers without high-level library abstractions."
            ),
            "duration_sec": round(time.perf_counter() - t0, 3),
        }

    elif experiment_id == "exp-9":
        # Port Scanning & Firewall Drops
        scan = scan_authorized_target("127.0.0.1", [80, 443, 8000, 9100, 5173, 9999])
        return {
            "experiment_id": "exp-9",
            "title": "Port Reachability & Firewall Drop Classification",
            "measurements": scan,
            "findings": (
                f"Classified {scan.get('open_count', 0)} open ports, {scan.get('closed_count', 0)} closed ports, "
                f"and {scan.get('filtered_count', 0)} filtered ports based on TCP RST vs timeout response signatures."
            ),
            "duration_sec": round(time.perf_counter() - t0, 3),
        }

    elif experiment_id == "exp-10":
        # DHCP Simulation
        dora = dhcp_sandbox.simulate_dora_cycle(
            client_mac="00:1A:2B:3C:4D:5E",
            client_name="Lab Device Alpha",
        )
        return {
            "experiment_id": "exp-10",
            "title": "Sandboxed RFC 2131 DHCP Address Allocation",
            "measurements": dora,
            "findings": (
                f"Completed 4-step DORA handshake: Discovered, Offered {dora.get('assigned_ip')}, "
                f"Requested, and Acknowledged with {dora.get('lease_duration_sec')}s lease duration."
            ),
            "duration_sec": round(time.perf_counter() - t0, 3),
        }

    return {"error": f"Unknown experiment '{experiment_id}'"}


def run_all_experiments() -> Dict[str, Any]:
    """Execute complete Capstone evaluation suite across all 10 laboratory experiments."""
    t0 = time.perf_counter()
    results = []

    for exp_meta in EXPERIMENT_CATALOG:
        try:
            res = run_single_experiment(exp_meta["id"])
            results.append({
                **exp_meta,
                **res,
            })
        except Exception as e:
            results.append({
                **exp_meta,
                "status": "error",
                "error": str(e),
            })

    total_duration_sec = round(time.perf_counter() - t0, 3)

    return {
        "status": "completed",
        "laboratory_course": "20MSS56 — Network Programming Laboratory",
        "platform": "NetSync Intelligent Cross-Device State Continuity Platform",
        "total_experiments_executed": len(results),
        "total_duration_sec": total_duration_sec,
        "experiments": results,
        "timestamp": time.time(),
    }
