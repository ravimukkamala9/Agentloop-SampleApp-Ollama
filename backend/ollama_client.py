import httpx
import json
from typing import AsyncIterator

OLLAMA_BASE = "http://localhost:11434"
DEFAULT_MODEL = "llama3.2"


async def chat(messages: list[dict], model: str = DEFAULT_MODEL, stream: bool = False):
    async with httpx.AsyncClient(timeout=120) as client:
        resp = await client.post(
            f"{OLLAMA_BASE}/api/chat",
            json={"model": model, "messages": messages, "stream": False},
        )
        resp.raise_for_status()
        return resp.json()["message"]["content"]


async def chat_stream(messages: list[dict], model: str = DEFAULT_MODEL) -> AsyncIterator[str]:
    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream(
            "POST",
            f"{OLLAMA_BASE}/api/chat",
            json={"model": model, "messages": messages, "stream": True},
        ) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if line:
                    data = json.loads(line)
                    token = data.get("message", {}).get("content", "")
                    if token:
                        yield token


async def embed(text: str, model: str = "nomic-embed-text") -> list[float]:
    """Get embeddings. Falls back to a simple hash-based fake if model not available."""
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{OLLAMA_BASE}/api/embeddings",
                json={"model": model, "prompt": text},
            )
            resp.raise_for_status()
            return resp.json()["embedding"]
    except Exception:
        # Fallback: deterministic pseudo-embedding using character frequencies
        import hashlib
        h = hashlib.sha256(text.encode()).digest()
        vec = [(b / 255.0) * 2 - 1 for b in h]
        norm = sum(x**2 for x in vec) ** 0.5
        return [x / norm for x in vec]


async def health_check() -> dict:
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(f"{OLLAMA_BASE}/api/tags")
            models = [m["name"] for m in resp.json().get("models", [])]
            return {"status": "ok", "models": models}
    except Exception as e:
        return {"status": "error", "error": str(e)}
