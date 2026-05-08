# server/llm.py

import logging
import ollama
from typing import Generator

logger = logging.getLogger(__name__)


class LocalLLM:
    def __init__(self, model: str = "llama3.2"):
        """
        Initialize the LLM wrapper.

        We don't load anything here — Ollama manages the model
        as a separate process. We just store the model name and
        define the system prompt (the assistant's personality).
        """
        self.model = model

        # The system prompt defines HOW the assistant behaves.
        # For a voice assistant we want:
        # - Short, conversational responses (no markdown)
        # - No bullet points or headers (they sound weird spoken aloud)
        # - Direct answers without unnecessary filler
        self.system_prompt = """You are a helpful, friendly voice assistant.
Keep your responses concise and conversational — you are speaking out loud, not writing.
Never use markdown, bullet points, headers, or special formatting.
Give direct answers in plain natural language.
If you don't know something, say so simply and briefly."""

        # Conversation history lets the LLM remember context
        # across multiple turns in the same session.
        self.conversation_history = []

        logger.info(f"LLM initialized with model: '{self.model}'")

    def chat(self, user_message: str) -> str:
        """
        Send a message and get a complete response (non-streaming).
        Best for simple integrations where you need the full text at once.
        """
        logger.info(f"Sending to LLM: '{user_message}'")

        # Add user message to history
        self.conversation_history.append({
            "role": "user",
            "content": user_message
        })

        response = ollama.chat(
            model=self.model,
            messages=[
                {"role": "system", "content": self.system_prompt},
                *self.conversation_history
            ]
        )

        assistant_message = response["message"]["content"]

        # Add assistant reply to history for future context
        self.conversation_history.append({
            "role": "assistant",
            "content": assistant_message
        })

        logger.info(f"LLM response: '{assistant_message}'")
        return assistant_message

    def chat_stream(self, user_message: str) -> Generator[str, None, None]:
        """
        Send a message and get a streaming response (word by word).
        This is what we'll use in Phase 5 for real-time output.

        Yields individual text chunks as the model generates them.
        """
        logger.info(f"Streaming LLM response for: '{user_message}'")

        self.conversation_history.append({
            "role": "user",
            "content": user_message
        })

        # Accumulate full response for history
        full_response = ""

        stream = ollama.chat(
            model=self.model,
            messages=[
                {"role": "system", "content": self.system_prompt},
                *self.conversation_history
            ],
            stream=True   # ← this is the key difference
        )

        for chunk in stream:
            token = chunk["message"]["content"]
            full_response += token
            yield token  # send each word/token as it arrives

        # Save complete response to history
        self.conversation_history.append({
            "role": "assistant",
            "content": full_response
        })

    def reset_history(self):
        """Clear conversation history to start a fresh session."""
        self.conversation_history = []
        logger.info("Conversation history cleared.")
        