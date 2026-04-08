import { useEffect, useMemo } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { ScenarioLineChart } from '@/components/ScenarioLineChart';
import { CitationChip } from '@/components/CitationChip';
import { useSimStore } from '@/store/simStore';
import { runAllScenarios, SCENARIO_LABEL } from '@/sim/scenarios';
import { formatNumber } from '@/lib/format';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ScenarioName } from '@/sim/types';
import { Settings2, Percent, Coins, Building2, TrendingUp, Activity, Trophy, Landmark, Info } from 'lucide-react';

function DiffCard({ title, diff, customVal, unit, inverse }: { title: string; diff: number; customVal: number; unit: string; inverse?: boolean }) {
  const isZero = Math.abs(diff) < 0.005; // Treat very small numbers as 0
  const isPositive = diff > 0;
  
  // By default (e.g. GDP Growth), positive is good (emerald), negative is bad (red)
  // If inverse (e.g. Poverty, Unemployment, Debt), negative is good (emerald), positive is bad (red)
  let colorClass = 'text-slate-400'; // neutral for zero
  let bgClass = 'bg-slate-50/50';
  if (!isZero) {
    if (inverse) {
      colorClass = isPositive ? 'text-red-600' : 'text-emerald-600';
      bgClass = isPositive ? 'bg-red-50' : 'bg-emerald-50';
    } else {
      colorClass = isPositive ? 'text-emerald-600' : 'text-red-600';
      bgClass = isPositive ? 'bg-emerald-50' : 'bg-red-50';
    }
  }

  const sign = isZero ? '' : isPositive ? '+' : '-';
  const displayDiff = isZero ? '0.00' : Math.abs(diff).toFixed(2);
  const displayVal = customVal.toFixed(2);
  
  const unitStr = unit === 'pct' ? '%' : unit === 'trill' ? 'T' : '';
  const prefix = unit === 'currency' || unit === 'trill' ? '₱' : '';

  return (
    <Card className="p-5 border-slate-200/60 bg-white rounded-2xl shadow-sm flex flex-col justify-between h-full hover:border-slate-300 transition-colors">
      <div className="text-[12px] font-bold text-slate-500 mb-2 uppercase tracking-wider leading-tight">{title}</div>
      <div className="flex flex-col gap-1.5">
        <div className="text-3xl font-black tracking-tight text-slate-800">
          {prefix}{displayVal}{unitStr}
        </div>
        <div className="flex items-center">
          <div className={`text-[12px] font-bold px-2 py-0.5 rounded-md ${colorClass} ${bgClass}`}>
            {sign}{displayDiff}{unitStr} vs baseline
          </div>
        </div>
      </div>
    </Card>
  );
}

function MetricRow({ label, values, highlight }: { label: string; values: Record<ScenarioName, number>, highlight?: boolean }) {
  return (
    <TableRow className={`border-b border-slate-100/80 transition-colors ${highlight ? 'bg-slate-50/30' : ''}`}>
      <TableCell className="font-medium text-slate-700 border-r border-slate-200/60 break-words whitespace-normal py-3">{label}</TableCell>
      <TableCell className="text-right tabular-nums border-r border-slate-200/60 truncate text-slate-600">{formatNumber(values.Baseline)}</TableCell>
      <TableCell className="text-right tabular-nums border-r border-slate-200/60 truncate text-slate-600">{formatNumber(values.Austerity)}</TableCell>
      <TableCell className="text-right tabular-nums font-bold text-purple-700 bg-purple-50/30 truncate border-r border-slate-200/60">{formatNumber(values.Custom)}</TableCell>
    </TableRow>
  );
}

