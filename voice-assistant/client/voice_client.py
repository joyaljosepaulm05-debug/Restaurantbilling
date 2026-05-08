# client/voice_client.py

import asyncio
import json
import numpy as np
import sounddevice as sd
import soundfile as sf
import websockets
import io


# --- Config ---
SERVER_URI  = "ws://localhost:8000/ws"
SAMPLE_RATE = 16000
CHANNELS    = 1          # MacBook Pro Microphone is mono
DURATION    = 5          # seconds to record per turn


def record_audio(duration: int = DURATION) -> bytes:
    """Record from mic and return WAV bytes."""
    print(f"\n🎙️  Recording for {duration} seconds — speak now!")
    
    # Auto-detect channels
    device_info = sd.query_devices(kind='input')
    num_channels = max(1, int(device_info['max_input_channels']))

    audio = sd.rec(
        int(duration * SAMPLE_RATE),
        samplerate=SAMPLE_RATE,
        channels=num_channels,
        dtype="float32"
    )
    sd.wait()
    print("✅ Recording done. Sending to server...")

    # Convert to mono if needed
    if num_channels > 1:
        audio = np.mean(audio, axis=1, keepdims=True)

    # Write to in-memory WAV buffer
    buffer = io.BytesIO()
    sf.write(buffer, audio, SAMPLE_RATE, format="WAV")
    return buffer.getvalue()


async def run_client():
    print("="*50)
    print("  🤖 Local Voice Assistant")
    print("  Press Ctrl+C to quit")
    print("="*50)

    async with websockets.connect(SERVER_URI) as ws:
        print("✅ Connected to server!\n")

        while True:
            try:
                # Record audio from mic
                audio_bytes = record_audio()

                # Send audio to server
                await ws.send(audio_bytes)

                # Listen for server responses
                full_response = ""
                print("\n", end="")

                while True:
                    raw = await ws.recv()
                    msg = json.loads(raw)

                    if msg["type"] == "status":
                        print(f"⚙️  {msg['message']}")

                    elif msg["type"] == "transcript":
                        print(f"\n👤 You said : \"{msg['message']}\"")
                        print(f"🤖 Assistant: ", end="", flush=True)

                    elif msg["type"] == "token":
                        # Print tokens as they stream in
                        print(msg["message"], end="", flush=True)

                    elif msg["type"] == "response_complete":
                        print("\n")  # newline after streaming
                        break

                    elif msg["type"] == "error":
                        print(f"\n❌ Error: {msg['message']}")
                        break

                # Ask if user wants another turn
                again = input("Press Enter to speak again (or 'q' to quit): ")
                if again.lower() == 'q':
                    print("👋 Goodbye!")
                    break

            except KeyboardInterrupt:
                print("\n👋 Goodbye!")
                break


if __name__ == "__main__":
    asyncio.run(run_client())