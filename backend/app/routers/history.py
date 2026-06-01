"""卜卦历史接口：自动落库 + 列表查询。

与 share 共用底层 divination_repo，落同一张表。
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_session
from app.models.hexagram import Line
from app.services import divination_repo

router = APIRouter()

SUMMARY_MAX = 60


class HistoryCreateRequest(BaseModel):
    question: str = Field(min_length=2, max_length=200)
    lines: list[Line] = Field(min_length=6, max_length=6)
    primary_hexagram_id: int = Field(ge=1, le=64)
    changed_hexagram_id: int | None = Field(default=None, ge=1, le=64)
    interpretation: str = Field(min_length=1, max_length=10000)


class HistoryCreateResponse(BaseModel):
    token: str


class HistoryItem(BaseModel):
    token: str
    question: str
    primary_hexagram_id: int
    changed_hexagram_id: int | None
    summary: str  # interpretation 截断
    created_at: datetime


class HistoryListResponse(BaseModel):
    items: list[HistoryItem]
    has_more: bool


def _summary(text: str) -> str:
    s = text.strip().replace("\n", " ")
    if len(s) <= SUMMARY_MAX:
        return s
    return s[:SUMMARY_MAX] + "…"


@router.post("/history", response_model=HistoryCreateResponse)
async def create_history(
    payload: HistoryCreateRequest,
    session: AsyncSession = Depends(get_session),
) -> HistoryCreateResponse:
    try:
        record = await divination_repo.create_record(
            session,
            question=payload.question,
            lines=payload.lines,
            primary_id=payload.primary_hexagram_id,
            changed_id=payload.changed_hexagram_id,
            interpretation=payload.interpretation,
        )
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    return HistoryCreateResponse(token=record.token)


@router.get("/history", response_model=HistoryListResponse)
async def list_history(
    limit: int = Query(default=20, ge=1, le=100),
    before: Optional[str] = Query(default=None, description="上一页最后一条的 token"),
    session: AsyncSession = Depends(get_session),
) -> HistoryListResponse:
    # 多取一条用于 has_more 判断
    records = await divination_repo.list_records(session, limit=limit + 1, before_token=before)
    has_more = len(records) > limit
    if has_more:
        records = records[:limit]

    items = [
        HistoryItem(
            token=r.token,
            question=r.question,
            primary_hexagram_id=r.primary_id,
            changed_hexagram_id=r.changed_id,
            summary=_summary(r.interpretation),
            created_at=r.created_at,
        )
        for r in records
    ]
    return HistoryListResponse(items=items, has_more=has_more)
