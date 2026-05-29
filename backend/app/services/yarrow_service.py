"""揲蓍法（蓍草法）算法实现。

规则：
- 起始：49 根蓍草（去太极一根，留 49 根用于揲蓍）
- 每爻经过三变得出
- 每变流程：
  1) 将当前蓍草随机分为左右两堆（每堆至少 1 根）
  2) 从右堆取一根置于"挂一"位（aside_one = 1）
  3) 左堆四根一组数（"揲之以四"）：左堆 mod 4，余 0 记为 4
  4) 右堆四根一组数：右堆 mod 4，余 0 记为 4
  5) 本变置旁总数 = 1 + 左余 + 右余
- 数学约束：
  - 第一变 (起始 49)：置旁只可能为 5 或 9
  - 第二变 / 第三变：置旁只可能为 4 或 8
- 三变之后剩余蓍草数除以 4，得爻值：
  36/4=9 (老阳，动) / 32/4=8 (少阴) / 28/4=7 (少阳) / 24/4=6 (老阴，动)
"""
import secrets

from app.models.hexagram import Line, LineValue, YarrowChange, YarrowRound


def _perform_one_change(available: int, change_number: int) -> YarrowChange:
    """执行一次"变"。"""
    # 随机分左右堆，每堆至少 1 根
    # 左堆取值范围 [1, available - 1]
    left = secrets.randbelow(available - 1) + 1
    right = available - left

    # 右堆取一根挂一
    aside_one = 1
    right_after = right - 1
    if right_after < 0:
        # 极端情况：右堆只有 1 根，取走后为 0；将左堆的 1 根移到右堆
        # 实际通过约束 left ≤ available-1 已保证 right ≥ 1，这里仅防御
        right_after = 0

    # 揲之以四：mod 4，余 0 记 4
    left_remainder = left % 4 or 4
    right_remainder = right_after % 4 or 4

    aside_total = aside_one + left_remainder + right_remainder
    available_after = available - aside_total

    # 数学约束验证
    if change_number == 1:
        assert aside_total in (5, 9), (
            f"第一变 aside_total 必须为 5 或 9, 得 {aside_total} (left={left}, right={right})"
        )
    else:
        assert aside_total in (4, 8), (
            f"第{change_number}变 aside_total 必须为 4 或 8, 得 {aside_total}"
        )

    return YarrowChange(
        change_number=change_number,  # type: ignore[arg-type]
        available_before=available,
        left_pile=left,
        right_pile=right,
        aside_one=aside_one,
        left_remainder=left_remainder,
        right_remainder=right_remainder,
        aside_total=aside_total,
        available_after=available_after,
    )


def perform_yarrow_round(round_number: int) -> YarrowRound:
    """模拟单爻的三变过程。"""
    available = 49
    changes: list[YarrowChange] = []
    for change_num in (1, 2, 3):
        change = _perform_one_change(available, change_num)
        changes.append(change)
        available = change.available_after

    # 三变后必为 36/32/28/24
    assert available in (36, 32, 28, 24), f"三变后剩余必为 36/32/28/24, 得 {available}"
    final_value: LineValue = available // 4  # type: ignore[assignment]
    assert final_value in (6, 7, 8, 9)

    return YarrowRound(
        round_number=round_number,
        changes=changes,
        final_value=final_value,
    )


def perform_full_divination() -> list[YarrowRound]:
    """完整起卦：六轮，每轮一爻，初爻在前，上爻在后。"""
    return [perform_yarrow_round(i) for i in range(1, 7)]


def value_to_line(value: LineValue, position: int) -> Line:
    polarity = "yang" if value in (7, 9) else "yin"
    return Line(
        value=value,
        polarity=polarity,  # type: ignore[arg-type]
        is_changing=value in (6, 9),
        position=position,  # type: ignore[arg-type]
    )


def lines_to_binary_code(lines: list[Line]) -> str:
    """六爻 → binary_code (index 0 = 初爻)。

    动爻按"现在态"取值（老阴=阴=0，老阳=阳=1）。
    """
    sorted_lines = sorted(lines, key=lambda x: x.position)
    return "".join("1" if l.polarity == "yang" else "0" for l in sorted_lines)


def lines_to_changed_binary_code(lines: list[Line]) -> str:
    """变卦 binary_code：动爻取反，静爻不变。"""
    sorted_lines = sorted(lines, key=lambda x: x.position)
    bits: list[str] = []
    for line in sorted_lines:
        if line.is_changing:
            bits.append("0" if line.polarity == "yang" else "1")
        else:
            bits.append("1" if line.polarity == "yang" else "0")
    return "".join(bits)
