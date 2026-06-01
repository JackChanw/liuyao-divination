// 64 卦轻量索引：仅含 binary_code → {id, name, chineseName, symbol}
// 完整数据通过 API GET /api/hexagram/{id} 获取
//
// binary_code 约定：6 位字符串，index 0 = 初爻（最下），index 5 = 上爻（最上）
//
// 此处提供查询表，方便前端在 AI 流式解卦尚未完成前先展示卦名/卦符

export interface HexagramIndexEntry {
  id: number;
  name: string;
  chineseName: string;
  symbol: string;
}

export const HEXAGRAM_INDEX: Record<string, HexagramIndexEntry> = {
  '111111': { id: 1, name: '乾', chineseName: '乾为天', symbol: '䷀' },
  '000000': { id: 2, name: '坤', chineseName: '坤为地', symbol: '䷁' },
  '100010': { id: 3, name: '屯', chineseName: '水雷屯', symbol: '䷂' },
  '010001': { id: 4, name: '蒙', chineseName: '山水蒙', symbol: '䷃' },
  '111010': { id: 5, name: '需', chineseName: '水天需', symbol: '䷄' },
  '010111': { id: 6, name: '讼', chineseName: '天水讼', symbol: '䷅' },
  '010000': { id: 7, name: '师', chineseName: '地水师', symbol: '䷆' },
  '000010': { id: 8, name: '比', chineseName: '水地比', symbol: '䷇' },
  '111011': { id: 9, name: '小畜', chineseName: '风天小畜', symbol: '䷈' },
  '110111': { id: 10, name: '履', chineseName: '天泽履', symbol: '䷉' },
  '111000': { id: 11, name: '泰', chineseName: '地天泰', symbol: '䷊' },
  '000111': { id: 12, name: '否', chineseName: '天地否', symbol: '䷋' },
  '101111': { id: 13, name: '同人', chineseName: '天火同人', symbol: '䷌' },
  '111101': { id: 14, name: '大有', chineseName: '火天大有', symbol: '䷍' },
  '001000': { id: 15, name: '谦', chineseName: '地山谦', symbol: '䷎' },
  '000100': { id: 16, name: '豫', chineseName: '雷地豫', symbol: '䷏' },
  '100110': { id: 17, name: '随', chineseName: '泽雷随', symbol: '䷐' },
  '011001': { id: 18, name: '蛊', chineseName: '山风蛊', symbol: '䷑' },
  '110000': { id: 19, name: '临', chineseName: '地泽临', symbol: '䷒' },
  '000011': { id: 20, name: '观', chineseName: '风地观', symbol: '䷓' },
  '100101': { id: 21, name: '噬嗑', chineseName: '火雷噬嗑', symbol: '䷔' },
  '101001': { id: 22, name: '贲', chineseName: '山火贲', symbol: '䷕' },
  '000001': { id: 23, name: '剥', chineseName: '山地剥', symbol: '䷖' },
  '100000': { id: 24, name: '复', chineseName: '地雷复', symbol: '䷗' },
  '100111': { id: 25, name: '无妄', chineseName: '天雷无妄', symbol: '䷘' },
  '111001': { id: 26, name: '大畜', chineseName: '山天大畜', symbol: '䷙' },
  '100001': { id: 27, name: '颐', chineseName: '山雷颐', symbol: '䷚' },
  '011110': { id: 28, name: '大过', chineseName: '泽风大过', symbol: '䷛' },
  '010010': { id: 29, name: '坎', chineseName: '坎为水', symbol: '䷜' },
  '101101': { id: 30, name: '离', chineseName: '离为火', symbol: '䷝' },
  '001110': { id: 31, name: '咸', chineseName: '泽山咸', symbol: '䷞' },
  '011100': { id: 32, name: '恒', chineseName: '雷风恒', symbol: '䷟' },
  '001111': { id: 33, name: '遁', chineseName: '天山遁', symbol: '䷠' },
  '111100': { id: 34, name: '大壮', chineseName: '雷天大壮', symbol: '䷡' },
  '000101': { id: 35, name: '晋', chineseName: '火地晋', symbol: '䷢' },
  '101000': { id: 36, name: '明夷', chineseName: '地火明夷', symbol: '䷣' },
  '101011': { id: 37, name: '家人', chineseName: '风火家人', symbol: '䷤' },
  '110101': { id: 38, name: '睽', chineseName: '火泽睽', symbol: '䷥' },
  '001010': { id: 39, name: '蹇', chineseName: '水山蹇', symbol: '䷦' },
  '010100': { id: 40, name: '解', chineseName: '雷水解', symbol: '䷧' },
  '110001': { id: 41, name: '损', chineseName: '山泽损', symbol: '䷨' },
  '100011': { id: 42, name: '益', chineseName: '风雷益', symbol: '䷩' },
  '111110': { id: 43, name: '夬', chineseName: '泽天夬', symbol: '䷪' },
  '011111': { id: 44, name: '姤', chineseName: '天风姤', symbol: '䷫' },
  '000110': { id: 45, name: '萃', chineseName: '泽地萃', symbol: '䷬' },
  '011000': { id: 46, name: '升', chineseName: '地风升', symbol: '䷭' },
  '010110': { id: 47, name: '困', chineseName: '泽水困', symbol: '䷮' },
  '011010': { id: 48, name: '井', chineseName: '水风井', symbol: '䷯' },
  '101110': { id: 49, name: '革', chineseName: '泽火革', symbol: '䷰' },
  '011101': { id: 50, name: '鼎', chineseName: '火风鼎', symbol: '䷱' },
  '100100': { id: 51, name: '震', chineseName: '震为雷', symbol: '䷲' },
  '001001': { id: 52, name: '艮', chineseName: '艮为山', symbol: '䷳' },
  '001011': { id: 53, name: '渐', chineseName: '风山渐', symbol: '䷴' },
  '110100': { id: 54, name: '归妹', chineseName: '雷泽归妹', symbol: '䷵' },
  '101100': { id: 55, name: '丰', chineseName: '雷火丰', symbol: '䷶' },
  '001101': { id: 56, name: '旅', chineseName: '火山旅', symbol: '䷷' },
  '011011': { id: 57, name: '巽', chineseName: '巽为风', symbol: '䷸' },
  '110110': { id: 58, name: '兑', chineseName: '兑为泽', symbol: '䷹' },
  '010011': { id: 59, name: '涣', chineseName: '风水涣', symbol: '䷺' },
  '110010': { id: 60, name: '节', chineseName: '水泽节', symbol: '䷻' },
  '110011': { id: 61, name: '中孚', chineseName: '风泽中孚', symbol: '䷼' },
  '001100': { id: 62, name: '小过', chineseName: '雷山小过', symbol: '䷽' },
  '101010': { id: 63, name: '既济', chineseName: '水火既济', symbol: '䷾' },
  '010101': { id: 64, name: '未济', chineseName: '火水未济', symbol: '䷿' },
};

export function lookupByBinary(binary: string): HexagramIndexEntry | null {
  return HEXAGRAM_INDEX[binary] ?? null;
}

let _byIdCache: Map<number, HexagramIndexEntry> | null = null;
export function lookupById(id: number): HexagramIndexEntry | null {
  if (!_byIdCache) {
    _byIdCache = new Map();
    for (const entry of Object.values(HEXAGRAM_INDEX)) {
      _byIdCache.set(entry.id, entry);
    }
  }
  return _byIdCache.get(id) ?? null;
}
