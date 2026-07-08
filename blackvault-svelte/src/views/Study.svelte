<script>
  import { nav, progress, toast } from '../stores/progress.js';
  import { PHASES } from '../data/curriculum.js';

  $: p = PHASES[$nav.phase] || PHASES[0];
  $: ac = (() => {
    const A = { DF: 'var(--amber)', RE: 'var(--volt)', MA: 'var(--blood)' };
    return p.tracks.length > 1 ? 'var(--bone)' : (A[p.tracks[0]] || 'var(--bone)');
  })();

  function chips(tracks) {
    return tracks.map(t => `<span class="chip t-${t}">${t}</span>`).join('');
  }

  function toggleConcept(key) {
    nav.update(s => ({
      ...s,
      openConcepts: { ...s.openConcepts, [key]: !s.openConcepts[key] }
    }));
  }

  function markLearned(key) {
    progress.update(p => {
      p.learned = { ...p.learned, [key]: p.learned[key] ? 0 : 1 };
      return p;
    });
    toast('✓ concept marked');
  }

  function copyCmd(text) {
    navigator.clipboard?.writeText(text).then(() => toast('✓ copied'));
  }

  function goMap()   { nav.update(s => ({ ...s, mode: 'map' })); }
  function goQuiz()  { nav.update(s => ({ ...s, mode: 'quiz', quizPhase: $nav.phase })); }
  function prevPhase() { nav.update(s => ({ ...s, phase: Math.max(0, s.phase - 1) })); }
  function nextPhase() { nav.update(s => ({ ...s, phase: Math.min(PHASES.length - 1, s.phase + 1) })); }
</script>

<div class="study-split">
  <div class="study-left">
    <div class="crumb">
      <button class="link-btn" on:click={goMap}>◂ Map</button>
      <span>/</span> PHASE {String(p.n).padStart(2,'0')}
      <span>/</span> {p.title}
    </div>

    <div class="studyhead">
      <div class="node__chips" style="margin-bottom:10px">{@html chips(p.tracks)}</div>
      <h1 class="h1" style="font-size:clamp(26px,4.5vw,40px)">{p.title}</h1>
      <div class="node__tags" style="margin-top:8px">{p.tag}</div>
    </div>

    <p class="idea" style="--accent:{ac}">{p.idea}</p>
    <div class="deepbox" style="--accent:{ac}">
      <div class="lbl">Mechanism · understand this one thing</div>
      <p>{p.deep}</p>
    </div>

    <div class="sec">
      <div class="sec__h">Core concepts <span style="color:{ac};font-family:var(--grot);letter-spacing:0;text-transform:none">— mark each once it clicks</span></div>
      {#each p.concepts as c, i}
        {@const key = p.id + ':' + i}
        {@const on = !!$progress.learned?.[key]}
        {@const open = !!$nav.openConcepts?.[key]}
        <div class="concept" style="--accent:{ac}">
          <div class="concept__header" on:click={() => toggleConcept(key)} style="cursor:pointer;display:flex;justify-content:space-between;align-items:center;width:100%">
            <p class="concept__t" style="margin:0;font-weight:bold;flex:1">{c.t}</p>
            <span style="font-family:var(--mono);font-size:12px;margin-left:12px;transform:{open ? 'rotate(90deg)' : 'rotate(0deg)'};transition:transform 0.2s">▸</span>
          </div>
          {#if open}
            <div style="margin-top:10px;border-top:1px solid var(--line);padding-top:10px;width:100%">
              <p class="concept__d" style="margin-bottom:12px;color:var(--ash)">{c.d}</p>
              <button class="learnbtn" class:learned={on} style="--accent:{ac}" on:click={() => markLearned(key)}>
                {on ? '✓ Got it' : 'Got it'}
              </button>
            </div>
          {/if}
        </div>
      {/each}
    </div>

    <div class="sec">
      <div class="sec__h">Traps that bite</div>
      <ul class="tlist">{#each p.traps as t}<li>{t}</li>{/each}</ul>
    </div>

    <div class="sec">
      <div class="sec__h">Reflect (open-ended — answer out loud)</div>
      <ul class="rlist">{#each p.reflect as r}<li>{r}</li>{/each}</ul>
    </div>

    <div class="sec">
      <div class="feeds"><b>↳ Connects forward:</b> {p.feeds}</div>
    </div>
  </div>

  <div class="study-sticky">
    <div class="sec" style="margin-top:0">
      <div class="sec__h">Command arsenal</div>
      <p class="lede" style="margin-bottom:12px;font-size:12px;color:var(--ash)">Tap any command below to copy it.</p>
      {#each p.commands as c}
        <div class="cmd">
          <button class="cmd-copy" on:click={() => copyCmd(c.c)}><code>{c.c}</code></button>
          <span>{c.d}</span>
        </div>
      {/each}
    </div>

    <div class="studynav" style="margin-top:24px;border-top:1.5px solid var(--line);padding-top:20px">
      <button class="btn--ghost btn" on:click={goQuiz} style="width:100%">Quiz this phase →</button>
      <div style="display:flex;gap:10px;margin-top:12px;width:100%">
        {#if $nav.phase > 0}
          <button class="iconbtn" on:click={prevPhase} style="flex:1">◂ Phase {p.n - 1}</button>
        {/if}
        {#if $nav.phase < PHASES.length - 1}
          <button class="iconbtn" on:click={nextPhase} style="flex:1">Phase {p.n + 1} ▸</button>
        {/if}
      </div>
    </div>
  </div>
</div>