export default function Dashboard() {
  const {
    baseline,
    baselineLoading,
    baselineError,
    loadBaseline,
    vatRatePct,
    cashAidPerMonthPhp,
    infraBudgetBillionPhp,
    wealthyTaxBumpPct,
    setVatRatePct,
    setCashAidPerMonthPhp,
    setInfraBudgetBillionPhp,
    setWealthyTaxBumpPct,
  } = useSimStore();

  useEffect(() => {
    void loadBaseline();
  }, [loadBaseline]);

  const rows = useMemo(() => {
    if (!baseline) return [];
    return runAllScenarios(baseline, { vatRatePct, cashAidPerMonthPhp, infraBudgetBillionPhp, wealthyTaxBumpPct });
  }, [baseline, vatRatePct, cashAidPerMonthPhp, infraBudgetBillionPhp, wealthyTaxBumpPct]);

  const y5 = useMemo(() => {
    const year5 = rows.filter((r) => r.year === 5);
    const byScenario = new Map<ScenarioName, typeof year5[number]>();
    year5.forEach((r) => byScenario.set(r.scenario, r));
    const b = byScenario.get('Baseline');
    const a = byScenario.get('Austerity');
    const c = byScenario.get('Custom');
    if (!b || !a || !c) return null;
    return { b, a, c };
  }, [rows]);

  const y5Diffs = useMemo(() => {
    if (!y5) return null;
    return {
      gdpGrowth: { diff: y5.c.growthPct - y5.b.growthPct, custom: y5.c.growthPct },
      poverty: { diff: y5.c.povertyPct - y5.b.povertyPct, custom: y5.c.povertyPct },
      unemployment: { diff: y5.c.unemploymentPct - y5.b.unemploymentPct, custom: y5.c.unemploymentPct },
      debt: { diff: y5.c.nationalDebtTrill - y5.b.nationalDebtTrill, custom: y5.c.nationalDebtTrill },
    };
  }, [y5]);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px] mx-auto">
      <div className="space-y-8 order-2 lg:order-1">
        <div className="space-y-3 hidden lg:block">
          <h1 className="text-3xl font-bold tracking-tight text-blue-900">BansaSim: Philippine Economy Simulator</h1>
          <p className="text-base text-slate-600 max-w-2xl leading-relaxed">
            Play the role of the President or Finance Secretary. Adjust taxes and spending to see what happens to the country over the next 5 years.
          </p>
        </div>

        {baselineError ? (
          <Alert variant="destructive" className="rounded-xl">
            <AlertTitle>Baseline data failed to load</AlertTitle>
            <AlertDescription>{baselineError}</AlertDescription>
          </Alert>
        ) : null}

        {baseline ? (
          <Alert className="border-blue-200 bg-blue-50/50 text-blue-900 rounded-xl shadow-sm">
            <Info className="size-4 text-blue-600" />
            <AlertTitle className="font-semibold text-blue-800">Real-Time Data Loaded</AlertTitle>
            <AlertDescription className="text-blue-700/80 mt-1">
              Baseline simulated from {baseline.Metadata.Source} ({baseline.Metadata.Date_Scraped})
              <span className="ml-2 inline-flex"><CitationChip label={13} toId="local-baseline-json" /></span>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="rounded-xl">
            <AlertTitle>Loading baseline data</AlertTitle>
            <AlertDescription>{baselineLoading ? 'Fetching configuration…' : 'Waiting to load…'}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          <div className="flex items-center gap-3 pb-2">
            <div className="p-2 bg-blue-100/50 rounded-lg">
              <Activity className="size-5 text-blue-700" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">What happens to the country over 5 years?</h2>
          </div>

          {y5Diffs && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <DiffCard title="GDP Growth" diff={y5Diffs.gdpGrowth.diff} customVal={y5Diffs.gdpGrowth.custom} unit="pct" />
              <DiffCard title="Poverty Rate" diff={y5Diffs.poverty.diff} customVal={y5Diffs.poverty.custom} unit="pct" inverse />
              <DiffCard title="Unemployment" diff={y5Diffs.unemployment.diff} customVal={y5Diffs.unemployment.custom} unit="pct" inverse />
              <DiffCard title="National Debt" diff={y5Diffs.debt.diff} customVal={y5Diffs.debt.custom} unit="trill" inverse />
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ScenarioLineChart title="Economic Growth (How fast we grow)" rows={rows} metric="growthPct" />
            <ScenarioLineChart title="Total Economy Size (Trillion PHP)" rows={rows} metric="economySizeTrill" />
            <ScenarioLineChart title="Poverty Rate (% of people struggling)" rows={rows} metric="povertyPct" />
            <ScenarioLineChart title="Unemployment (% of people without jobs)" rows={rows} metric="unemploymentPct" />
            <ScenarioLineChart title="Government Piggybank Deficit (Lower is better)" rows={rows} metric="govDeficitTrill" />
            <ScenarioLineChart title="National Debt-to-GDP (%) (Lower is safer)" rows={rows} metric="debtToGdpPct" />
          </div>
        </div>

        <Card className="p-6 shadow-sm border-slate-200/60 bg-white rounded-2xl w-full overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <div className="text-xl font-bold flex items-center gap-2 text-slate-900 tracking-tight">
                <div className="p-1.5 bg-amber-100 rounded-lg">
                  <Trophy className="size-5 text-amber-600" />
                </div>
                The Final Scoreboard
              </div>
              <div className="text-sm text-slate-500 mt-1">Comparing outcomes at the end of Year 5</div>
            </div>
          </div>
          <div className="overflow-x-auto w-full rounded-xl border border-slate-200/60">
            <Table className="bg-white w-full table-fixed min-w-[600px]">
              <TableHeader className="bg-slate-50/50 border-b border-slate-200/60">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-slate-600 border-r border-slate-200/60 w-[250px] bg-slate-50/50">Metric</TableHead>
                  <TableHead className="text-right font-semibold text-blue-700 border-r border-slate-200/60 w-[150px] whitespace-normal break-words leading-tight p-3 bg-blue-50/20">{SCENARIO_LABEL.Baseline}</TableHead>
                  <TableHead className="text-right font-semibold text-red-700 border-r border-slate-200/60 w-[150px] whitespace-normal break-words leading-tight p-3 bg-red-50/20">{SCENARIO_LABEL.Austerity}</TableHead>
                  <TableHead className="text-right font-bold text-purple-700 bg-purple-50/50 border-r border-slate-200/60 w-[150px] whitespace-normal break-words p-3">
                    {SCENARIO_LABEL.Custom}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {y5 ? (
                  <>
                    <MetricRow
                      label="Gov Tax Revenue Collected (Trillion PHP)"
                      values={{ Baseline: y5.b.govRevenueTrill, Austerity: y5.a.govRevenueTrill, Custom: y5.c.govRevenueTrill }}
                    />
                    <MetricRow
                      label="Gov Total Spending (Trillion PHP)"
                      values={{ Baseline: y5.b.govSpendingTrill, Austerity: y5.a.govSpendingTrill, Custom: y5.c.govSpendingTrill }}
                    />
                    <MetricRow
                      label="Gov Deficit (Trillion PHP)"
                      values={{ Baseline: y5.b.govDeficitTrill, Austerity: y5.a.govDeficitTrill, Custom: y5.c.govDeficitTrill }}
                      highlight
                    />
                    <MetricRow
                      label="National Debt (Trillion PHP)"
                      values={{ Baseline: y5.b.nationalDebtTrill, Austerity: y5.a.nationalDebtTrill, Custom: y5.c.nationalDebtTrill }}
                    />
                    <MetricRow
                      label="Debt-to-GDP (%)"
                      values={{ Baseline: y5.b.debtToGdpPct, Austerity: y5.a.debtToGdpPct, Custom: y5.c.debtToGdpPct }}
                      highlight
                    />
                    <MetricRow
                      label="Poor Families Savings & Spending Power (Trillion PHP)"
                      values={{
                        Baseline: y5.b.poorSpendingPowerTrill,
                        Austerity: y5.a.poorSpendingPowerTrill,
                        Custom: y5.c.poorSpendingPowerTrill,
                      }}
                    />
                  </>
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-sm text-slate-500">
                      Run the simulation to see the year-5 scoreboard.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Card className="p-6 lg:p-8 bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-100/50 rounded-2xl shadow-sm">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 rounded-xl shadow-sm shadow-blue-600/20">
                <Landmark className="size-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-blue-950 tracking-tight">
                  The Government Piggybank
                </h3>
                <p className="text-sm text-blue-800/80 font-medium">Where does the money come from?</p>
              </div>
            </div>
            
            <ul className="space-y-4 text-[15px] text-slate-700 list-disc list-outside ml-6">
              <li className="pl-1">
                <strong className="text-blue-900">Ayuda costs money!</strong> If you promise ₱1,500/month to poor families without raising taxes, the <strong className="text-slate-900">Gov Total Spending</strong> skyrockets and the <strong className="text-slate-900">Gov Deficit</strong> worsens. The government must borrow money (increasing national debt) to fund the Ayuda.
              </li>
              <li className="pl-1">
                <strong className="text-blue-900">The Austerity Trade-off (VAT):</strong> Raising VAT to 15% (Red Line) collects more <strong className="text-slate-900">Tax Revenue</strong>, fixing the deficit. But because things get expensive, ordinary people buy less, hurting <strong className="text-slate-900">Economic Growth</strong>.
                <span className="inline-block ml-2"><CitationChip label={9} toId="nirc-vat-12" /></span>
              </li>
              <li className="pl-1">
                <strong className="text-blue-900">Taxing the Wealthy:</strong> Notice what happens when you raise taxes on the rich instead of VAT. The wealthy save a lot of their money (they have a lower Marginal Propensity to Consume). Taxing them fills the government piggybank <em className="text-slate-600">without</em> crushing everyday spending as much as a VAT hike does! This lets you fund Ayuda with less damage to GDP growth.
              </li>
              <li className="pl-1">
                <strong className="text-blue-900">The Perfect Balance:</strong> Can you use the sliders to find a policy where the Government Deficit stays manageable (near Baseline), but Poverty drops and Economic Growth rises? Try combining Wealth Taxes and targeted Ayuda!
              </li>
            </ul>
          </div>
        </Card>
      </div>
      
      <div className="space-y-6 lg:sticky lg:top-[88px] h-fit order-1 lg:order-2">
        <Card className="p-6 bg-white border-slate-200/60 shadow-xl shadow-slate-200/40 rounded-2xl space-y-7">
          <div className="space-y-3 lg:hidden mb-8 border-b border-slate-100 pb-6">
            <h1 className="text-3xl font-bold tracking-tight text-blue-900">BansaSim</h1>
            <p className="text-sm text-slate-600">
              Play the role of the President or Finance Secretary. Adjust taxes and spending to see what happens to the country over the next 5 years.
            </p>
          </div>
          
          <div className="space-y-2 border-b border-slate-100 pb-4">
            <div className="text-xl font-bold flex items-center gap-2 text-slate-900 tracking-tight">
              <div className="p-1.5 bg-slate-100 rounded-lg">
                <Settings2 className="size-5 text-slate-700" />
              </div>
              Policy Decisions
            </div>
            <p className="text-[13px] text-slate-500 leading-relaxed">Charts update automatically when you move the sliders to simulate your choices.</p>
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="text-[14px] font-semibold flex items-center gap-2 text-slate-800">
                    <Percent className="size-4 text-red-500" /> VAT / Sales Tax Rate
                  </div>
                  <div className="text-[13px] text-slate-500 pr-4 leading-tight">
                    Affects consumer prices and government revenue.
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-red-600 bg-red-50/50 px-2 py-0.5 rounded-md inline-block border border-red-100/50">{vatRatePct.toFixed(1)}%</div>
                  <div className="mt-1.5"><CitationChip label={9} toId="nirc-vat-12" /></div>
                </div>
              </div>
              <div className="pt-3 px-1">
                <Slider colorClass="bg-red-500" trackColorClass="bg-slate-100" value={[vatRatePct]} min={10} max={20} step={0.5} onValueChange={(v) => setVatRatePct(v[0] ?? 12)} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="text-[14px] font-semibold flex items-center gap-2 text-slate-800">
                    <Coins className="size-4 text-blue-500" /> Cash Aid (Ayuda)
                  </div>
                  <div className="text-[13px] text-slate-500 pr-4 leading-tight">
                    Per poor family / month. Targeted cash transfers.
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-blue-600 bg-blue-50/50 px-2 py-0.5 rounded-md inline-block border border-blue-100/50">₱{cashAidPerMonthPhp.toLocaleString()}</div>
                  <div className="mt-1.5"><CitationChip label={4} toId="psa-poverty-2024-111" /></div>
                </div>
              </div>
              <div className="pt-3 px-1">
                <Slider
                  colorClass="bg-blue-500" trackColorClass="bg-slate-100"
                  value={[cashAidPerMonthPhp]}
                  min={0}
                  max={10000}
                  step={500}
                  onValueChange={(v) => setCashAidPerMonthPhp(v[0] ?? 0)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="text-[14px] font-semibold flex items-center gap-2 text-slate-800">
                    <Building2 className="size-4 text-amber-500" /> Extra Infra Budget
                  </div>
                  <div className="text-[13px] text-slate-500 pr-4 leading-tight">
                    Billion PHP/year. Increases government goods/services spending.
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-amber-600 bg-amber-50/50 px-2 py-0.5 rounded-md inline-block border border-amber-100/50">₱{infraBudgetBillionPhp.toLocaleString()}B</div>
                </div>
              </div>
              <div className="pt-3 px-1">
                <Slider
                  colorClass="bg-amber-500" trackColorClass="bg-slate-100"
                  value={[infraBudgetBillionPhp]}
                  min={0}
                  max={1000}
                  step={50}
                  onValueChange={(v) => setInfraBudgetBillionPhp(v[0] ?? 0)}
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="text-[14px] font-semibold flex items-center gap-2 text-slate-800">
                    <TrendingUp className="size-4 text-emerald-500" /> Tax the Wealthy
                  </div>
                  <div className="text-[13px] text-slate-500 pr-4 leading-tight">
                    Extra income tax on the highest earners.
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-emerald-600 bg-emerald-50/50 px-2 py-0.5 rounded-md inline-block border border-emerald-100/50">+{wealthyTaxBumpPct.toFixed(0)}%</div>
                </div>
              </div>
              <div className="pt-3 px-1">
                <Slider
                  colorClass="bg-emerald-500" trackColorClass="bg-slate-100"
                  value={[wealthyTaxBumpPct]}
                  min={0}
                  max={20}
                  step={1}
                  onValueChange={(v) => setWealthyTaxBumpPct(v[0] ?? 0)}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
