"""分享接口单元测试。

运行：
    cd backend
    python -m pytest tests/test_share.py -v
"""
import os
import sys
import tempfile
from collections.abc import AsyncIterator
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# 切换到独立的临时数据库，避免污染本地 liuyao.db
_TMP_DB = Path(tempfile.mkdtemp()) / "test_share.db"
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


def _payload() -> dict:
    return {
        "question": "近期事业运如何",
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
        "interpretation": "卦象综述：……（省略）",
    }


@pytest.mark.asyncio
async def test_create_share_returns_token(client: AsyncClient) -> None:
    r = await client.post("/api/share", json=_payload())
    assert r.status_code == 200, r.text
    body = r.json()
    assert "token" in body and len(body["token"]) == 12
    assert body["share_url"].endswith(f"/r/{body['token']}")


@pytest.mark.asyncio
async def test_get_share_roundtrip(client: AsyncClient) -> None:
    src = _payload()
    create = await client.post("/api/share", json=src)
    token = create.json()["token"]

    read = await client.get(f"/api/share/{token}")
    assert read.status_code == 200, read.text
    out = read.json()
    assert out["token"] == token
    assert out["question"] == src["question"]
    assert len(out["lines"]) == 6
    assert out["primary_hexagram_id"] == src["primary_hexagram_id"]
    assert out["changed_hexagram_id"] == src["changed_hexagram_id"]
    assert out["interpretation"] == src["interpretation"]
    assert "created_at" in out


@pytest.mark.asyncio
async def test_unknown_token_404(client: AsyncClient) -> None:
    r = await client.get("/api/share/notexisttoken")
    assert r.status_code == 404


@pytest.mark.asyncio
async def test_token_unique_across_creates(client: AsyncClient) -> None:
    """连续创建多次，token 不重复。"""
    tokens: set[str] = set()
    for _ in range(20):
        r = await client.post("/api/share", json=_payload())
        assert r.status_code == 200
        tokens.add(r.json()["token"])
    assert len(tokens) == 20
