'use client';

/**
 * Public network diagnostics page — excluded from the auth middleware.
 * Open on any machine having trouble reaching the app; it tests each hop
 * (CDN, edge, API proxy, direct database) and shows what is broken.
 * URL: /diagnostics
 */

import { useCallback, useEffect, useState } from 'react';

type TestResult = {
  name: string;
  detail: string;
  expect: string;
  status?: number;
  ms?: number;
  outcome: 'pending' | 'pass' | 'fail' | 'hang';
  note?: string;
};

const TIMEOUT_MS = 10000;

async function timedFetch(
  url: string,
  init: RequestInit
): Promise<{ status: number; ms: number }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const t0 = performance.now();
  try {
    const res = await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' });
    return { status: res.status, ms: Math.round(performance.now() - t0) };
  } finally {
    clearTimeout(timer);
  }
}

const SUPABASE_HOST = 'ddtrzryqobmurqlgclxd.supabase.co';

export default function DiagnosticsPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ipInfo, setIpInfo] = useState<string>('');

  const run = useCallback(async () => {
    setRunning(true);
    setCopied(false);
    const out: TestResult[] = [];

    const push = (r: TestResult) => {
      out.push(r);
      setResults([...out]);
    };

    const attempt = async (
      name: string,
      detail: string,
      expect: string,
      url: string,
      init: RequestInit,
      ok: (status: number) => boolean
    ) => {
      try {
        const { status, ms } = await timedFetch(url, init);
        push({
          name, detail, expect, status, ms,
          outcome: ok(status) ? (ms > 3000 ? 'fail' : 'pass') : 'fail',
          note: ms > 3000 ? 'very slow (>3s)' : undefined,
        });
      } catch (e) {
        const aborted = e instanceof DOMException && e.name === 'AbortError';
        push({
          name, detail, expect,
          outcome: aborted ? 'hang' : 'fail',
          note: aborted ? `no response in ${TIMEOUT_MS / 1000}s` : 'request blocked or network error',
        });
      }
    };

    // 1. Static asset from the CDN (the page shell itself)
    await attempt(
      'Static page assets (CDN)',
      'GET /logo.svg via camclinic.vercel.app',
      '200',
      '/logo.svg',
      { method: 'GET' },
      (s) => s === 200
    );

    // 2. Edge routing / middleware (unauthenticated /terms redirects to
    // /login; following it to a 200 proves the app server responded)
    await attempt(
      'App server (Vercel edge)',
      'GET /terms (redirects to /login, then loads)',
      '200',
      '/terms',
      { method: 'GET' },
      (s) => s === 200
    );

    // 3. Database proxy — GET (same origin as the page)
    await attempt(
      'Database API via proxy — GET',
      `GET /auth/v1/health via camclinic.vercel.app`,
      '401',
      '/auth/v1/health',
      { method: 'GET' },
      (s) => s === 401
    );

    // 4. Database proxy — POST with dummy credentials (400/401 = reached the
    // database and got an answer; distinguishes POST filtering by antivirus)
    await attempt(
      'Database API via proxy — POST (login call)',
      'POST /auth/v1/token with dummy credentials',
      '400/401',
      '/auth/v1/token?grant_type=password',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: 'diagnostics' },
        body: JSON.stringify({ email: 'diagnostics@test.local', password: 'x' }),
      },
      (s) => s === 400 || s === 401
    );

    // 5. Direct database reachability (what ad-blockers/URL filters kill)
    await attempt(
      'Direct database endpoint',
      `GET https://${SUPABASE_HOST}/auth/v1/health`,
      '401',
      `https://${SUPABASE_HOST}/auth/v1/health`,
      { method: 'GET' },
      (s) => s === 401
    );

    // 6. IP / protocol info
    try {
      const res = await fetch('https://ipv4.icanhazip.com', { cache: 'no-store' });
      const v4 = (await res.text()).trim();
      setIpInfo(`Public IPv4: ${v4}`);
    } catch {
      setIpInfo('IP lookup unreachable');
    }

    setRunning(false);
  }, []);

  useEffect(() => {
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summaryText = [
    'CamClinic connection diagnostics',
    `Time: ${new Date().toLocaleString()}`,
    `Browser: ${navigator.userAgent}`,
    ipInfo,
    ...results.map(
      (r) =>
        `${r.outcome.toUpperCase().padEnd(4)} ${r.name}: status=${r.status ?? '-'} ${r.ms ?? '-'}ms${r.note ? ` (${r.note})` : ''}`
    ),
  ].join('\n');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const color = (o: TestResult['outcome']) =>
    o === 'pass'
      ? 'bg-green-50 text-green-700 border-green-200'
      : o === 'pending'
        ? 'bg-gray-50 text-gray-500 border-gray-200'
        : 'bg-red-50 text-red-700 border-red-200';

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Connection Diagnostics</h1>
            <p className="text-sm text-gray-500">
              Tests how this machine reaches the CamClinic app and database.
            </p>
          </div>
          <button
            onClick={() => void run()}
            disabled={running}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {running ? 'Running…' : 'Run again'}
          </button>
        </div>

        <div className="space-y-2">
          {results.map((r) => (
            <div key={r.name} className={`rounded-xl border p-3 ${color(r.outcome)}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">
                  {r.name}
                </span>
                <span className="text-xs font-semibold uppercase">
                  {r.outcome === 'pass' ? 'OK' : r.outcome}
                  {r.ms !== undefined ? ` · ${r.ms}ms` : ''}
                  {r.status !== undefined ? ` · HTTP ${r.status}` : ''}
                </span>
              </div>
              <p className="mt-1 text-xs opacity-80">
                {r.detail} — expected {r.expect}
                {r.note ? ` · ${r.note}` : ''}
              </p>
            </div>
          ))}
          {results.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-500">
              Running tests…
            </div>
          )}
        </div>

        {ipInfo && <p className="text-xs text-gray-400">{ipInfo}</p>}

        <div className="rounded-xl border border-gray-200 bg-white p-4 text-xs leading-relaxed text-gray-600">
          <p className="font-medium text-gray-800">How to read this</p>
          <p className="mt-1">
            All rows <strong>OK</strong> → the app should work; sign in again.{' '}
            <strong>POST row fails/hangs while GET rows are OK</strong> → antivirus or
            &quot;web protection&quot; software on this system is filtering login requests —
            disable it for this site or add camclinic.vercel.app to its allow-list.{' '}
            <strong>Everything hangs</strong> → this machine&apos;s internet (Wi-Fi/router/ISP)
            is the problem — try a phone hotspot to confirm.
          </p>
        </div>

        <button
          onClick={() => void copy()}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          {copied ? 'Copied — paste it to support' : 'Copy results for support'}
        </button>
      </div>
    </div>
  );
}
