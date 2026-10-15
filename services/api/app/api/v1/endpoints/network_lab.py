"""
Network Intelligence Lab Endpoints (20MSS56 Network Programming Lab)
=====================================================================
REST API endpoints powering the NetSync Network Intelligence Lab:
- TCP / UDP socket toolkit & high-resolution latency probing
- Concurrent server & I/O multiplexing performance benchmarks
- Binary packet parsing & TCP/IP header extraction
- Authorized host port accessibility & DNS lookup diagnostics
- Subnet broadcast & IP multicast group communication
- Sandboxed RFC 2131 DHCP address allocation & DORA cycle
- Automated academic experiment runner and report generation
"""

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import oauth2_scheme
from app.core.security import decode_access_token
from app.models.user import User

def get_lab_user(
    db: Session = Depends(get_db),
    token: Optional[str] = Depends(oauth2_scheme),
) -> User:
    """Validate Bearer JWT or provide academic laboratory user context."""
    if token:
        try:
            payload = decode_access_token(token)
            if payload and payload.get("sub"):
                user = db.query(User).filter(User.id == payload.get("sub")).first()
                if user and user.is_active:
                    return user
        except Exception:
            pass

    user = db.query(User).first()
    if user:
        return user
    return User(
        id="lab-student",
        email="lab@20mss56.netsync.dev",
        full_name="20MSS56 Lab Operator",
        is_active=True,
    )
from app.network_lab.concurrency_benchmarks import benchmark_runner
from app.network_lab.dhcp_sandbox import dhcp_sandbox
from app.network_lab.discovery_multicast import (
    test_multicast_group_transmission,
    test_udp_broadcast_probe,
)
from app.network_lab.experiment_runner import (
    EXPERIMENT_CATALOG,
    run_all_experiments,
    run_single_experiment,
)
from app.network_lab.packet_parser import (
    get_sample_lab_packets,
    parse_raw_packet,
)
from app.network_lab.port_diagnostics import (
    run_dns_diagnostics,
    scan_authorized_target,
)
from app.network_lab.socket_toolkit import (
    query_network_time_service,
    run_tcp_echo_test,
    run_udp_echo_test,
)
from app.network_lab.tier_a_labs import (
    trace_life_of_request,
    simulate_congestion_control,
    simulate_reliable_transport,
    calculate_impairment_impact,
    simulate_dns_resolution_hierarchy,
    calculate_nodal_delay_and_bufferbloat,
)
from app.network_lab.tier_b_labs import (
    simulate_as_path_trace,
    run_dijkstra_shortest_path,
    simulate_bellman_ford_count_to_infinity,
    calculate_vlsm_subnets,
    generate_eui64_ipv6,
    simulate_csmacd_backoff,
    simulate_csmaca_hidden_terminal,
    calculate_kademlia_distance,
    run_marzullo_ntp_filter,
)
from app.network_lab.tier_c_labs import (
    simulate_router_architecture,
    simulate_datacenter_fabric,
    compare_http_protocols,
    run_icmp_diagnostics,
)

router = APIRouter()


# -------------------------------------------------------------
# Request Schemas
# -------------------------------------------------------------
class TCPEchoRequest(BaseModel):
    host: str = "127.0.0.1"
    port: int = 9100
    payload_size: int = Field(64, ge=16, le=65536)
    count: int = Field(5, ge=1, le=50)
    timeout_sec: float = Field(2.0, ge=0.1, le=10.0)


class UDPEchoRequest(BaseModel):
    host: str = "127.0.0.1"
    port: int = 9100
    payload_size: int = Field(64, ge=16, le=1400)
    count: int = Field(10, ge=1, le=100)
    interval_sec: float = Field(0.02, ge=0.0, le=1.0)
    timeout_sec: float = Field(1.0, ge=0.1, le=5.0)


class ConcurrencyBenchmarkRequest(BaseModel):
    architecture: str = Field("multiplexed", pattern="^(iterative|concurrent|multiplexed)$")
    clients_count: int = Field(10, ge=1, le=50)
    requests_per_client: int = Field(5, ge=1, le=20)
    payload_bytes: int = Field(128, ge=16, le=4096)


class PortScanRequest(BaseModel):
    host: str = "127.0.0.1"
    ports: Optional[List[int]] = None
    timeout_sec: float = Field(0.4, ge=0.1, le=2.0)


class DNSDiagRequest(BaseModel):
    hostname: str = "localhost"


