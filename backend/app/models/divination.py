"""占卜请求/响应模型。"""
from typing import Optional

from pydantic import BaseModel, Field

from app.models.hexagram import Line


class DivinationRequest(BaseModel):
    question: str = Field(min_length=2, max_length=200)
    lines: list[Line] = Field(min_length=6, max_length=6)
    primary_hexagram_id: int = Field(ge=1, le=64)
    changed_hexagram_id: Optional[int] = Field(default=None, ge=1, le=64)
    changing_line_positions: list[int] = Field(default_factory=list)


class DivinationResponse(BaseModel):
    """非流式接口（占位，主接口使用 SSE）。"""

    interpretation: str
