import { useEffect } from 'react';
import './KnowledgeOverlay.css';

interface Props {
  open: boolean;
  onClose: () => void;
  /** 默认展开到哪个章节 id（用于从某处直接跳到对应位置） */
  initialSection?: string;
}

const SECTIONS: { id: string; title: string; body: React.ReactNode }[] = [
  {
    id: 'what',
    title: '何为六爻',
    body: (
      <>
        <p>
          六爻起源于《周易》。古人以六根爻线自下而上叠成一卦，每爻分阴阳，三爻为一经卦，六爻为一别卦，共 64 卦。
        </p>
        <p>
          每一卦象征一个特定情境，配以
          <em>「卦辞」</em>（整卦总意）与
          <em>「爻辞」</em>（每爻情态）。占卜时所成之卦，是把"此刻心念"投射到这套符号系统中，以辅助思考、寻得方向。
        </p>
        <p className="kn-tip">
          ※ 占卜不是预言。它更像一面镜子，映照内心已有的判断与隐忧。
        </p>
      </>
    ),
  },
  {
    id: 'lines',
    title: '阴阳与动静',
    body: (
      <>
        <p>每一爻有四种可能的"值"，对应阴阳与动静：</p>
        <ul className="kn-list">
          <li>
            <span className="kn-tag kn-yang">老阳 9</span>
            阳爻，且为<em>动爻</em>（变化中）
          </li>
          <li>
            <span className="kn-tag kn-yang kn-static">少阳 7</span>
            阳爻，静（不变）
          </li>
          <li>
            <span className="kn-tag kn-yin kn-static">少阴 8</span>
            阴爻，静（不变）
          </li>
          <li>
            <span className="kn-tag kn-yin">老阴 6</span>
            阴爻，且为<em>动爻</em>（变化中）
          </li>
        </ul>
        <p>
          得到的卦称为
          <em>「本卦」</em>，描述当下情境。若卦中含动爻，把动爻翻转阴阳后得到的卦称为
          <em>「变卦」</em>，提示事态走向。
        </p>
        <p className="kn-tip">
          ※ 动爻是关键。若无动爻，事态稳定；若有动爻，重点看动爻爻辞与变卦。
        </p>
      </>
    ),
  },
  {
    id: 'yarrow',
    title: '蓍草法（揲蓍）',
    body: (
      <>
        <p>
          蓍草法是《周易·系辞》记载的正统起卦法，相传为周文王所授。一卦六爻，每爻经
          <em>「三变」</em>方成；六爻共
          <em>「十有八变」</em>而成卦。
        </p>
        <p>每一变的流程：</p>
        <ol className="kn-list">
          <li>
            <em>分二</em>　将手中蓍草随机分成左右两堆
          </li>
          <li>
            <em>挂一</em>　从右堆取一根置于一旁
          </li>
          <li>
            <em>揲四</em>　左堆四根一组数，余数置旁；右堆同
          </li>
          <li>
            <em>归奇</em>　把"挂一 + 左余 + 右余"合在一起置旁
          </li>
        </ol>
        <p>
          三变之后，剩余蓍草数除以 4，得 9 / 8 / 7 / 6 之一，即为本爻之值。
        </p>
        <p className="kn-tip">
          ※ 数学上，第一变置旁必为 5 或 9；第二、三变必为 4 或 8。这是揲蓍法精妙的算术约束。
        </p>
      </>
    ),
  },
  {
    id: 'how-to-use',
    title: '本应用如何使用',
    body: (
      <>
        <p>
          <em>① 写下所问</em>　占卜以一事一问为宜。把心中真正困扰你的事，凝神静气写一句话。
        </p>
        <p>
          <em>② 选择起卦方式</em>
        </p>
        <ul className="kn-list">
          <li>
            <em>亲手揲蓍</em>　按古法逐步操作，体验仪式感与思考过程。共 18 变，约 3-5 分钟。
          </li>
          <li>
            <em>一键成卦</em>　由系统模拟 18 变并展示快进动画，约 4 秒得卦。算法与古法一致，结果合法。
          </li>
        </ul>
        <p>
          <em>③ 玄机推演</em>　成卦后由 AI 占卜师"玄机子"在线流式解卦，从卦象、爻辞、动爻、变卦多角度给出建议。
        </p>
        <p>
          <em>④ 一键分享</em>　可保存国风长图、复制短链或文案，分享到社交平台。
        </p>
        <p className="kn-tip">
          ※ 心诚则灵。占卜之事，重在引你重新审视自己的判断，而非交予机运。
        </p>
      </>
    ),
  },
];

export default function KnowledgeOverlay({ open, onClose, initialSection }: Props) {
  // 锁定 body 滚动
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // initialSection 滚动到位
  useEffect(() => {
    if (!open || !initialSection) return;
    const t = window.setTimeout(() => {
      const el = document.getElementById(`kn-section-${initialSection}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(t);
  }, [open, initialSection]);

  // ESC 关闭
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="kn-mask" onClick={onClose}>
      <div className="kn-panel" onClick={(e) => e.stopPropagation()}>
        <header className="kn-header">
          <div className="kn-title">卦　理　浅　说</div>
          <button className="kn-close" onClick={onClose} aria-label="关闭">
            ×
          </button>
        </header>

        <nav className="kn-toc">
          {SECTIONS.map((s) => (
            <a key={s.id} href={`#kn-section-${s.id}`} className="kn-toc-item">
              {s.title}
            </a>
          ))}
        </nav>

        <div className="kn-body">
          {SECTIONS.map((s) => (
            <section key={s.id} id={`kn-section-${s.id}`} className="kn-section">
              <h3 className="kn-section-title">{s.title}</h3>
              <div className="kn-section-body">{s.body}</div>
            </section>
          ))}

          <footer className="kn-footer">
            <span>※ 文以载道，卦以见心 ※</span>
          </footer>
        </div>
      </div>
    </div>
  );
}
