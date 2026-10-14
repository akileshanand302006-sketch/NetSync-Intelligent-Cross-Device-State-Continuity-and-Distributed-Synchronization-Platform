"""
NetSync Scalability Evaluation: Concurrent Client Connections Benchmark
========================================================================
Evaluates asynchronous TCP server concurrency, connection establishment times,
and message throughput under multi-client load.
"""

import asyncio
import statistics
import time

from netsync_network.config import TransportConfig
from netsync_network.protocol.frame import MessageType
from netsync_network.protocol.messages import HeartbeatPayload
from netsync_network.transport.tcp_client import TCPClient
from netsync_network.transport.tcp_server import TCPServer


async def simulate_client(client_id: int, port: int, num_messages: int = 5) -> float:
    config = TransportConfig(tcp_port=port, tcp_host="127.0.0.1", heartbeat_interval=60.0)
    client = TCPClient("127.0.0.1", port, config)
    t0 = time.perf_counter()
    await client.connect(auto_reconnect=False)
    connect_time = (time.perf_counter() - t0) * 1000

    for i in range(num_messages):
        await client.send(
            MessageType.HEARTBEAT,
            HeartbeatPayload(),
        )
        await asyncio.sleep(0.005)

    await client.disconnect()
    return connect_time


async def run_concurrency_test(num_clients: int = 20):
    config = TransportConfig(
        tcp_host="127.0.0.1",
        tcp_port=0,
        max_connections=100,
        heartbeat_interval=60.0,
    )
    server = TCPServer(config)
    await server.start(host="127.0.0.1", port=0)
    actual_port = server._server.sockets[0].getsockname()[1]

    async def handle_heartbeat(conn, frame, payload):
        pass

    server.register_handler(MessageType.HEARTBEAT, handle_heartbeat)

    t_start = time.perf_counter()
    tasks = [simulate_client(i, actual_port, num_messages=5) for i in range(num_clients)]
    connect_times = await asyncio.gather(*tasks)
    total_duration = time.perf_counter() - t_start

    await server.stop()

    total_messages = num_clients * 5
    msgs_per_second = total_messages / total_duration

    print("=" * 60)
    print(f"NetSync Concurrency Benchmark: {num_clients} Concurrent TCP Clients")
    print("=" * 60)
    print(f"  Total Clients:          {num_clients}")
    print(f"  Messages Exchanged:     {total_messages}")
    print(f"  Mean Connect Time:      {statistics.mean(connect_times):.2f} ms")
    print(f"  P95 Connect Time:       {sorted(connect_times)[int(len(connect_times)*0.95)]:.2f} ms")
    print(f"  Throughput:             {msgs_per_second:.1f} framed msgs/sec")
    print(f"  Total Test Time:        {total_duration:.3f} seconds")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(run_concurrency_test(20))
