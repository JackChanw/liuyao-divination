import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import InkButton from '@/components/common/InkButton';
import LoadingBrush from '@/components/common/LoadingBrush';
import { lookupById } from '@/data/hexagrams';
import './HistoryPage.css';

interface HistoryItem {
  token: string;
  question: string;
  primary_hexagram_id: number;
  changed_hexagram_id: number | null;
  summary: string;
  created_at: string;
}

interface HistoryListResponse {
  items: HistoryItem[];
  has_more: boolean;
}

const PAGE_SIZE = 20;

function formatDate(iso: string): string {
  // 兼容后端可能返回的 naive datetime（不带 Z 时区）
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const loadFirst = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/history?limit=${PAGE_SIZE}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const body = (await r.json()) as HistoryListResponse;
      setItems(body.items);
      setHasMore(body.has_more);
    } catch (e) {
      setError((e as Error).message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!items.length || loadingMore) return;
    const last = items[items.length - 1];
    setLoadingMore(true);
    try {
      const r = await fetch(`/api/history?limit=${PAGE_SIZE}&before=${encodeURIComponent(last.token)}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const body = (await r.json()) as HistoryListResponse;
      setItems((prev) => [...prev, ...body.items]);
      setHasMore(body.has_more);
    } catch (e) {
      setError((e as Error).message || '加载失败');
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadFirst();
  }, []);

  return (
    <div className="history-page animate-page-in">
      <header className="history-header">
        <div className="history-title-row">
          <h2 className="history-title">卜　卦　史</h2>
          <Link to="/" className="history-back">← 返　回</Link>
        </div>
        <p className="history-sub">所占之卦，皆在册中。点击任一条目查阅完整解卦。</p>
      </header>

      {loading && (
        <div className="history-state">
          <LoadingBrush />
        </div>
      )}

      {error && !loading && (
        <div className="history-state history-error">
          <div className="error-tip">⚠ {error}</div>
          <InkButton variant="ghost" onClick={loadFirst}>重　试</InkButton>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="history-state history-empty">
          <div className="history-empty-icon">☯</div>
          <div className="history-empty-text">尚无占卜记录</div>
          <div className="history-empty-tip">心有所惑时，何不一占？</div>
          <InkButton variant="primary" onClick={() => navigate('/')}>
            起　卦
          </InkButton>
        </div>
      )}

      {!loading && items.length > 0 && (
        <ul className="history-list">
          {items.map((item) => {
            const primary = lookupById(item.primary_hexagram_id);
            const changed = item.changed_hexagram_id ? lookupById(item.changed_hexagram_id) : null;
            return (
              <li key={item.token} className="history-card">
                <Link to={`/r/${item.token}`} className="history-card-inner">
                  <div className="history-card-head">
                    <span className="history-card-time">{formatDate(item.created_at)}</span>
                    <span className="history-card-hex">
                      <span className="hex-name">{primary?.chineseName || `#${item.primary_hexagram_id}`}</span>
                      {changed && (
                        <>
                          <span className="hex-arrow">→</span>
                          <span className="hex-name">{changed.chineseName}</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="history-card-q">{item.question}</div>
                  <div className="history-card-summary">{item.summary}</div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {!loading && hasMore && (
        <div className="history-load-more">
          <InkButton variant="ghost" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? '加载中…' : '加　载　更　多'}
          </InkButton>
        </div>
      )}
    </div>
  );
}
