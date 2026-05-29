import { useEffect, useRef } from 'react';
import './InterpretationStream.css';

interface Props {
  text: string;
  isStreaming: boolean;
}

/**
 * 流式解卦展示。
 * 为避免每个字一个 span 导致大量 DOM 节点，这里采用：
 * - 已稳定文本：直接 textContent 显示
 * - 最近 N 个字符：用 char-fade 入场动画
 */
const RECENT_CHAR_COUNT = 28;

export default function InterpretationStream({ text, isStreaming }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 自动滚动到底部
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [text]);

  const stableLen = Math.max(0, text.length - RECENT_CHAR_COUNT);
  const stableText = text.slice(0, stableLen);
  const recentText = text.slice(stableLen);

  return (
    <div className="interpretation-stream" ref={containerRef}>
      <pre className="interpretation-text">
        {stableText}
        {recentText.split('').map((ch, i) => (
          <span key={`${stableLen + i}-${ch}`} className="char-fade">
            {ch}
          </span>
        ))}
        {isStreaming && <span className="cursor-brush">｜</span>}
      </pre>
    </div>
  );
}
