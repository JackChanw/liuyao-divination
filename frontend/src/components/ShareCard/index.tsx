import HexagramGrid from '@/components/HexagramDisplay/HexagramGrid';
import type { HexagramData, Line } from '@/types/hexagram';
import { formatLunarDate } from '@/utils/lunar';
import './ShareCard.css';

interface Props {
  question: string;
  lines: Line[];
  primary: HexagramData | null;
  changed: HexagramData | null;
  interpretation: string;
  qrDataUrl: string | null; // 二维码 PNG dataURL
  shareUrl: string | null;
  date?: Date; // 落款日期，默认 new Date()
}

const SUMMARY_MAX = 220;

function summarize(text: string, max: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max) + '…';
}

export default function ShareCard({
  question,
  lines,
  primary,
  changed,
  interpretation,
  qrDataUrl,
  shareUrl,
  date,
}: Props) {
  const summary = summarize(interpretation, SUMMARY_MAX);
  const stamp = date ?? new Date();
  const lunar = formatLunarDate(stamp);
  const gregorian = `${stamp.getFullYear()}年${stamp.getMonth() + 1}月${stamp.getDate()}日`;

  // 变卦行：动爻翻转
  const changedLines: Line[] = lines.map((l) => ({
    ...l,
    polarity: l.isChanging ? (l.polarity === 'yang' ? 'yin' : 'yang') : l.polarity,
    isChanging: false,
  }));

  return (
    <div className="share-card">
      <div className="share-card-paper">
        <header className="share-card-header">
          <div className="share-card-brand">
            <div className="share-card-brand-line" />
            <div className="share-card-title">六　爻　占　卜</div>
            <div className="share-card-subtitle">玄机推演</div>
            <div className="share-card-brand-line" />
          </div>
        </header>

        <section className="share-card-question">
          <div className="share-card-q-label">所　问</div>
          <div className="share-card-q-text">{question}</div>
        </section>

        <section className="share-card-hexagrams">
          <HexagramGrid
            lines={lines}
            title={primary?.chinese_name || '本卦'}
            subtitle={primary?.symbol}
            showChangingMark
          />
          {changed && (
            <>
              <div className="share-card-arrow">
                <span>变</span>
              </div>
              <HexagramGrid
                lines={changedLines}
                title={changed.chinese_name}
                subtitle={changed.symbol}
                showChangingMark={false}
              />
            </>
          )}
        </section>

        {primary && (
          <section className="share-card-guaci">
            <div className="share-card-section-title">卦　辞</div>
            <div className="share-card-guaci-text">{primary.guaci}</div>
          </section>
        )}

        <section className="share-card-summary">
          <div className="share-card-section-title">玄机推演（节录）</div>
          <div className="share-card-summary-text">{summary}</div>
        </section>

        <footer className="share-card-footer">
          <div className="share-card-signoff">
            <div className="share-card-seal">
              <div className="share-card-seal-text">
                <span>玄</span>
                <span>机</span>
                <span>子</span>
                <span>印</span>
              </div>
            </div>
            <div className="share-card-date">
              <div className="share-card-date-lunar">{lunar}</div>
              <div className="share-card-date-greg">{gregorian}</div>
            </div>
          </div>

          {qrDataUrl && (
            <div className="share-card-qr">
              <img src={qrDataUrl} alt="分享二维码" className="share-card-qr-img" />
              <div className="share-card-qr-tip">扫码查看完整解卦</div>
            </div>
          )}
        </footer>

        {shareUrl && <div className="share-card-watermark">{shareUrl}</div>}
      </div>
    </div>
  );
}
