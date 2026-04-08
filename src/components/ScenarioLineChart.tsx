import { Card } from '@/components/ui/card';
import type { SimResultRow, ScenarioName } from '@/sim/types';
import { SCENARIO_COLOR, SCENARIO_LABEL } from '@/sim/scenarios';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';

type MetricKey =
  | 'growthPct'
  | 'povertyPct'
  | 'unemploymentPct'
  | 'govDeficitTrill'
  | 'govRevenueTrill'
  | 'govSpendingTrill'
  | 'economySizeTrill'
  | 'poorSpendingPowerTrill';

function pivot(rows: SimResultRow[], metric: MetricKey) {
  const byYear = new Map<number, Record<string, number | string>>();
  rows.forEach((r) => {
    const existing = byYear.get(r.year) ?? { year: r.year };
    existing[r.scenario] = r[metric];
    byYear.set(r.year, existing);
  });
  return Array.from(byYear.values()).sort((a, b) => Number(a.year) - Number(b.year));
}

export function ScenarioLineChart({ title, rows, metric }: { title: string; rows: SimResultRow[]; metric: MetricKey }) {
  const data = pivot(rows, metric);
  const scenarios: ScenarioName[] = ['Baseline', 'Austerity', 'Custom'];
  return (
    <Card className="p-5 shadow-sm border border-slate-200 bg-white rounded-xl">
      <div className="text-sm font-semibold text-slate-700 mb-4">{title}</div>
      <div className="h-52 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 18, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
            <XAxis dataKey="year" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip />
            <Legend formatter={(v) => SCENARIO_LABEL[v as ScenarioName] ?? v} />
            {scenarios.map((s) => (
              <Line
                key={s}
                type="monotone"
                dataKey={s}
                stroke={SCENARIO_COLOR[s]}
                dot
                strokeWidth={2}
                name={SCENARIO_LABEL[s]}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

