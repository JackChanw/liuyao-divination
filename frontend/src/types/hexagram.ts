// 卦象核心类型
export type LineValue = 6 | 7 | 8 | 9;
// 6=老阴(动) 7=少阳(静) 8=少阴(静) 9=老阳(动)

export type Polarity = 'yang' | 'yin';
export type LinePosition = 1 | 2 | 3 | 4 | 5 | 6;

export interface Line {
  value: LineValue;
  polarity: Polarity;
  isChanging: boolean;
  position: LinePosition;
}

export interface YaoCi {
  position: number;
  title: string;
  text: string;
}

export interface HexagramData {
  id: number;
  name: string;
  chinese_name: string;
  symbol: string;
  binary_code: string;
  guaci: string;
  tuan: string;
  xiang: string;
  yaoci: YaoCi[];
}

export interface DivinationResult {
  question: string;
  lines: Line[];
  primaryHexagram: HexagramData;
  changedHexagram?: HexagramData;
  changingLines: number[];
}

// 工具：根据爻值生成 Line
export function buildLine(value: LineValue, position: LinePosition): Line {
  const polarity: Polarity = value === 7 || value === 9 ? 'yang' : 'yin';
  return {
    value,
    polarity,
    isChanging: value === 6 || value === 9,
    position,
  };
}

// 六爻 → 本卦 binary_code (index 0 = 初爻)
export function linesToBinary(lines: Line[]): string {
  const sorted = [...lines].sort((a, b) => a.position - b.position);
  return sorted.map(l => (l.polarity === 'yang' ? '1' : '0')).join('');
}

// 六爻 → 变卦 binary_code（动爻取反）
export function linesToChangedBinary(lines: Line[]): string | null {
  const sorted = [...lines].sort((a, b) => a.position - b.position);
  if (!sorted.some(l => l.isChanging)) return null;
  return sorted
    .map(l => {
      if (l.isChanging) {
        return l.polarity === 'yang' ? '0' : '1';
      }
      return l.polarity === 'yang' ? '1' : '0';
    })
    .join('');
}
