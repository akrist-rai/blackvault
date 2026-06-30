import { writable, derived, get } from 'svelte/store';
import { browser } from '$app/environment';
import { LAB_FLAGS } from '$lib/lab-sim.js';
import { BADGES } from '$lib/data.js';

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

// ── case flag-challenge progress  { caseId: { chalIndex: true } } ───────────
export const caseFlags = persist('bv_case_flags', {});

// ── playbook flag-challenge progress  { pbId: { chalIndex: true } } ─────────
export const playbookFlags = persist('bv_playbook_flags', {});

// ── ctf solved  { chalId: true } ────────────────────────────────────────────
export const ctf = persist('bv_ctf', {});

// ── badge set  [ badgeId, ... ] — derived live from lab/phase progress ──────
export const badges = derived([labs, phases], ([$labs, $phases]) =>
  BADGES.filter(b => b.cond($labs, $phases)).map(b => b.id)
);

// ── platform-wide flag total & live capture count ───────────────────────────
// 60 study + 16 range labs + 12 cases + 8 playbooks + 6 intel + 6 attack + 5 tools
export const TOTAL_FLAGS = 113;
function flatCount(obj)   { return Object.values(obj).filter(Boolean).length; }
function nestedCount(obj) { return Object.values(obj).reduce((s, v) => s + Object.values(v).filter(Boolean).length, 0); }
export const flagsCaptured = derived([ctf, caseFlags, playbookFlags], ([$ctf, $caseFlags, $playbookFlags]) =>
  flatCount($ctf) + nestedCount($caseFlags) + nestedCount($playbookFlags)
);

// ── overall mastery 0–100 ───────────────────────────────────────────────────
const LAB_IDS = Object.keys(LAB_FLAGS);

export const mastery = derived([phases, labs, cases, badges, ctf], ([$p, $l, $c, $b, $ctf]) => {
  const phaseScore = Object.values($p).reduce((s, x) => s + (x.pass ? 100 : x.score ?? 0), 0);
  const phaseMax   = 12 * 100;
  const labScore   = Object.values($l).reduce((s, x) => s + (x.done?.length || 0), 0);
  const labMax     = 80; // approx total objectives
  const caseScore  = Object.values($c).filter(Boolean).length * 100;
  const caseMax    = 4 * 100;
  const badgeScore = $b.length * 10;
  const badgeMax   = BADGES.length * 10;
  const flagScore  = LAB_IDS.filter(id => $ctf[id]).length * 25;
  const flagMax    = LAB_IDS.length * 25;
  const total = phaseScore + labScore * 5 + caseScore + badgeScore + flagScore;
  const max   = phaseMax   + labMax * 5  + caseMax   + badgeMax   + flagMax;
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

// ── command palette open/close ───────────────────────────────────────────────
export const commandPaletteOpen = writable(false);

// ── operator profile ─────────────────────────────────────────────────────────
export const operatorName = persist('bv_operator_name', '');
export const certifiedAt  = persist('bv_certified_at', null);
