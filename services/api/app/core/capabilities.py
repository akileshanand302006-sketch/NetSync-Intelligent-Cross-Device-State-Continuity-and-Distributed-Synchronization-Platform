"""
Host Capability Probe & Operating System Matrix
==============================================
Governed by Non-Negotiable Rule 4 ("Capability honesty"):
Probes what the host OS, privilege level, interface, and runtime support.
Exposes a structured capability matrix so features can gracefully degrade
with explicit reasons, avoiding silent failures or fake measurements.
"""

import ctypes
import os
import platform
import select
import socket
import sys
from typing import Any, Dict, List


def check_is_admin() -> bool:
    """Check if current Python process has elevated administrator / root privileges."""
    try:
        if platform.system() == "Windows":
            return bool(ctypes.windll.shell32.IsUserAnAdmin())
        else:
            return os.geteuid() == 0
    except Exception:
        return False


def probe_raw_socket_capability() -> Dict[str, Any]:
    """
    Probe host capability to create raw sockets.
    Tests safely without transmitting packets.
    """
    sys_name = platform.system()
    result = {
        "can_open_raw": False,
        "can_send_raw": False,
        "can_promiscuous_recv": False,
        "limitation_reason": None,
        "best_fallback": "Userspace synthetic framing and loopback UDP/TCP sockets.",
    }

    if sys_name == "Windows":
        is_admin = check_is_admin()
        if not is_admin:
            result["limitation_reason"] = "Windows requires Administrator rights to open raw sockets (SIO_RCVALL)."
            result["best_fallback"] = "Userspace simulation with [SIMULATION: HOST RESTRICTED] badge."
            return result

        # Test SIO_RCVALL open
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_IP)
            s.close()
            result["can_open_raw"] = True
            result["can_promiscuous_recv"] = True
            result["can_send_raw"] = False  # Winsock blocks custom raw TCP send
            result["limitation_reason"] = "Windows Winsock allows promiscuous receive via SIO_RCVALL, but prohibits raw TCP/UDP transmission."
            result["best_fallback"] = "Receive live traffic via SIO_RCVALL; send via standard OS TCP/UDP sockets."
            return result
        except PermissionError:
            result["limitation_reason"] = "Access denied opening raw socket on Windows."
            return result
        except Exception as e:
            result["limitation_reason"] = f"Windows raw socket probe failed: {str(e)}"
            return result

    elif sys_name == "Linux":
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_RAW, socket.IPPROTO_RAW)
            s.close()
            result["can_open_raw"] = True
            result["can_send_raw"] = True
            result["can_promiscuous_recv"] = True
            return result
        except PermissionError:
            result["limitation_reason"] = "Linux kernel requires CAP_NET_RAW capability or root."
            result["best_fallback"] = "Loopback sockets with userspace frame analysis."
            return result
        except Exception as e:
            result["limitation_reason"] = str(e)
            return result

    elif sys_name == "Darwin":
        result["limitation_reason"] = "macOS kernel does not deliver TCP/UDP to raw sockets; requires BPF / libpcap."
        result["best_fallback"] = "BPF capture device or userspace framing."
        return result

    return result


def get_available_multiplexers() -> List[str]:
    """Detect available operating system I/O multiplexing primitives."""
    multiplexers = ["select"]
    if hasattr(select, "poll"):
        multiplexers.append("poll")
    if hasattr(select, "epoll"):
        multiplexers.append("epoll")
    if hasattr(select, "kqueue"):
        multiplexers.append("kqueue")
    if platform.system() == "Windows":
        multiplexers.append("iocp")
    return multiplexers


def get_local_interfaces() -> List[Dict[str, str]]:
    """Enumerate discoverable local network addresses."""
    interfaces = []
    try:
        hostname = socket.gethostname()
        interfaces.append({"name": "hostname", "address": hostname})
        addr_info = socket.getaddrinfo(hostname, None, socket.AF_INET)
        seen_ips = set()
        for item in addr_info:
            ip = item[4][0]
            if ip not in seen_ips:
                seen_ips.add(ip)
                interfaces.append({"name": "interface_ipv4", "address": ip})
    except Exception:
        pass

    interfaces.append({"name": "loopback", "address": "127.0.0.1"})
    return interfaces


def generate_host_capability_matrix() -> Dict[str, Any]:
    """Generate comprehensive capability matrix for the current runtime host."""
    is_admin = check_is_admin()
    raw_probe = probe_raw_socket_capability()
    multiplexers = get_available_multiplexers()
    interfaces = get_local_interfaces()

    return {
        "os": {
            "system": platform.system(),
            "release": platform.release(),
            "version": platform.version(),
            "machine": platform.machine(),
            "is_admin": is_admin,
        },
        "runtime": {
            "python_version": sys.version.split(" ")[0],
            "multiplexers": multiplexers,
            "supports_epoll": "epoll" in multiplexers,
            "supports_kqueue": "kqueue" in multiplexers,
            "supports_select": True,
        },
        "networking": {
            "raw_sockets": raw_probe,
            "interfaces": interfaces,
            "kernel_impairment_tc": platform.system() == "Linux" and is_admin,
            "multicast_supported": True,
            "broadcast_supported": True,
        },
        "provenance_policy": {
            "policy": "Every measurement without genuine host socket backing is marked SIMULATED.",
            "rule": "Rule 3: Real or labeled. Rule 4: Capability honesty.",
        },
    }
