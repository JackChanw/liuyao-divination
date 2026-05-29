"""解卦 prompt 构建。"""
from app.models.divination import DivinationRequest
from app.models.hexagram import HexagramData


SYSTEM_PROMPT = """你是一位精通《周易》六爻占卜的占卜师，道号"玄机子"。
你深谙易理，融贯象数与义理两派之说，断卦时既重卦象，又通人情。

【解卦框架】每次解卦必须依次包含五部分，并使用对应的小标题：
一、卦象综述：简述本卦卦名、卦象之意，结合所问之事点出整体形势。
二、爻象分析：重点分析动爻爻辞的指向，若多爻动则分主次；无动爻则参考卦辞主旨。
三、核心指示：从卦象中提炼对所问之事最关键的提示。
四、行动建议：给出三条以内具体可行的建议，每条以"宜"或"忌"起首。
五、结语：以一句意味深长的箴言作结。

【语言要求】
- 半文半白，文笔典雅，富有古风韵味
- 全文 600~800 字
- 使用"利于/宜/忌/可/慎/防"等审慎措辞
- 不做绝对的吉凶论断，不预测具体日期
- 不使用 markdown 加粗符号 ** 或 #，标题直接以"一、""二、"等前缀分段

【职业操守】
- 只就卦象与所问之事作答
- 提醒占卜者：卦象示其势，决断在于人
"""


def _format_lines_table(req: DivinationRequest) -> str:
    """格式化六爻爻象表格（自上爻到初爻，符合传统看卦顺序）。"""
    line_by_pos = {l.position: l for l in req.lines}
    rows = []
    pos_label = {1: "初爻", 2: "二爻", 3: "三爻", 4: "四爻", 5: "五爻", 6: "上爻"}
    for pos in (6, 5, 4, 3, 2, 1):
        l = line_by_pos[pos]
        symbol = {6: "老阴 ✕（动）", 7: "少阳 —", 8: "少阴 - -", 9: "老阳 ○（动）"}[l.value]
        marker = "  ← 动爻" if l.is_changing else ""
        rows.append(f"  {pos_label[pos]}：{symbol}{marker}")
    return "\n".join(rows)


def build_divination_messages(
    req: DivinationRequest,
    primary: HexagramData,
    changed: HexagramData | None,
) -> list[dict]:
    """构建发送给 LLM 的 messages。"""
    parts: list[str] = []
    parts.append(f"【所问之事】\n{req.question}\n")

    parts.append("【本卦】")
    parts.append(f"卦名：{primary.chinese_name}（{primary.name}） {primary.symbol}")
    parts.append(f"卦辞：{primary.guaci}")
    parts.append(f"彖曰：{primary.tuan}")
    parts.append(f"象曰：{primary.xiang}")
    parts.append("\n【六爻爻象】（自上而下）")
    parts.append(_format_lines_table(req))

    if req.changing_line_positions:
        parts.append("\n【动爻爻辞】")
        for pos in sorted(req.changing_line_positions):
            yc = next((y for y in primary.yaoci if y.position == pos), None)
            if yc:
                parts.append(f"  {yc.title}：{yc.text}")
    else:
        parts.append("\n【动爻】无（静卦，以卦辞为主断之）")

    if changed:
        parts.append(f"\n【变卦】{changed.chinese_name}（{changed.name}） {changed.symbol}")
        parts.append(f"变卦卦辞：{changed.guaci}")

    parts.append("\n请依据上述卦象，按解卦框架展开论断。")

    user_content = "\n".join(parts)

    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "user", "content": user_content},
    ]
