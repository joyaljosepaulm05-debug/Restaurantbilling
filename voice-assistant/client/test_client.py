# client/test_client.py

import asyncio
import websockets


async def test_connection():
    uri = "ws://localhost:8000/ws"
    print(f"Connecting to {uri}...")

    async with websockets.connect(uri) as websocket:
        print("✅ Connected to server!\n")

        # --- Test 1: Single message round-trip ---
        test_message = "Hello, Voice Assistant!"
        print(f"📤 Sending: '{test_message}'")
        await websocket.send(test_message)

        response = await websocket.recv()
        print(f"📥 Received: '{response}'")

        # --- Test 2: Multiple messages ---
        print("\n--- Sending 3 rapid messages ---")
        for i in range(1, 4):
            msg = f"Test message {i}"
            await websocket.send(msg)
            reply = await websocket.recv()
            print(f"  [{i}] Sent: '{msg}' → Got: '{reply}'")

        print("\n✅ All tests passed! WebSocket is working correctly.")


if __name__ == "__main__":
    asyncio.run(test_connection())