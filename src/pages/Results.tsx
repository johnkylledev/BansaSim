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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-blue-900">Results Data</h1>
        <p className="text-base text-slate-600 max-w-2xl leading-relaxed">Inspect the full 5-year time series and export your run.</p>
      </div>

      <Card className="p-5 bg-white border-slate-200/60 shadow-sm rounded-2xl">
        <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4">
          <div className="flex items-center flex-wrap gap-2">
            <div className="text-[14px] font-semibold text-slate-800 mr-2 uppercase tracking-wider">Scenario</div>
            {(['All', 'Baseline', 'Austerity', 'Custom'] as const).map((s) => (
              <Button
                key={s}
                variant={scenario === s ? 'default' : 'outline'}
                size="sm"
                className={scenario === s ? 'bg-blue-700 text-white hover:bg-blue-800' : 'text-slate-600 hover:bg-slate-50'}
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
                  'nationalDebtTrill',
                  'debtToGdpPct',
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
                    r.nationalDebtTrill,
                    r.debtToGdpPct,
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
        <TabsList className="mb-6 bg-slate-100/50 p-1.5 rounded-xl border border-slate-200/50">
          <TabsTrigger value="table" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <TableIcon className="size-4" /> Time Series Table
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-2 rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <FileText className="size-4" /> Run Notes
          </TabsTrigger>
        </TabsList>
        <TabsContent value="table" className="mt-0">
          <Card className="p-0 overflow-x-auto shadow-sm border border-slate-200/60 rounded-2xl bg-white">
            <Table className="border-none">
              <TableHeader className="bg-slate-50/50 border-b border-slate-200/60">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-semibold text-slate-600 border-r border-slate-200/60 py-3">Year</TableHead>
                  <TableHead className="font-semibold text-slate-600 border-r border-slate-200/60 py-3">Scenario</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600 border-r border-slate-200/60 py-3">Growth (%)</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600 border-r border-slate-200/60 py-3">Poverty (%)</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600 border-r border-slate-200/60 py-3">Unemployment (%)</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600 border-r border-slate-200/60 py-3">Deficit (Trill PHP)</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600 border-r border-slate-200/60 py-3">Debt (Trill PHP)</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600 border-r border-slate-200/60 py-3">Debt-to-GDP (%)</TableHead>
                  <TableHead className="text-right font-semibold text-slate-600 py-3">Poor Spending Power</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length ? (
                  filtered.map((r) => (
                    <TableRow key={`${r.scenario}-${r.year}`} className="hover:bg-slate-50/50 border-b border-slate-100/80 transition-colors">
                      <TableCell className="tabular-nums font-semibold text-slate-700 border-r border-slate-200/60">{r.year}</TableCell>
                      <TableCell className="text-slate-600 border-r border-slate-200/60 font-medium">{SCENARIO_LABEL[r.scenario]}</TableCell>
                      <TableCell className="text-right tabular-nums text-slate-600 border-r border-slate-200/60">{formatNumber(r.growthPct)}</TableCell>
                      <TableCell className="text-right tabular-nums text-slate-600 border-r border-slate-200/60">{formatNumber(r.povertyPct)}</TableCell>
                      <TableCell className="text-right tabular-nums text-slate-600 border-r border-slate-200/60">{formatNumber(r.unemploymentPct)}</TableCell>
                      <TableCell className="text-right tabular-nums text-slate-600 border-r border-slate-200/60">{formatNumber(r.govDeficitTrill)}</TableCell>
                      <TableCell className="text-right tabular-nums text-slate-600 border-r border-slate-200/60">{formatNumber(r.nationalDebtTrill)}</TableCell>
                      <TableCell className="text-right tabular-nums text-slate-600 border-r border-slate-200/60">{formatNumber(r.debtToGdpPct)}</TableCell>
                      <TableCell className="text-right tabular-nums text-slate-600">{formatNumber(r.poorSpendingPowerTrill)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-sm text-slate-500 h-32 text-center">
                      {baseline ? 'No rows for this selection.' : 'Load baseline data to see results.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
        <TabsContent value="notes" className="mt-0">
          <Card className="p-8 space-y-6 shadow-sm border border-slate-200/60 rounded-2xl bg-white max-w-lg">
            <div className="text-xl font-bold text-blue-900 flex items-center gap-3 tracking-tight">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings2 className="size-5 text-blue-700" />
              </div>
              Current Policy Controls
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

