import { useEffect, useState } from 'react';
import { toPng } from 'html-to-image';
import QRCode from 'qrcode';
import type { HexagramData, Line } from '@/types/hexagram';
import ShareCard from '@/components/ShareCard';
import './ShareSheet.css';

interface ShareCreateResponse {
  token: string;
  share_url: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  question: string;
  lines: Line[];
  primary: HexagramData | null;
  changed: HexagramData | null;
  interpretation: string;
  primaryHexagramId: number;
  changedHexagramId: number | null;
  /** 已存在的 token（如来自 history 自动落库），可省去重复 POST /api/share */
  existingToken?: string | null;
  /** 当本组件首次创建/解析出 token 时回调，用于把 token 写回 store */
  onTokenResolved?: (token: string) => void;
}

type Status =
  | { phase: 'idle' }
  | { phase: 'loading'; action: ActionKey }
  | { phase: 'done'; action: ActionKey; message: string }
  | { phase: 'error'; action: ActionKey; message: string };

type ActionKey = 'image' | 'link' | 'text';

async function createShare(payload: {
  question: string;
  lines: Line[];
  primary_hexagram_id: number;
  changed_hexagram_id: number | null;
  interpretation: string;
}): Promise<ShareCreateResponse> {
  const r = await fetch('/api/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return (await r.json()) as ShareCreateResponse;
}

async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // 降级：document.execCommand('copy')
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand('copy');
  } finally {
    document.body.removeChild(ta);
  }
}

function buildTextSummary(question: string, primary: HexagramData | null, changed: HexagramData | null, interpretation: string, shareUrl: string): string {
  const guaName = primary?.chinese_name || '本卦';
  const changedPart = changed ? ` → ${changed.chinese_name}` : '';
  const excerpt = interpretation.trim().slice(0, 80);
  return `【六爻占卜 · 玄机推演】\n所问：${question}\n卦象：${guaName}${changedPart}\n推演：${excerpt}……\n\n查看完整解卦：${shareUrl}`;
}

