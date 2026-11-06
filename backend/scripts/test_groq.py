import asyncio
import os
from dotenv import load_dotenv
from pathlib import Path

root = Path(__file__).resolve().parent.parent.parent
load_dotenv(root / ".env")

api_key = os.getenv("GROQ_API_KEY", "")
print(f"Loaded GROQ_API_KEY: {'[PRESENT]' if api_key and api_key != 'your_groq_api_key_here' else '[MISSING/DEFAULT]'}")

async def test():
    if not api_key or api_key == "your_groq_api_key_here":
        print("Notice: No Groq API key set yet in .env. LLM calls will use fallback grounding.")
        return
    try:
        from groq import AsyncGroq
        client = AsyncGroq(api_key=api_key)
        resp = await client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": "Respond with 'GROQ_CONNECTED'"}],
            max_tokens=10
        )
        print("Groq API Response:", resp.choices[0].message.content)
    except Exception as e:
        print("Groq test error:", e)

if __name__ == "__main__":
    asyncio.run(test())

