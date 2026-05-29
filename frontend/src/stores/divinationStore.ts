import { create } from 'zustand';
import type { HexagramData, Line } from '@/types/hexagram';

interface DivinationState {
  question: string;
  setQuestion: (q: string) => void;

  lines: Line[];
  setLines: (lines: Line[]) => void;
  addLine: (line: Line) => void;
  resetLines: () => void;

  primaryHexagram: HexagramData | null;
  changedHexagram: HexagramData | null;
  setHexagrams: (primary: HexagramData | null, changed: HexagramData | null) => void;

  interpretation: string;
  appendInterpretation: (chunk: string) => void;
  resetInterpretation: () => void;

  reset: () => void;
}

export const useDivinationStore = create<DivinationState>((set) => ({
  question: '',
  setQuestion: (q) => set({ question: q }),

  lines: [],
  setLines: (lines) => set({ lines }),
  addLine: (line) =>
    set((s) => ({ lines: [...s.lines, line].sort((a, b) => a.position - b.position) })),
  resetLines: () => set({ lines: [] }),

  primaryHexagram: null,
  changedHexagram: null,
  setHexagrams: (primary, changed) =>
    set({ primaryHexagram: primary, changedHexagram: changed }),

  interpretation: '',
  appendInterpretation: (chunk) =>
    set((s) => ({ interpretation: s.interpretation + chunk })),
  resetInterpretation: () => set({ interpretation: '' }),

  reset: () =>
    set({
      lines: [],
      primaryHexagram: null,
      changedHexagram: null,
      interpretation: '',
    }),
}));
