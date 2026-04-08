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
import { Settings2, Percent, Coins, Building2, TrendingUp, Activity, Trophy, Landmark } from 'lucide-react';

function MetricRow({ label, values }: { label: string; values: Record<ScenarioName, number> }) {
  return (
    <TableRow className="border-b border-slate-100">
      <TableCell className="font-medium text-slate-500 border-r break-words whitespace-normal">{label}</TableCell>
      <TableCell className="text-right tabular-nums border-r truncate">{formatNumber(values.Baseline)}</TableCell>
      <TableCell className="text-right tabular-nums border-r truncate">{formatNumber(values.Austerity)}</TableCell>
      <TableCell className="text-right tabular-nums font-medium text-slate-800 bg-amber-50/30 truncate border-r">{formatNumber(values.Custom)}</TableCell>
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

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-6 order-2 lg:order-1">
        <div className="space-y-1 hidden lg:block">
          <h1 className="text-3xl font-semibold tracking-tight text-[#0b2a6f]">BansaSim: Philippine Economy Sandbox</h1>
          <div className="text-sm text-muted-foreground">
            Play the role of the President or Finance Secretary. Adjust taxes and spending to see what happens to the country over the next 5 years.
          </div>
        </div>

          {baselineError ? (
            <Alert variant="destructive">
              <AlertTitle>Baseline data failed to load</AlertTitle>
              <AlertDescription>{baselineError}</AlertDescription>
            </Alert>
          ) : null}

          {baseline ? (
            <Alert className="border-emerald-200 bg-emerald-50 text-emerald-900">
              <AlertTitle>Real-Time Data Loaded</AlertTitle>
              <AlertDescription>
                Baseline simulated from {baseline.Metadata.Source} ({baseline.Metadata.Date_Scraped})
                <CitationChip label={13} toId="local-baseline-json" />
              </AlertDescription>
            </Alert>
          ) : (
            <Alert>
              <AlertTitle>Loading baseline data</AlertTitle>
              <AlertDescription>{baselineLoading ? 'Fetching configuration…' : 'Waiting to load…'}</AlertDescription>
            </Alert>
          )}

          <div className="text-xl font-bold flex items-center gap-2 text-[#0b2a6f] pt-4">
            <Activity className="size-6" /> What happens to the country over 5 years?
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mt-4">
            <ScenarioLineChart title="Economic Growth (How fast we grow)" rows={rows} metric="growthPct" />
            <ScenarioLineChart title="Poverty Rate (% of people struggling)" rows={rows} metric="povertyPct" />
            <ScenarioLineChart title="Unemployment (% of people without jobs)" rows={rows} metric="unemploymentPct" />
            <ScenarioLineChart title="Government Piggybank Deficit (Lower is better)" rows={rows} metric="govDeficitTrill" />
          </div>

          <Card className="p-5 shadow-sm border border-blue-100 bg-white rounded-2xl w-full overflow-hidden">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div>
                <div className="text-lg font-bold flex items-center gap-2 text-[#0b2a6f]">
                  <Trophy className="size-5" /> The Final Scoreboard
                </div>
                <div className="text-sm text-muted-foreground">At the end of 5 Years</div>
              </div>
              <div className="text-xs text-muted-foreground">Year 5</div>
            </div>
            <div className="mt-4 overflow-x-auto w-full">
              <Table className="border rounded-md bg-white w-full table-fixed">
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-semibold text-slate-500 border-r w-[250px]"></TableHead>
                    <TableHead className="text-right font-medium text-slate-500 border-r w-[120px]">{SCENARIO_LABEL.Baseline}</TableHead>
                    <TableHead className="text-right font-medium text-slate-500 border-r w-[120px]">{SCENARIO_LABEL.Austerity}</TableHead>
                    <TableHead className="text-right font-medium text-amber-600 bg-amber-50/50 border-r w-[120px] h-[45px]">
                      <div className="flex items-center justify-end gap-1 w-full h-full">
                        {SCENARIO_LABEL.Custom}
                      </div>
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
                      <TableCell colSpan={4} className="text-sm text-muted-foreground">
                        Run the simulation to see the year-5 scoreboard.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

        <Card className="p-6 bg-blue-50/50 border-blue-100 rounded-2xl shadow-sm">
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-[#0b2a6f] flex items-center gap-2">
              <Landmark className="size-6" /> The Government Piggybank (Where does the money come from?):
            </h3>
            <ul className="space-y-3 text-sm text-slate-700 list-disc list-outside ml-5">
              <li>
                <strong className="text-[#0b2a6f]">Ayuda costs money!</strong> If you promise ₱1,500/month to poor families without raising taxes, the <strong>Gov Total Spending</strong> skyrockets and the <strong>Gov Deficit</strong> worsens. The government must borrow money (increasing national debt) to fund the Ayuda.
              </li>
              <li>
                <strong className="text-[#0b2a6f]">The Austerity Trade-off (VAT):</strong> Raising VAT to 15% (Red Line) collects more <strong>Tax Revenue</strong>, fixing the deficit. But because things get expensive, ordinary people buy less, hurting <strong>Economic Growth</strong>.
                <span className="inline-block ml-2"><CitationChip label={9} toId="nirc-vat-12" /></span>
              </li>
              <li>
                <strong className="text-[#0b2a6f]">Taxing the Wealthy:</strong> Notice what happens when you raise taxes on the rich instead of VAT. The wealthy save a lot of their money (they have a lower Marginal Propensity to Consume). Taxing them fills the government piggybank <em>without</em> crushing everyday spending as much as a VAT hike does! This lets you fund Ayuda with less damage to GDP growth.
              </li>
              <li>
                <strong className="text-[#0b2a6f]">The Perfect Balance:</strong> Can you use the sliders to find a policy where the Government Deficit stays manageable (near Baseline), but Poverty drops and Economic Growth rises? Try combining Wealth Taxes and targeted Ayuda!
              </li>
            </ul>
          </div>
        </Card>
      </div>
      
      <Card className="h-fit p-5 space-y-6 lg:sticky lg:top-4 bg-[#f8f9fa] border-blue-200 shadow-sm rounded-2xl order-1 lg:order-2">
          <div className="space-y-4 lg:hidden mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-[#0b2a6f]">BansaSim: Philippine Economy Sandbox</h1>
            <div className="text-sm text-muted-foreground">
              Play the role of the President or Finance Secretary. Adjust taxes and spending to see what happens to the country over the next 5 years.
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-lg font-bold flex items-center gap-2 text-[#0b2a6f]">
              <Settings2 className="size-5" /> Your Policy Decisions
            </div>
            <div className="text-sm text-muted-foreground">Charts update automatically when you move the sliders.</div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium flex items-center gap-2">
                <Percent className="size-4 text-slate-500" /> VAT / Sales Tax Rate (%)
              </div>
              <CitationChip label={9} toId="nirc-vat-12" />
            </div>
            <div className="text-sm font-semibold text-slate-800">{vatRatePct.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">
              VAT affects consumer prices and government revenue.
            </div>
            <div className="pt-2 pb-1">
              <Slider colorClass="bg-red-500" trackColorClass="bg-red-500/20" value={[vatRatePct]} min={10} max={20} step={0.5} onValueChange={(v) => setVatRatePct(v[0] ?? 12)} />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium flex items-center gap-2">
                <Coins className="size-4 text-slate-500" /> Cash Aid (Ayuda) per poor family / month
              </div>
              <CitationChip label={4} toId="psa-poverty-2024-111" />
            </div>
            <div className="text-sm font-semibold text-slate-800">₱{cashAidPerMonthPhp.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              Targeted cash transfers are modeled as direct spending.
            </div>
            <div className="pt-2 pb-1">
              <Slider
                colorClass="bg-blue-500" trackColorClass="bg-blue-500/20"
                value={[cashAidPerMonthPhp]}
                min={0}
                max={10000}
                step={500}
                onValueChange={(v) => setCashAidPerMonthPhp(v[0] ?? 0)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium flex items-center gap-2">
                <Building2 className="size-4 text-slate-500" /> Extra Infra Budget (Billion PHP / year)
              </div>
            </div>
            <div className="text-sm font-semibold text-slate-800">₱{infraBudgetBillionPhp.toLocaleString()}B</div>
            <div className="text-xs text-muted-foreground">
              Infrastructure increases government goods/services spending in GDP.
            </div>
            <div className="pt-2 pb-1">
              <Slider
                colorClass="bg-amber-500" trackColorClass="bg-amber-500/20"
                value={[infraBudgetBillionPhp]}
                min={0}
                max={1000}
                step={50}
                onValueChange={(v) => setInfraBudgetBillionPhp(v[0] ?? 0)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="size-4 text-slate-500" /> Tax the Wealthy (Extra Income Tax)
              </div>
            </div>
            <div className="text-sm font-semibold text-slate-800">+{wealthyTaxBumpPct.toFixed(0)}%</div>
            <div className="text-xs text-muted-foreground">
              Applies an additional PIT rate only to the high-income group.
            </div>
            <div className="pt-2 pb-1">
              <Slider
                colorClass="bg-emerald-500" trackColorClass="bg-emerald-500/20"
                value={[wealthyTaxBumpPct]}
                min={0}
                max={20}
                step={1}
                onValueChange={(v) => setWealthyTaxBumpPct(v[0] ?? 0)}
              />
            </div>
          </div>
      </Card>
    </div>
  );
}