class ParsePacketRequest(BaseModel):
    hex_payload: str = Field(..., description="Hex string representing raw packet bytes")


class MulticastRequest(BaseModel):
    group: str = "239.255.0.1"
    port: int = 9105
    ttl: int = Field(1, ge=1, le=32)
    message_count: int = Field(3, ge=1, le=20)


class DHCPDoraRequest(BaseModel):
    client_mac: str = "00:1A:2B:3C:4D:5E"
    client_name: str = "Laptop Alpha"
    force_ip: Optional[str] = None


class DHCPReleaseRequest(BaseModel):
    client_mac: str


# -------------------------------------------------------------
# Endpoints: Sockets & Transport Layer
# -------------------------------------------------------------
@router.post("/socket/tcp")
def run_tcp_probe(
    req: TCPEchoRequest,
    current_user: User = Depends(get_lab_user),
):
    """Execute TCP client connection and round-trip timing probe."""
    return run_tcp_echo_test(
        host=req.host,
        port=req.port,
        payload_size=req.payload_size,
        count=req.count,
        timeout_sec=req.timeout_sec,
    )


@router.post("/socket/udp")
def run_udp_probe(
    req: UDPEchoRequest,
    current_user: User = Depends(get_lab_user),
):
    """Execute UDP datagram probe with loss and jitter analysis."""
    return run_udp_echo_test(
        host=req.host,
        port=req.port,
        payload_size=req.payload_size,
        count=req.count,
        interval_sec=req.interval_sec,
        timeout_sec=req.timeout_sec,
    )


@router.post("/socket/time")
def query_time_service(
    host: str = "time.cloudflare.com",
    port: int = 123,
    current_user: User = Depends(get_lab_user),
):
    """Query external RFC 5905 NTP server to compare wall-clock vs monotonic elapsed time."""
    return query_network_time_service(host=host, port=port)


# -------------------------------------------------------------
# Endpoints: Concurrency & I/O Multiplexing
# -------------------------------------------------------------
@router.post("/concurrency/benchmark")
def run_concurrency_benchmark(
    req: ConcurrencyBenchmarkRequest,
    current_user: User = Depends(get_lab_user),
):
    """Run benchmark comparing Iterative vs Concurrent vs Multiplexed server models."""
    return benchmark_runner.run_benchmark(
        architecture=req.architecture,
        clients_count=req.clients_count,
        requests_per_client=req.requests_per_client,
        payload_bytes=req.payload_bytes,
    )


# -------------------------------------------------------------
# Endpoints: Packet Explorer & Protocol Headers
# -------------------------------------------------------------
@router.get("/packet/samples")
def get_sample_packets(
    current_user: User = Depends(get_lab_user),
):
    """Get realistic laboratory packet captures with parsed layers and hex representations."""
    return get_sample_lab_packets()


@router.post("/packet/parse")
def parse_custom_packet(
    req: ParsePacketRequest,
    current_user: User = Depends(get_lab_user),
):
    """Parse raw hex packet bytes into Ethernet, IPv4, IPv6, TCP, and UDP layers."""
    try:
        clean_hex = req.hex_payload.replace(" ", "").replace("\n", "").replace(":", "")
        raw_bytes = bytes.fromhex(clean_hex)
        return parse_raw_packet(raw_bytes)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse hex packet: {str(e)}")


# -------------------------------------------------------------
# Endpoints: Port Diagnostics & DNS
# -------------------------------------------------------------
@router.post("/ports/scan")
def scan_ports(
    req: PortScanRequest,
    current_user: User = Depends(get_lab_user),
):
    """Scan authorized target ports and classify into OPEN, CLOSED, or FILTERED states."""
    return scan_authorized_target(
        host=req.host,
        ports=req.ports,
        timeout_sec=req.timeout_sec,
    )


@router.post("/dns/diag")
def dns_diagnostics(
    req: DNSDiagRequest,
    current_user: User = Depends(get_lab_user),
):
    """Execute DNS resolution and reverse PTR diagnostics."""
    return run_dns_diagnostics(hostname=req.hostname)


# -------------------------------------------------------------
# Endpoints: LAN Discovery, Broadcast & Multicast
# -------------------------------------------------------------
@router.post("/discovery/broadcast")
def test_broadcast(
    port: int = 9100,
    current_user: User = Depends(get_lab_user),
):
    """Send UDP SO_BROADCAST discovery probe to 255.255.255.255."""
    return test_udp_broadcast_probe(port=port)


