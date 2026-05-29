import type { Line } from '@/types/hexagram';
import LineSymbol from './LineSymbol';
import './LineSymbol.css';
import './HexagramGrid.css';

interface Props {
  lines: Line[];
  title?: string;
  subtitle?: string;
  showChangingMark?: boolean;
  // 是否对每一爻按 position 错峰入场
  staggered?: boolean;
}

const POSITION_LABEL: Record<number, string> = {
  1: '初',
  2: '二',
  3: '三',
  4: '四',
  5: '五',
  6: '上',
};

export default function HexagramGrid({
  lines,
  title,
  subtitle,
  showChangingMark = true,
  staggered = false,
}: Props) {
  // 显示顺序：从上到下 = 上爻 → 初爻
  const ordered = [...lines].sort((a, b) => b.position - a.position);

  return (
    <div className="hexagram-grid">
      {(title || subtitle) && (
        <div className="hexagram-header">
          {title && <div className="hexagram-title">{title}</div>}
          {subtitle && <div className="hexagram-subtitle">{subtitle}</div>}
        </div>
      )}
      <div className="hexagram-lines">
        {ordered.map((line, idx) => (
          <div className="hexagram-row" key={line.position}>
            <span className="row-label">
              {POSITION_LABEL[line.position]}
              {line.polarity === 'yang' ? '九' : '六'}
            </span>
            <LineSymbol
              line={line}
              showChangingMark={showChangingMark}
              delayMs={staggered ? idx * 180 : 0}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
