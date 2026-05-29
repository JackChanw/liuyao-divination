"""卦象数据查询路由。"""
from fastapi import APIRouter, HTTPException

from app.models.hexagram import HexagramData
from app.services import hexagram_service

router = APIRouter()


@router.get("/hexagram/{hex_id}", response_model=HexagramData)
async def get_hexagram(hex_id: int) -> HexagramData:
    h = hexagram_service.get_by_id(hex_id)
    if h is None:
        raise HTTPException(status_code=404, detail=f"hexagram id {hex_id} not found")
    return h


@router.get("/hexagram/by-binary/{binary_code}", response_model=HexagramData)
async def get_hexagram_by_binary(binary_code: str) -> HexagramData:
    if len(binary_code) != 6 or any(c not in "01" for c in binary_code):
        raise HTTPException(status_code=400, detail="binary_code must be 6-char 0/1 string")
    h = hexagram_service.get_by_binary(binary_code)
    if h is None:
        raise HTTPException(status_code=404, detail=f"binary_code {binary_code} not found")
    return h


@router.get("/hexagrams", response_model=list[HexagramData])
async def list_hexagrams() -> list[HexagramData]:
    return hexagram_service.get_all()