@router.post("/discovery/multicast")
def test_multicast(
    req: MulticastRequest,
    current_user: User = Depends(get_lab_user),
):
    """Transmit sequence-numbered datagrams to a Class D multicast group."""
    return test_multicast_group_transmission(
        group=req.group,
        port=req.port,
        ttl=req.ttl,
        message_count=req.message_count,
    )


# -------------------------------------------------------------
# Endpoints: DHCP Simulation Sandbox
# -------------------------------------------------------------
@router.get("/dhcp/status")
def get_dhcp_sandbox_status(
    current_user: User = Depends(get_lab_user),
):
    """Get active DHCP sandbox server state, IP pool allocation, and leases."""
    return dhcp_sandbox.get_status()


@router.post("/dhcp/dora")
def simulate_dhcp_dora(
    req: DHCPDoraRequest,
    current_user: User = Depends(get_lab_user),
):
    """Simulate complete RFC 2131 Discover-Offer-Request-Ack handshake for a client."""
    return dhcp_sandbox.simulate_dora_cycle(
        client_mac=req.client_mac,
        client_name=req.client_name,
        force_ip=req.force_ip,
    )


@router.post("/dhcp/release")
def release_dhcp_lease(
    req: DHCPReleaseRequest,
    current_user: User = Depends(get_lab_user),
):
    """Simulate client releasing its active DHCP address lease."""
    return dhcp_sandbox.release_lease(client_mac=req.client_mac)


# -------------------------------------------------------------
# Endpoints: Capstone Experiments Runner & Reports
# -------------------------------------------------------------
@router.get("/experiments")
def list_experiments(
    current_user: User = Depends(get_lab_user),
):
    """List 10 structured Capstone experiments matching course 20MSS56."""
    return EXPERIMENT_CATALOG


@router.post("/experiments/run/{experiment_id}")
def execute_single_experiment(
    experiment_id: str,
    current_user: User = Depends(get_lab_user),
):
    """Execute a single structured experiment and collect actual measurements."""
    return run_single_experiment(experiment_id)


@router.post("/experiments/run-all")
def execute_all_experiments(
    current_user: User = Depends(get_lab_user),
):
    """Execute all 10 Capstone experiments and generate a comprehensive evaluation report."""
    return run_all_experiments()


# -------------------------------------------------------------
# Endpoints: Tier A Network Intelligence Labs (Section 6)
# -------------------------------------------------------------
class RequestTracerRequest(BaseModel):
    url: str = Field("https://netsync.dev/api/v1/health")
    client_ip: str = Field("192.168.1.105")
    gateway_ip: str = Field("192.168.1.1")


class CongestionSimulatorRequest(BaseModel):
    algorithm: str = Field("reno", pattern="^(reno|cubic|bbr)$")
    rtt_ms: float = Field(30.0, ge=1.0, le=500.0)
    bandwidth_mbps: float = Field(100.0, ge=1.0, le=10000.0)
    loss_rate: float = Field(0.02, ge=0.0, le=0.5)
    buffer_packets: int = Field(60, ge=5, le=500)
    total_rounds: int = Field(60, ge=10, le=200)


class ReliableTransportRequest(BaseModel):
    protocol: str = Field("go_back_n", pattern="^(stop_and_wait|go_back_n|selective_repeat)$")
    window_size: int = Field(4, ge=1, le=16)
    total_packets: int = Field(12, ge=1, le=50)
    drop_packets: Optional[List[int]] = None
    corrupt_packets: Optional[List[int]] = None


class ImpairmentStudioRequest(BaseModel):
    base_rtt_ms: float = Field(4.0, ge=0.1, le=100.0)
    added_delay_ms: float = Field(60.0, ge=0.0, le=1000.0)
    jitter_ms: float = Field(12.0, ge=0.0, le=200.0)
    loss_percent: float = Field(5.0, ge=0.0, le=50.0)
    bandwidth_cap_mbps: float = Field(20.0, ge=0.1, le=1000.0)
    file_size_mb: float = Field(100.0, ge=0.1, le=5000.0)


class DnsStudioRequest(BaseModel):
    domain: str = Field("netsync.dev")


