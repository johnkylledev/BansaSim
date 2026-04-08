import { Card } from '@/components/ui/card';
import type { SimResultRow, ScenarioName } from '@/sim/types';
import { SCENARIO_COLOR, SCENARIO_LABEL } from '@/sim/scenarios';
import { formatNumber } from '@/lib/format';
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
  | 'poorSpendingPowerTrill'
  | 'nationalDebtTrill'
  | 'debtToGdpPct';

function pivot(rows: SimResultRow[], metric: MetricKey) {
  const byYear = new Map<number, Record<string, number | string>>();
  rows.forEach((r) => {
    const existing = byYear.get(r.year) ?? { year: r.year };
    existing[r.scenario] = r[metric];
    byYear.set(r.year, existing);
  });
  return Array.from(byYear.values()).sort((a, b) => Number(a.year) - Number(b.year));
}

function getAxisFormatter(metric: MetricKey) {
  if (metric.endsWith('Pct')) {
    return (val: number) => `${val.toFixed(1)}%`;
  }
  return (val: number) => `₱${val.toFixed(1)}T`;
}

function CustomTooltip({ active, payload, label, metric }: any) {
  if (active && payload && payload.length) {
    const formatter = getAxisFormatter(metric);
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 p-3 rounded-xl shadow-lg shadow-slate-200/50">
        <div className="text-[13px] font-semibold text-slate-500 mb-2 border-b border-slate-100 pb-2 uppercase tracking-wider">Year {label}</div>
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center justify-between gap-6 text-[13px] mb-1.5 last:mb-0">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-700 font-medium">{SCENARIO_LABEL[entry.name as ScenarioName] || entry.name}</span>
            </div>
            <span className="font-bold text-slate-900">{formatter(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export function ScenarioLineChart({ title, rows, metric }: { title: string; rows: SimResultRow[]; metric: MetricKey }) {
  const data = pivot(rows, metric);
  const formatter = getAxisFormatter(metric);
  
  // Custom is drawn last so it appears on top
  const orderedScenarios: ScenarioName[] = ['Baseline', 'Austerity', 'Custom'];

  // Determine domain bounds so charts don't look completely flat or cut off, especially percentages
  let domain: [number | 'auto', number | 'auto'] = ['auto', 'auto'];
  if (metric.endsWith('Pct')) {
    // Extract min and max values to give some breathing room
    let min = Infinity;
    let max = -Infinity;
    data.forEach((d) => {
      orderedScenarios.forEach((s) => {
        const val = Number(d[s]);
        if (!isNaN(val)) {
          if (val < min) min = val;
          if (val > max) max = val;
        }
      });
    });
    // Add padding to domain (10% padding or at least 1 percentage point)
    const padding = Math.max((max - min) * 0.1, 1);
    domain = [Math.max(0, min - padding), max + padding];
  }

  return (
    <Card className="p-5 shadow-sm border-slate-200/60 bg-white rounded-2xl">
      <div className="text-[14px] font-semibold text-slate-800 mb-5">{title}</div>
      <div className="h-56 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="year" 
              tickLine={false} 
              axisLine={false} 
              tick={{ fill: '#64748b', fontSize: 12 }} 
              dy={10}
              tickFormatter={(v) => `Yr ${v}`}
            />
            <YAxis 
              domain={domain}
              tickLine={false} 
              axisLine={false} 
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={formatter}
              dx={-10}
              width={60}
            />
            <Tooltip content={<CustomTooltip metric={metric} />} />
            <Legend 
              formatter={(v) => <span className="text-slate-600 font-medium text-xs ml-1">{SCENARIO_LABEL[v as ScenarioName] ?? v}</span>}
              iconType="circle"
              wrapperStyle={{ paddingTop: '20px' }}
            />
            {orderedScenarios.map((s) => (
              <Line
                key={s}
                type="monotone"
                dataKey={s}
                stroke={SCENARIO_COLOR[s]}
                strokeWidth={3}
                name={s}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

