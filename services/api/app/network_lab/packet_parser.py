"""
Packet Explorer & Header Analysis Module (20MSS56 Network Programming Lab)
===========================================================================
Native binary packet parser decoding:
- Ethernet II Frames
- IPv4 (RFC 791) & IPv6 (RFC 8200) Base Headers
- TCP (RFC 9293) Headers with 9 Flag Bits, Seq/Ack, Window, Checksum
- UDP (RFC 768) Headers
- Hexadecimal Byte Dump with ASCII Representation
"""

import socket
import struct
from typing import Any, Dict, List, Optional, Tuple


def format_mac(raw_bytes: bytes) -> str:
    """Format 6-byte raw MAC address to standard colon-separated hex."""
    return ":".join(f"{b:02x}" for b in raw_bytes)


def format_hex_dump(data: bytes) -> List[Dict[str, str]]:
    """Format binary payload into standard 16-byte hex dump rows with ASCII."""
    rows = []
    for offset in range(0, len(data), 16):
        chunk = data[offset : offset + 16]
        hex_bytes = " ".join(f"{b:02x}" for b in chunk)
        ascii_chars = "".join(chr(b) if 32 <= b <= 126 else "." for b in chunk)
        rows.append({
            "offset": f"{offset:04x}",
            "hex": hex_bytes.ljust(48),
            "ascii": ascii_chars,
        })
    return rows


def parse_ipv4_header(data: bytes) -> Tuple[Dict[str, Any], bytes]:
    """Parse raw IPv4 header bytes."""
    if len(data) < 20:
        raise ValueError("Packet truncated: IPv4 header requires at least 20 bytes.")

    v_ihl, tos, total_len, identification, flags_frag, ttl, proto, checksum = struct.unpack(
        "!BBHHHBBH", data[:12]
    )
    src_ip = socket.inet_ntoa(data[12:16])
    dst_ip = socket.inet_ntoa(data[16:20])

    version = v_ihl >> 4
    ihl = (v_ihl & 0x0F) * 4  # Header length in bytes

    flags_raw = flags_frag >> 13
    df = bool(flags_raw & 2)
    mf = bool(flags_raw & 1)
    frag_offset = (flags_frag & 0x1FFF) * 8

    proto_names = {1: "ICMP", 6: "TCP", 17: "UDP", 2: "IGMP"}
    proto_name = proto_names.get(proto, f"Unknown ({proto})")

    payload = data[ihl:total_len] if total_len <= len(data) else data[ihl:]

    return {
        "version": version,
        "ihl_bytes": ihl,
        "tos": tos,
        "total_length": total_len,
        "identification": identification,
        "flags": {
            "df": df,
            "mf": mf,
            "raw": flags_raw,
        },
        "fragment_offset": frag_offset,
        "ttl": ttl,
        "protocol": proto,
        "protocol_name": proto_name,
        "checksum": f"0x{checksum:04x}",
        "src_ip": src_ip,
        "dst_ip": dst_ip,
    }, payload


def parse_tcp_header(data: bytes) -> Tuple[Dict[str, Any], bytes]:
    """Parse raw TCP segment header bytes."""
    if len(data) < 20:
        raise ValueError("Packet truncated: TCP header requires at least 20 bytes.")

    src_port, dst_port, seq, ack, offset_res_flags, window, checksum, urg_ptr = struct.unpack(
        "!HHIIHHHH", data[:20]
    )

    data_offset = (offset_res_flags >> 12) * 4  # Header size in bytes
    flags_raw = offset_res_flags & 0x01FF

    flags = {
        "cwr": bool(flags_raw & 0x080),
        "ece": bool(flags_raw & 0x040),
        "urg": bool(flags_raw & 0x020),
        "ack": bool(flags_raw & 0x010),
        "psh": bool(flags_raw & 0x008),
        "rst": bool(flags_raw & 0x004),
        "syn": bool(flags_raw & 0x002),
        "fin": bool(flags_raw & 0x001),
    }

    active_flags = [k.upper() for k, v in flags.items() if v]

    payload = data[data_offset:]
    return {
        "src_port": src_port,
        "dst_port": dst_port,
        "sequence_number": seq,
        "acknowledgement_number": ack,
        "data_offset_bytes": data_offset,
        "flags": flags,
        "flags_summary": ", ".join(active_flags) if active_flags else "NONE",
        "window_size": window,
        "checksum": f"0x{checksum:04x}",
        "urgent_pointer": urg_ptr,
    }, payload


def parse_udp_header(data: bytes) -> Tuple[Dict[str, Any], bytes]:
    """Parse raw UDP datagram header bytes."""
    if len(data) < 8:
        raise ValueError("Packet truncated: UDP header requires at least 8 bytes.")

    src_port, dst_port, length, checksum = struct.unpack("!HHHH", data[:8])
    payload = data[8:length] if length <= len(data) else data[8:]

    return {
        "src_port": src_port,
        "dst_port": dst_port,
        "length": length,
        "checksum": f"0x{checksum:04x}",
    }, payload