class NodalDelayRequest(BaseModel):
    packet_size_bytes: int = Field(1500, ge=64, le=9000)
    link_rate_mbps: float = Field(100.0, ge=1.0, le=10000.0)
    distance_km: float = Field(500.0, ge=0.1, le=40000.0)
    propagation_speed_km_s: float = Field(200000.0, ge=10000.0, le=300000.0)
    processing_delay_us: float = Field(10.0, ge=0.0, le=10000.0)
    current_queue_packets: int = Field(25, ge=0, le=1000)
    unloaded_ping_ms: float = Field(12.0, ge=0.1, le=500.0)
    loaded_ping_ms: float = Field(85.0, ge=0.1, le=2000.0)


@router.post("/tier-a/request-tracer")
def api_trace_request(
    req: RequestTracerRequest,
    current_user: User = Depends(get_lab_user),
):
    """A1: Trace full life-of-a-request across DHCP, ARP, DNS, TCP, TLS, and HTTP."""
    return trace_life_of_request(
        url=req.url,
        client_ip=req.client_ip,
        gateway_ip=req.gateway_ip,
    )


@router.post("/tier-a/congestion-simulator")
def api_simulate_congestion(
    req: CongestionSimulatorRequest,
    current_user: User = Depends(get_lab_user),
):
    """A2: Simulate TCP Reno, Cubic, and BBR congestion control state machines."""
    return simulate_congestion_control(
        algorithm=req.algorithm,
        rtt_ms=req.rtt_ms,
        bandwidth_mbps=req.bandwidth_mbps,
        loss_rate=req.loss_rate,
        buffer_packets=req.buffer_packets,
        total_rounds=req.total_rounds,
    )


@router.post("/tier-a/reliable-transport")
def api_simulate_transport(
    req: ReliableTransportRequest,
    current_user: User = Depends(get_lab_user),
):
    """A3: Simulate Stop-and-Wait, Go-Back-N, and Selective Repeat sliding window ARQ."""
    return simulate_reliable_transport(
        protocol=req.protocol,
        window_size=req.window_size,
        total_packets=req.total_packets,
        drop_packets=req.drop_packets,
        corrupt_packets=req.corrupt_packets,
    )


@router.post("/tier-a/impairment-studio")
def api_calculate_impairment(
    req: ImpairmentStudioRequest,
    current_user: User = Depends(get_lab_user),
):
    """A4: Model throughput degradation and latency under link impairments."""
    return calculate_impairment_impact(
        base_rtt_ms=req.base_rtt_ms,
        added_delay_ms=req.added_delay_ms,
        jitter_ms=req.jitter_ms,
        loss_percent=req.loss_percent,
        bandwidth_cap_mbps=req.bandwidth_cap_mbps,
        file_size_mb=req.file_size_mb,
    )


@router.post("/tier-a/dns-studio")
def api_dns_hierarchy(
    req: DnsStudioRequest,
    current_user: User = Depends(get_lab_user),
):
    """A5: RFC 1035 root-to-authoritative recursive resolution and cache audit."""
    return simulate_dns_resolution_hierarchy(domain=req.domain)


@router.post("/tier-a/nodal-delay")
def api_nodal_delay(
    req: NodalDelayRequest,
    current_user: User = Depends(get_lab_user),
):
    """A6: Decompose nodal delay (proc, queue, trans, prop) and grade bufferbloat."""
    return calculate_nodal_delay_and_bufferbloat(
        packet_size_bytes=req.packet_size_bytes,
        link_rate_mbps=req.link_rate_mbps,
        distance_km=req.distance_km,
        propagation_speed_km_s=req.propagation_speed_km_s,
        processing_delay_us=req.processing_delay_us,
        current_queue_packets=req.current_queue_packets,
        unloaded_ping_ms=req.unloaded_ping_ms,
        loaded_ping_ms=req.loaded_ping_ms,
    )


# -------------------------------------------------------------
# Endpoints: Tier B Network Intelligence Labs (Section 6)
# -------------------------------------------------------------
class VlsmRequest(BaseModel):
    network_cidr: str = Field("192.168.0.0/24")
    subnet_sizes: Optional[List[int]] = None


class Eui64Request(BaseModel):
    mac_address: str = Field("3A:8F:C2:59:E0:11")
    prefix: str = Field("2001:db8:acad::")


class KademliaRequest(BaseModel):
    node_a_hex: str = Field("A1B2C3")
    node_b_hex: str = Field("A1B2D5")


