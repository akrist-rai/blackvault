<script>
  import { nav, progress, mastery } from '../stores/progress.js';
  import { PHASES, LABS, LABOBJ } from '../data/curriculum.js';

  $: totalConcepts = PHASES.reduce((s, p) => s + p.concepts.length, 0);
  $: learnedConcepts = PHASES.reduce((s, p) =>
    s + p.concepts.filter((_, i) => $progress.learned?.[p.id + ':' + i]).length, 0);
  $: totalQuiz = PHASES.reduce((s, p) => s + p.quiz.length, 0);
  $: correctQuiz = PHASES.reduce((s, p) =>
    s + p.quiz.filter((_, i) => $progress.quiz?.[p.id + ':' + i] === 1).length, 0);
  $: labsCleared = LABS.filter(l => {
    const o = $progress.labs?.[l.id] || {};
    const total = (LABOBJ[l.id] || []).length;
    return total > 0 && Object.values(o).filter(Boolean).length >= total;
  }).length;

  function phaseMastery(p) {
    const cTot = p.concepts.length, qTot = p.quiz.length;
    const cDone = p.concepts.filter((_, i) => $progress.learned?.[p.id + ':' + i]).length;
    const qDone = p.quiz.filter((_, i) => $progress.quiz?.[p.id + ':' + i] === 1).length;
    return (cTot + qTot) ? Math.round((cDone + qDone) / (cTot + qTot) * 100) : 0;
  }

  function chips(tracks) {
    return tracks.map(t => `<span class="chip t-${t}">${t}</span>`).join('');
  }
  function accentOf(tracks) {
    const A = { DF: 'var(--amber)', RE: 'var(--volt)', MA: 'var(--blood)' };
    return tracks.length > 1 ? 'var(--bone)' : (A[tracks[0]] || 'var(--bone)');
  }

  let trackFilter = 'ALL';

  function goPhase(idx) {
    nav.update(s => ({ ...s, mode: 'study', phase: idx }));
  }
  function goLab(id) {
    nav.update(s => ({ ...s, mode: 'range', labId: id }));
  }
</script>

<div class="maphead">
  <div>
    <div class="eyebrow">Reverse Engineering · Malware Analysis · DFIR</div>
    <h1 class="h1">Twelve phases.<br>One investigation reflex.</h1>
    <p class="lede">Each node builds the next: bytes on disk → instructions → formats → behaviour → memory → wire → the full reconstruction. Tap a phase to study its mechanism, drill it, or jump into a live case.</p>
  </div>
  <div class="legend">
    <i><span class="dot d-DF"></span>Forensics</i>
    <i><span class="dot d-RE"></span>Reverse Eng.</i>
    <i><span class="dot d-MA"></span>Malware</i>
  </div>
</div>

<div class="stats">
  <div class="stat jade">
    <div class="stat-n jade">{$mastery}%</div>
    <div class="stat-l">Global Mastery</div>
  </div>
  <div class="stat volt">
    <div class="stat-n volt">{learnedConcepts} / {totalConcepts}</div>
    <div class="stat-l">Concepts Learned</div>
  </div>
  <div class="stat amber">
    <div class="stat-n amber">{correctQuiz} / {totalQuiz}</div>
    <div class="stat-l">Scored Quizzes</div>
  </div>
  <div class="stat blood">
    <div class="stat-n blood">{labsCleared} / {LABS.length}</div>
    <div class="stat-l">Labs Cleared</div>
  </div>
</div>

<div class="map-filters">
  <span style="font-family:var(--mono);font-size:11px;color:var(--ash);text-transform:uppercase;margin-right:8px">Curriculum Track:</span>
  {#each [['ALL','All Tracks'],['DF','Digital Forensics'],['RE','Reverse Engineering'],['MA','Malware Analysis']] as [t, label]}
    <button class="filter-btn" data-track={t}
      aria-pressed={trackFilter === t}
      on:click={() => trackFilter = t}>{label}</button>
  {/each}
</div>

<div class="spine">
  {#each PHASES as p, idx}
    {@const m = phaseMastery(p)}
    {@const ac = accentOf(p.tracks)}
    {@const dimmed = trackFilter !== 'ALL' && !p.tracks.includes(trackFilter)}
    <div class="node {dimmed ? 'dimmed' : ''}"
      data-done={m === 100 ? 1 : 0}
      style="--accent:{ac}"
      role="button" tabindex="0"
      on:click={() => goPhase(idx)}
      on:keydown={e => e.key === 'Enter' && goPhase(idx)}
      aria-label="Phase {p.n}: {p.title}">
      <span class="node__check">✓ MASTERED</span>
      <div class="node__n">PHASE {String(p.n).padStart(2,'0')}</div>
      <div class="node__t">{p.title}</div>
      <div class="node__tags">{p.tag}</div>
      <div class="node__chips">{@html chips(p.tracks)}</div>
      <div class="node__mast"><i style="width:{m}%"></i></div>
      <button class="nodelab" on:click|stopPropagation={() => goLab(p.id)}>⚡ Open lab</button>
    </div>
  {/each}
</div>
