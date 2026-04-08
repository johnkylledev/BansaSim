import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useSimStore } from '@/store/simStore';
import { runAllScenarios, SCENARIO_LABEL } from '@/sim/scenarios';
import { formatNumber } from '@/lib/format';
import type { ScenarioName } from '@/sim/types';
import { Download, Table as TableIcon, FileText, Settings2 } from 'lucide-react';

function downloadFile(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Results() {
  const {
    baseline,
    loadBaseline,
    vatRatePct,
    cashAidPerMonthPhp,
    infraBudgetBillionPhp,
    wealthyTaxBumpPct,
  } = useSimStore();

  useEffect(() => {
    void loadBaseline();
  }, [loadBaseline]);

  const [scenario, setScenario] = useState<ScenarioName | 'All'>('All');

  const rows = useMemo(() => {
    if (!baseline) return [];
    return runAllScenarios(baseline, { vatRatePct, cashAidPerMonthPhp, infraBudgetBillionPhp, wealthyTaxBumpPct });
  }, [baseline, vatRatePct, cashAidPerMonthPhp, infraBudgetBillionPhp, wealthyTaxBumpPct]);

  const filtered = useMemo(() => {
    if (scenario === 'All') return rows;
    return rows.filter((r) => r.scenario === scenario);
  }, [rows, scenario]);

  const exportPayload = useMemo(() => {
    return {
      inputs: { vatRatePct, cashAidPerMonthPhp, infraBudgetBillionPhp, wealthyTaxBumpPct },
      rows,
    };
  }, [rows, vatRatePct, cashAidPerMonthPhp, infraBudgetBillionPhp, wealthyTaxBumpPct]);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Results</h1>
        <div className="text-sm text-muted-foreground">Inspect the full 5-year time series and export your run.</div>
      </div>

      <Card className="p-4 bg-white border-slate-200 shadow-sm rounded-xl">
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4">
          <div className="flex items-center flex-wrap gap-2">
            <div className="text-sm font-semibold text-slate-700 mr-2">Scenario</div>
            {(['All', 'Baseline', 'Austerity', 'Custom'] as const).map((s) => (
              <Button
                key={s}
                variant={scenario === s ? 'default' : 'outline'}
                size="sm"
                className={scenario === s ? 'bg-[#0b2a6f] text-white hover:bg-[#0b2a6f]/90' : 'text-slate-600 hover:bg-slate-50'}
                onClick={() => setScenario(s)}
              >
                {s === 'All' ? 'All' : SCENARIO_LABEL[s]}
              </Button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none gap-2 text-slate-700 hover:bg-slate-100"
              onClick={() => downloadFile('ph-macro-run.json', JSON.stringify(exportPayload, null, 2), 'application/json')}
              disabled={!rows.length}
            >
              <Download className="size-4" /> Download JSON
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none gap-2 text-slate-700 hover:bg-slate-100"
              onClick={() => {
                const header = [
                  'year',
                  'scenario',
                  'economySizeTrill',
                  'growthPct',
                  'unemploymentPct',
                  'povertyPct',
                  'govRevenueTrill',
                  'govSpendingTrill',
                  'govDeficitTrill',
                  'poorSpendingPowerTrill',
                ].join(',');
                const lines = rows.map((r) =>
                  [
                    r.year,
                    r.scenario,
                    r.economySizeTrill,
                    r.growthPct,
                    r.unemploymentPct,
                    r.povertyPct,
                    r.govRevenueTrill,
                    r.govSpendingTrill,
                    r.govDeficitTrill,
                    r.poorSpendingPowerTrill,
                  ].join(','),
                );
                downloadFile('ph-macro-run.csv', [header, ...lines].join('\n'), 'text/csv');
              }}
              disabled={!rows.length}
            >
              <Download className="size-4" /> Download CSV
            </Button>
          </div>
        </div>
      </Card>

      <Tabs defaultValue="table" className="w-full">
        <TabsList className="mb-4 bg-slate-100/50 p-1">
          <TabsTrigger value="table" className="gap-2">
            <TableIcon className="size-4" /> Time Series Table
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-2">
            <FileText className="size-4" /> Run Notes
          </TabsTrigger>
        </TabsList>
        <TabsContent value="table" className="mt-0">
          <Card className="p-0 overflow-x-auto shadow-sm border border-slate-200 rounded-xl bg-white">
            <Table className="border-none">
              <TableHeader className="bg-slate-50 border-b border-slate-200">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-slate-600">Year</TableHead>
                  <TableHead className="font-semibold text-slate-600 border-r">Scenario</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600">Growth (%)</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600">Poverty (%)</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600">Unemployment (%)</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600">Deficit (Trill PHP)</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600">Poor Spending Power</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length ? (
                  filtered.map((r) => (
                    <TableRow key={`${r.scenario}-${r.year}`} className="hover:bg-slate-50 border-b border-slate-100">
                      <TableCell className="tabular-nums font-medium text-slate-700">{r.year}</TableCell>
                      <TableCell className="text-slate-600 border-r">{SCENARIO_LABEL[r.scenario]}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(r.growthPct)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(r.povertyPct)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(r.unemploymentPct)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(r.govDeficitTrill)}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatNumber(r.poorSpendingPowerTrill)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-sm text-muted-foreground">
                      {baseline ? 'No rows for this selection.' : 'Load baseline data to see results.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        <TabsContent value="notes" className="mt-0">
          <Card className="p-6 space-y-4 shadow-sm border border-slate-200 rounded-xl bg-white max-w-lg">
            <div className="text-lg font-bold text-[#0b2a6f] flex items-center gap-2">
              <Settings2 className="size-5" /> Current policy controls
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-600 font-medium">VAT</span>
                <span className="text-slate-800 font-semibold">{vatRatePct.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-600 font-medium">Cash aid</span>
                <span className="text-slate-800 font-semibold">₱{cashAidPerMonthPhp.toLocaleString()} / month</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-slate-600 font-medium">Infra</span>
                <span className="text-slate-800 font-semibold">₱{infraBudgetBillionPhp.toLocaleString()}B / year</span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span className="text-slate-600 font-medium">Wealthy PIT bump</span>
                <span className="text-slate-800 font-semibold">+{wealthyTaxBumpPct.toFixed(0)}%</span>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

