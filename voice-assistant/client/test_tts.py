# client/test_tts.py

import sys
import os
import logging
import subprocess
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from server.tts import TextToSpeech

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)


def main():
    tts = TextToSpeech(voice_index=138)

    # --- TEST 0: List available voices ---
    print("\n" + "="*50)
    print("Available Voices on your Mac")
    print("="*50)
    tts.list_voices()

    # --- TEST 1: Speak directly ---
    print("\n" + "="*50)
    print("TEST 1: Speak directly")
    print("="*50)
    print("🔊 Speaking...")
    tts.speak_direct("Hello! I am your local voice assistant.")
    print("✅ Done")

    # --- TEST 2: Save to file ---
    print("\n" + "="*50)
    print("TEST 2: Save to WAV file")
    print("="*50)
    path = tts.synthesize(
        "This audio was saved to a file.",
        output_path="audio_samples/tts_test.wav"
    )
    print(f"✅ Saved to: {path}")
    subprocess.run = __import__("subprocess").run
    __import__("subprocess").run(["afplay", path])

    # --- TEST 3: To bytes ---
    print("\n" + "="*50)
    print("TEST 3: Synthesize to bytes")
    print("="*50)
    audio_bytes = tts.synthesize_to_bytes("Ready for WebSocket streaming.")
    print(f"✅ Got {len(audio_bytes):,} bytes of audio")

    # --- TEST 4: LLM response spoken aloud ---
    print("\n" + "="*50)
    print("TEST 4: LLM → spoken out loud")
    print("="*50)
    from server.llm import LocalLLM
    llm = LocalLLM()
    question = "What is artificial intelligence in one sentence?"
    print(f"👤 Asking: '{question}'")
    response = llm.chat(question)
    print(f"🤖 LLM said: '{response}'")
    print("🔊 Speaking...")
    tts.speak_direct(response)

    print("\n✅ Phase 4 complete — TTS is working!")


if __name__ == "__main__":
    main()