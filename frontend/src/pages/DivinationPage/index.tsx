import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import YarrowSimulation from '@/components/YarrowSimulation';
import YarrowAutoSimulation from '@/components/YarrowAutoSimulation';
import KnowledgeOverlay from '@/components/KnowledgeOverlay';
import { useDivinationStore } from '@/stores/divinationStore';
import { linesToBinary, linesToChangedBinary, type Line } from '@/types/hexagram';
import { lookupByBinary } from '@/data/hexagrams';
import './DivinationPage.css';

export default function DivinationPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const mode = params.get('mode') === 'auto' ? 'auto' : 'manual';
  const question = useDivinationStore((s) => s.question);
  const setLines = useDivinationStore((s) => s.setLines);
  const [knOpen, setKnOpen] = useState(false);
  const [knSection, setKnSection] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!question) navigate('/', { replace: true });
  }, [question, navigate]);

  const onComplete = (lines: Line[]) => {
    setLines(lines);
    const primaryBin = linesToBinary(lines);
    const primary = lookupByBinary(primaryBin);
    if (!primary) console.warn('[Divination] 本卦未匹配:', primaryBin);
    const changedBin = linesToChangedBinary(lines);
    if (changedBin) {
      const changed = lookupByBinary(changedBin);
      if (!changed) console.warn('[Divination] 变卦未匹配:', changedBin);
    }
    window.setTimeout(() => navigate('/result'), 1100);
  };

  const openKn = (section?: string) => {
    setKnSection(section);
    setKnOpen(true);
  };

  if (!question) return null;

  return (
    <div className="divination-page animate-page-in">
      <header className="divination-header">
        <span className="hint">所问之事</span>
        <h2 className="question-text">{question}</h2>
        <button className="divine-kn-btn" onClick={() => openKn(mode === 'auto' ? 'how-to-use' : 'yarrow')}>
          📜 卦理浅说
        </button>
      </header>

      <main className="divination-main">
        {mode === 'auto' ? (
          <YarrowAutoSimulation onComplete={onComplete} />
        ) : (
          <YarrowSimulation onComplete={onComplete} />
        )}
      </main>

      <aside className="divination-tip">
        {mode === 'auto'
          ? '揲蓍化繁为简，瞬间得卦。结果与古法等价。'
          : '揲蓍之法：分二、挂一、揲四、归奇'}
        {mode !== 'auto' && (
          <>
            <br />
            三变成爻，十有八变而成卦
          </>
        )}
      </aside>

      <KnowledgeOverlay
        open={knOpen}
        onClose={() => setKnOpen(false)}
        initialSection={knSection}
      />
    </div>
  );
}
