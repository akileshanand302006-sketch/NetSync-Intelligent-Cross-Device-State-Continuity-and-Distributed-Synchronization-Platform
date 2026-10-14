"""
NetSync Networking Engine Configuration
=======================================
Central configuration for all networking parameters.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class SyncStrategy(str, Enum):
    """Adaptive synchronization strategies."""
    SYNC_NOW = "sync_now"
    DELTA_SYNC = "delta_sync"
    COMPRESS = "compress"
    DEFER = "defer"
    WIFI_ONLY = "wifi_only"
    LOCAL_TRANSFER = "local_transfer"
    CLOUD_RELAY = "cloud_relay"
    RESUME_AFTER_RECONNECT = "resume_after_reconnect"


@dataclass(frozen=True)
class ProtocolConfig:
    """Binary protocol configuration."""
    magic: bytes = b"NSYN"
    version: int = 1
    max_payload_size: int = 16 * 1024 * 1024  # 16 MB
    header_size: int = 64  # Fixed header size in bytes


@dataclass
class TransportConfig:
    """TCP/UDP transport configuration."""
    # TCP settings
    tcp_host: str = "0.0.0.0"
    tcp_port: int = 9400
    tcp_backlog: int = 128
    tcp_recv_buffer: int = 65536
    tcp_connect_timeout: float = 10.0
    tcp_read_timeout: float = 30.0

    # UDP settings
    udp_host: str = "0.0.0.0"
    udp_port: int = 9401
    udp_broadcast_port: int = 9402
    udp_buffer_size: int = 4096

    # Connection management
    max_connections: int = 256
    heartbeat_interval: float = 15.0
    heartbeat_timeout: float = 45.0
    reconnect_delay: float = 2.0
    reconnect_max_delay: float = 60.0
    reconnect_max_attempts: int = 10


@dataclass
class DiscoveryConfig:
    """Device discovery configuration."""
    service_type: str = "_netsync._tcp.local."
    service_name: str = "NetSync"
    broadcast_interval: float = 5.0
    discovery_timeout: float = 10.0
    mdns_enabled: bool = True
    udp_broadcast_enabled: bool = True


@dataclass
class SyncConfig:
    """State synchronization configuration."""
    delta_threshold_bytes: int = 1024  # Use delta if state > this
    compress_threshold_bytes: int = 4096  # Compress if payload > this
    max_offline_queue_size: int = 1000
    max_retry_count: int = 5
    retry_base_delay: float = 1.0
    retry_max_delay: float = 30.0
    state_snapshot_interval: int = 10  # Every N versions
    conflict_resolution: str = "server_wins"  # server_wins | client_wins | manual


@dataclass
class SecurityConfig:
    """Security configuration."""
    pairing_token_length: int = 6
    pairing_token_ttl: int = 300  # 5 minutes
    tls_enabled: bool = True
    tls_cert_path: str | None = None
    tls_key_path: str | None = None
    min_tls_version: str = "TLSv1.2"


@dataclass
class MonitoringConfig:
    """Network monitoring configuration."""
    latency_sample_count: int = 10
    latency_sample_interval: float = 1.0
    throughput_window: float = 5.0  # seconds
    health_check_interval: float = 30.0
    metrics_retention_seconds: int = 3600


@dataclass
class NetSyncConfig:
    """Root configuration for the networking engine."""
    protocol: ProtocolConfig = field(default_factory=ProtocolConfig)
    transport: TransportConfig = field(default_factory=TransportConfig)
    discovery: DiscoveryConfig = field(default_factory=DiscoveryConfig)
    sync: SyncConfig = field(default_factory=SyncConfig)
    security: SecurityConfig = field(default_factory=SecurityConfig)
    monitoring: MonitoringConfig = field(default_factory=MonitoringConfig)
    device_id: str = ""
    device_name: str = ""
    device_platform: str = ""
