import type { Line } from '@/types/hexagram';
import './LineSymbol.css';

interface Props {
  line: Line;
  // 是否显示动爻标记（变卦展示时通常不再标记动爻）
  showChangingMark?: boolean;
  // 入场动画延时
  delayMs?: number;
  width?: number;
  height?: number;
}

export default function LineSymbol({
  line,
  showChangingMark = true,
  delayMs = 0,
  width = 160,
  height = 28,
}: Props) {
  const isYang = line.polarity === 'yang';
  const isChanging = line.isChanging && showChangingMark;
  const stroke = isChanging ? 'var(--red-changing)' : 'var(--ink-black)';
  const strokeWidth = 8;
  const cy = height / 2;

  return (
    <svg
      className={`line-symbol ${isChanging ? 'changing' : ''}`}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      {isYang ? (
        <line
          x1={6}
          y1={cy}
          x2={width - 6}
          y2={cy}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="yang-line"
        />
      ) : (
        <>
          <line
            x1={6}
            y1={cy}
            x2={width / 2 - 12}
            y2={cy}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="yin-line yin-left"
          />
          <line
            x1={width / 2 + 12}
            y1={cy}
            x2={width - 6}
            y2={cy}
            stroke={stroke}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="yin-line yin-right"
          />
        </>
      )}
      {isChanging && (
        <text
          x={width - 4}
          y={cy + 5}
          fill="var(--red-changing)"
          fontSize="14"
          fontFamily="var(--font-brush)"
          textAnchor="start"
          className="changing-mark"
        >
          {line.value === 9 ? '○' : '✕'}
        </text>
      )}
    </svg>
  );
}
