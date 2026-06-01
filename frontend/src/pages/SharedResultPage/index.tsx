import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import HexagramGrid from '@/components/HexagramDisplay/HexagramGrid';
import InterpretationStream from '@/components/InterpretationStream';
import InkButton from '@/components/common/InkButton';
import LoadingBrush from '@/components/common/LoadingBrush';
import { lookupByBinary } from '@/data/hexagrams';
import {
  linesToBinary,
  linesToChangedBinary,
  type HexagramData,
  type Line,
} from '@/types/hexagram';
import '@/pages/ResultPage/ResultPage.css';

interface ShareReadResponse {
  token: string;
  question: string;
  lines: Line[];
  primary_hexagram_id: number;
  changed_hexagram_id: number | null;
  interpretation: string;
  created_at: string;
}

async function fetchHexagram(id: number): Promise<HexagramData | null> {
  try {
    const r = await fetch(`/api/hexagram/${id}`);
    if (!r.ok) return null;
    return (await r.json()) as HexagramData;
  } catch {
    return null;
  }
}

export default function SharedResultPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<ShareReadResponse | null>(null);
  const [primary, setPrimary] = useState<HexagramData | null>(null);
  const [changed, setChanged] = useState<HexagramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/share/${token}`);
        if (!r.ok) {
          if (r.status === 404) throw new Error('此卦象不存在或已失效');
          throw new Error(`HTTP ${r.status}`);
        }
        const body = (await r.json()) as ShareReadResponse;
        if (cancelled) return;
        setData(body);

        const [p, c] = await Promise.all([
          fetchHexagram(body.primary_hexagram_id),
          body.changed_hexagram_id ? fetchHexagram(body.changed_hexagram_id) : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setPrimary(p);
        setChanged(c);
      } catch (e) {
        if (!cancelled) setError((e as Error).message || '加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const lines = data?.lines ?? [];
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

  if (loading) {
    return (
      <div className="result-page">
        <LoadingBrush />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="result-page">
        <div className="error-tip" style={{ textAlign: 'center', margin: '40px 0' }}>
          ⚠ {error || '加载失败'}
        </div>
        <footer className="result-footer">
          <InkButton onClick={() => navigate('/')} variant="primary">
            自　占　一　卦
          </InkButton>
        </footer>
      </div>
    );
  }

  return (
    <div className="result-page animate-page-in">
      <header className="result-header">
        <div className="seal-badge">分　享　卦　象</div>
        <h2 className="result-question">{data.question}</h2>
      </header>

      <section className="result-hexagrams">
        <HexagramGrid
          lines={lines}
          title={primary?.chinese_name || primaryIdx?.chineseName || '本卦'}
          subtitle={primary?.symbol || primaryIdx?.symbol}
          showChangingMark
        />
        {changedIdx && (
          <>
            <div className="arrow-divider">
              <span>变</span>
            </div>
            <HexagramGrid
              lines={lines.map((l) => ({
                ...l,
                polarity: l.isChanging
                  ? l.polarity === 'yang'
                    ? 'yin'
                    : 'yang'
                  : l.polarity,
                isChanging: false,
              }))}
              title={changed?.chinese_name || changedIdx.chineseName}
              subtitle={changed?.symbol || changedIdx.symbol}
              showChangingMark={false}
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
        <InterpretationStream text={data.interpretation} isStreaming={false} />
      </section>

      <footer className="result-footer">
        <InkButton onClick={() => navigate('/')} variant="primary">
          自　占　一　卦
        </InkButton>
      </footer>
    </div>
  );
}