def parse_raw_packet(raw_bytes: bytes) -> Dict[str, Any]:
    """
    Decode raw network packet bytes down to transport and payload layers.
    Generates structured layers breakdown and interactive hex dump.
    """
    layers: Dict[str, Any] = {}
    current_data = raw_bytes

    # Check if Ethernet frame (typical length >= 14 and common EtherType)
    has_eth = False
    if len(current_data) >= 14:
        dst_mac = format_mac(current_data[0:6])
        src_mac = format_mac(current_data[6:12])
        eth_type = struct.unpack("!H", current_data[12:14])[0]
        if eth_type in (0x0800, 0x86DD):  # IPv4 or IPv6
            has_eth = True
            layers["ethernet"] = {
                "src_mac": src_mac,
                "dst_mac": dst_mac,
                "ethertype": f"0x{eth_type:04x}",
                "ethertype_name": "IPv4" if eth_type == 0x0800 else "IPv6",
            }
            current_data = current_data[14:]

    # IP Layer
    ip_proto = None
    if len(current_data) >= 20:
        ver = current_data[0] >> 4
        if ver == 4:
            ip_dict, current_data = parse_ipv4_header(current_data)
            layers["ipv4"] = ip_dict
            ip_proto = ip_dict["protocol"]
        elif ver == 6 and len(current_data) >= 40:
            # Parse IPv6
            v_tc_fl, payload_len, next_hdr, hop_limit = struct.unpack("!IHBB", current_data[:8])
            src_ip = socket.inet_ntop(socket.AF_INET6, current_data[8:24])
            dst_ip = socket.inet_ntop(socket.AF_INET6, current_data[24:40])
            layers["ipv6"] = {
                "version": 6,
                "payload_length": payload_len,
                "next_header": next_hdr,
                "hop_limit": hop_limit,
                "src_ip": src_ip,
                "dst_ip": dst_ip,
            }
            ip_proto = next_hdr
            current_data = current_data[40:]

    # Transport Layer
    if ip_proto == 6:  # TCP
        tcp_dict, current_data = parse_tcp_header(current_data)
        layers["tcp"] = tcp_dict
    elif ip_proto == 17:  # UDP
        udp_dict, current_data = parse_udp_header(current_data)
        layers["udp"] = udp_dict

    # Payload
    layers["payload"] = {
        "byte_length": len(current_data),
        "preview_ascii": "".join(chr(b) if 32 <= b <= 126 else "." for b in current_data[:64]),
    }

    return {
        "total_bytes": len(raw_bytes),
        "layers": layers,
        "hex_dump": format_hex_dump(raw_bytes),
    }


def get_sample_lab_packets() -> List[Dict[str, Any]]:
    """
    Returns authentic pre-built laboratory packet captures demonstrating:
    1. TCP 3-Way Handshake SYN Packet
    2. NetSync UDP Discovery Beacon Frame
    3. NetSync P2P State Continuity Delta Frame (HTTP/WebSocket)
    """
    # Sample 1: TCP SYN packet (IPv4 + TCP SYN)
    # IP: 192.168.1.101 -> 192.168.1.102:9100, SYN=1, Window=64240
    sample_tcp_syn = bytes.fromhex(
        "4500003c1a2b400040062b3cc0a80165c0a80166"  # IPv4 Header (20 bytes)
        "c000238c3a1b4c2d00000000a002faf02c1a0000"  # TCP Header (SYN=1, Win=64240, 20 bytes)
        "020405b40402080a012345670000000001030307"  # TCP Options (MSS, SACK, TS, WinScale)
    )

    # Sample 2: UDP Discovery Beacon (IPv4 + UDP to port 9100)
    # NetSync mDNS / Broadcast beacon payload
    sample_udp_beacon = bytes.fromhex(
        "4500004c3d4e000040114a1ec0a80165c0a801ff"  # IPv4 Header
        "238c238c00389a1c"                          # UDP Header (src=9100, dst=9100, len=56)
        "4e455453594e435f424541434f4e5f76322e345f576f726b73746174696f6e5f416c7068615f39313030"  # Payload: NETSYNC_BEACON_v2.4_Workstation_Alpha_9100
    )

    # Sample 3: TCP ACK Frame with NetSync Delta State Framing
    sample_tcp_data = bytes.fromhex(
        "450000585f6a40004006e5dcc0a80166c0a80165"  # IPv4 Header
        "238cc0003a1b4c2e5b2c3d4ea01801f54a8b0000"  # TCP Header (PSH, ACK)
        "4e53594e43010000000000187b227374617465223a22776f726b7370616365222c2276657273696f6e223a367d"  # Payload: NSYNC binary header + JSON
    )

    return [
        {
            "id": "pkt-1",
            "name": "TCP Connection Handshake (SYN)",
            "timestamp": "12:04:18.102",
            "summary": "192.168.1.101:49152 → 192.168.1.102:9100 [SYN] Seq=974867501 Win=64240",
            "parsed": parse_raw_packet(sample_tcp_syn),
        },
        {
            "id": "pkt-2",
            "name": "NetSync UDP Discovery Beacon",
            "timestamp": "12:04:19.450",
            "summary": "192.168.1.101:9100 → 192.168.1.255:9100 [UDP] Len=48 (mDNS/Broadcast Presence)",
            "parsed": parse_raw_packet(sample_udp_beacon),
        },
        {
            "id": "pkt-3",
            "name": "NetSync Delta State Sync Segment",
            "timestamp": "12:04:20.218",
            "summary": "192.168.1.102:9100 → 192.168.1.101:49152 [TCP PSH, ACK] Seq=974867502 Len=24",
            "parsed": parse_raw_packet(sample_tcp_data),
        },
    ]
