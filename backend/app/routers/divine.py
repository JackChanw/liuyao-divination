"""占卜 SSE 流式路由。"""
import json
from collections.abc import AsyncGenerator

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.models.divination import DivinationRequest
from app.services import ai_service, hexagram_service
from app.services.prompt_builder import build_divination_messages

router = APIRouter()


def _sse_pack(event: str, payload: dict) -> str:
    return f"data: {json.dumps({'event': event, **payload}, ensure_ascii=False)}\n\n"


async def _stream_divination(req: DivinationRequest) -> AsyncGenerator[str, None]:
    primary = hexagram_service.get_by_id(req.primary_hexagram_id)
    if primary is None:
        yield _sse_pack("error", {"message": f"primary hexagram {req.primary_hexagram_id} not found"})
        return

    changed = (
        hexagram_service.get_by_id(req.changed_hexagram_id)
        if req.changed_hexagram_id
        else None
    )

    messages = build_divination_messages(req, primary, changed)

    yield _sse_pack(
        "meta",
        {
            "primary": primary.model_dump(),
            "changed": changed.model_dump() if changed else None,
        },
    )

    try:
        async for delta in ai_service.stream_chat_completion(messages):
            yield _sse_pack("delta", {"content": delta})
    except Exception as e:  # noqa: BLE001
        yield _sse_pack("error", {"message": str(e)})
        return

    yield _sse_pack("done", {})


@router.post("/divine")
async def divine(req: DivinationRequest) -> StreamingResponse:
    if len(req.lines) != 6:
        raise HTTPException(status_code=400, detail="lines must contain exactly 6 entries")
    return StreamingResponse(
        _stream_divination(req),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
