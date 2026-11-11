'use client';

/**
 * Public network + auth diagnostics page — excluded from the auth middleware.
 * Open on any machine having trouble reaching the app; it tests each hop
 * (CDN, edge, API proxy, direct database), the real auth engine, local
 * session data health, and can clear corrupted local data.
 * URL: /diagnostics
 */

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

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

function raceTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(label)), ms)
    ),
  ]);
}

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

type AuthTest = {
  outcome: 'pass' | 'fail' | 'hang';
  ms?: number;
  detail: string;
};

export default function DiagnosticsPage() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ipInfo, setIpInfo] = useState('');

  // Deep auth state
  const [authTest, setAuthTest] = useState<AuthTest | null>(null);
  const [cookieList, setCookieList] = useState<Array<{ name: string; size: number }>>([]);
  const [resetDone, setResetDone] = useState(false);
  const [probeEmail, setProbeEmail] = useState('');
  const [probePassword, setProbePassword] = useState('');
  const [probeResult, setProbeResult] = useState<string | null>(null);
  const [probing, setProbing] = useState(false);

  const refreshCookieList = useCallback(() => {
    setCookieList(
      document.cookie
        .split('; ')
        .filter(Boolean)
        .map((c) => {
          const eq = c.indexOf('=');
          return { name: c.slice(0, eq), size: c.length };
        })
        .filter((c) => c.name.startsWith('sb-'))
    );
  }, []);

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

    await attempt(
      'Static page assets (CDN)',
      'GET /logo.svg via camclinic.vercel.app',
      '200',
      '/logo.svg',
      { method: 'GET' },
      (s) => s === 200
    );

    await attempt(
      'App server (Vercel edge)',
      'GET /terms (redirects to /login, then loads)',
      '200',
      '/terms',
      { method: 'GET' },
      (s) => s === 200
    );

    await attempt(
      'Database API via proxy — GET',
      `GET /auth/v1/health via camclinic.vercel.app`,
      '401',
      '/auth/v1/health',
      { method: 'GET' },
      (s) => s === 401
    );

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

    await attempt(
      'Direct database endpoint',
      `GET https://${SUPABASE_HOST}/auth/v1/health`,
      '401',
      `https://${SUPABASE_HOST}/auth/v1/health`,
      { method: 'GET' },
      (s) => s === 401
    );

    try {
      const res = await fetch('https://ipv4.icanhazip.com', { cache: 'no-store' });
      const v4 = (await res.text()).trim();
      setIpInfo(`Public IPv4: ${v4}`);
    } catch {
      setIpInfo('IP lookup unreachable');
    }

    refreshCookieList();
    setRunning(false);
  }, [refreshCookieList]);

  useEffect(() => {
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Run the real production auth engine: client construction, cookie read,
   * lock acquisition, and (if a stored token is expired) a real refresh POST. */
  const runAuthEngineTest = async () => {
    setAuthTest(null);
    const t0 = performance.now();
    try {
      const client = createClient();
      const { data } = await raceTimeout(
        client.auth.getSession(),
        12000,
        'Auth engine did not respond in 12s (possible stuck lock or corrupted local session data)'
      );
      const ms = Math.round(performance.now() - t0);
      setAuthTest({
        outcome: 'pass',
        ms,
        detail: data.session
          ? `Session restored (user: ${data.session.user.email})`
          : 'No stored session (fresh state — normal after clearing data or sign-out)',
      });
    } catch (e) {
      const ms = Math.round(performance.now() - t0);
      const msg = e instanceof Error ? e.message : String(e);
      const hang = ms >= 11900;
      setAuthTest({
        outcome: hang ? 'hang' : 'fail',
        ms,
        detail: msg,
      });
    }
    refreshCookieList();
  };

  /** Clear all local app data (session cookies, local/session storage).
   * Fixes corrupted session state left by earlier bugs. */
  const resetLocalData = async () => {
    // Expire every sb-* cookie on this origin
    document.cookie.split('; ').filter(Boolean).forEach((c) => {
      const name = c.split('=')[0];
      if (name.startsWith('sb-')) {
        document.cookie = `${name}=; path=/; max-age=0`;
        document.cookie = `${name}=; path=/; max-age=0; domain=${window.location.hostname}`;
      }
    });
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith('sb-') || k.includes('supabase'))
        .forEach((k) => localStorage.removeItem(k));
      sessionStorage.clear();
    } catch {
      // storage unavailable — ignore
    }
    setResetDone(true);
    refreshCookieList();
  };

  /** Real sign-in with the exact production code path (same client the login
   * page uses). Entered credentials are used only for this request. */
  const runSignInProbe = async () => {
    setProbeResult(null);
    setProbing(true);
    try {
      const client = createClient();
      const { data, error } = await raceTimeout(
        client.auth.signInWithPassword({ email: probeEmail, password: probePassword }),
        20000,
        'Sign-in did not complete in 20s'
      );
      if (error) {
        setProbeResult(`FAILED: ${error.message} (code: ${error.status ?? error.name})`);
      } else {
        setProbeResult(`SUCCESS — signed in as ${data.user?.email}. Go to /dashboard.`);
      }
    } catch (e) {
      setProbeResult(`HANG/ERROR: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setProbing(false);
    }
    refreshCookieList();
  };

  const summaryText = [
    'CamClinic connection diagnostics',
    `Time: ${new Date().toLocaleString()}`,
    `Browser: ${navigator.userAgent}`,
    ipInfo,
    ...results.map(
      (r) =>
        `${r.outcome.toUpperCase().padEnd(4)} ${r.name}: status=${r.status ?? '-'} ${r.ms ?? '-'}ms${r.note ? ` (${r.note})` : ''}`
    ),
    authTest ? `AUTH-ENGINE ${authTest.outcome.toUpperCase()} ${authTest.ms}ms — ${authTest.detail}` : '',
    `Local sb-* cookies: ${cookieList.map((c) => `${c.name}(${c.size}b)`).join(', ') || 'none'}`,
    probeResult ? `SIGN-IN PROBE: ${probeResult}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summaryText);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const color = (o: 'pass' | 'fail' | 'hang' | 'pending') =>
    o === 'pass'
      ? 'bg-green-50 text-green-700 border-green-200'
      : o === 'pending'
        ? 'bg-gray-50 text-gray-500 border-gray-200'
        : 'bg-red-50 text-red-700 border-red-200';

  const bigCookie = cookieList.some((c) => c.size > 4000);
  const manyCookies = cookieList.length > 6;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Connection Diagnostics</h1>
            <p className="text-sm text-gray-500">
              Tests how this machine reaches the app, database, and the sign-in engine.
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
                <span className="text-sm font-medium">{r.name}</span>
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

        {/* Deep auth engine */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Auth engine test</h2>
              <p className="text-xs text-gray-500">
                Runs the exact sign-in engine used by the app (reads the local session,
                acquires the auth lock, refreshes an expired token).
              </p>
            </div>
            <button
              onClick={() => void runAuthEngineTest()}
              className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white"
            >
              Test auth engine
            </button>
          </div>
          {authTest && (
            <div className={`rounded-lg border p-3 text-xs ${color(authTest.outcome)}`}>
              <span className="font-semibold uppercase">
                {authTest.outcome} {authTest.ms !== undefined ? `· ${authTest.ms}ms` : ''}
              </span>
              <p className="mt-1">{authTest.detail}</p>
            </div>
          )}

          <div className="text-xs text-gray-600">
            <p className="font-medium text-gray-800">
              Local session cookies ({cookieList.length})
              {bigCookie && <span className="ml-2 text-red-600">oversized cookie detected</span>}
              {manyCookies && <span className="ml-2 text-red-600">too many chunks</span>}
            </p>
            {cookieList.length === 0 ? (
              <p className="mt-1 text-gray-400">none (signed out / cleared)</p>
            ) : (
              <ul className="mt-1 space-y-0.5">
                {cookieList.map((c) => (
                  <li key={c.name} className={c.size > 4000 ? 'text-red-600' : ''}>
                    {c.name} — {c.size} bytes
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => void resetLocalData()}
              className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700"
            >
              Clear local app data (sign out everywhere on this browser)
            </button>
            {resetDone && (
              <span className="text-xs text-green-700">
                Cleared — now <a className="underline" href="/login">open the login page</a> and sign in again.
              </span>
            )}
          </div>
        </div>

        {/* Real sign-in probe */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Advanced: real sign-in test</h2>
            <p className="text-xs text-gray-500">
              Same code path as the login page — used only to compare when /login fails.
              Credentials are sent only to this site, never stored.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              placeholder="email"
              value={probeEmail}
              onChange={(e) => setProbeEmail(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              type="password"
              placeholder="password"
              value={probePassword}
              onChange={(e) => setProbePassword(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              onClick={() => void runSignInProbe()}
              disabled={probing || !probeEmail || !probePassword}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {probing ? 'Testing…' : 'Test sign-in'}
            </button>
          </div>
          {probeResult && (
            <div
              className={`rounded-lg border p-3 text-xs ${
                probeResult.startsWith('SUCCESS')
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {probeResult}
            </div>
          )}
        </div>

        {ipInfo && <p className="text-xs text-gray-400">{ipInfo}</p>}

        <div className="rounded-xl border border-gray-200 bg-white p-4 text-xs leading-relaxed text-gray-600">
          <p className="font-medium text-gray-800">How to read this</p>
          <p className="mt-1">
            All network rows OK but <strong>auth engine HANGs or cookies look oversized/too many</strong>{' '}
            → corrupted local session data (common after the older redirect-loop bug) → press{' '}
            <strong>Clear local app data</strong> above, then sign in again. Auth engine OK but sign-in
            probe fails with a server error → credential/account issue, not this machine.
            Everything OK → the app should work; sign in again.
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
