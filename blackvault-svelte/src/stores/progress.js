import { writable, derived } from 'svelte/store';
import { PHASES, LABS, LABOBJ } from '../data/curriculum.js';

// ── Navigation / UI state (ephemeral, not persisted) ──────────────────────────
export const nav = writable({
  mode: 'map',
  phase: 0,
  deck: 'all',
  cardIdx: 0,
  flip: false,
  quizPhase: null,
  quizIdx: 0,
  search: '',
  trackFilter: 'ALL',
  openConcepts: {},
  labId: null,
  labTab: 'overview',
  caseNode: 'root',
  caseGood: 0,
  caseBad: 0,
  arsenalSearch: '',
});

// ── User progress (persisted to localStorage 'blackvault') ────────────────────
function loadSaved() {
  try {
    const raw = localStorage.getItem('blackvault');
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

const defaults = { learned: {}, quiz: {}, cards: {}, labs: {}, quizPick: {} };
export const progress = writable({ ...defaults, ...loadSaved() });

// Auto-save on every change
progress.subscribe(p => {
  try { localStorage.setItem('blackvault', JSON.stringify(p)); } catch {}
});

// ── Lab session state (ephemeral, resets on lab change) ───────────────────────
export const labSession = writable({
  memOut: [], rePatched: { 0: false, 1: false, 2: false }, reVerdict: {},
  pkts: null, pcapMeta: null, pcapSel: null, pcapFilter: '', logTab: 'auth', logFilter: '',
  cryptoIn: '', cryptoOps: [], cryptoOut: '',
  unpPc: 0, unpRun: false,
  memPc: 0, memRun: false,
});

// ── Toast ─────────────────────────────────────────────────────────────────────
export const toastMsg = writable('');
let toastTimer = null;
export function toast(msg) {
  toastMsg.set(msg);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastMsg.set(''), 2200);
}

// ── Derived: overall mastery % ────────────────────────────────────────────────
export const mastery = derived(progress, $p => {
  let total = 0;
  PHASES.forEach(p => {
    const cTot = p.concepts.length, qTot = p.quiz.length;
    const cDone = p.concepts.filter((_, i) => $p.learned?.[p.id + ':' + i]).length;
    const qDone = p.quiz.filter((_, i) => $p.quiz?.[p.id + ':' + i] === 1).length;
    total += Math.round((cDone + qDone) / (cTot + qTot) * 100);
  });
  return Math.round(total / PHASES.length);
});

// ── Helpers ───────────────────────────────────────────────────────────────────
export function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function accentOf(tracks) {
  const TRACK_ACCENT = { DF: 'var(--amber)', RE: 'var(--volt)', MA: 'var(--blood)' };
  return tracks.length > 1 ? 'var(--bone)' : (TRACK_ACCENT[tracks[0]] || 'var(--bone)');
}

export function weakItems(p) {
  const out = [];
  PHASES.forEach(ph => {
    ph.quiz.forEach((q, i) => {
      if (p.quiz?.[ph.id + ':' + i] === 0) out.push({ ph, q, i });
    });
  });
  return out;
}

export function labDoneCount(id, $p) {
  const o = $p.labs?.[id] || {};
  return (LABOBJ[id] || []).filter(x => o[x.k]).length;
}
export function labTotal(id) { return (LABOBJ[id] || []).length; }
export function labComplete(id, $p) { return labDoneCount(id, $p) === labTotal(id); }

export function setObj(id, k, progressStore) {
  progressStore.update(p => {
    if (!p.labs[id]) p.labs[id] = {};
    if (!p.labs[id][k]) {
      p.labs[id][k] = 1;
      const done = labDoneCount(id, p);
      if (done === labTotal(id)) toast('★ LAB CLEARED — ' + id.toUpperCase());
      else toast('✓ objective complete');
    }
    return p;
  });
}
