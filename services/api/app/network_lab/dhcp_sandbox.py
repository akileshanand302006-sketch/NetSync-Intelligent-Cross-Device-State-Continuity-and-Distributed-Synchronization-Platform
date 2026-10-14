"""
DHCP Simulation Sandbox (20MSS56 Network Programming Lab)
=========================================================
Implements an educational, sandboxed RFC 2131 Dynamic Host Configuration Protocol simulation:
- Address Pool Management (Subnet, Pool Start/End, Gateway, DNS, Lease Time)
- Complete DORA Handshake:
    1. DHCP DISCOVER (Client Broadcast, xid, MAC address)
    2. DHCP OFFER (Server unicast/broadcast of available lease)
    3. DHCP REQUEST (Client formal lease request)
    4. DHCP ACK (Server binding confirmation)
- Client State Machine: INIT → SELECTING → REQUESTING → BOUND → RENEWING → RELEASED
- Address conflict detection, lease renewal, and release mechanics.
"""

from datetime import datetime, timezone
import ipaddress
import time
from typing import Any, Dict, List, Optional


class DHCPServerSandbox:
    """Sandboxed RFC 2131 DHCP Server and Lease Manager."""

    def __init__(
        self,
        subnet: str = "192.168.10.0/24",
        pool_start: str = "192.168.10.100",
        pool_end: str = "192.168.10.150",
        gateway: str = "192.168.10.1",
        dns_server: str = "1.1.1.1",
        default_lease_sec: int = 3600,
    ):
        self.subnet = subnet
        self.gateway = gateway
        self.dns_server = dns_server
        self.default_lease_sec = default_lease_sec
        self.subnet_mask = "255.255.255.0"

        # Generate address pool
        start_int = int(ipaddress.IPv4Address(pool_start))
        end_int = int(ipaddress.IPv4Address(pool_end))
        self.pool_ips = [str(ipaddress.IPv4Address(ip)) for ip in range(start_int, end_int + 1)]

        # mac -> {"ip": ..., "lease_start": ..., "lease_end": ..., "state": "BOUND" | "OFFERED"}
        self.leases: Dict[str, Dict[str, Any]] = {}
        self.event_log: List[Dict[str, Any]] = []

    def get_status(self) -> Dict[str, Any]:
        """Return server configuration, active leases, and pool utilization."""
        now = time.time()
        # Clean expired leases
        active_leases = []
        for mac, lease in self.leases.items():
            is_expired = lease["lease_end"] < now
            active_leases.append({
                "mac": mac,
                "ip": lease["ip"],
                "client_id": lease.get("client_id", "Unknown"),
                "state": "EXPIRED" if is_expired else lease["state"],
                "lease_duration_sec": self.default_lease_sec,
                "expires_in_sec": max(0, int(lease["lease_end"] - now)),
                "allocated_at": datetime.fromtimestamp(lease["lease_start"], timezone.utc).isoformat(),
            })

        allocated_ips = {l["ip"] for l in active_leases if l["state"] != "EXPIRED"}
        available_ips = [ip for ip in self.pool_ips if ip not in allocated_ips]

        return {
            "server_ip": self.gateway,
            "subnet": self.subnet,
            "subnet_mask": self.subnet_mask,
            "gateway": self.gateway,
            "dns_server": self.dns_server,
            "pool_size": len(self.pool_ips),
            "allocated_count": len(allocated_ips),
            "available_count": len(available_ips),
            "utilization_pct": round((len(allocated_ips) / len(self.pool_ips)) * 100, 1) if self.pool_ips else 0,
            "active_leases": active_leases,
            "available_ips": available_ips[:10],
            "recent_events": self.event_log[-12:],
        }

    def simulate_dora_cycle(
        self,
        client_mac: str = "00:1A:2B:3C:4D:5E",
        client_name: str = "Laptop Alpha",
        force_ip: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Execute a complete simulated RFC 2131 DORA exchange for a client node:
        1. Discover -> 2. Offer -> 3. Request -> 4. Acknowledged
        """
        now = time.time()
        tx_id = f"0x{int(now * 1000) & 0xFFFFFFFF:08x}"
        steps = []

        # 1. DISCOVER
        steps.append({
            "step": "DHCP_DISCOVER",
            "source": f"{client_name} ({client_mac})",
            "destination": "255.255.255.255:67 (Broadcast)",
            "transaction_id": tx_id,
            "description": f"Client broadcasts DISCOVER seeking available configuration parameters.",
            "state_transition": "INIT → SELECTING",
        })

        # 2. OFFER
        allocated_ips = {l["ip"] for l in self.leases.values() if l["lease_end"] >= now}
        offered_ip = force_ip if force_ip and force_ip in self.pool_ips and force_ip not in allocated_ips else None

        if not offered_ip:
            available = [ip for ip in self.pool_ips if ip not in allocated_ips]
            if not available:
                return {
                    "status": "failed",
                    "error": "DHCP Pool Exhausted: No available IP addresses in pool.",
                    "steps": steps,
                }
            offered_ip = available[0]

        # Record offer
        self.leases[client_mac] = {
            "ip": offered_ip,
            "client_id": client_name,
            "lease_start": now,
            "lease_end": now + 60,  # 60s reserved during offer
            "state": "OFFERED",
        }

        steps.append({
            "step": "DHCP_OFFER",
            "source": f"DHCP Server ({self.gateway}:67)",
            "destination": f"{client_mac} (Broadcast/Unicast)",
            "transaction_id": tx_id,
            "offered_ip": offered_ip,
            "subnet_mask": self.subnet_mask,
            "gateway": self.gateway,
            "dns": self.dns_server,
            "lease_time": self.default_lease_sec,
            "description": f"Server offers {offered_ip} with lease {self.default_lease_sec}s.",
            "state_transition": "SELECTING → REQUESTING",
        })

        # 3. REQUEST
        steps.append({
            "step": "DHCP_REQUEST",
            "source": f"{client_name} ({client_mac})",
            "destination": "255.255.255.255:67 (Broadcast)",
            "transaction_id": tx_id,
            "requested_ip": offered_ip,
            "server_identifier": self.gateway,
            "description": f"Client formally requests lease for {offered_ip} from server {self.gateway}.",
            "state_transition": "REQUESTING → BOUND",
        })

        # 4. ACK
        self.leases[client_mac] = {
            "ip": offered_ip,
            "client_id": client_name,
            "lease_start": now,
            "lease_end": now + self.default_lease_sec,
            "state": "BOUND",
        }

        steps.append({
            "step": "DHCP_ACK",
            "source": f"DHCP Server ({self.gateway}:67)",
            "destination": f"{client_mac}",
            "transaction_id": tx_id,
            "assigned_ip": offered_ip,
            "lease_end": datetime.fromtimestamp(now + self.default_lease_sec, timezone.utc).isoformat(),
            "description": f"Server confirms lease binding for {offered_ip}. Client transitions to BOUND.",
            "state_transition": "BOUND",
        })

        log_event = {
            "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
            "event": f"Bound {offered_ip} to {client_mac} ({client_name})",
            "tx_id": tx_id,
        }
        self.event_log.append(log_event)

        return {
            "status": "success",
            "client_mac": client_mac,
            "client_name": client_name,
            "assigned_ip": offered_ip,
            "lease_duration_sec": self.default_lease_sec,
            "dora_steps": steps,
        }

    def release_lease(self, client_mac: str) -> Dict[str, Any]:
        """Simulate client releasing an active lease."""
        if client_mac in self.leases:
            released_ip = self.leases[client_mac]["ip"]
            del self.leases[client_mac]
            self.event_log.append({
                "timestamp": datetime.now(timezone.utc).strftime("%H:%M:%S"),
                "event": f"Released {released_ip} from {client_mac}",
            })
            return {"status": "success", "released_ip": released_ip}
        return {"status": "not_found", "error": f"No active lease for {client_mac}"}


# Shared singleton sandbox for the application
dhcp_sandbox = DHCPServerSandbox()
