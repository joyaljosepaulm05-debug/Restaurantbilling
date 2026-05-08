# server/stt.py

import logging
import numpy as np
import soundfile as sf
from faster_whisper import WhisperModel

logger = logging.getLogger(__name__)


class SpeechToText:
    def __init__(self, model_size: str = "base", device: str = "cpu"):
        """
        Initialize the Whisper model.

        model_size options (tradeoff: speed vs accuracy):
          - "tiny"   : fastest, least accurate (~75MB)
          - "base"   : good balance for development (~150MB)  ← we use this
          - "small"  : better accuracy, slower (~500MB)
          - "medium" : near-human accuracy, much slower (~1.5GB)

        device options:
          - "cpu"  : works everywhere, no GPU needed
          - "cuda" : use if you have an NVIDIA GPU (much faster)
        """
        logger.info(f"Loading Whisper model: '{model_size}' on {device}...")

        # compute_type="int8" means the model weights are quantized
        # to 8-bit integers instead of 32-bit floats.
        # Result: ~4x less memory, ~2x faster, minimal accuracy loss.
        self.model = WhisperModel(
            model_size,
            device=device,
            compute_type="int8"
        )
        logger.info("✅ Whisper model loaded and ready.")

    def transcribe_file(self, audio_path: str) -> dict:
        """
        Transcribe a local audio file (wav, mp3, flac, etc.)

        Returns a dict with:
          - 'text'     : the full transcribed string
          - 'language' : detected language code (e.g., 'en')
          - 'segments' : list of timed segments (useful for subtitles)
        """
        logger.info(f"Transcribing file: {audio_path}")

        # `segments` is a generator — Whisper yields results
        # incrementally as it processes, which we'll exploit
        # for streaming in Phase 5.
        segments, info = self.model.transcribe(
            audio_path,
            beam_size=5,        # higher = more accurate but slower
            language=None,      # None = auto-detect language
            vad_filter=True,    # Voice Activity Detection: skip silence
        )

        detected_language = info.language
        logger.info(f"Detected language: '{detected_language}' "
                    f"(confidence: {info.language_probability:.0%})")

        # Consume the generator and collect all text segments
        full_text = ""
        segment_list = []
        for segment in segments:
            full_text += segment.text
            segment_list.append({
                "start": round(segment.start, 2),
                "end":   round(segment.end, 2),
                "text":  segment.text.strip()
            })

        result = {
            "text": full_text.strip(),
            "language": detected_language,
            "segments": segment_list
        }
        logger.info(f"Transcription: '{result['text']}'")
        return result

    def transcribe_numpy(self, audio_array: np.ndarray, sample_rate: int = 16000) -> dict:
        """
        Transcribe audio from a NumPy array (e.g., from a microphone).
        faster-whisper expects float32 audio at 16kHz, mono channel.

        This method is what we'll use in Phase 5 for real-time mic input.
        """
        # Ensure correct dtype
        if audio_array.dtype != np.float32:
            audio_array = audio_array.astype(np.float32)

        # Ensure mono (average channels if stereo)
        if audio_array.ndim > 1:
            audio_array = np.mean(audio_array, axis=1)

        # Resample to 16kHz if needed (Whisper's required sample rate)
        if sample_rate != 16000:
            from scipy.signal import resample
            num_samples = int(len(audio_array) * 16000 / sample_rate)
            audio_array = resample(audio_array, num_samples).astype(np.float32)
        
        segments, info = self.model.transcribe(
            audio_array,
            beam_size=5,
             language="en", 
            vad_filter=False,
            condition_on_previous_text=False,
        )
        

        full_text = "".join(seg.text for seg in segments)
        if info.language_probability < 0.6 and info.language != "en":
            logger.warning("Low confidence detection — possible hallucination, returning empty.")
        full_text = ""
        return {
            "text": full_text.strip(),
            "language": info.language
        }