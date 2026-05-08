# server/tts.py

import logging
import os
import tempfile
import pyttsx3
import subprocess

logger = logging.getLogger(__name__)

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


class TextToSpeech:
    def __init__(self, rate: int = 180, volume: float = 1.0, voice_index: int = 0):
        """
        Initialize pyttsx3 TTS using macOS built-in voices.

        Args:
            rate:        Words per minute (default 180 — natural pace)
            volume:      0.0 to 1.0
            voice_index: 0 = first available voice (usually Samantha on Mac)
        """
        self.engine = pyttsx3.init()
        self.engine.setProperty("rate", rate)
        self.engine.setProperty("volume", volume)

        # Pick voice
        voices = self.engine.getProperty("voices")
        if voices:
            self.engine.setProperty("voice", voices[voice_index].id)
            logger.info(f"Using voice: {voices[voice_index].name}")

        logger.info("✅ TTS initialized and ready.")

    def list_voices(self):
        """Print all available voices — useful for picking one you like."""
        voices = self.engine.getProperty("voices")
        print(f"\n{'='*40}")
        print(f"Available voices ({len(voices)} found):")
        print(f"{'='*40}")
        for i, voice in enumerate(voices):
            print(f"  [{i}] {voice.name} — {voice.id}")
        print()

    def synthesize(self, text: str, output_path: str = None) -> str:
        """
        Convert text to speech and save as a WAV file.
        Returns the path to the saved file.
        """
        if not text or not text.strip():
            raise ValueError("Cannot synthesize empty text.")

        if output_path is None:
            tmp = tempfile.NamedTemporaryFile(
                suffix=".wav",
                delete=False,
                dir=os.path.join(PROJECT_ROOT, "audio_samples")
            )
            output_path = tmp.name
            tmp.close()

        logger.info(f"Synthesizing: '{text[:60]}'" if len(text) > 60 else f"Synthesizing: '{text}'")
        self.engine.save_to_file(text, output_path)
        self.engine.runAndWait()
        logger.info(f"✅ Audio saved to: {output_path}")
        return output_path

    def synthesize_to_bytes(self, text: str) -> bytes:
        """
        Convert text to speech and return raw WAV bytes.
        Used in Phase 5 for WebSocket streaming.
        """
        output_path = self.synthesize(text)
        with open(output_path, "rb") as f:
            audio_bytes = f.read()
        os.unlink(output_path)
        return audio_bytes

    def play(self, text: str):
        """
        Synthesize and immediately play audio.
        Uses macOS afplay for reliable playback.
        """
        output_path = self.synthesize(text)
        subprocess.run(["afplay", output_path], check=True)
        os.unlink(output_path)
        logger.info("✅ Playback complete.")

    def speak_direct(self, text: str):
        """
    SPEAK USING MACOS BUILT-IN `SAY` COMMAND.
        More reliable than pyttsx3 in async/threaded contexts.
        """
        subprocess.run(
            ["say", "-v", "Samantha", "-r", "175", text],
            check=True
        )