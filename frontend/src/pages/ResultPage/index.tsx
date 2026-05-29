import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDivinationStore } from '@/stores/divinationStore';
import HexagramGrid from '@/components/HexagramDisplay/HexagramGrid';
import InterpretationStream from '@/components/InterpretationStream';
import { useSSEStream } from '@/components/InterpretationStream/useSSEStream';
import InkButton from '@/components/common/InkButton';
import LoadingBrush from '@/components/common/LoadingBrush';
import { lookupByBinary } from '@/data/hexagrams';
import {
  linesToBinary,
  linesToChangedBinary,
  type HexagramData,
} from '@/types/hexagram';
import './ResultPage.css';

async function fetchHexagram(id: number): Promise<HexagramData | null> {
  try {
    const r = await fetch(`/api/hexagram/${id}`);
    if (!r.ok) return null;
    return (await r.json()) as HexagramData;
  } catch {
    return null;
  }
}

export default function ResultPage() {
  const navigate = useNavigate();
  const question = useDivinationStore((s) => s.question);
  const lines = useDivinationStore((s) => s.lines);
  const primary = useDivinationStore((s) => s.primaryHexagram);
  const changed = useDivinationStore((s) => s.changedHexagram);
  const setHexagrams = useDivinationStore((s) => s.setHexagrams);
  const interpretation = useDivinationStore((s) => s.interpretation);
  const appendInterpretation = useDivinationStore((s) => s.appendInterpretation);
  const resetInterpretation = useDivinationStore((s) => s.resetInterpretation);

  const startedRef = useRef(false);

  const primaryBin = useMemo(() => (lines.length === 6 ? linesToBinary(lines) : null), [lines]);
  const changedBin = useMemo(
    () => (lines.length === 6 ? linesToChangedBinary(lines) : null),
    [lines],
  );
  const primaryIdx = primaryBin ? lookupByBinary(primaryBin) : null;
  const changedIdx = changedBin ? lookupByBinary(changedBin) : null;

  const changingLines = useMemo<number[]>(
    () => lines.filter((l) => l.isChanging).map((l) => l.position),
    [lines],
  );

  const sse = useSSEStream({
    onDelta: (chunk) => appendInterpretation(chunk),
  });

  useEffect(() => {
    if (!question || lines.length !== 6) {
      navigate('/', { replace: true });
      return;
    }
    if (startedRef.current) return;
    if (!primaryIdx) return;
    startedRef.current = true;

    (async () => {
      // 1. 拉取本卦/变卦的完整数据
      const [primaryFull, changedFull] = await Promise.all([
        fetchHexagram(primaryIdx.id),
        changedIdx ? fetchHexagram(changedIdx.id) : Promise.resolve(null),
      ]);
      setHexagrams(primaryFull, changedFull);

      // 2. 启动 SSE 解卦
      resetInterpretation();
      sse.start({
        url: '/api/divine',
        body: {
          question,
          lines,
          primary_hexagram_id: primaryIdx.id,
          changed_hexagram_id: changedIdx?.id ?? null,
          changing_line_positions: changingLines,
        },
      });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, lines, primaryIdx?.id, changedIdx?.id]);

  const onAgain = () => {
    sse.cancel();
    navigate('/');
  };

  if (!question || lines.length !== 6) return null;

  return (
    <div className="result-page animate-page-in">
      <header className="result-header">
        <div className="seal-badge">已　成　卦</div>
        <h2 className="result-question">{question}</h2>
      </header>

      <section className="result-hexagrams">
        <HexagramGrid
          lines={lines}
          title={primary?.chinese_name || primaryIdx?.chineseName || '本卦'}
          subtitle={primary?.symbol || primaryIdx?.symbol}
          showChangingMark
          staggered
        />
        {changedIdx && (
          <>
            <div className="arrow-divider">
              <span>变</span>
            </div>
            <HexagramGrid
              lines={lines.map((l) => ({
                ...l,
                // 变卦：动爻翻转极性
                polarity: l.isChanging
                  ? l.polarity === 'yang'
                    ? 'yin'
                    : 'yang'
                  : l.polarity,
                // 变卦中不再标记动爻
                isChanging: false,
              }))}
              title={changed?.chinese_name || changedIdx.chineseName}
              subtitle={changed?.symbol || changedIdx.symbol}
              showChangingMark={false}
              staggered
            />
          </>
        )}
      </section>

      {primary && (
        <section className="result-guaci">
          <h3 className="guaci-title">卦　辞</h3>
          <p className="guaci-text">{primary.guaci}</p>
          {changingLines.length > 0 && (
            <>
              <h3 className="guaci-title">动爻爻辞</h3>
              <ul className="yaoci-list">
                {primary.yaoci
                  .filter((y) => changingLines.includes(y.position))
                  .map((y) => (
                    <li key={y.position}>
                      <span className="yaoci-title">{y.title}</span>
                      <span className="yaoci-text">{y.text}</span>
                    </li>
                  ))}
              </ul>
            </>
          )}
        </section>
      )}

      <section className="result-interpretation">
        <h3 className="interpretation-title">玄机推演</h3>
        {sse.status === 'idle' || (sse.status === 'streaming' && !interpretation) ? (
          <LoadingBrush />
        ) : (
          <InterpretationStream
            text={interpretation}
            isStreaming={sse.status === 'streaming'}
          />
        )}
        {sse.status === 'error' && (
          <div className="error-tip">
            ⚠ {sse.error || '解卦中断，请稍后再试'}
          </div>
        )}
      </section>

      <footer className="result-footer">
        <InkButton onClick={onAgain} variant="ghost">
          再　占　一　卦
        </InkButton>
      </footer>
    </div>
  );
}
