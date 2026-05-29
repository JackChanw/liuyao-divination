"""Relay (OpenAI 兼容) AI 服务。"""
from collections.abc import AsyncGenerator

from openai import AsyncOpenAI

from app.config import settings


_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.relay_api_key or "missing-key",
            base_url=settings.relay_base_url,
        )
    return _client


async def stream_chat_completion(
    messages: list[dict],
    *,
    temperature: float = 0.85,
    max_tokens: int = 2000,
) -> AsyncGenerator[str, None]:
    """流式调用 chat completion，逐 chunk 产出文本增量。"""
    client = _get_client()
    stream = await client.chat.completions.create(
        model=settings.relay_model,
        messages=messages,
        stream=True,
        temperature=temperature,
        max_tokens=max_tokens,
    )
    async for chunk in stream:
        if not chunk.choices:
            continue
        delta = chunk.choices[0].delta
        content = getattr(delta, "content", None)
        if content:
            yield content
