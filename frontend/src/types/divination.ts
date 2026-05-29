// 占卜流程类型
export type DivinationPhase =
  | 'idle'           // 待开始
  | 'preparing'      // 准备 49 根蓍草
  | 'round-active'   // 当前轮进行中
  | 'all-done'       // 六爻完成，进入解卦
  | 'interpreting'   // AI 解卦流式中
  | 'finished';      // 解卦完成

export type ChangeStep =
  | 'pre-split'      // 准备分堆
  | 'split'          // 已分左右
  | 'right-aside'    // 右堆挂一
  | 'count-left'     // 数左堆
  | 'count-right'    // 数右堆
  | 'change-done';   // 本变完成

export interface YarrowChangeState {
  changeNumber: 1 | 2 | 3;
  availableBefore: number;
  leftPile: number;
  rightPile: number;
  asideOne: number;
  leftRemainder: number;
  rightRemainder: number;
  asideTotal: number;
  availableAfter: number;
  step: ChangeStep;
}

export interface YarrowRoundState {
  roundNumber: number; // 1~6
  changes: YarrowChangeState[];
  finalValue?: 6 | 7 | 8 | 9;
}
