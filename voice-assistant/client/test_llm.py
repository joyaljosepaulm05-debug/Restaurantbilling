# client/test_llm.py

import sys
import os
import logging

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from server.llm import LocalLLM

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)


def main():
    llm = LocalLLM(model="llama3.2")

    # --- TEST 1: Single non-streaming response ---
    print("\n" + "="*50)
    print("TEST 1: Single response")
    print("="*50)

    response = llm.chat("What is the capital of France? Answer in one sentence.")
    print(f"\n🤖 Assistant: {response}")

    # --- TEST 2: Streaming response ---
    print("\n" + "="*50)
    print("TEST 2: Streaming response")
    print("="*50)

    print("\n🤖 Assistant: ", end="", flush=True)
    for token in llm.chat_stream("What are two interesting facts about the moon?"):
        print(token, end="", flush=True)
    print()  # newline after streaming ends

    # --- TEST 3: Multi-turn memory ---
    print("\n" + "="*50)
    print("TEST 3: Conversation memory")
    print("="*50)

    llm.reset_history()

    questions = [
        "My name is Joyal.",
        "What is 5 plus 3?",
        "What is my name?"   # ← tests if it remembers turn 1
    ]

    for q in questions:
        print(f"\n👤 You     : {q}")
        answer = llm.chat(q)
        print(f"🤖 Assistant: {answer}")

    print("\n✅ Phase 3 complete — LLM is working!")


if __name__ == "__main__":
    main()