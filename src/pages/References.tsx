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
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">References & Citations</h1>
        <div className="text-sm text-muted-foreground">Data sources and model assumptions used by this simulator.</div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Failed to load references</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
        <Card className="p-4">
          <div className="text-sm font-medium">Citation index</div>
          <div className="mt-4 space-y-4">
            {payload?.citations?.length ? (
              payload.citations
                .slice()
                .sort((a, b) => a.label - b.label)
                .map((c) => (
                  <div key={c.id} id={`ref-${c.id}`} className="scroll-mt-20">
                    <div className="text-sm font-semibold">[{c.label}] {c.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.publisher ? <span>{c.publisher}</span> : null}
                      {c.publisher && c.accessed ? <span> · </span> : null}
                      {c.accessed ? <span>Accessed {c.accessed}</span> : null}
                    </div>
                    {c.url ? (
                      <div className="mt-1">
                        <a className="text-sm underline underline-offset-4" href={c.url} target="_blank" rel="noreferrer">
                          {c.url}
                        </a>
                      </div>
                    ) : null}
                    {c.note ? <div className="mt-1 text-sm text-muted-foreground">{c.note}</div> : null}
                  </div>
                ))
            ) : (
              <div className="text-sm text-muted-foreground">Loading citations…</div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-4">
            <div className="text-sm font-medium">Data file status</div>
            <div className="mt-3 space-y-3">
              {payload?.dataFiles?.length ? (
                payload.dataFiles.map((f) => {
                  const status = dataFileStatus[f.id];
                  return (
                    <div key={f.id} className="rounded-md border p-3">
                      <div className="text-sm font-medium">{f.label}</div>
                      <div className="text-xs text-muted-foreground">{f.path}</div>
                      <div className={`mt-1 text-xs ${status?.ok ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {status ? (status.ok ? `OK · ${status.detail}` : `Issue · ${status.detail}`) : 'Checking…'}
                      </div>
                      {f.citations?.length ? (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Source:
                          {f.citations
                            .map((n) => citationsByLabel.get(n))
                            .filter(Boolean)
                            .map((c) => (
                              <a key={c!.id} href={`#ref-${c!.id}`} className="ml-1 underline underline-offset-4">
                                [{c!.label}]
                              </a>
                            ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-muted-foreground">No data file checks configured.</div>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-medium">Model assumptions</div>
            <div className="mt-3 space-y-3">
              {payload?.assumptions?.length ? (
                payload.assumptions.map((a) => (
                  <div key={a.id} className="text-sm text-muted-foreground">
                    <span>{a.text}</span>
                    {a.citations?.length
                      ? a.citations
                          .map((n) => citationsByLabel.get(n))
                          .filter(Boolean)
                          .map((c) => (
                            <a
                              key={c!.id}
                              href={`#ref-${c!.id}`}
                              className="ml-1 text-xs underline underline-offset-4"
                            >
                              [{c!.label}]
                            </a>
                          ))
                      : null}
                  </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground">Loading assumptions…</div>
              )}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-sm font-medium">Disclaimer</div>
            <div className="mt-2 text-sm text-muted-foreground">
              This app is an educational sandbox that mirrors a simplified rule-based simulation.
              It is not an official forecast and should not be used for real-world policy decisions.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
