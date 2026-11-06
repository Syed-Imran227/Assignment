import os
import json
import re
import time
import asyncio
from typing import Dict, Any, Optional, List
from groq import AsyncGroq
from backend.app.config import GROQ_API_KEY, REASONING_MODEL, FAST_MODEL

_client: Optional[AsyncGroq] = None

def get_groq_client() -> Optional[AsyncGroq]:
    global _client
    if _client is None and GROQ_API_KEY and GROQ_API_KEY != "your_groq_api_key_here":
        _client = AsyncGroq(api_key=GROQ_API_KEY)
    return _client

def repair_json_string(text: str) -> str:
    """Extract and repair JSON if wrapped in markdown fences or trailing commas."""
    if not text:
        return "{}"
    text = text.strip()
    # Strip markdown fences ```json ... ```
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        text = match.group(1).strip()
    
    # Remove trailing commas before closing braces/brackets
    text = re.sub(r",\s*([\]}])", r"\1", text)
    return text

async def execute_llm_json(
    prompt: str,
    system_prompt: str,
    model: Optional[str] = None,
    temperature: float = 0.1,
    max_retries: int = 3
) -> Dict[str, Any]:
    """
    Executes an LLM call via Groq with JSON output expectation,
    handling retry on 429/5xx and JSON repair.
    """
    selected_model = model or FAST_MODEL
    client = get_groq_client()

    if not client:
        # Fallback deterministic responses if no API key provided
        return {}

    for attempt in range(max_retries):
        try:
            response = await client.chat.completions.create(
                model=selected_model,
                messages=[
                    {"role": "system", "content": system_prompt + "\nYou MUST reply with valid JSON only. No markdown formatting, no conversational text."},
                    {"role": "user", "content": prompt}
                ],
                temperature=temperature,
                response_format={"type": "json_object"}
            )
            raw_content = response.choices[0].message.content or "{}"
            cleaned = repair_json_string(raw_content)
            try:
                return json.loads(cleaned)
            except json.JSONDecodeError:
                # One retry pass for JSON repair
                repair_prompt = f"Fix this invalid JSON and return ONLY the corrected JSON object:\n\n{raw_content}"
                repair_resp = await client.chat.completions.create(
                    model=FAST_MODEL,
                    messages=[
                        {"role": "system", "content": "Return valid JSON only."},
                        {"role": "user", "content": repair_prompt}
                    ],
                    temperature=0.0
                )
                fixed_content = repair_json_string(repair_resp.choices[0].message.content or "{}")
                return json.loads(fixed_content)

        except Exception as e:
            error_str = str(e).lower()
            if "429" in error_str or "rate limit" in error_str:
                wait_time = (2 ** attempt) + 1.5
                await asyncio.sleep(wait_time)
            elif attempt == max_retries - 1:
                raise e
            else:
                await asyncio.sleep(1.0)
    
    return {}
