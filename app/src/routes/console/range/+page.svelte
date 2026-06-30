<script>
  import { LABS } from '$lib/data';
  import { labs, ctf } from '$lib/stores';
  import { goto } from '$app/navigation';

  let trackFilter = 'ALL'; // ALL | DF | RE | MA

  const ALL_CHAPTER = LABS.filter(l => !['yara','timeline','threat_hunt','crypt_re'].includes(l.id));
  const ALL_SKILL   = LABS.filter(l =>  ['yara','timeline','threat_hunt','crypt_re'].includes(l.id));

  $: CHAPTER = trackFilter === 'ALL' ? ALL_CHAPTER : ALL_CHAPTER.filter(l => l.track === trackFilter);
  $: SKILL   = trackFilter === 'ALL' ? ALL_SKILL   : ALL_SKILL.filter(l => l.track === trackFilter);

  $: labsDone = $labs;
  $: flagsCaptured = $ctf;
  $: flagCount = LABS.filter(l => flagsCaptured[l.id]).length;

  function progress(lab) {
    const done = labsDone[lab.id]?.done?.length ?? 0;
    const total = OBJS[lab.id]?.length ?? 1;
    return Math.round((done / total) * 100);
  }

  const OBJS = {
    disk:       ['mount','mmls','fls','icat','flag'],
    asm:        ['break','stepi','regs','result'],
    peelf:      ['magic','sections','entry','iat'],
    static:     ['hash','strings','imports','entropy','yara'],
    ghidra:     ['open','rename','xorkey','decode'],
    dynamic:    ['strace','file_drop','c2','registry'],
    unpack:     ['entropy','stub','oep','strings'],
    memory:     ['pslist','malfind','rwx','netscan'],
    network:    ['beacon','ja3','carve','dns'],
    protocol:   ['magic','framing','xorkey','decode'],
    rootkit:    ['runkey','timestomp','service','ssdt'],
    capstone:   ['phishing','exec','c2','impact'],
    yara:       ['strings','entropy','imports','pe_header','rule','test'],
    timeline:   ['run','filter','first_action','correlate','csv'],
    threat_hunt:['beaconing','lsass_access','lotl','process_tree'],
    crypt_re:   ['entropy','sbox','keysched','rc4'],
  };
</script>

<svelte:head><title>Range Labs — BLACKVAULT</title></svelte:head>

