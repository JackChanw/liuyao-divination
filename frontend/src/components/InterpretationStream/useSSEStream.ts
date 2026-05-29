import { useCallback, useRef, useState } from 'react';

interface SSEMessage {
  event: 'meta' | 'delta' | 'done' | 'error';
  content?: string;
  message?: string;
  primary?: unknown;
  changed?: unknown;
}

interface UseSSEStreamOptions {
  onMeta?: (msg: SSEMessage) => void;
  onDelta?: (chunk: string) => void;
  onDone?: () => void;
  onError?: (err: string) => void;
}

interface StartParams {
  url: string;
  body: unknown;
}

export function useSSEStream(opts: UseSSEStreamOptions = {}) {
  const [status, setStatus] = useState<'idle' | 'streaming' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const start = useCallback(
    async ({ url, body }: StartParams) => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setStatus('streaming');
      setError(null);

      try {
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: ctrl.signal,
        });
        if (!resp.ok || !resp.body) {
          const txt = await resp.text().catch(() => '');
          throw new Error(`HTTP ${resp.status}: ${txt}`);
        }
        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          // 拆分 SSE：以 \n\n 分隔
          let idx: number;
          while ((idx = buffer.indexOf('\n\n')) >= 0) {
            const raw = buffer.slice(0, idx);
            buffer = buffer.slice(idx + 2);
            // 去掉 "data: " 前缀
            const dataLines = raw
              .split('\n')
              .filter((l) => l.startsWith('data:'))
              .map((l) => l.slice(5).trim());
            const dataStr = dataLines.join('');
            if (!dataStr) continue;
            try {
              const msg: SSEMessage = JSON.parse(dataStr);
              if (msg.event === 'delta' && msg.content) {
                opts.onDelta?.(msg.content);
              } else if (msg.event === 'meta') {
                opts.onMeta?.(msg);
              } else if (msg.event === 'done') {
                setStatus('done');
                opts.onDone?.();
              } else if (msg.event === 'error') {
                throw new Error(msg.message || 'unknown stream error');
              }
            } catch (parseErr) {
              // 单条解析失败不中断整体流
              console.warn('[SSE] parse failed:', parseErr, dataStr);
            }
          }
        }
        setStatus('done');
        opts.onDone?.();
      } catch (e: unknown) {
        if ((e as Error).name === 'AbortError') return;
        const msg = (e as Error).message || String(e);
        setError(msg);
        setStatus('error');
        opts.onError?.(msg);
      }
    },
    [opts],
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  return { status, error, start, cancel };
}
