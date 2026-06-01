import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useDivinationStore } from '@/stores/divinationStore';
import InkButton from '@/components/common/InkButton';
import InkInput from '@/components/common/InkInput';
import KnowledgeOverlay from '@/components/KnowledgeOverlay';
import './HomePage.css';

export default function HomePage() {
  const setQuestion = useDivinationStore((s) => s.setQuestion);
  const reset = useDivinationStore((s) => s.reset);
  const [text, setText] = useState('');
  const [knOpen, setKnOpen] = useState(false);
  const [knSection, setKnSection] = useState<string | undefined>(undefined);
  const navigate = useNavigate();

  const startWithMode = (mode: 'manual' | 'auto') => {
    const q = text.trim();
    if (q.length < 2) return;
    reset();
    setQuestion(q);
    navigate(`/divine?mode=${mode}`);
  };

  const openKn = (section?: string) => {
    setKnSection(section);
    setKnOpen(true);
  };

  return (
    <div className="home-page animate-page-in">
      <header className="home-header">
        <h1 className="home-title">六　爻　占　卜</h1>
        <p className="home-subtitle">
          蓍草三变以成爻，六爻齐备而卦显
          <br />
          心诚则灵，问其所惑，玄机自现
        </p>
      </header>

      <section className="home-intro">
        <p className="home-intro-text">
          <strong>六爻</strong>是中国传统占卜方式，以阴阳爻象演变映照所问之事。本应用融合古法
          <strong>蓍草十有八变</strong>与现代 AI，由占卜师"玄机子"为你解卦。
        </p>
        <button className="home-kn-link" onClick={() => openKn()}>
          📜 卦理浅说
        </button>
      </section>

      <section className="home-form">
        <InkInput
          label="所　问　何　事"
          placeholder="请凝神静气，将心中所惑娓娓道来…（如：欲谋此事可成否？）"
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={200}
        />
        <div className="char-count">{text.length} / 200</div>

        <div className="home-actions home-actions-dual">
          <div className="home-action-block">
            <InkButton onClick={() => startWithMode('manual')} disabled={text.trim().length < 2} variant="ghost">
              亲　手　揲　蓍
            </InkButton>
            <button className="home-mode-tip" onClick={() => openKn('yarrow')}>
              古法 18 变 · 约 3 分钟
            </button>
          </div>

          <div className="home-action-divider">或</div>

          <div className="home-action-block">
            <InkButton onClick={() => startWithMode('auto')} disabled={text.trim().length < 2}>
              一　键　成　卦
            </InkButton>
            <button className="home-mode-tip" onClick={() => openKn('how-to-use')}>
              系统模拟 · 约 4 秒
            </button>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <span>※ 占卜之事，唯诚乃灵 ※</span>
      </footer>

      <KnowledgeOverlay
        open={knOpen}
        onClose={() => setKnOpen(false)}
        initialSection={knSection}
      />
    </div>
  );
}
