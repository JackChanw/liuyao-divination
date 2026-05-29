"""不依赖 pydantic 的纯算法验证（兼容 Python 3.8+），用于本机快速自测。

正式测试请使用 test_yarrow.py（需 Python 3.10+）。
"""
import secrets


def perform_one_change(available, change_number):
    left = secrets.randbelow(available - 1) + 1
    right = available - left
    aside_one = 1
    right_after = right - 1
    left_remainder = left % 4 or 4
    right_remainder = right_after % 4 or 4
    aside_total = aside_one + left_remainder + right_remainder
    available_after = available - aside_total
    return aside_total, available_after


def perform_round():
    available = 49
    asides = []
    for cn in (1, 2, 3):
        aside, available = perform_one_change(available, cn)
        asides.append(aside)
    return asides, available


def main():
    iters = 5000
    dist = {6: 0, 7: 0, 8: 0, 9: 0}
    for _ in range(iters):
        asides, remaining = perform_round()
        assert asides[0] in (5, 9), asides
        assert asides[1] in (4, 8), asides
        assert asides[2] in (4, 8), asides
        assert remaining in (24, 28, 32, 36), remaining
        dist[remaining // 4] += 1
    print(f"[OK] {iters} 轮约束验证通过")
    print(f"分布: {dist}")
    print("理论概率: 老阴 6=1/16, 少阳 7=5/16, 少阴 8=7/16, 老阳 9=3/16")
    total = sum(dist.values())
    for v, label in [(6, "老阴"), (7, "少阳"), (8, "少阴"), (9, "老阳")]:
        print(f"  {label}({v}): {dist[v]/total:.4f}")


if __name__ == "__main__":
    main()