function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export default function ShareSheet({
  open,
  onClose,
  question,
  lines,
  primary,
  changed,
  interpretation,
  primaryHexagramId,
  changedHexagramId,
  existingToken,
  onTokenResolved,
}: Props) {
  const [status, setStatus] = useState<Status>({ phase: 'idle' });
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);

  // 把已存在的 token 转成本地 share URL（拼当前域名）
  const tokenToUrl = (token: string) => `${window.location.origin}/r/${token}`;

  // 打开 sheet 时主动建分享记录 + 生成二维码（异步预热，用户点保存图片时不会卡）
  useEffect(() => {
    if (!open) return;
    if (shareUrl) return;
    let cancelled = false;
    setPreparing(true);
    (async () => {
      try {
        let url: string;
        if (existingToken) {
          url = tokenToUrl(existingToken);
        } else {
          const res = await createShare({
            question,
            lines,
            primary_hexagram_id: primaryHexagramId,
            changed_hexagram_id: changedHexagramId,
            interpretation,
          });
          if (cancelled) return;
          url = res.share_url;
          onTokenResolved?.(res.token);
        }
        setShareUrl(url);
        const qr = await QRCode.toDataURL(url, {
          margin: 1,
          width: 192,
          color: { dark: '#1a1008', light: '#ffffff' },
        });
        if (cancelled) return;
        setQrDataUrl(qr);
      } catch (e) {
        if (!cancelled) {
          // 仍然允许关闭面板，但保存图片/复制链接会再次尝试
          console.error('share prepare failed', e);
        }
      } finally {
        if (!cancelled) setPreparing(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, shareUrl, question, lines, primaryHexagramId, changedHexagramId, interpretation, existingToken, onTokenResolved]);

  // 关闭时重置 transient 状态
  useEffect(() => {
    if (!open) setStatus({ phase: 'idle' });
  }, [open]);

  const handleSaveImage = async () => {
    setStatus({ phase: 'loading', action: 'image' });
    try {
      const node = document.getElementById('share-card-capture-root');
      if (!node) throw new Error('截图区未找到');
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: '#f5eed8',
      });
      downloadDataUrl(dataUrl, `liuyao-${Date.now()}.png`);
      setStatus({ phase: 'done', action: 'image', message: '图片已保存' });
    } catch (e) {
      setStatus({ phase: 'error', action: 'image', message: (e as Error).message || '保存失败' });
    }
  };

  const ensureShareUrl = async (): Promise<string> => {
    if (shareUrl) return shareUrl;
    if (existingToken) {
      const url = tokenToUrl(existingToken);
      setShareUrl(url);
      return url;
    }
    const res = await createShare({
      question,
      lines,
      primary_hexagram_id: primaryHexagramId,
      changed_hexagram_id: changedHexagramId,
      interpretation,
    });
    setShareUrl(res.share_url);
    onTokenResolved?.(res.token);
    return res.share_url;
  };

  const handleCopyLink = async () => {
    setStatus({ phase: 'loading', action: 'link' });
    try {
      const url = await ensureShareUrl();
      await copyToClipboard(url);
      setStatus({ phase: 'done', action: 'link', message: '链接已复制' });
    } catch (e) {
      setStatus({ phase: 'error', action: 'link', message: (e as Error).message || '复制失败' });
    }
  };

  const handleCopyText = async () => {
    setStatus({ phase: 'loading', action: 'text' });
    try {
      const url = await ensureShareUrl();
      const text = buildTextSummary(question, primary, changed, interpretation, url);
      await copyToClipboard(text);
      setStatus({ phase: 'done', action: 'text', message: '文案已复制' });
    } catch (e) {
      setStatus({ phase: 'error', action: 'text', message: (e as Error).message || '复制失败' });
    }
  };

  if (!open) return null;

  const isLoading = status.phase === 'loading';

  return (
    <>
      {/* 隐藏的截图源，固定 750×1334 */}
      <div className="share-card-capture-host" aria-hidden>
        <div id="share-card-capture-root">
          <ShareCard
            question={question}
            lines={lines}
            primary={primary}
            changed={changed}
            interpretation={interpretation}
            qrDataUrl={qrDataUrl}
            shareUrl={shareUrl}
          />
        </div>
      </div>

      <div className="share-sheet-mask" onClick={isLoading ? undefined : onClose}>
        <div className="share-sheet" onClick={(e) => e.stopPropagation()}>
          <div className="share-sheet-handle" />
          <div className="share-sheet-title">分　享　此　卦</div>
          <div className="share-sheet-subtitle">
            {preparing ? '正在备好分享……' : '选择你喜欢的方式'}
          </div>

          <div className="share-sheet-options">
            <button
              className="share-option"
              onClick={handleSaveImage}
              disabled={isLoading}
            >
              <div className="share-option-icon">圖</div>
              <div className="share-option-text">
                <div className="share-option-title">保存图片</div>
                <div className="share-option-desc">国风长图，适合朋友圈、小红书</div>
              </div>
            </button>

            <button
              className="share-option"
              onClick={handleCopyLink}
              disabled={isLoading || (preparing && !shareUrl)}
            >
              <div className="share-option-icon">鏈</div>
              <div className="share-option-text">
                <div className="share-option-title">复制链接</div>
                <div className="share-option-desc">对方点开看完整解卦</div>
              </div>
            </button>

            <button
              className="share-option"
              onClick={handleCopyText}
              disabled={isLoading || (preparing && !shareUrl)}
            >
              <div className="share-option-icon">文</div>
              <div className="share-option-text">
                <div className="share-option-title">复制文案</div>
                <div className="share-option-desc">摘要 + 短链，发到 IM 即可</div>
              </div>
            </button>
          </div>

          {status.phase !== 'idle' && (
            <div className={`share-sheet-status ${status.phase}`}>
              {status.phase === 'loading' && '处理中…'}
              {status.phase === 'done' && `✓ ${status.message}`}
              {status.phase === 'error' && `✗ ${status.message}`}
            </div>
          )}

          <button className="share-sheet-cancel" onClick={onClose} disabled={isLoading}>
            取　消
          </button>
        </div>
      </div>
    </>
  );
}
