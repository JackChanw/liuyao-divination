import { useEffect, useMemo, useState } from 'react';
import type { Line } from '@/types/hexagram';
import LineSymbol from '@/components/HexagramDisplay/LineSymbol';
import '@/components/HexagramDisplay/LineSymbol.css';
import InkButton from '@/components/common/InkButton';
import InfoTip from '@/components/common/InfoTip';
import { useYarrowLogic } from './useYarrowLogic';
import './YarrowSimulation.css';

interface Props {
  onComplete: (lines: Line[]) => void;
}

// 静态的蓍草分布。每根蓍草有相对位置 + 旋转
interface Stalk {
  id: number;
  side: 'pool' | 'left' | 'right' | 'aside';
  // 位置在容器中的百分比
  x: number;
  y: number;
  rotation: number;
}

function generateStalks(n: number): Stalk[] {
  const stalks: Stalk[] = [];
  for (let i = 0; i < n; i++) {
    stalks.push({
      id: i,
      side: 'pool',
      x: 30 + Math.random() * 40,
      y: 30 + Math.random() * 40,
      rotation: Math.random() * 360,
    });
  }
  return stalks;
}

export default function YarrowSimulation({ onComplete }: Props) {
  const yarrow = useYarrowLogic({ onAllComplete: onComplete });

  // 当前 49 根蓍草的视觉位置
  const [stalks, setStalks] = useState<Stalk[]>(() => generateStalks(49));

  // 每次"available"变化时重新生成对应数量蓍草
  useEffect(() => {
    if (yarrow.step === 'idle') {
      setStalks(generateStalks(yarrow.available));
    }
  }, [yarrow.step, yarrow.available]);

  // splitting → 把 stalks 分到 left / right
  useEffect(() => {
    if (yarrow.step === 'splitting' && yarrow.currentChange) {
      const left = yarrow.currentChange.leftPile;
      setStalks((prev) =>
        prev.map((s, i) => ({
          ...s,
          side: i < left ? 'left' : 'right',
          // 飞向左/右
          x: i < left ? 18 + Math.random() * 22 : 60 + Math.random() * 22,
          y: 25 + Math.random() * 50,
          rotation: i < left ? -85 + Math.random() * 30 : 65 + Math.random() * 30,
        })),
      );
    }
  }, [yarrow.step, yarrow.currentChange]);

  // count → 把"置旁"的根数飞到 aside
  useEffect(() => {
    if (yarrow.step === 'count' && yarrow.currentChange) {
      const c = yarrow.currentChange;
      // 取 1 from right + leftRem from left + rightRem from right
      const totalAside = c.asideTotal;
      // 简化：随机选 totalAside 根（按规则左堆抽 leftRem，右堆抽 rightRem+1）飞到 aside 区
      setStalks((prev) => {
        const left = prev.filter((s) => s.side === 'left');
        const right = prev.filter((s) => s.side === 'right');
        const asideFromLeft = left.slice(0, c.leftRemainder).map((s) => s.id);
        const asideFromRight = right.slice(0, c.rightRemainder + c.asideOne).map((s) => s.id);
        const asideIds = new Set([...asideFromLeft, ...asideFromRight]);
        // 防御：确保数量正确
        if (asideIds.size !== totalAside) {
          // fallback: 取前 totalAside 根
          const allIds = prev.map((s) => s.id);
          for (const id of allIds.slice(0, totalAside)) asideIds.add(id);
        }
        return prev.map((s) => {
          if (asideIds.has(s.id)) {
            return {
              ...s,
              side: 'aside',
              x: 80 + Math.random() * 12,
              y: 8 + Math.random() * 12,
              rotation: -10 + Math.random() * 20,
            };
          }
          return s;
        });
      });
    }
  }, [yarrow.step, yarrow.currentChange]);

  const stepLabel = useMemo(() => {
    if (yarrow.step === 'all-done') return '六爻齐备';
    if (yarrow.step === 'round-done') return `第 ${yarrow.roundNumber} 爻已成`;
    return `第 ${yarrow.roundNumber} 爻 · 第 ${yarrow.changeNumber} 变`;
  }, [yarrow.step, yarrow.roundNumber, yarrow.changeNumber]);

  const stepTip = useMemo(() => {
    switch (yarrow.step) {
      case 'idle':
        return '把手中蓍草随机分成左右两堆（"分二"），每堆至少 1 根。';
      case 'splitting':
        return '蓍草正在分入左右两堆…';
      case 'split-done':
        return '从右堆取一根置于一旁（"挂一"），再左右各以四根为一组数（"揲四"），余数置旁。';
      case 'count':
        return '正在数蓍——左堆 mod 4、右堆 mod 4，余 0 记为 4。';
      case 'change-done':
        return `本变结束，置旁 ${yarrow.currentChange?.asideTotal ?? '?'} 根。第一变必为 5/9，二三变必为 4/8。`;
      case 'round-done':
        return '三变得本爻：余 36→9（老阳·动），32→8（少阴），28→7（少阳），24→6（老阴·动）。';
      case 'all-done':
        return '十有八变而成卦，本卦已现。';
      default:
        return '';
    }
  }, [yarrow.step, yarrow.currentChange]);

  const actionButton = (() => {
    switch (yarrow.step) {
      case 'idle':
        return (
          <InkButton onClick={yarrow.handleSplit}>
            分　蓍
          </InkButton>
        );
      case 'splitting':
        return <InkButton disabled>分　蓍 …</InkButton>;
      case 'split-done':
        return <InkButton onClick={yarrow.handleCount}>揲　四</InkButton>;
      case 'count':
        return <InkButton disabled>揲　四 …</InkButton>;
      case 'change-done':
        return (
          <InkButton onClick={yarrow.handleNext}>
            {yarrow.changeNumber < 3 ? '下一变' : '成爻'}
          </InkButton>
        );
      case 'round-done':
        return <InkButton disabled>爻象呈现…</InkButton>;
      case 'all-done':
        return <InkButton disabled>六爻齐备</InkButton>;
      default:
        return null;
    }
  })();

  return (
    <div className="yarrow-sim">
      <div className="yarrow-header">
        <span className="yarrow-stage">
          {stepLabel}
          <InfoTip text={stepTip} />
        </span>
        <span className="yarrow-meta">余蓍 {yarrow.available}</span>
      </div>

      <div className="yarrow-stage-wrap">
        <div className="yarrow-zone yarrow-zone-aside">
          <span className="zone-label">
            挂　一
            <InfoTip text="本变置旁的总根数 = 1（挂一）+ 左堆 mod 4 + 右堆 mod 4。" />
          </span>
          {yarrow.currentChange && yarrow.step !== 'idle' && yarrow.step !== 'splitting' && (
            <div className="aside-num">{yarrow.currentChange.asideTotal}</div>
          )}
        </div>

        <div className="yarrow-zone yarrow-zone-left">
          <span className="zone-label">
            左　堆
            <InfoTip text="分二之后的左堆。四根一组数，余数置旁。" />
          </span>
          {yarrow.currentChange && (yarrow.step === 'split-done' || yarrow.step === 'count' || yarrow.step === 'change-done') && (
            <div className="pile-num">{yarrow.currentChange.leftPile}</div>
          )}
        </div>

        <div className="yarrow-zone yarrow-zone-right">
          <span className="zone-label">
            右　堆
            <InfoTip text="分二之后的右堆。先取一根挂一，剩余四根一组数。" />
          </span>
          {yarrow.currentChange && (yarrow.step === 'split-done' || yarrow.step === 'count' || yarrow.step === 'change-done') && (
            <div className="pile-num">{yarrow.currentChange.rightPile}</div>
          )}
        </div>

        {/* 蓍草 */}
        {stalks.map((s) => (
          <div
            key={s.id}
            className={`stalk side-${s.side}`}
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              transform: `rotate(${s.rotation}deg)`,
            }}
          />
        ))}

        {/* 当前出现的爻 */}
        {yarrow.step === 'round-done' && yarrow.allLines.length > 0 && (
          <div className="round-yao-overlay">
            <LineSymbol
              line={yarrow.allLines[yarrow.allLines.length - 1]}
              showChangingMark
            />
            <span className="yao-value">{yarrow.allLines[yarrow.allLines.length - 1].value}</span>
          </div>
        )}
      </div>

      {/* 已成之爻：纵向展示，从下到上 */}
      <div className="lines-progress">
        <span className="progress-label">爻象渐成</span>
        <div className="lines-stack">
          {[6, 5, 4, 3, 2, 1].map((pos) => {
            const line = yarrow.allLines.find((l) => l.position === pos);
            return (
              <div className="stack-row" key={pos}>
                {line ? (
                  <LineSymbol line={line} showChangingMark width={120} height={22} />
                ) : (
                  <div className="placeholder-line" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="yarrow-actions">{actionButton}</div>

      {/* 当前变记录 */}
      {yarrow.currentChange && yarrow.step === 'change-done' && (
        <div className="change-record">
          {yarrow.changeNumber} 变 · 置旁 {yarrow.currentChange.asideTotal} 根 · 余 {yarrow.currentChange.availableAfter}
        </div>
      )}
    </div>
  );
}
