import type { BaselineConfig, SimResultRow, ScenarioInputs, ScenarioName } from '@/sim/types';

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

class Household {
  public income: number;
  public minSurvivalCostTrill: number;
  public disposableIncomeTrill = 0;
  public consumptionTrill = 0;

  public constructor(
    public name: string,
    private readonly mpc: number,
    minSurvivalCostTrill: number,
    baseIncomeTrill: number,
  ) {
    this.income = baseIncomeTrill;
    this.minSurvivalCostTrill = minSurvivalCostTrill;
  }

  public applyTaxes(vatRate: number, pitRate: number, subsidiesTrill: number) {
    const pitTrill = this.income * pitRate;
    this.disposableIncomeTrill = this.income - pitTrill + subsidiesTrill;
    const targetC = this.disposableIncomeTrill * this.mpc;
    this.consumptionTrill = Math.max(this.minSurvivalCostTrill, targetC);
    const goodsValue = this.consumptionTrill / (1 + vatRate);
    const vatPaidTrill = this.consumptionTrill - goodsValue;
    return { consumptionTrill: this.consumptionTrill, vatPaidTrill, pitTrill };
  }
}

class Firm {
  public constructor(private readonly citRate: number) {}

  public operate(
    totalConsumptionTrill: number,
    gForGdpTrill: number,
    nxTrill: number,
    gdpGrowthExpectation: number,
  ) {
    const revenue = totalConsumptionTrill + gForGdpTrill + nxTrill;
    const investmentTrill = revenue * 0.2 * (1 + gdpGrowthExpectation);
    const citPaidTrill = revenue * 0.15 * this.citRate;
    return { investmentTrill, citPaidTrill };
  }
}

class Government {
  public deficitTrill = 0;
  public taxRevenueTrill = 0;
  public totalSpendingTrill = 0;

  public constructor(private readonly baseGTrill: number) {}

  public calculateFinances(
    vatTrill: number,
    pitTrill: number,
    citTrill: number,
    totalSubsidiesTrill: number,
    stimGTrill: number,
  ) {
    this.taxRevenueTrill = vatTrill + pitTrill + citTrill;
    this.totalSpendingTrill = this.baseGTrill + stimGTrill + totalSubsidiesTrill;
    this.deficitTrill = this.totalSpendingTrill - this.taxRevenueTrill;
    return {
      taxRevenueTrill: this.taxRevenueTrill,
      totalSpendingTrill: this.totalSpendingTrill,
      deficitTrill: this.deficitTrill,
    };
  }

  public get baseG() {
    return this.baseGTrill;
  }
}

class MacroEconomy {
  public gdpTrill: number;
  public inflationRate: number;
  public unemploymentRate: number;
  public povertyRate: number;

  private readonly low: Household;
  private readonly mid: Household;
  private readonly high: Household;
  private readonly households: [Household, Household, Household];
  private readonly firms: Firm;
  private readonly gov: Government;
  private readonly nxTrill: number;

  public constructor(private readonly config: BaselineConfig) {
    const base = config.Baseline_Indicators;
    this.gdpTrill = base.GDP_Trillions_PHP;
    this.inflationRate = base.Inflation_Rate;
    this.unemploymentRate = base.Unemployment_Rate;
    this.povertyRate = base.Poverty_Rate;

    const households = config.ABM_Households;
    this.low = new Household(
      'Low',
      households.Low_Income.mpc,
      households.Low_Income.survival_cost_trill,
      this.gdpTrill * households.Low_Income.income_share,
    );
    this.mid = new Household(
      'Mid',
      households.Mid_Income.mpc,
      households.Mid_Income.survival_cost_trill,
      this.gdpTrill * households.Mid_Income.income_share,
    );
    this.high = new Household(
      'High',
      households.High_Income.mpc,
      households.High_Income.survival_cost_trill,
      this.gdpTrill * households.High_Income.income_share,
    );
    this.households = [this.low, this.mid, this.high];

    const fisc = config.Fiscal_Policy;
    this.firms = new Firm(fisc.CIT_Rate);
    this.gov = new Government(fisc.Gov_Base_Spending_Trill);
    this.nxTrill = fisc.Net_Exports_Trill;
  }

  public simulateYear(vatRate: number, pitRates: [number, number, number], subsidiesTrill: [number, number, number], stimGTrill: number) {
    let totalC = 0;
    let totalVat = 0;
    let totalPit = 0;
    const totalSubs = subsidiesTrill.reduce((a, b) => a + b, 0);

    this.households.forEach((h, idx) => {
      const { consumptionTrill, vatPaidTrill, pitTrill } = h.applyTaxes(vatRate, pitRates[idx], subsidiesTrill[idx]);
      totalC += consumptionTrill;
      totalVat += vatPaidTrill;
      totalPit += pitTrill;
      h.income *= 1 + this.inflationRate * 0.5;
      h.minSurvivalCostTrill *= 1 + this.inflationRate;
    });

    const gForGdpTrill = this.gov.baseG + stimGTrill;
    const { investmentTrill, citPaidTrill } = this.firms.operate(totalC, gForGdpTrill, this.nxTrill, 0.05);
    const { taxRevenueTrill, totalSpendingTrill, deficitTrill } = this.gov.calculateFinances(
      totalVat,
      totalPit,
      citPaidTrill,
      totalSubs,
      stimGTrill,
    );

    const newGdpTrill = totalC + investmentTrill + gForGdpTrill + this.nxTrill;
    const gdpGrowth = (newGdpTrill - this.gdpTrill) / this.gdpTrill;

    this.unemploymentRate -= (gdpGrowth - 0.04) * 0.4;
    this.unemploymentRate = Math.max(0.03, this.unemploymentRate);

    if (gdpGrowth > 0.06) this.inflationRate += 0.01;
    else if (gdpGrowth < 0.03) this.inflationRate -= 0.005;

    if (this.low.disposableIncomeTrill < this.low.minSurvivalCostTrill) this.povertyRate += 0.02;

    this.gdpTrill = newGdpTrill;

    return {
      economySizeTrill: round2(this.gdpTrill),
      growthPct: round2(gdpGrowth * 100),
      unemploymentPct: round2(this.unemploymentRate * 100),
      povertyPct: round2(this.povertyRate * 100),
      govRevenueTrill: round2(taxRevenueTrill),
      govSpendingTrill: round2(totalSpendingTrill),
      govDeficitTrill: round2(deficitTrill),
      poorSpendingPowerTrill: round2(this.low.disposableIncomeTrill),
    };
  }
}

export function runScenario(name: ScenarioName, years: number, inputs: ScenarioInputs, config: BaselineConfig): SimResultRow[] {
  const economy = new MacroEconomy(config);
  const results: SimResultRow[] = [];
  for (let y = 0; y < years; y += 1) {
    const r = economy.simulateYear(inputs.vatRate, inputs.pitRates, inputs.subsidiesTrill, inputs.stimulusTrill);
    results.push({
      year: y + 1,
      scenario: name,
      ...r,
    });
  }
  return results;
}

