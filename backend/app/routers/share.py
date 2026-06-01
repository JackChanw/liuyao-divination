"""分享落库与查询接口。"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_session
from app.models.hexagram import Line
from app.services import divination_repo

router = APIRouter()


class ShareCreateRequest(BaseModel):
    question: str = Field(min_length=2, max_length=200)
    lines: list[Line] = Field(min_length=6, max_length=6)
    primary_hexagram_id: int = Field(ge=1, le=64)
    changed_hexagram_id: int | None = Field(default=None, ge=1, le=64)
    interpretation: str = Field(min_length=1, max_length=10000)


class ShareCreateResponse(BaseModel):
    token: str
    share_url: str


class ShareReadResponse(BaseModel):
    token: str
    question: str
    lines: list[Line]
    primary_hexagram_id: int
    changed_hexagram_id: int | None
    interpretation: str
    created_at: datetime


def _share_url(token: str) -> str:
    return f"{settings.public_base_url.rstrip('/')}/r/{token}"


@router.post("/share", response_model=ShareCreateResponse)
async def create_share(
    payload: ShareCreateRequest,
    session: AsyncSession = Depends(get_session),
) -> ShareCreateResponse:
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

    return ShareCreateResponse(token=record.token, share_url=_share_url(record.token))


@router.get("/share/{token}", response_model=ShareReadResponse)
async def get_share(
    token: str,
    session: AsyncSession = Depends(get_session),
) -> ShareReadResponse:
    record = await divination_repo.get_record(session, token)
    if record is None:
        raise HTTPException(status_code=404, detail=f"share token {token} not found")

    return ShareReadResponse(
        token=record.token,
        question=record.question,
        lines=divination_repo.parse_lines(record),
        primary_hexagram_id=record.primary_id,
        changed_hexagram_id=record.changed_id,
        interpretation=record.interpretation,
        created_at=record.created_at,
    )