@router.get("/tier-b/as-path")
def api_as_path(
    destination: str = "1.1.1.1",
    current_user: User = Depends(get_lab_user),
):
    """B1: Trace AS-level autonomous system path & BGP attributes."""
    return simulate_as_path_trace(destination_ip=destination)


@router.get("/tier-b/dijkstra")
def api_dijkstra(
    source: str = "A",
    current_user: User = Depends(get_lab_user),
):
    """B2: Run Dijkstra's Link-State shortest path tree algorithm."""
    return run_dijkstra_shortest_path(source_node=source)


@router.get("/tier-b/count-to-infinity")
def api_count_to_infinity(
    current_user: User = Depends(get_lab_user),
):
    """B2: Demonstrate Bellman-Ford count-to-infinity routing loop & poison reverse."""
    return simulate_bellman_ford_count_to_infinity()


@router.post("/tier-b/vlsm")
def api_vlsm(
    req: VlsmRequest,
    current_user: User = Depends(get_lab_user),
):
    """B3: Calculate optimal Variable Length Subnet Masking (VLSM) allocations."""
    return calculate_vlsm_subnets(network_cidr=req.network_cidr, subnet_sizes=req.subnet_sizes)


@router.post("/tier-b/eui64")
def api_eui64(
    req: Eui64Request,
    current_user: User = Depends(get_lab_user),
):
    """B3: Generate RFC 4291 Modified EUI-64 IPv6 interface identifier."""
    return generate_eui64_ipv6(mac_address=req.mac_address, prefix=req.prefix)


@router.get("/tier-b/csmacd")
def api_csmacd(
    collisions: int = 4,
    current_user: User = Depends(get_lab_user),
):
    """B4: Simulate 802.3 CSMA/CD Truncated Binary Exponential Backoff."""
    return simulate_csmacd_backoff(collisions=collisions)


@router.get("/tier-b/csmaca")
def api_csmaca(
    current_user: User = Depends(get_lab_user),
):
    """B4: Simulate 802.11 RTS/CTS 4-way handshake solving hidden terminals."""
    return simulate_csmaca_hidden_terminal()


@router.post("/tier-b/kademlia-distance")
def api_kademlia(
    req: KademliaRequest,
    current_user: User = Depends(get_lab_user),
):
    """B5: Compute Kademlia XOR metric distance and k-bucket index."""
    return calculate_kademlia_distance(node_a_hex=req.node_a_hex, node_b_hex=req.node_b_hex)


@router.get("/tier-b/marzullo-ntp")
def api_marzullo(
    current_user: User = Depends(get_lab_user),
):
    """B6: Execute RFC 5905 NTP Marzullo clock intersection algorithm."""
    return run_marzullo_ntp_filter()


# -------------------------------------------------------------
# Endpoints: Tier C Deep Network Features (Section 6)
# -------------------------------------------------------------
@router.get("/tier-c/router-architecture")
def api_router_architecture(
    fabric_type: str = "crossbar",
    input_ports: int = 4,
    enable_voq: bool = False,
    current_user: User = Depends(get_lab_user),
):
    """C1: Simulate router switching fabrics and Head-of-Line (HOL) blocking."""
    return simulate_router_architecture(fabric_type=fabric_type, input_ports=input_ports, enable_voq=enable_voq)


@router.get("/tier-c/datacenter-fabric")
def api_datacenter_fabric(
    spines: int = 4,
    leafs: int = 8,
    servers: int = 32,
    current_user: User = Depends(get_lab_user),
):
    """C2: Evaluate 2-tier Clos Leaf-Spine datacenter fabric & ECMP hashing."""
    return simulate_datacenter_fabric(spine_switches=spines, leaf_switches=leafs, servers_per_leaf=servers)


@router.get("/tier-c/http-evolution")
def api_http_evolution(
    assets: int = 50,
    rtt_ms: float = 40.0,
    loss_rate: float = 2.0,
    current_user: User = Depends(get_lab_user),
):
    """C3: Compare page load performance across HTTP/1.1, HTTP/2, and HTTP/3 QUIC."""
    return compare_http_protocols(asset_count=assets, rtt_ms=rtt_ms, loss_rate_pct=loss_rate)


@router.get("/tier-c/icmp-diagnostics")
def api_icmp_diagnostics(
    target: str = "1.1.1.1",
    count: int = 5,
    current_user: User = Depends(get_lab_user),
):
    """C4: Execute RFC 792 ICMP Echo diagnostics and latency distribution statistics."""
    return run_icmp_diagnostics(target=target, count=count)



