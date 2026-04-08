import { useEffect, useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { CitationEntry } from '@/sim/types';

type ReferencesPayload = {
  citations: CitationEntry[];
  dataFiles?: { id: string; label: string; path: string; type: 'json' | 'csv'; citations?: number[] }[];
  assumptions: { id: string; text: string; citations?: number[] }[];
};

type DataFileStatus = {
  ok: boolean;
  detail: string;
};

async function inspectDataFile(path: string, type: 'json' | 'csv'): Promise<DataFileStatus> {
  const res = await fetch(path);
  if (!res.ok) return { ok: false, detail: `HTTP ${res.status}` };
  const text = await res.text();
  if (!text.trim().length) return { ok: false, detail: 'Empty file' };
  if (type === 'json') {
    try {
      const parsed = JSON.parse(text) as unknown;
      if (parsed && typeof parsed === 'object') return { ok: true, detail: 'JSON loaded successfully' };
      return { ok: false, detail: 'JSON is not an object' };
    } catch {
      return { ok: false, detail: 'Invalid JSON format' };
    }
  }
  const lines = text.split('\n').filter((l) => l.trim().length);
  if (lines.length < 2) return { ok: false, detail: 'CSV missing data rows' };
  return { ok: true, detail: `${lines.length - 1} rows parsed` };
}

export default function References() {
  const [payload, setPayload] = useState<ReferencesPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dataFileStatus, setDataFileStatus] = useState<Record<string, DataFileStatus>>({});

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch('/data/references.json');
        if (!res.ok) throw new Error(`Failed to load references: ${res.status}`);
        const json = (await res.json()) as ReferencesPayload;
        if (!cancelled) setPayload(json);
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to load references';
        if (!cancelled) setError(msg);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  const citationsByLabel = useMemo(() => {
    const m = new Map<number, CitationEntry>();
    payload?.citations.forEach((c) => m.set(c.label, c));
    return m;
  }, [payload]);

  useEffect(() => {
    let cancelled = false;
    async function runChecks() {
      if (!payload?.dataFiles?.length) return;
      const entries = await Promise.all(
        payload.dataFiles.map(async (f) => {
          const status = await inspectDataFile(f.path, f.type);
          return [f.id, status] as const;
        }),
      );
      if (!cancelled) setDataFileStatus(Object.fromEntries(entries));
    }
    void runChecks();
    return () => {
      cancelled = true;
    };
  }, [payload]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-blue-900">References & Citations</h1>
        <p className="text-base text-slate-600 max-w-2xl leading-relaxed">Data sources and model assumptions used by this simulator.</p>
      </div>

      {error ? (
        <Alert variant="destructive" className="rounded-xl">
          <AlertTitle>Failed to load references</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <Card className="p-6 border-slate-200/60 shadow-sm rounded-2xl bg-white">
          <div className="text-lg font-bold text-slate-900 tracking-tight mb-6">Citation Index</div>
          <div className="space-y-6">
            {payload?.citations?.length ? (
              payload.citations
                .slice()
                .sort((a, b) => a.label - b.label)
                .map((c) => (
                  <div key={c.id} id={`ref-${c.id}`} className="scroll-mt-24 p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                    <div className="text-[15px] font-semibold text-slate-800 leading-tight mb-1">[{c.label}] {c.title}</div>
                    <div className="text-[13px] text-slate-500 font-medium">
                      {c.publisher ? <span>{c.publisher}</span> : null}
                      {c.publisher && c.accessed ? <span> · </span> : null}
                      {c.accessed ? <span>Accessed {c.accessed}</span> : null}
                    </div>
                    {c.url ? (
                      <div className="mt-2">
                        <a className="text-[13px] font-medium text-blue-600 hover:text-blue-800 underline underline-offset-2 decoration-blue-200" href={c.url} target="_blank" rel="noreferrer">
                          {c.url}
                        </a>
                      </div>
                    ) : null}
                    {c.note ? <div className="mt-3 text-[13px] text-slate-600 bg-white p-3 rounded-lg border border-slate-100">{c.note}</div> : null}
                  </div>
                ))
            ) : (
              <div className="text-sm text-slate-500">Loading citations…</div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6 border-slate-200/60 shadow-sm rounded-2xl bg-white">
            <div className="text-lg font-bold text-slate-900 tracking-tight mb-4">Data File Status</div>
            <div className="space-y-3">
              {payload?.dataFiles?.length ? (
                payload.dataFiles.map((f) => {
                  const status = dataFileStatus[f.id];
                  return (
                    <div key={f.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
                      <div className="text-[14px] font-semibold text-slate-800">{f.label}</div>
                      <div className="text-[12px] text-slate-500 font-mono mt-1 break-all">{f.path}</div>
                      <div className={`mt-2 text-[13px] font-medium flex items-center gap-1.5 ${status?.ok ? 'text-emerald-600' : 'text-amber-600'}`}>
                        <div className={`size-2 rounded-full ${status?.ok ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {status ? (status.ok ? `OK · ${status.detail}` : `Issue · ${status.detail}`) : 'Checking…'}
                      </div>
                      {f.citations?.length ? (
                        <div className="mt-3 pt-3 border-t border-slate-200/50 text-[12px] text-slate-500">
                          Source:
                          {f.citations
                            .map((n) => citationsByLabel.get(n))
                            .filter(Boolean)
                            .map((c) => (
                              <a key={c!.id} href={`#ref-${c!.id}`} className="ml-1 text-blue-600 hover:underline">
                                [{c!.label}]
                              </a>
                            ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-slate-500">No data file checks configured.</div>
              )}
            </div>
          </Card>

          <Card className="p-6 border-slate-200/60 shadow-sm rounded-2xl bg-white">
            <div className="text-lg font-bold text-slate-900 tracking-tight mb-4">Model Assumptions</div>
            <div className="space-y-4">
              {payload?.assumptions?.length ? (
                payload.assumptions.map((a) => (
                  <div key={a.id} className="text-[14px] text-slate-600 leading-relaxed border-l-2 border-slate-200 pl-3">
                    <span>{a.text}</span>
                    {a.citations?.length
                      ? a.citations
                          .map((n) => citationsByLabel.get(n))
                          .filter(Boolean)
                          .map((c) => (
                            <a
                              key={c!.id}
                              href={`#ref-${c!.id}`}
                              className="ml-1.5 text-[12px] font-medium text-blue-600 hover:underline"
                            >
                              [{c!.label}]
                            </a>
                          ))
                      : null}
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-500">Loading assumptions…</div>
              )}
            </div>
          </Card>

          <Card className="p-6 border-amber-200/60 bg-amber-50/30 shadow-sm rounded-2xl">
            <div className="text-lg font-bold text-amber-900 tracking-tight mb-2">Disclaimer</div>
            <div className="text-[14px] text-amber-800/80 leading-relaxed">
              This app is an educational simulator that mirrors a simplified rule-based simulation.
              It is not an official forecast and should not be used for real-world policy decisions.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
