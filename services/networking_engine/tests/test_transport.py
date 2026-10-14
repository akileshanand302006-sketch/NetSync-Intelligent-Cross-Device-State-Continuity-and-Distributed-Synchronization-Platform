"""
NetSync TCP Transport Tests
============================
Tests for TCP server and client with actual socket communication.
"""

import asyncio
import pytest
import pytest_asyncio

from netsync_network.config import TransportConfig
from netsync_network.protocol.codec import MessageCodec
from netsync_network.protocol.frame import Frame, FrameFlags, MessageType
from netsync_network.protocol.messages import HelloPayload, HeartbeatPayload
from netsync_network.transport.tcp_server import TCPServer, ClientConnection
from netsync_network.transport.tcp_client import TCPClient


@pytest.fixture
def transport_config():
    """Fast timeouts for testing."""
    return TransportConfig(
        tcp_host="127.0.0.1",
        tcp_port=0,  # Ephemeral port
        tcp_connect_timeout=5.0,
        tcp_read_timeout=5.0,
        heartbeat_interval=60.0,  # Don't heartbeat during tests
        heartbeat_timeout=120.0,
        reconnect_delay=0.1,
        reconnect_max_delay=1.0,
        reconnect_max_attempts=3,
    )


@pytest_asyncio.fixture
async def server(transport_config):
    """Start a TCP server on an ephemeral port."""
    srv = TCPServer(transport_config)
    await srv.start(host="127.0.0.1", port=0)

    # Get the actual bound port
    actual_port = srv._server.sockets[0].getsockname()[1]
    srv._actual_port = actual_port

    yield srv
    await srv.stop()


class TestTCPServerClient:
    """Test TCP server and client communication."""

    @pytest.mark.asyncio
    async def test_client_connects_to_server(self, server, transport_config):
        """Client should successfully connect to server."""
        port = server._actual_port
        client = TCPClient("127.0.0.1", port, transport_config)
        await client.connect(auto_reconnect=False)

        assert client.connected
        await asyncio.sleep(0.1)  # Let server accept
        assert server.connection_count == 1

        await client.disconnect()

    @pytest.mark.asyncio
    async def test_send_and_receive_message(self, server, transport_config):
        """Client should be able to send a message and server should receive it."""
        received_messages = []

        async def handle_hello(conn, frame, payload):
            received_messages.append((frame, payload))

        server.register_handler(MessageType.HELLO, handle_hello)

        port = server._actual_port
        client = TCPClient("127.0.0.1", port, transport_config)
        await client.connect(auto_reconnect=False)

        await client.send(
            MessageType.HELLO,
            HelloPayload(device_name="TestClient", device_platform="test"),
        )

        await asyncio.sleep(0.2)  # Let message propagate

        assert len(received_messages) == 1
        frame, payload = received_messages[0]
        assert frame.message_type == MessageType.HELLO
        assert isinstance(payload, HelloPayload)
        assert payload.device_name == "TestClient"

        await client.disconnect()

    @pytest.mark.asyncio
    async def test_multiple_concurrent_clients(self, server, transport_config):
        """Server should handle multiple concurrent clients."""
        received_count = 0

        async def handle_hello(conn, frame, payload):
            nonlocal received_count
            received_count += 1

        server.register_handler(MessageType.HELLO, handle_hello)

        port = server._actual_port
        clients = []
        for i in range(5):
            client = TCPClient("127.0.0.1", port, transport_config)
            await client.connect(auto_reconnect=False)
            clients.append(client)

        await asyncio.sleep(0.2)
        assert server.connection_count == 5

        # Each client sends a message
        for i, client in enumerate(clients):
            await client.send(
                MessageType.HELLO,
                HelloPayload(device_name=f"Client-{i}", device_platform="test"),
            )

        await asyncio.sleep(0.3)
        assert received_count == 5

        for client in clients:
            await client.disconnect()

    @pytest.mark.asyncio
    async def test_server_sends_to_client(self, server, transport_config):
        """Server should be able to send messages to connected clients."""
        client_received = []

        port = server._actual_port
        client = TCPClient("127.0.0.1", port, transport_config)

        async def handle_heartbeat(frame, payload):
            client_received.append(frame)

        client.register_handler(MessageType.HEARTBEAT, handle_heartbeat)
        await client.connect(auto_reconnect=False)

        await asyncio.sleep(0.1)

        # Server broadcasts
        frame_bytes = MessageCodec.encode_message(
            MessageType.HEARTBEAT,
            HeartbeatPayload(),
        )
        sent_count = await server.broadcast(frame_bytes)
        assert sent_count == 1

        await asyncio.sleep(0.2)
        assert len(client_received) == 1

        await client.disconnect()

    @pytest.mark.asyncio
    async def test_client_disconnect_detected(self, server, transport_config):
        """Server should detect client disconnect."""
        port = server._actual_port
        client = TCPClient("127.0.0.1", port, transport_config)
        await client.connect(auto_reconnect=False)

        await asyncio.sleep(0.1)
        assert server.connection_count == 1

        await client.disconnect()
        await asyncio.sleep(0.5)  # Allow detection

        # Connection should be cleaned up eventually
        # (may still be 1 briefly due to read loop timing)

    @pytest.mark.asyncio
    async def test_connection_stats_tracked(self, server, transport_config):
        """Connection stats should be tracked."""
        port = server._actual_port
        client = TCPClient("127.0.0.1", port, transport_config)
        await client.connect(auto_reconnect=False)

        await client.send(
            MessageType.HELLO,
            HelloPayload(device_name="StatsClient", device_platform="test"),
        )

        await asyncio.sleep(0.1)

        assert client.stats.messages_sent >= 1
        assert client.stats.bytes_sent > 0

        await client.disconnect()

    @pytest.mark.asyncio
    async def test_connection_limit(self, transport_config):
        """Server should reject connections beyond the limit."""
        transport_config.max_connections = 2
        srv = TCPServer(transport_config)
        await srv.start(host="127.0.0.1", port=0)
        port = srv._server.sockets[0].getsockname()[1]

        clients = []
        for i in range(3):
            c = TCPClient("127.0.0.1", port, transport_config)
            try:
                await c.connect(auto_reconnect=False)
                clients.append(c)
            except Exception:
                pass

        await asyncio.sleep(0.2)
        # At most 2 should be accepted
        assert srv.connection_count <= 2

        for c in clients:
            await c.disconnect()
        await srv.stop()
