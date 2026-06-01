"""自动起卦接口单元测试。"""
import os
import sys
import tempfile
from collections.abc import AsyncIterator
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

_TMP_DB = Path(tempfile.mkdtemp()) / "test_yarrow_api.db"
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


@pytest.mark.asyncio
async def test_auto_yarrow_returns_six_lines(client: AsyncClient) -> None:
    r = await client.post("/api/yarrow/auto")
    assert r.status_code == 200, r.text
    body = r.json()
    assert "lines" in body and "rounds" in body
    assert len(body["lines"]) == 6
    assert len(body["rounds"]) == 6


@pytest.mark.asyncio
async def test_auto_yarrow_line_invariants(client: AsyncClient) -> None:
    r = await client.post("/api/yarrow/auto")
    body = r.json()
    positions = [line["position"] for line in body["lines"]]
    assert sorted(positions) == [1, 2, 3, 4, 5, 6]

    for line in body["lines"]:
        assert line["value"] in (6, 7, 8, 9)
        # polarity 自洽
        if line["value"] in (7, 9):
            assert line["polarity"] == "yang"
        else:
            assert line["polarity"] == "yin"
        # is_changing 自洽（Pydantic 序列化默认走 alias 'isChanging'）
        is_changing = line.get("isChanging", line.get("is_changing"))
        assert is_changing == (line["value"] in (6, 9))


@pytest.mark.asyncio
async def test_auto_yarrow_round_changes(client: AsyncClient) -> None:
    r = await client.post("/api/yarrow/auto")
    body = r.json()
    for rd in body["rounds"]:
        assert len(rd["changes"]) == 3
        # 第一变 5/9，二三变 4/8
        assert rd["changes"][0]["aside_total"] in (5, 9)
        assert rd["changes"][1]["aside_total"] in (4, 8)
        assert rd["changes"][2]["aside_total"] in (4, 8)
        assert rd["final_value"] in (6, 7, 8, 9)


@pytest.mark.asyncio
async def test_auto_yarrow_distribution(client: AsyncClient) -> None:
    """跑 50 次，观察 6/7/8/9 都能出现（弱概率检验）。"""
    seen: set[int] = set()
    for _ in range(50):
        r = await client.post("/api/yarrow/auto")
        for line in r.json()["lines"]:
            seen.add(line["value"])
        if len(seen) == 4:
            break
    assert seen == {6, 7, 8, 9}, f"50 次中未覆盖全部值: {seen}"
