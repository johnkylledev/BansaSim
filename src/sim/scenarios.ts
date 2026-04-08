import type { BaselineConfig, ScenarioInputs, ScenarioName, SimResultRow } from '@/sim/types';
import { runScenario } from '@/sim/engine';

export type PolicyControls = {
  vatRatePct: number;
  cashAidPerMonthPhp: number;
  infraBudgetBillionPhp: number;
  wealthyTaxBumpPct: number;
};

export function cashAidTrillionsPerYear(cashAidPerMonthPhp: number) {
  const poorFamilies = 4_100_000;
  return (cashAidPerMonthPhp * 12 * poorFamilies) / 1_000_000_000_000;
}

export function buildScenarios(config: BaselineConfig, controls: PolicyControls) {
  const baseVat = config.Fiscal_Policy.VAT_Rate;

  const baseline: ScenarioInputs = {
    vatRate: baseVat,
    pitRates: [0, 0.2, 0.3],
    subsidiesTrill: [0, 0, 0],
    stimulusTrill: 0,
  };

  const austerity: ScenarioInputs = {
    vatRate: 0.15,
    pitRates: [0, 0.2, 0.3],
    subsidiesTrill: [0, 0, 0],
    stimulusTrill: 0,
  };

  const ayudaTrill = cashAidTrillionsPerYear(controls.cashAidPerMonthPhp);
  const stimulusTrill = controls.infraBudgetBillionPhp / 1000;
  const custom: ScenarioInputs = {
    vatRate: controls.vatRatePct / 100,
    pitRates: [0, 0.2, 0.3 + controls.wealthyTaxBumpPct / 100],
    subsidiesTrill: [ayudaTrill, 0, 0],
    stimulusTrill,
  };

  return {
    baseline,
    austerity,
    custom,
    ayudaTrill,
    stimulusTrill,
  };
}

export function runAllScenarios(config: BaselineConfig, controls: PolicyControls): SimResultRow[] {
  const { baseline, austerity, custom } = buildScenarios(config, controls);
  return [
    ...runScenario('Baseline', 5, baseline, config),
    ...runScenario('Austerity', 5, austerity, config),
    ...runScenario('Custom', 5, custom, config),
  ];
}

export const SCENARIO_LABEL: Record<ScenarioName, string> = {
  Baseline: 'Baseline (12% VAT, No changes)',
  Austerity: 'Austerity (15% VAT, No Help)',
  Custom: 'Your Custom Policy',
};

export const SCENARIO_COLOR: Record<ScenarioName, string> = {
  Baseline: '#3b82f6', // blue-500
  Austerity: '#ef4444', // red-500
  Custom: '#9333ea', // purple-600
};

