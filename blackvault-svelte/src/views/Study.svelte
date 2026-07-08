<script>
  import { nav, progress, toast, accentOf } from '../stores/progress.js';
  import { PHASES } from '../data/curriculum.js';

  $: p  = PHASES[$nav.phase] || PHASES[0];
  $: ac = accentOf(p.tracks);

  function toggle(key) {
    nav.update(s => ({ ...s, openConcepts: { ...s.openConcepts, [key]: !s.openConcepts[key] } }));
  }
  function markLearned(key) {
    progress.update(pr => ({ ...pr, learned: { ...pr.learned, [key]: pr.learned?.[key] ? 0 : 1 } }));
    toast('✓ concept locked');
  }
  function copyCmd(text) { navigator.clipboard?.writeText(text).then(() => toast('✓ copied')); }
  function goMap()   { nav.update(s => ({ ...s, mode: 'map' })); }
  function goLab()   { nav.update(s => ({ ...s, mode: 'range', labId: p.id })); }
  function prev()    { nav.update(s => ({ ...s, phase: Math.max(0, s.phase - 1) })); }
  function next()    { nav.update(s => ({ ...s, phase: Math.min(PHASES.length - 1, s.phase + 1) })); }
</script>

<div class="study-split">
  <div class="study-left">
    <div class="crumb">
      <button class="link-btn" onclick={goMap}>◂ Map</button>
      <span>/</span> PHASE {String(p.n).padStart(2,'0')}
      <span>/</span> {p.title}
    </div>

    <div class="studyhead">
      <div class="node__chips" style="margin-bottom:10px">
        {#each p.tracks as t}<span class="chip t-{t}">{t}</span>{/each}
      </div>
      <h1 class="h1" style="font-size:clamp(26px,4.5vw,42px)">{p.title}</h1>
      <div class="node__tags" style="margin-top:8px">{p.tag}</div>
    </div>

    {#if p.idea}
      <p class="idea" style="--accent:{ac}">{@html p.idea}</p>
    {/if}
    <div class="deepbox" style="--accent:{ac}">
      <span class="lbl">Mechanism — understand this one thing</span>
      <p>{p.deep}</p>
    </div>

    <div class="sec">
      <div class="sec__h">Core concepts <span style="color:{ac};font-family:var(--grot);letter-spacing:0;text-transform:none">— open to mark</span></div>
      {#each p.concepts as c, i}
        {@const key  = p.id + ':' + i}
        {@const on   = !!$progress.learned?.[key]}
        {@const open = !!$nav.openConcepts?.[key]}
        <div class="concept" style="--accent:{ac}" data-on={on ? 1 : 0}>
          <div class="concept-header" onclick={() => toggle(key)}>
            <span class="concept-title">{c.t}</span>
            <span class="concept-arrow">{open ? '▾' : '▸'}</span>
          </div>
          {#if open}
            <div class="concept-body">
              <p>{c.d}</p>
              <button class="learnbtn" class:on onclick={() => markLearned(key)} style="--accent:{ac}">
                {on ? '✓ Locked in' : 'Mark as learned'}
              </button>
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <div class="sec">
      <div class="sec__h">Traps</div>
      <ul class="tlist">{#each p.traps as t}<li>{t}</li>{/each}</ul>
    </div>

    <div class="sec">
      <div class="sec__h">Reflect</div>
      <ul class="rlist">{#each p.reflect as r}<li>{r}</li>{/each}</ul>
    </div>

    <div class="sec">
      <div class="feeds"><b>↳ Connects forward:</b> {p.feeds}</div>
    </div>
  </div>

  <div class="study-sticky">
    <div class="sec" style="margin-top:0">
      <div class="sec__h">Commands</div>
      {#each p.commands as c}
        <div class="cmd">
          <div class="cmd-copy-wrap">
            <code onclick={() => copyCmd(c.c)}>{c.c}</code>
          </div>
          <span>{c.d}</span>
        </div>
      {/each}
    </div>

    <div class="studynav">
      <button class="btn" onclick={goLab} style="width:100%">⚡ Launch Interactive Lab →</button>
      <div class="phase-nav">
        {#if $nav.phase > 0}
          <button class="iconbtn" onclick={prev}>◂ Phase {p.n - 1}</button>
        {/if}
        {#if $nav.phase < PHASES.length - 1}
          <button class="iconbtn" onclick={next}>Phase {p.n + 1} ▸</button>
        {/if}
      </div>
    </div>
  </div>
</div>
