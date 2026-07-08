<script>
  import { nav, progress, mastery, accentOf, labDoneCount, labTotal } from '../stores/progress.js';
  import { PHASES, LABS } from '../data/curriculum.js';
  import { MAP_STRIP, imageUrl } from '../data/images.js';

  let trackFilter = 'ALL';

  // Duplicate for seamless loop
  const STRIP = [...MAP_STRIP, ...MAP_STRIP];

  $: totalConcepts  = PHASES.reduce((s, p) => s + p.concepts.length, 0);
  $: learnedConcepts = PHASES.reduce((s, p) =>
    s + p.concepts.filter((_, i) => $progress.learned?.[p.id + ':' + i]).length, 0);
  $: labsCleared = LABS.filter(l => labDoneCount(l.id, $progress) === labTotal(l.id) && labTotal(l.id) > 0).length;
  $: phasesActive = PHASES.filter(p => p.concepts.some((_, i) => $progress.learned?.[p.id + ':' + i])).length;

  function phaseMastery(p) {
    const cTot = p.concepts.length;
    if (!cTot) return 0;
    const cDone = p.concepts.filter((_, i) => $progress.learned?.[p.id + ':' + i]).length;
    return Math.round(cDone / cTot * 100);
  }

  function goPhase(idx) { nav.update(s => ({ ...s, mode: 'study', phase: idx })); }
  function goLab(id)    { nav.update(s => ({ ...s, mode: 'range', labId: id  })); }
</script>

<div class="maphead">
  <div>
    <div class="eyebrow">Reverse Engineering · Malware Analysis · DFIR</div>
    <h1 class="h1">Twelve phases.<br>One investigation reflex.</h1>
    <p class="lede">Bytes on disk → instructions → formats → behaviour → memory → wire → full reconstruction. Each node is a hands-on lab. Study the mechanism, then launch it.</p>
  </div>
  <div class="legend">
    <i><span class="dot d-DF"></span>Forensics</i>
    <i><span class="dot d-RE"></span>Reverse Eng.</i>
    <i><span class="dot d-MA"></span>Malware</i>
  </div>
</div>

<!-- ── Image Art Strip ───────────────────────────────────────── -->
<div class="imgstrip-wrap" aria-hidden="true">
  <div class="imgstrip">
    {#each STRIP as img}
      <div class="imgstrip__tile">
        <img src={imageUrl(img)} alt="" loading="lazy" />
      </div>
    {/each}
  </div>
</div>

<div class="stats">
  <div class="stat">
    <div class="stat-n" style="color:var(--volt);text-shadow:0 0 20px rgba(57,255,20,.4)">{$mastery}%</div>
    <div class="stat-l">Global Mastery</div>
  </div>
  <div class="stat">
    <div class="stat-n" style="color:var(--volt);text-shadow:0 0 20px rgba(57,255,20,.4)">{learnedConcepts} / {totalConcepts}</div>
    <div class="stat-l">Concepts Locked</div>
  </div>
  <div class="stat">
    <div class="stat-n" style="color:var(--amber);text-shadow:0 0 20px rgba(255,170,0,.4)">{phasesActive} / {PHASES.length}</div>
    <div class="stat-l">Phases Active</div>
  </div>
  <div class="stat">
    <div class="stat-n" style="color:var(--blood);text-shadow:0 0 20px rgba(255,25,41,.4)">{labsCleared} / {LABS.length}</div>
    <div class="stat-l">Labs Cleared</div>
  </div>
</div>

<div class="map-filters">
  <span class="filter-label">Track:</span>
  {#each [['ALL','All'],['DF','Forensics'],['RE','Reverse Eng.'],['MA','Malware']] as [t, label]}
    <button class="filter-btn" data-track={t}
      aria-pressed={trackFilter === t}
      onclick={() => trackFilter = t}>{label}</button>
  {/each}
</div>

<div class="spine">
  {#each PHASES as p, idx}
    {@const m   = phaseMastery(p)}
    {@const ac  = accentOf(p.tracks)}
    {@const dim = trackFilter !== 'ALL' && !p.tracks.includes(trackFilter)}
    <div
      class="node {dim ? 'dimmed' : ''}"
      data-done={m === 100 ? 1 : 0}
      style="--accent:{ac}"
      role="button" tabindex="0"
      onclick={() => goPhase(idx)}
      onkeydown={e => e.key === 'Enter' && goPhase(idx)}
      aria-label="Phase {p.n}: {p.title}">
      <span class="node__check">✓ MASTERED</span>
      <div class="node__n">PHASE {String(p.n).padStart(2,'0')}</div>
      <div class="node__t">{p.title}</div>
      <div class="node__tags">{p.tag}</div>
      <div class="node__chips">
        {#each p.tracks as t}<span class="chip t-{t}">{t}</span>{/each}
      </div>
      <div class="node__mast"><i style="width:{m}%"></i></div>
      <button class="nodelab" onclick={e => { e.stopPropagation(); goLab(p.id); }}>⚡ Open lab</button>
    </div>
  {/each}
</div>
