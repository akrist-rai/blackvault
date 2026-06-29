<script>
  import { PHASES } from '$lib/data';
  import { phases } from '$lib/stores';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';

  $: selectedId = $page.url.searchParams.get('phase') ?? 'p01';
  $: selected   = PHASES.find(p => p.id === selectedId) ?? PHASES[0];
</script>

<svelte:head><title>Study — BLACKVAULT</title></svelte:head>

<div class="topstrip">
  <span>STUDY</span>
  <span class="ts-right">Phase {selected.n} — {selected.name}</span>
</div>

<div class="study-layout">
  <nav class="phase-nav">
    {#each PHASES as p}
      <button
        class="pn-item"
        class:active={p.id === selectedId}
        on:click={() => goto('/console/study?phase='+p.id)}
      >
        <span class="pn-n">{p.n}</span>
        <span class="pn-name">{p.name}</span>
        <span class="chip chip-{p.track==='DF'?'df':p.track==='RE'?'re':'ma'}" style="font-size:9px;padding:1px 5px">{p.track}</span>
      </button>
    {/each}
  </nav>

  <main class="study-main">
    <div class="study-card">
      <div class="sc-header">
        <div class="sc-eyebrow">Phase {selected.n}</div>
        <h1 class="sc-title">{selected.name}</h1>
        <div class="sc-tools">{selected.tools}</div>
      </div>
      <div class="sc-body">
        <p>Detailed study material for <strong>{selected.name}</strong> is available in <code>phases/phase-{String(selected.n).padStart(2,'0')}-*.md</code>.</p>
        <p>The guide covers: conceptual background, command walkthrough on the range artifacts, flashcard-style key terms, common traps, and phase links.</p>
        <a
          href="/console/range"
          class="btn-primary"
          style="display:inline-block;margin-top:20px"
        >
          Open Lab for Phase {selected.n} →
        </a>
      </div>
    </div>
  </main>
</div>

<style>
  .topstrip {
    position: sticky; top: 0;
    background: color-mix(in srgb, var(--panel) 85%, transparent);
    backdrop-filter: blur(6px);
    border-bottom: 1px solid var(--line);
    padding: 10px 28px; font-size: 11px; font-weight: 700; letter-spacing: .1em; color: var(--ash);
    display: flex; justify-content: space-between; z-index: 10;
  }
  .ts-right { color: var(--volt); }

  .study-layout { display: flex; flex: 1; overflow: hidden; }

  .phase-nav {
    width: 220px; min-width: 220px;
    border-right: 1px solid var(--line);
    overflow-y: auto;
    padding: 8px 0;
  }
  .pn-item {
    display: flex; align-items: center; gap: 8px;
    width: 100%; padding: 9px 16px; border: none;
    background: none; text-align: left; cursor: pointer;
    border-left: 2px solid transparent;
    transition: background .15s, border-color .15s;
  }
  .pn-item:hover { background: var(--panel2); }
  .pn-item.active { border-left-color: var(--volt); background: color-mix(in srgb, var(--volt) 6%, transparent); }
  .pn-n { font-family: var(--mono); font-size: 11px; color: var(--volt); width: 16px; flex-shrink: 0; }
  .pn-name { flex: 1; font-size: 12px; color: var(--ash); }
  .pn-item.active .pn-name { color: var(--bone); }

  .study-main { flex: 1; padding: 28px; overflow-y: auto; }
  .study-card {
    background: var(--panel); border: 1px solid var(--line);
    border-radius: var(--rad); overflow: hidden; max-width: 700px;
  }
  .sc-header {
    padding: 28px 32px;
    border-bottom: 1px solid var(--line);
    background: var(--panel2);
  }
  .sc-eyebrow { font-size: 11px; color: var(--volt); font-weight: 700; letter-spacing: .1em; text-transform: uppercase; margin-bottom: 6px; }
  .sc-title { font-size: 22px; font-weight: 700; color: var(--bone); margin-bottom: 8px; }
  .sc-tools { font-family: var(--mono); font-size: 12px; color: var(--ash); }
  .sc-body { padding: 28px 32px; }
  .sc-body p { font-size: 14px; color: var(--ash); line-height: 1.7; margin-bottom: 12px; }
  .sc-body code { font-family: var(--mono); color: var(--volt); font-size: 12px; }
  .sc-body strong { color: var(--bone); }
  .btn-primary {
    background: var(--volt); color: var(--void); font-weight: 700;
    font-size: 13px; padding: 10px 20px; border-radius: var(--rad);
    text-decoration: none; transition: opacity .15s;
  }
  .btn-primary:hover { opacity: .85; text-decoration: none; }
</style>
