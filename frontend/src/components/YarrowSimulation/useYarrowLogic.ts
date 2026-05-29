import { useCallback, useMemo, useState } from 'react';
import type { LineValue, LinePosition, Line } from '@/types/hexagram';
import { buildLine } from '@/types/hexagram';

// 状态机 step
export type YarrowStep =
  | 'idle'         // 等待用户点击"分蓍"
  | 'splitting'    // 分堆动画中
  | 'split-done'   // 已分好，显示左/右堆
  | 'count'        // 数蓍动画
  | 'change-done'  // 本变完成，显示置旁数
  | 'round-done'   // 三变完成，爻已出现
  | 'all-done';    // 六爻齐备

export interface ChangeRecord {
  changeNumber: 1 | 2 | 3;
  availableBefore: number;
  leftPile: number;
  rightPile: number;
  asideOne: number;
  leftRemainder: number;
  rightRemainder: number;
  asideTotal: number;
  availableAfter: number;
}

function performOneChange(
  available: number,
  changeNumber: 1 | 2 | 3,
): ChangeRecord {
  const left = Math.floor(Math.random() * (available - 1)) + 1;
  const right = available - left;
  const asideOne = 1;
  const rightAfter = right - 1;
  const leftRemainder = left % 4 === 0 ? 4 : left % 4;
  const rightRemainder = rightAfter % 4 === 0 ? 4 : rightAfter % 4;
  const asideTotal = asideOne + leftRemainder + rightRemainder;
  // 第一变约束：5 或 9；第二三变：4 或 8
  // 数学上自动满足，无需 retry
  return {
    changeNumber,
    availableBefore: available,
    leftPile: left,
    rightPile: right,
    asideOne,
    leftRemainder,
    rightRemainder,
    asideTotal,
    availableAfter: available - asideTotal,
  };
}

interface UseYarrowOptions {
  onLineComplete?: (line: Line) => void;
  onAllComplete?: (lines: Line[]) => void;
}

export function useYarrowLogic(opts: UseYarrowOptions = {}) {
  const [roundIndex, setRoundIndex] = useState(0); // 0~5
  const [step, setStep] = useState<YarrowStep>('idle');
  const [available, setAvailable] = useState(49);
  const [changeIdx, setChangeIdx] = useState<0 | 1 | 2>(0);
  const [currentChange, setCurrentChange] = useState<ChangeRecord | null>(null);
  const [roundChanges, setRoundChanges] = useState<ChangeRecord[]>([]);
  const [allLines, setAllLines] = useState<Line[]>([]);

  const totalRounds = 6;
  const isFinished = step === 'all-done';

  // 触发"分蓍"
  const handleSplit = useCallback(() => {
    if (step !== 'idle') return;
    setStep('splitting');
    const change = performOneChange(available, (changeIdx + 1) as 1 | 2 | 3);
    setCurrentChange(change);
    // 分堆动画 ~800ms
    window.setTimeout(() => {
      setStep('split-done');
    }, 800);
  }, [step, available, changeIdx]);

  // 触发"数蓍"
  const handleCount = useCallback(() => {
    if (step !== 'split-done' || !currentChange) return;
    setStep('count');
    window.setTimeout(() => {
      setStep('change-done');
    }, 1200);
  }, [step, currentChange]);

  // 进入下一变 / 下一爻
  const handleNext = useCallback(() => {
    if (step !== 'change-done' || !currentChange) return;

    const nextRoundChanges = [...roundChanges, currentChange];
    const nextAvailable = currentChange.availableAfter;

    if (changeIdx < 2) {
      // 进入下一变
      setRoundChanges(nextRoundChanges);
      setAvailable(nextAvailable);
      setChangeIdx((changeIdx + 1) as 0 | 1 | 2);
      setCurrentChange(null);
      setStep('idle');
      return;
    }

    // 三变完成，得本爻
    const finalValue = (nextAvailable / 4) as LineValue;
    const position = (roundIndex + 1) as LinePosition;
    const line = buildLine(finalValue, position);
    const newLines = [...allLines, line];
    setAllLines(newLines);
    opts.onLineComplete?.(line);

    setStep('round-done');

    // 1.6s 后进入下一爻 / 全部完成
    window.setTimeout(() => {
      if (roundIndex >= totalRounds - 1) {
        setStep('all-done');
        opts.onAllComplete?.(newLines);
      } else {
        // 下一爻：重置
        setRoundIndex(roundIndex + 1);
        setAvailable(49);
        setChangeIdx(0);
        setCurrentChange(null);
        setRoundChanges([]);
        setStep('idle');
      }
    }, 1600);
  }, [step, currentChange, roundChanges, changeIdx, roundIndex, allLines, opts]);

  const reset = useCallback(() => {
    setRoundIndex(0);
    setStep('idle');
    setAvailable(49);
    setChangeIdx(0);
    setCurrentChange(null);
    setRoundChanges([]);
    setAllLines([]);
  }, []);

  const view = useMemo(
    () => ({
      roundIndex,
      roundNumber: roundIndex + 1,
      changeNumber: (changeIdx + 1) as 1 | 2 | 3,
      step,
      available,
      currentChange,
      roundChanges,
      allLines,
      totalRounds,
      isFinished,
    }),
    [roundIndex, changeIdx, step, available, currentChange, roundChanges, allLines, isFinished],
  );

  return {
    ...view,
    handleSplit,
    handleCount,
    handleNext,
    reset,
  };
}
