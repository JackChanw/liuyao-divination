"""揲蓍法约束单元测试。

运行：
    cd backend
    python -m pytest tests/ -v
或：
    python tests/test_yarrow.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.yarrow_service import (  # noqa: E402
    perform_full_divination,
    perform_yarrow_round,
)


def test_yarrow_constraints_many_runs() -> None:
    """大量重复执行验证：第一变 5/9，第二三变 4/8，最终值 6/7/8/9。"""
    iterations = 2000
    final_distribution: dict[int, int] = {6: 0, 7: 0, 8: 0, 9: 0}
    for _ in range(iterations):
        round_result = perform_yarrow_round(1)
        assert round_result.changes[0].aside_total in (5, 9)
        assert round_result.changes[1].aside_total in (4, 8)
        assert round_result.changes[2].aside_total in (4, 8)
        assert round_result.final_value in (6, 7, 8, 9)
        final_distribution[round_result.final_value] += 1

    # 应当四种值都至少出现一次
    for v in (6, 7, 8, 9):
        assert final_distribution[v] > 0, f"值 {v} 未出现，可能算法偏差: {final_distribution}"

    print(f"[OK] {iterations} 轮约束验证通过；分布 = {final_distribution}")


def test_full_divination_six_lines() -> None:
    rounds = perform_full_divination()
    assert len(rounds) == 6
    for i, r in enumerate(rounds, start=1):
        assert r.round_number == i
        assert len(r.changes) == 3
    print(f"[OK] 完整起卦 6 爻：{[r.final_value for r in rounds]}")


if __name__ == "__main__":
    test_yarrow_constraints_many_runs()
    test_full_divination_six_lines()
    print("\n所有测试通过 ✓")
