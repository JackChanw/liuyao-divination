"""卦象/爻 数据模型。"""
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


LineValue = Literal[6, 7, 8, 9]


class Line(BaseModel):
    """单爻。

    value: 6=老阴(动) / 7=少阳(静) / 8=少阴(静) / 9=老阳(动)
    polarity: 阴阳极性
    is_changing: 是否动爻 (value 为 6 或 9)
    position: 1~6, 1 为初爻 (最下), 6 为上爻 (最上)

    同时接受蛇形命名 (is_changing) 与驼峰命名 (isChanging)。
    """

    model_config = ConfigDict(populate_by_name=True)

    value: LineValue
    polarity: Literal["yang", "yin"]
    is_changing: bool = Field(alias="isChanging")
    position: Literal[1, 2, 3, 4, 5, 6]


class YaoCi(BaseModel):
    position: int
    title: str
    text: str


class HexagramData(BaseModel):
    id: int = Field(ge=1, le=64)
    name: str
    chinese_name: str
    symbol: str
    binary_code: str = Field(min_length=6, max_length=6)
    guaci: str
    tuan: str
    xiang: str
    yaoci: list[YaoCi]


class YarrowChange(BaseModel):
    """单次"变"的过程详情。"""

    change_number: Literal[1, 2, 3]
    available_before: int
    left_pile: int
    right_pile: int
    aside_one: int  # 右堆取 1 置旁
    left_remainder: int  # 左堆 mod 4 (0 记 4)
    right_remainder: int  # 右堆 mod 4 (0 记 4)
    aside_total: int  # = aside_one + left_remainder + right_remainder
    available_after: int


class YarrowRound(BaseModel):
    """单爻的揲蓍法过程：三变。"""

    round_number: int = Field(ge=1, le=6)
    changes: list[YarrowChange]
    final_value: LineValue
