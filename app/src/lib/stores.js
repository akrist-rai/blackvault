import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';

// ── persistence ─────────────────────────────────────────────────────────────
function persist(key, init) {
  const stored = browser ? JSON.parse(localStorage.getItem(key) || 'null') : null;
  const store  = writable(stored ?? init);
  if (browser) store.subscribe(v => localStorage.setItem(key, JSON.stringify(v)));
  return store;
}

// ── phase scores  { phaseId: { score, total, pass } } ──────────────────────
export const phases = persist('bv_phases', {});

// ── lab completions  { labId: { done: Set-as-array } } ─────────────────────
export const labs = persist('bv_labs', {});

// ── case completions  { caseId: true } ──────────────────────────────────────
export const cases = persist('bv_cases', {});

// ── badge set  [ badgeId, ... ] ─────────────────────────────────────────────
export const badges = persist('bv_badges', []);

// ── ctf solved  { chalId: true } ────────────────────────────────────────────
export const ctf = persist('bv_ctf', {});

// ── overall mastery 0–100 ───────────────────────────────────────────────────
export const mastery = derived([phases, labs, cases, badges], ([$p, $l, $c, $b]) => {
  const phaseScore = Object.values($p).reduce((s, x) => s + (x.pass ? 100 : x.score ?? 0), 0);
  const phaseMax   = 12 * 100;
  const labScore   = Object.values($l).reduce((s, x) => s + (x.done?.length || 0), 0);
  const labMax     = 80; // approx total objectives
  const caseScore  = Object.values($c).filter(Boolean).length * 100;
  const caseMax    = 4 * 100;
  const badgeScore = $b.length * 10;
  const badgeMax   = 22 * 10;
  const total = phaseScore + labScore * 5 + caseScore + badgeScore;
  const max   = phaseMax   + labMax * 5  + caseMax   + badgeMax;
  return Math.min(100, Math.round((total / max) * 100));
});

// ── toast ────────────────────────────────────────────────────────────────────
export const toast = writable(null);
export function showToast(msg, kind = 'info', ms = 2600) {
  toast.set({ msg, kind });
  setTimeout(() => toast.set(null), ms);
}

// ── drill progress  { phaseId: { got: number[], review: number[] } } ─────────
export const drillProgress = persist('bv_drill', {});

// ── current console mode ─────────────────────────────────────────────────────
export const mode = writable('dashboard');
