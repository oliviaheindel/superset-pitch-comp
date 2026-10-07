import { useEffect, useState } from 'react';

/* Everything a normal website can read about you without asking. We just show it. */
export function collectDevice() {
  const n = typeof navigator !== 'undefined' ? navigator : {};
  const ua = n.userAgent || '';
  const os = /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Mac/.test(ua) ? 'macOS' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : 'Unknown';
  const browser = /Edg\//.test(ua) ? 'Edge' : /CriOS|Chrome\//.test(ua) ? 'Chrome' : /FxiOS|Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Unknown';
  let tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { /* old browser */ }
  const hour = new Date().getHours();
  return {
    device: /Mobi|iPhone|Android/.test(ua) ? 'Phone' : /iPad|Tablet/.test(ua) ? 'Tablet' : 'Computer',
    os,
    browser,
    screen: typeof screen !== 'undefined' ? `${screen.width}×${screen.height}` : '',
    timezone: tz,
    language: n.language || '',
    localTime: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    cores: n.hardwareConcurrency ? String(n.hardwareConcurrency) : '',
    darkMode: typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches ? 'Yes' : 'No',
    vibe: hour < 6 ? 'Up way too late' : hour < 12 ? 'Morning person (allegedly)' : hour < 18 ? 'Should be working' : 'Doomscrolling hours',
  };
}

export async function battery() {
  try { const b = await navigator.getBattery?.(); return b ? `${Math.round(b.level * 100)}%${b.charging ? ' (charging)' : ''}` : ''; } catch { return ''; }
}

export async function postSignup(payload) {
  const r = await fetch('/api/signup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || 'Something broke. Probably capitalism.');
  return j;
}

/* Live count of everyone who has sold themselves, polled. */
export function useStats(every = 4000) {
  const [s, setS] = useState({ count: 0, names: [], loaded: false });
  useEffect(() => {
    let on = true;
    const tick = () => fetch('/api/stats').then((r) => r.json()).then((j) => { if (on) setS({ ...j, loaded: true }); }).catch(() => {});
    tick();
    const id = setInterval(tick, every);
    return () => { on = false; clearInterval(id); };
  }, [every]);
  return s;
}

export const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);
