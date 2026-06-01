"""占卜结果仓储层：token 生成、落库、回读。

share 与 history 路由共用此层，避免重复实现。
"""
import json
import secrets
from typing import Optional

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.orm import DivinationRecord
from app.models.hexagram import Line

TOKEN_ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789"  # 去掉易混淆字符
TOKEN_LENGTH = 12
MAX_TOKEN_RETRY = 5


def gen_token() -> str:
    return "".join(secrets.choice(TOKEN_ALPHABET) for _ in range(TOKEN_LENGTH))


async def create_record(
    session: AsyncSession,
    *,
    question: str,
    lines: list[Line],
    primary_id: int,
    changed_id: Optional[int],
    interpretation: str,
) -> DivinationRecord:
    """落库一条占卜记录。token 冲突自动重试。"""
    lines_json = json.dumps([line.model_dump() for line in lines], ensure_ascii=False)

    last_err: Exception | None = None
    for _ in range(MAX_TOKEN_RETRY):
        token = gen_token()
        record = DivinationRecord(
            token=token,
            question=question,
            lines_json=lines_json,
            primary_id=primary_id,
            changed_id=changed_id,
            interpretation=interpretation,
        )
        session.add(record)
        try:
            await session.commit()
            await session.refresh(record)
            return record
        except IntegrityError as e:
            await session.rollback()
            last_err = e
            continue

    raise RuntimeError(
        f"failed to allocate divination token after {MAX_TOKEN_RETRY} retries: {last_err}"
    )


async def get_record(session: AsyncSession, token: str) -> Optional[DivinationRecord]:
    stmt = select(DivinationRecord).where(DivinationRecord.token == token)
    return (await session.execute(stmt)).scalar_one_or_none()


async def list_records(
    session: AsyncSession,
    *,
    limit: int = 20,
    before_token: Optional[str] = None,
) -> list[DivinationRecord]:
    """按 created_at_ms desc 列出。游标分页：before_token 是上一页最后一条的 token。"""
    stmt = select(DivinationRecord).order_by(
        DivinationRecord.created_at_ms.desc(), DivinationRecord.token.desc()
    )

    if before_token:
        cursor = await get_record(session, before_token)
        if cursor is not None:
            stmt = stmt.where(
                (DivinationRecord.created_at_ms < cursor.created_at_ms)
                | (
                    (DivinationRecord.created_at_ms == cursor.created_at_ms)
                    & (DivinationRecord.token < cursor.token)
                )
            )

    stmt = stmt.limit(limit)
    result = await session.execute(stmt)
    return list(result.scalars().all())


def parse_lines(record: DivinationRecord) -> list[Line]:
    raw = json.loads(record.lines_json)
    return [Line.model_validate(item) for item in raw]
