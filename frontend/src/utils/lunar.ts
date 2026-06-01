import { Solar } from 'lunar-typescript';

/**
 * 输出形如"丙午年五月十七"的农历落款。
 * 失败时降级为公历短文本。
 */
export function formatLunarDate(date: Date): string {
  try {
    const solar = Solar.fromDate(date);
    const lunar = solar.getLunar();
    return `${lunar.getYearInGanZhi()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
  } catch {
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  }
}
