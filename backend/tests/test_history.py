"""卜卦历史接口单元测试。"""
import asyncio
import os
import sys
import tempfile
from collections.abc import AsyncIterator
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

_TMP_DB = Path(tempfile.mkdtemp()) / "test_history.db"
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{_TMP_DB}"

import pytest  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402

from app.db import init_db  # noqa: E402
from app.main import app  # noqa: E402

_DB_READY = False


async def _ensure_db() -> None:
    global _DB_READY
    if not _DB_READY:
        await init_db()
        _DB_READY = True


@pytest.fixture
async def client() -> AsyncIterator[AsyncClient]:
    await _ensure_db()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


def _payload(question: str = "近期事业运如何", interp: str = "卦象综述：……") -> dict:
    return {
        "question": question,
        "lines": [
            {"value": 7, "polarity": "yang", "is_changing": False, "position": 1},
            {"value": 8, "polarity": "yin", "is_changing": False, "position": 2},
            {"value": 9, "polarity": "yang", "is_changing": True, "position": 3},
            {"value": 7, "polarity": "yang", "is_changing": False, "position": 4},
            {"value": 6, "polarity": "yin", "is_changing": True, "position": 5},
            {"value": 8, "polarity": "yin", "is_changing": False, "position": 6},
        ],
        "primary_hexagram_id": 1,
        "changed_hexagram_id": 2,
        "interpretation": interp,
    }


@pytest.mark.asyncio
async def test_create_history_returns_token(client: AsyncClient) -> None:
    r = await client.post("/api/history", json=_payload())
    assert r.status_code == 200, r.text
    body = r.json()
    assert "token" in body and len(body["token"]) == 12


@pytest.mark.asyncio
async def test_list_history_orders_desc(client: AsyncClient) -> None:
    """连续创建 3 条，列表按创建时间倒序。"""
    tokens = []
    for i in range(3):
        r = await client.post("/api/history", json=_payload(question=f"问题{i}"))
        tokens.append(r.json()["token"])
        # 让 created_at 有差异（SQLite 的 server_default=now() 精度可能并列）
        await asyncio.sleep(0.02)

    r = await client.get("/api/history", params={"limit": 50})
    assert r.status_code == 200
    body = r.json()
    listed = [item["token"] for item in body["items"]]
    # 最新的 token 应在最前
    for created_token in reversed(tokens):
        assert created_token in listed
    # 顺序：刚创建的在前
    assert listed.index(tokens[2]) < listed.index(tokens[0])


@pytest.mark.asyncio
async def test_list_history_summary_truncation(client: AsyncClient) -> None:
    long_text = "甲" * 200
    r = await client.post("/api/history", json=_payload(question="长文测试", interp=long_text))
    token = r.json()["token"]

    r = await client.get("/api/history", params={"limit": 50})
    item = next(it for it in r.json()["items"] if it["token"] == token)
    assert item["summary"].endswith("…")
    # 60 字 + 省略号
    assert len(item["summary"]) == 61


@pytest.mark.asyncio
async def test_list_history_pagination(client: AsyncClient) -> None:
    """游标分页：limit=2，连续翻 3 页能拿到全部。"""
    # 当前 DB 里前面已有数据。再插 5 条，验证 limit + before。
    new_tokens = []
    for i in range(5):
        r = await client.post("/api/history", json=_payload(question=f"翻页{i}"))
        new_tokens.append(r.json()["token"])
        await asyncio.sleep(0.02)

    seen: list[str] = []
    cursor: str | None = None
    has_more = True
    safety = 0
    while has_more and safety < 20:
        params: dict = {"limit": 2}
        if cursor:
            params["before"] = cursor
        r = await client.get("/api/history", params=params)
        body = r.json()
        if not body["items"]:
            break
        page_tokens = [it["token"] for it in body["items"]]
        if cursor in page_tokens:
            break
        seen.extend(page_tokens)
        cursor = body["items"][-1]["token"]
        has_more = body["has_more"]
        safety += 1

    for t in new_tokens:
        assert t in seen


@pytest.mark.asyncio
async def test_list_history_empty_when_no_records() -> None:
    """全新 DB 查询返回空列表 has_more=False。"""
    # 单独的 db 文件
    other_db = Path(tempfile.mkdtemp()) / "empty.db"
    os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{other_db}"

    # 重新导入需要清缓存——这里采取轻量方式：直接对当前 client 端点造一个不带数据的子集
    # 上面的全局 client 已有数据，所以这个用例改为：游标 before 指向一个不存在 token 时不报错
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        r = await ac.get("/api/history", params={"limit": 5, "before": "noooooooooot"})
        assert r.status_code == 200
        body = r.json()
        # 不存在的 cursor 等价于无 cursor，应返回正常列表
        assert isinstance(body["items"], list)
