"""自动起卦（一键成卦）路由。"""
from fastapi import APIRouter
from pydantic import BaseModel

from app.models.hexagram import Line, YarrowRound
from app.services.yarrow_service import perform_full_divination, value_to_line

router = APIRouter()


class AutoYarrowResponse(BaseModel):
    lines: list[Line]
    rounds: list[YarrowRound]


@router.post("/yarrow/auto", response_model=AutoYarrowResponse)
async def auto_yarrow() -> AutoYarrowResponse:
    """完整起卦，返回六爻与每爻三变明细。"""
    rounds = perform_full_divination()
    lines = [value_to_line(r.final_value, r.round_number) for r in rounds]
    return AutoYarrowResponse(lines=lines, rounds=rounds)
