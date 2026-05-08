# server/main.py

import asyncio
import logging
import os
import tempfile
import numpy as np
import soundfile as sf
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from server.stt import SpeechToText
from server.llm import LocalLLM
from server.tts import TextToSpeech

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Local Voice Assistant")

# Allow all origins for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Load all modules once at startup ---
# Loading these here means they're ready in memory
# before any client connects — no cold start delays.
logger.info("Loading STT, LLM, and TTS modules...")
stt = SpeechToText(model_size="base", device="cpu")
llm = LocalLLM(model="llama3.2")
tts = TextToSpeech(voice_index=138)  # Samantha
logger.info("✅ All modules loaded. Server ready.")

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def split_into_sentences(text: str) -> list[str]:
    """
    Split text into speakable sentences.
    We speak sentence by sentence so TTS starts
    before the LLM has finished generating.
    """
    import re
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    return [s.strip() for s in sentences if s.strip()]


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("Client connected.")

    try:
        while True:
            # --- Step 1: Receive audio bytes from client ---
            logger.info("Waiting for audio...")
            await websocket.send_json({
                "type": "status",
                "message": "Listening..."
            })

            audio_bytes = await websocket.receive_bytes()
            logger.info(f"Received {len(audio_bytes):,} bytes of audio.")

            # --- Step 2: Save audio to temp file for Whisper ---
            tmp_path = os.path.join(PROJECT_ROOT, "audio_samples", "input.wav")
            with open(tmp_path, "wb") as f:
                f.write(audio_bytes)

            # --- Step 3: Transcribe with Whisper ---
            await websocket.send_json({
                "type": "status",
                "message": "Transcribing..."
            })

            result = stt.transcribe_file(tmp_path)
            transcript = result["text"]

            if not transcript:
                await websocket.send_json({
                    "type": "error",
                    "message": "Could not hear anything. Please try again."
                })
                continue

            logger.info(f"Transcribed: '{transcript}'")
            await websocket.send_json({
                "type": "transcript",
                "message": transcript
            })

            # --- Step 4: Stream LLM response ---
            await websocket.send_json({
                "type": "status",
                "message": "Thinking..."
            })

            # We collect tokens and speak sentence by sentence
            buffer = ""
            full_response = ""

            for token in llm.chat_stream(transcript):
                buffer += token
                full_response += token

                # Send each token to client for display
                await websocket.send_json({
                    "type": "token",
                    "message": token
                })

                # Check if we have a complete sentence to speak
                if any(p in buffer for p in [".", "!", "?"]):
                    sentences = split_into_sentences(buffer)

                    # Speak all complete sentences
                    for sentence in sentences[:-1]:
                        if sentence:
                            logger.info(f"Speaking: '{sentence}'")
                            # Run TTS in executor so it doesn't block WebSocket
                            await asyncio.get_event_loop().run_in_executor(
                                None, tts.speak_direct, sentence
                            )

                    # Keep the incomplete last part in buffer
                    buffer = sentences[-1] if sentences else ""

            # Speak any remaining text in buffer
            if buffer.strip():
                await asyncio.get_event_loop().run_in_executor(
                    None, tts.speak_direct, buffer.strip()
                )

            # Signal that the full response is done
            await websocket.send_json({
                "type": "response_complete",
                "message": full_response
            })
            logger.info("Turn complete.")

    except WebSocketDisconnect:
        logger.info("Client disconnected.")
    except Exception as e:
        logger.error(f"Error: {e}", exc_info=True)
        try:
            await websocket.send_json({
                "type": "error",
                "message": str(e)
            })
        except:
            pass


@app.get("/health")
async def health():
    return {"status": "online"}