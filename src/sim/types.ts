export type BaselineConfig = {
  Metadata: {
    Source: string;
    Date_Scraped: string;
    Description: string;
  };
  Baseline_Indicators: {
    GDP_Trillions_PHP: number;
    Inflation_Rate: number;
    Unemployment_Rate: number;
    Poverty_Rate: number;
  };
  ABM_Households: {
    Low_Income: HouseholdConfig;
    Mid_Income: HouseholdConfig;
    High_Income: HouseholdConfig;
  };
  Fiscal_Policy: {
    VAT_Rate: number;
    CIT_Rate: number;
    Gov_Base_Spending_Trill: number;
    Net_Exports_Trill: number;
  };
};

export type HouseholdConfig = {
  pop_share: number;
  income_share: number;
  mpc: number;
  survival_cost_trill: number;
};

export type ScenarioInputs = {
  vatRate: number;
  pitRates: [number, number, number];
  subsidiesTrill: [number, number, number];
  stimulusTrill: number;
};

export type ScenarioName = 'Baseline' | 'Austerity' | 'Custom';

export type SimResultRow = {
  year: number;
  scenario: ScenarioName;
  economySizeTrill: number;
  growthPct: number;
  unemploymentPct: number;
  povertyPct: number;
  govRevenueTrill: number;
  govSpendingTrill: number;
  govDeficitTrill: number;
  nationalDebtTrill: number;
  debtToGdpPct: number;
  poorSpendingPowerTrill: number;
};

export type CitationEntry = {
  id: string;
  label: number;
  title: string;
  publisher?: string;
  url?: string;
  accessed?: string;
  note?: string;
};

