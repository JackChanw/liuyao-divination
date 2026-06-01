import { useEffect, useRef, useState } from 'react';
import './InfoTip.css';

interface Props {
  text: string;
  /** 触发器尺寸：sm（默认）/ md */
  size?: 'sm' | 'md';
  /** 自定义 className（用于精细布局） */
  className?: string;
}

/**
 * 行内问号图标 + tooltip。
 * - 桌面：hover 显示
 * - 移动：点击切换
 */
export default function InfoTip({ text, size = 'sm', className = '' }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [open]);

  return (
    <span
      ref={ref}
      className={`info-tip info-tip-${size} ${open ? 'open' : ''} ${className}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onClick={(e) => {
        e.stopPropagation();
        setOpen((v) => !v);
      }}
    >
      <span className="info-tip-icon" aria-label="说明">?</span>
      {open && <span className="info-tip-bubble" role="tooltip">{text}</span>}
    </span>
  );
}
