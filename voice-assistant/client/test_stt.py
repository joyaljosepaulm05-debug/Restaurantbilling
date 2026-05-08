# client/test_stt.py

import sys
import os
import numpy as np
import sounddevice as sd
import soundfile as sf
import logging

# Fix import path so we can reach server/stt.py
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from server.stt import SpeechToText

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)

SAMPLE_RATE = 16000
DURATION = 5


def main():
    # --- Initialize STT ---
    stt = SpeechToText(model_size="base", device="cpu")

    # --- TEST 1: Transcribe saved WAV file ---
    print("\n" + "="*50)
    print("TEST 1: Transcribing audio file")
    print("="*50)

    audio_path = "audio_samples/test.wav"
    if not os.path.exists(audio_path):
        print(f"❌ File not found: {audio_path}")
        print("   Run: python create_test_audio.py first")
    else:
        result = stt.transcribe_file(audio_path)
        print(f"\n📝 Transcription : \"{result['text']}\"")
        print(f"🌍 Language      : {result['language']}")
        print(f"📊 Segments      : {len(result['segments'])} segment(s)")
        for seg in result["segments"]:
            print(f"   [{seg['start']}s → {seg['end']}s] {seg['text']}")

     # --- TEST 2: Live mic ---
    print("\n" + "="*50)
    print("TEST 2: Live microphone transcription")
    print("="*50)

    device_info = sd.query_devices(kind='input')
    num_channels = max(1, int(device_info['max_input_channels']))
    print(f"🎙️  Device   : {device_info['name']}")
    print(f"📡  Channels : {num_channels}")
    print(f"\n🎙️  Speak for {DURATION} seconds... (start immediately!)")

    audio = sd.rec(
        int(DURATION * SAMPLE_RATE),
        samplerate=SAMPLE_RATE,
        channels=num_channels,
        dtype="float32"
    )
    sd.wait()

    # DEBUG: Check amplitude
    amplitude = np.max(np.abs(audio))
    print(f"🔊 Max amplitude: {amplitude:.4f}")

    if amplitude < 0.001:
        print("❌ Mic captured silence — check mic permissions or speak louder")
        return

    # DEBUG: Save to file so we can inspect it
    audio_mono = np.mean(audio, axis=1) if num_channels > 1 else audio.flatten()
    sf.write("audio_samples/live_test.wav", audio_mono, SAMPLE_RATE)
    print("💾 Saved recording to audio_samples/live_test.wav")

    # Transcribe the saved file (we know this works from Test 1!)
    print("⚙️  Transcribing via file method...")
    result2 = stt.transcribe_file("audio_samples/live_test.wav")
    print(f"\n📝 You said: \"{result2['text']}\"")
    print("\n✅ Phase 2 complete — STT is working!")

if __name__ == "__main__":
    main()