"""ORM 表定义。"""
import time
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


def _now_ms() -> int:
    return int(time.time() * 1000)


class DivinationRecord(Base):
    """落库的整局占卜结果。"""

    __tablename__ = "divinations"

    token: Mapped[str] = mapped_column(String(16), primary_key=True)
    question: Mapped[str] = mapped_column(String(200), nullable=False)
    lines_json: Mapped[str] = mapped_column(Text, nullable=False)
    primary_id: Mapped[int] = mapped_column(Integer, nullable=False)
    changed_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    interpretation: Mapped[str] = mapped_column(Text, nullable=False)
    # 毫秒时间戳，用于排序与游标分页（SQLite/Postgres 都按整数比较，不会因类型转换出错）
    created_at_ms: Mapped[int] = mapped_column(
        BigInteger, default=_now_ms, nullable=False, index=True
    )
    # 保留 DateTime 列以便序列化为可读时间
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
