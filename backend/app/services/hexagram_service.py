"""64 卦数据加载与查询。"""
import json
from functools import lru_cache
from pathlib import Path
from typing import Optional

from app.models.hexagram import HexagramData


_DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "hexagrams.json"


@lru_cache
def _load_all() -> list[HexagramData]:
    if not _DATA_FILE.exists():
        return []
    with _DATA_FILE.open("r", encoding="utf-8") as f:
        raw = json.load(f)
    return [HexagramData(**item) for item in raw]


@lru_cache
def _by_id() -> dict[int, HexagramData]:
    return {h.id: h for h in _load_all()}


@lru_cache
def _by_binary() -> dict[str, HexagramData]:
    return {h.binary_code: h for h in _load_all()}


def get_all() -> list[HexagramData]:
    return _load_all()


def get_by_id(hex_id: int) -> Optional[HexagramData]:
    return _by_id().get(hex_id)


def get_by_binary(binary_code: str) -> Optional[HexagramData]:
    return _by_binary().get(binary_code)