<div class="topstrip">
  <span>RANGE LABS</span>
  <div class="ts-right-group">
    <span class="ts-count">{LABS.filter(l => (labsDone[l.id]?.done?.length ?? 0) > 0).length}/{LABS.length} started</span>
    <div class="track-filters">
      {#each ['ALL','DF','RE','MA'] as t}
        <button class="tf" class:active={trackFilter === t} on:click={() => trackFilter = t}>{t}</button>
      {/each}
    </div>
  </div>
</div>

<main class="range-main">
  <div class="range-hero">
    <h1 class="rh-title">Training Range</h1>
    <p class="rh-sub">Browser-based labs with simulated tool output. Work each objective in order, then submit the lab's <code>BV{'{'}...{'}'}</code> flag to bank the capture. Pair with real artifacts in <code>range/</code> for the full experience.</p>
    <div class="rh-stats">
      <div class="rh-stat">
        <div class="rh-stat-bar"><div class="rh-stat-fill rh-fill-volt" style="width:{Math.round(LABS.filter(l => (labsDone[l.id]?.done?.length ?? 0) > 0).length / LABS.length * 100)}%"></div></div>
        <span class="rh-stat-label">{LABS.filter(l => (labsDone[l.id]?.done?.length ?? 0) > 0).length}/{LABS.length} labs started</span>
      </div>
      <div class="rh-stat">
        <div class="rh-stat-bar"><div class="rh-stat-fill rh-fill-amber" style="width:{Math.round(flagCount / LABS.length * 100)}%"></div></div>
        <span class="rh-stat-label">{flagCount}/{LABS.length} flags captured</span>
      </div>
    </div>
  </div>

  <section class="lab-section">
    <h2 class="ls-hd">Field Exercises <span class="ls-count">1</span></h2>
    <p class="ls-sub">Real downloadable artifacts, analyzed with real tools on your own machine — no simulated terminal.</p>
    <button class="field-card" on:click={() => goto('/console/range/field/nightglass')}>
      <div class="fc-top">
        <span class="fc-tag">LIVE ARTIFACT</span>
        {#if [0,1,2].every(i => flagsCaptured['field_nightglass_'+i])}<span class="lc-done">✓</span>{/if}
      </div>
      <div class="fc-name">Case NIGHTGLASS — Memory-Resident PowerShell Stager</div>
      <p class="fc-blurb">Download a real EDR triage log, decode a Base64/UTF-16LE <code>-EncodedCommand</code> payload, recover the XOR key, and carve a flag out of a memory dump — three real flags, zero simulation.</p>
      <div class="fc-stages">{[0,1,2].filter(i => flagsCaptured['field_nightglass_'+i]).length}/3 stages solved</div>
    </button>
  </section>

  <section class="lab-section">
    <h2 class="ls-hd">Chapter Labs <span class="ls-count">{CHAPTER.length}</span></h2>
    <div class="lab-grid">
      {#each CHAPTER as lab}
        {@const pct = progress(lab)}
        {@const done = pct === 100}
        <button class="lab-card" class:done on:click={() => goto('/console/range/'+lab.id)}>
          <div class="lc-top">
            <span class="chip chip-{lab.track==='DF'?'df':lab.track==='RE'?'re':'ma'}">{lab.track}</span>
            <span class="lc-phase">Phase {lab.phase}</span>
            {#if flagsCaptured[lab.id]}<span class="lc-flag" title="Flag captured">⚑</span>{/if}
            {#if done}<span class="lc-done">✓</span>{/if}
          </div>
          <div class="lc-name">{lab.name}</div>
          <div class="lc-tool">{lab.tool}</div>
          <p class="lc-blurb">{lab.blurb}</p>
          <div class="lc-bar">
            <div class="lc-fill" style="width:{pct}%"></div>
          </div>
          <div class="lc-pct">{pct}%</div>
        </button>
      {/each}
    </div>
  </section>

  <section class="lab-section">
    <h2 class="ls-hd">Skill Labs <span class="ls-count">{SKILL.length}</span></h2>
    <p class="ls-sub">Cross-cutting skills that go deeper than a single phase.</p>
    <div class="lab-grid">
      {#each SKILL as lab}
        {@const pct = progress(lab)}
        {@const done = pct === 100}
        <button class="lab-card" class:done on:click={() => goto('/console/range/'+lab.id)}>
          <div class="lc-top">
            <span class="chip chip-{lab.track==='DF'?'df':lab.track==='RE'?'re':'ma'}">{lab.track}</span>
            <span class="lc-phase">Phase {lab.phase}</span>
            {#if flagsCaptured[lab.id]}<span class="lc-flag" title="Flag captured">⚑</span>{/if}
            {#if done}<span class="lc-done">✓</span>{/if}
          </div>
          <div class="lc-name">{lab.name}</div>
          <div class="lc-tool">{lab.tool}</div>
          <p class="lc-blurb">{lab.blurb}</p>
          <div class="lc-bar">
            <div class="lc-fill" style="width:{pct}%"></div>
          </div>
          <div class="lc-pct">{pct}%</div>
        </button>
      {/each}
    </div>
  </section>
</main>

<style>
  .topstrip {
    position: sticky; top: 0;
    background: color-mix(in srgb, var(--panel) 85%, transparent);
    backdrop-filter: blur(6px);
    border-bottom: 1px solid var(--line);
    padding: 10px 28px;
    font-size: 11px; font-weight: 700; letter-spacing: .1em; color: var(--ash);
    display: flex; justify-content: space-between;
    z-index: 10;
  }
  .ts-right-group { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
  .ts-count { color: var(--volt); font-size: 11px; }
  .track-filters { display: flex; gap: 3px; }
  .tf {
    font-size: 10px; font-weight: 700; letter-spacing: .08em;
    padding: 3px 9px; border-radius: 3px; cursor: pointer;
    border: 1px solid var(--line2); background: transparent; color: var(--ash);
    min-height: 26px; transition: all .15s;
  }
  .tf.active { border-color: var(--volt); color: var(--volt); background: color-mix(in srgb,var(--volt) 10%,transparent); }
  .tf:hover:not(.active) { border-color: var(--ash); color: var(--bone); }

  .range-main { padding: 28px; flex: 1; }

  .range-hero {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: var(--rad);
    padding: 28px 32px;
    margin-bottom: 32px;
  }
  .rh-title { font-size: 22px; font-weight: 700; color: var(--bone); margin-bottom: 8px; }
  .rh-sub { font-size: 14px; color: var(--ash); line-height: 1.6; margin-bottom: 18px; }
  .rh-sub code { color: var(--volt); font-family: var(--mono); font-size: 13px; }

  .rh-stats { display: flex; gap: 24px; flex-wrap: wrap; }
  .rh-stat { flex: 1; min-width: 200px; }
  .rh-stat-bar { height: 4px; background: var(--line2); border-radius: 2px; overflow: hidden; margin-bottom: 6px; }
  .rh-stat-fill { height: 100%; border-radius: 2px; transition: width .5s ease; }
  .rh-fill-volt { background: var(--volt); box-shadow: var(--glow-volt); }
  .rh-fill-amber { background: var(--amber); box-shadow: var(--glow-amber); }
  .rh-stat-label { font-size: 11px; color: var(--ash); letter-spacing: .04em; }

  .lab-section { margin-bottom: 36px; }
  .ls-hd {
    font-size: 14px; font-weight: 700; color: var(--bone);
    letter-spacing: .06em; text-transform: uppercase;
    margin-bottom: 16px; display: flex; align-items: center; gap: 10px;
  }
  .ls-count {
    font-size: 11px; color: var(--ash);
    background: var(--panel); border: 1px solid var(--line);
    padding: 2px 8px; border-radius: 20px;
  }
  .ls-sub { font-size: 13px; color: var(--ash); margin-bottom: 16px; margin-top: -8px; }

  .field-card {
    display: block; width: 100%; text-align: left; cursor: pointer;
    background: color-mix(in srgb, var(--amber) 5%, var(--panel));
    border: 1px solid color-mix(in srgb, var(--amber) 25%, var(--line));
    border-radius: var(--rad); padding: 20px 24px;
    transition: border-color .15s, transform .15s;
  }
  .field-card:hover { border-color: var(--amber); transform: translateY(-1px); }
  .fc-top { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .fc-tag {
    font-size: 10px; font-weight: 700; letter-spacing: .1em; color: var(--amber);
    border: 1px solid color-mix(in srgb, var(--amber) 35%, transparent);
    background: color-mix(in srgb, var(--amber) 8%, transparent);
    padding: 3px 9px; border-radius: 20px;
  }
  .fc-name { font-size: 15px; font-weight: 700; color: var(--bone); margin-bottom: 8px; }
  .fc-blurb { font-size: 13px; color: var(--ash); line-height: 1.6; margin-bottom: 10px; }
  .fc-blurb code { font-family: var(--mono); color: var(--volt); font-size: 12px; }
  .fc-stages { font-size: 11px; color: var(--amber); font-family: var(--mono); }

  .lab-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }

  .lab-card {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: var(--rad);
    padding: 18px;
    text-align: left;
    cursor: pointer;
    transition: border-color .15s, transform .15s;
    width: 100%;
  }
  .lab-card:hover { border-color: var(--line2); transform: translateY(-1px); }
  .lab-card.done { border-color: color-mix(in srgb, var(--volt) 30%, transparent); }
  .lc-top { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
  .lc-phase { font-size: 10px; color: var(--dim); font-family: var(--mono); }
  .lc-flag { margin-left: auto; color: var(--amber); font-size: 12px; }
  .lc-flag + .lc-done { margin-left: 6px; }
  .lc-done { margin-left: auto; color: var(--volt); font-size: 13px; }
  .lc-name { font-size: 14px; font-weight: 600; color: var(--bone); margin-bottom: 4px; }
  .lc-tool { font-size: 11px; color: var(--volt); font-family: var(--mono); margin-bottom: 8px; }
  .lc-blurb { font-size: 12px; color: var(--ash); line-height: 1.5; margin-bottom: 12px; }
  .lc-bar { height: 2px; background: var(--line2); border-radius: 1px; overflow: hidden; }
  .lc-fill { height: 100%; background: var(--volt); border-radius: 1px; transition: width .4s ease; }
  .lc-pct { font-size: 10px; color: var(--ash); margin-top: 4px; font-family: var(--mono); }

  @media (max-width: 900px) { .lab-grid { grid-template-columns: repeat(2, 1fr); } }
</style>
