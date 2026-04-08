import { create } from 'zustand';
import type { BaselineConfig } from '@/sim/types';

export type SimState = {
  baseline: BaselineConfig | null;
  baselineError: string | null;
  baselineLoading: boolean;
  vatRatePct: number;
  cashAidPerMonthPhp: number;
  infraBudgetBillionPhp: number;
  wealthyTaxBumpPct: number;
  loadBaseline: () => Promise<void>;
  setVatRatePct: (v: number) => void;
  setCashAidPerMonthPhp: (v: number) => void;
  setInfraBudgetBillionPhp: (v: number) => void;
  setWealthyTaxBumpPct: (v: number) => void;
};

export const useSimStore = create<SimState>((set, get) => ({
  baseline: null,
  baselineError: null,
  baselineLoading: false,
  vatRatePct: 12,
  cashAidPerMonthPhp: 0,
  infraBudgetBillionPhp: 0,
  wealthyTaxBumpPct: 0,
  loadBaseline: async () => {
    const { baselineLoading } = get();
    if (baselineLoading) return;
    set({ baselineLoading: true, baselineError: null });
    try {
      const res = await fetch('/data/psa_2026_baseline.json');
      if (!res.ok) throw new Error(`Failed to load baseline data: ${res.status}`);
      const json = (await res.json()) as BaselineConfig;
      set({ baseline: json, baselineLoading: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load baseline data';
      set({ baselineError: msg, baselineLoading: false });
    }
  },
  setVatRatePct: (v) => set({ vatRatePct: v }),
  setCashAidPerMonthPhp: (v) => set({ cashAidPerMonthPhp: v }),
  setInfraBudgetBillionPhp: (v) => set({ infraBudgetBillionPhp: v }),
  setWealthyTaxBumpPct: (v) => set({ wealthyTaxBumpPct: v }),
}));

