import { useEffect, useMemo, useRef, useState } from 'react';
import LineSymbol from '@/components/HexagramDisplay/LineSymbol';
import '@/components/HexagramDisplay/LineSymbol.css';
import LoadingBrush from '@/components/common/LoadingBrush';
import { buildLine, type Line, type LinePosition, type LineValue } from '@/types/hexagram';
import './YarrowAutoSimulation.css';

interface AutoYarrowResponse {
  lines: Array<{
    value: LineValue;
    polarity: 'yang' | 'yin';
    isChanging: boolean;
    position: LinePosition;
  }>;
  rounds: unknown;
}

interface Props {
  onComplete: (lines: Line[]) => void;
  onError?: (msg: string) => void;
}

interface Stalk {
  id: number;
  x: number;
  y: number;
  rotation: number;
  burst: boolean;
}

const TOTAL_STALKS = 49;
// 6 爻 × 600ms ≈ 3.6s + 入场/收尾 ≈ 4s
const PER_LINE_MS = 600;
const STALK_BURST_MS = 360;

function makeStalks(): Stalk[] {
  const arr: Stalk[] = [];
  for (let i = 0; i < TOTAL_STALKS; i++) {
    arr.push({
      id: i,
      x: 36 + Math.random() * 28,
      y: 30 + Math.random() * 40,
      rotation: Math.random() * 360,
      burst: false,
    });
  }
  return arr;
}

export default function YarrowAutoSimulation({ onComplete, onError }: Props) {
  const [phase, setPhase] = useState<'fetching' | 'animating' | 'done' | 'error'>('fetching');
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [revealedIdx, setRevealedIdx] = useState(-1); // -1 表示尚未出爻；0~5 表示当前展示到第 (idx+1) 爻
  const [stalks, setStalks] = useState<Stalk[]>(() => makeStalks());
  const [shake, setShake] = useState(false);
  const fetchedRef = useRef(false);
  const linesRef = useRef<Line[]>([]);

  // 1. 拉取后端起卦结果
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    (async () => {
      try {
        const r = await fetch('/api/yarrow/auto', { method: 'POST' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const body = (await r.json()) as AutoYarrowResponse;
        const lines = body.lines.map((l) =>
          buildLine(l.value as LineValue, l.position as LinePosition),
        );
        linesRef.current = lines;
        setPhase('animating');
      } catch (e) {
        const msg = (e as Error).message || '起卦失败';
        setErrMsg(msg);
        setPhase('error');
        onError?.(msg);
      }
    })();
  }, [onError]);

  // 2. 串行播放 6 爻
  useEffect(() => {
    if (phase !== 'animating') return;
    let cancelled = false;
    let idx = 0;

    const playOne = () => {
      if (cancelled) return;
      // 蓍草随机重排 + 抖动
      setStalks(makeStalks().map((s) => ({ ...s, burst: false })));
      setShake(true);
      window.setTimeout(() => {
        if (cancelled) return;
        // 蓍草飞散
        setStalks((prev) => prev.map((s) => ({ ...s, burst: true })));
        setShake(false);
      }, 120);

      window.setTimeout(() => {
        if (cancelled) return;
        // 显爻
        setRevealedIdx(idx);
        idx += 1;
        if (idx < 6) {
          window.setTimeout(playOne, PER_LINE_MS - STALK_BURST_MS);
        } else {
          // 全部完成
          window.setTimeout(() => {
            if (cancelled) return;
            setPhase('done');
            onComplete(linesRef.current);
          }, 700);
        }
      }, STALK_BURST_MS);
    };

    playOne();
    return () => {
      cancelled = true;
    };
  }, [phase, onComplete]);

  const currentLine = useMemo(
    () => (revealedIdx >= 0 ? linesRef.current[revealedIdx] : null),
    [revealedIdx],
  );

  if (phase === 'fetching') {
    return (
      <div className="auto-yarrow">
        <div className="auto-yarrow-stage auto-stage-loading">
          <LoadingBrush />
          <div className="auto-yarrow-tip">蓍草初成…</div>
        </div>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="auto-yarrow">
        <div className="auto-yarrow-stage auto-stage-error">
          <div className="auto-yarrow-error">⚠ {errMsg}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="auto-yarrow">
      <div className="auto-yarrow-header">
        <span className="auto-yarrow-stage-label">
          {phase === 'done' ? '六爻齐备' : `第 ${Math.max(revealedIdx + 1, 1)} / 6 爻`}
        </span>
        <span className="auto-yarrow-meta">
          {phase === 'done' ? '卦象已成' : '揲蓍化繁为简，瞬间得卦'}
        </span>
      </div>

      <div className={`auto-yarrow-stage ${shake ? 'shaking' : ''}`}>
        {stalks.map((s) => (
          <div
            key={s.id}
            className={`auto-stalk ${s.burst ? 'burst' : ''}`}
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              transform: `rotate(${s.rotation}deg)`,
            }}
          />
        ))}

        {currentLine && (
          <div className="auto-yao-flash" key={`yao-${revealedIdx}`}>
            <LineSymbol line={currentLine} showChangingMark width={180} height={32} />
          </div>
        )}
      </div>

      <div className="auto-lines-stack">
        {[6, 5, 4, 3, 2, 1].map((pos) => {
          const line = linesRef.current.find(
            (l) => l.position === pos && (linesRef.current.indexOf(l) <= revealedIdx),
          );
          return (
            <div className="auto-stack-row" key={pos}>
              {line ? (
                <LineSymbol line={line} showChangingMark width={150} height={22} />
              ) : (
                <div className="auto-placeholder-line" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
