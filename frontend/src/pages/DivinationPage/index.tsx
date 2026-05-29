import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import YarrowSimulation from '@/components/YarrowSimulation';
import { useDivinationStore } from '@/stores/divinationStore';
import { linesToBinary, linesToChangedBinary, type Line } from '@/types/hexagram';
import { lookupByBinary } from '@/data/hexagrams';
import './DivinationPage.css';

export default function DivinationPage() {
  const navigate = useNavigate();
  const question = useDivinationStore((s) => s.question);
  const setLines = useDivinationStore((s) => s.setLines);

  // 无问题则返回
  useEffect(() => {
    if (!question) navigate('/', { replace: true });
  }, [question, navigate]);

  const onComplete = (lines: Line[]) => {
    setLines(lines);
    // 提前用前端轻量索引校验：本卦/变卦能否查到
    const primaryBin = linesToBinary(lines);
    const primary = lookupByBinary(primaryBin);
    if (!primary) {
      console.warn('[Divination] 本卦未匹配:', primaryBin);
    }
    const changedBin = linesToChangedBinary(lines);
    if (changedBin) {
      const changed = lookupByBinary(changedBin);
      if (!changed) console.warn('[Divination] 变卦未匹配:', changedBin);
    }
    // 短暂停留以呈现完成态
    window.setTimeout(() => {
      navigate('/result');
    }, 1100);
  };

  if (!question) return null;

  return (
    <div className="divination-page animate-page-in">
      <header className="divination-header">
        <span className="hint">所问之事</span>
        <h2 className="question-text">{question}</h2>
      </header>

      <main className="divination-main">
        <YarrowSimulation onComplete={onComplete} />
      </main>

      <aside className="divination-tip">
        揲蓍之法，分二、挂一、揲四、归奇
        <br />
        三变成爻，十有八变而成卦
      </aside>
    </div>
  );
}
