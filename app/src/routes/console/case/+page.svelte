<script>
  import { CASES } from '$lib/data';
  import { cases } from '$lib/stores';

  $: solved = $cases;
</script>

<svelte:head><title>Cases — BLACKVAULT</title></svelte:head>

<div class="topstrip">
  <span>INVESTIGATION CASES</span>
  <span class="ts-right">{Object.values(solved).filter(Boolean).length} / {CASES.length} solved</span>
</div>

<main class="page">
  <div class="page-intro">
    <h1>Investigation Cases</h1>
    <p>Full end-to-end investigation scenarios. Each case provides artifacts, IOCs, and a timeline to reconstruct. Work through the evidence to answer the investigative questions and close the case.</p>
  </div>

  <div class="case-grid">
    {#each CASES as c}
      {@const done = !!solved[c.id]}
      <div class="case-card" class:done>
        <div class="cc-top">
          <span class="cc-codename">{c.codename}</span>
          <span class="sev sev-{c.severity === 'CRITICAL' ? 'blood' : 'amber'}">{c.severity}</span>
          {#if done}<span class="cc-solved">SOLVED</span>{/if}
        </div>
        <h2 class="cc-title">{c.title}</h2>
        <div class="cc-meta">
          <span class="cc-actor">{c.actor}</span>
          <span class="cc-sep">·</span>
          <span class="cc-sector">{c.sector}</span>
        </div>
        <p class="cc-blurb">{c.blurb}</p>
        <div class="cc-tracks">
          {#each c.tracks as t}
            <span class="chip chip-{t === 'DF' ? 'df' : t === 'RE' ? 're' : 'ma'}">{t}</span>
          {/each}
        </div>
        <button class="cc-btn">
          {#if done}Review Case{:else}Open Case{/if}
        </button>
      </div>
    {/each}
  </div>
</main>

<style>
  .topstrip {
    position: sticky; top: 0;
    background: color-mix(in srgb, var(--panel) 85%, transparent);
    backdrop-filter: blur(6px);
    border-bottom: 1px solid var(--line);
    padding: 10px 28px;
    font-size: 11px; font-weight: 700; letter-spacing: .1em; color: var(--ash);
    display: flex; justify-content: space-between; z-index: 10;
  }
  .ts-right { color: var(--volt); }

  .page { padding: 28px; }
  .page-intro {
    background: var(--panel); border: 1px solid var(--line); border-radius: var(--rad);
    padding: 28px 32px; margin-bottom: 28px;
  }
  .page-intro h1 { font-size: 20px; font-weight: 700; color: var(--bone); margin-bottom: 10px; }
  .page-intro p { font-size: 14px; color: var(--ash); line-height: 1.6; }

  .case-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }

  .case-card {
    background: var(--panel); border: 1px solid var(--line);
    border-radius: var(--rad); padding: 24px;
    transition: border-color .15s;
  }
  .case-card:hover { border-color: var(--line2); }
  .case-card.done { border-color: color-mix(in srgb, var(--volt) 25%, transparent); }

  .cc-top { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
  .cc-codename { font-family: var(--mono); font-size: 12px; color: var(--volt); font-weight: 700; letter-spacing: .06em; }
  .sev { font-size: 10px; font-weight: 700; letter-spacing: .08em; }
  .sev-blood { color: var(--blood); }
  .sev-amber { color: var(--amber); }
  .cc-solved { margin-left: auto; font-size: 10px; color: var(--volt); font-weight: 700; letter-spacing: .08em; }

  .cc-title { font-size: 17px; font-weight: 700; color: var(--bone); margin-bottom: 6px; }
  .cc-meta { font-size: 12px; color: var(--ash); margin-bottom: 12px; display: flex; gap: 6px; }
  .cc-sep { color: var(--dim); }
  .cc-blurb { font-size: 13px; color: var(--ash); line-height: 1.6; margin-bottom: 14px; }
  .cc-tracks { display: flex; gap: 6px; margin-bottom: 16px; }
  .cc-btn {
    display: inline-block;
    padding: 8px 18px;
    background: color-mix(in srgb, var(--volt) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--volt) 30%, transparent);
    color: var(--volt); border-radius: var(--rad);
    font-size: 13px; font-weight: 600; cursor: pointer;
    transition: background .15s;
  }
  .cc-btn:hover { background: color-mix(in srgb, var(--volt) 18%, transparent); }

  @media (max-width: 800px) { .case-grid { grid-template-columns: 1fr; } }
</style>
