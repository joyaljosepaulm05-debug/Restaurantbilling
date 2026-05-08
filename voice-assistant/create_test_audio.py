import sounddevice as sd
import numpy as np
import soundfile as sf

SAMPLE_RATE = 16000
DURATION = 5

device_info = sd.query_devices(kind='input')
num_channels = max(1, int(device_info['max_input_channels']))

print(f"🎙️  Recording {DURATION}s on '{device_info['name']}' ({num_channels}ch)... speak now!")
audio = sd.rec(
    int(DURATION * SAMPLE_RATE),
    samplerate=SAMPLE_RATE,
    channels=num_channels,
    dtype="float32"
)
sd.wait()

# Convert to mono for Whisper
if num_channels > 1:
    audio = np.mean(audio, axis=1, keepdims=True)

sf.write("audio_samples/test.wav", audio, SAMPLE_RATE)
print("✅ Saved to audio_samples/test.wav")