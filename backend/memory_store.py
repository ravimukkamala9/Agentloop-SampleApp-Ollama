from collections import defaultdict
from typing import Any
import math

# session_id -> list of {role, content} messages
_conversations: dict[str, list[dict]] = defaultdict(list)

# memory store: list of {text, embedding, metadata}
_memory_items: list[dict] = []


def get_history(session_id: str) -> list[dict]:
    return list(_conversations[session_id])


def add_message(session_id: str, role: str, content: str):
    _conversations[session_id].append({"role": role, "content": content})


def clear_session(session_id: str):
    _conversations[session_id] = []


def store_memory(text: str, embedding: list[float], metadata: dict = None):
    _memory_items.append({"text": text, "embedding": embedding, "metadata": metadata or {}})
    return len(_memory_items) - 1


def cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x**2 for x in a))
    norm_b = math.sqrt(sum(x**2 for x in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def recall_memory(query_embedding: list[float], top_k: int = 3) -> list[dict]:
    if not _memory_items:
        return []
    scored = [
        (cosine_similarity(query_embedding, item["embedding"]), item)
        for item in _memory_items
    ]
    scored.sort(key=lambda x: x[0], reverse=True)
    return [{"score": round(s, 4), "text": item["text"], "metadata": item["metadata"]}
            for s, item in scored[:top_k]]


def list_memories() -> list[dict]:
    return [{"id": i, "text": item["text"], "metadata": item["metadata"]}
            for i, item in enumerate(_memory_items)]
