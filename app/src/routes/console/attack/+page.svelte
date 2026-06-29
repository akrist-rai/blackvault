<script>
  import { ATTACK } from '$lib/data';

  const TACTICS = [...new Set(ATTACK.map(t => t.tactic))];
  let search = '';
  $: filtered = ATTACK.filter(t =>
    !search ||
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.id.toLowerCase().includes(search.toLowerCase()) ||
    t.tactic.toLowerCase().includes(search.toLowerCase())
  );
  let selected = null;
</script>

<svelte:head><title>ATT&amp;CK — BLACKVAULT</title></svelte:head>

<div class="topstrip">
  <span>MITRE ATT&amp;CK</span>
  <span class="ts-right">{ATTACK.length} techniques</span>
</div>

<main class="page">
  <div class="page-intro">
    <h1>MITRE ATT&amp;CK Reference</h1>
    <p>Techniques covered across the BLACKVAULT curriculum, mapped to tactics. Click any technique for details and detection guidance.</p>
    <input class="search-input" bind:value={search} placeholder="Search techniques…" type="search" />
  </div>

  <div class="attack-grid">
    {#each filtered as t}
      <button class="att-card" class:active={selected?.id === t.id} on:click={() => selected = selected?.id === t.id ? null : t}>
        <div class="att-id">{t.id}</div>
        <div class="att-tactic">{t.tactic}</div>
        <div class="att-name">{t.name}</div>
        {#if selected?.id === t.id}
          <div class="att-detail">{t.detail}</div>
        {/if}
      </button>
    {/each}
  </div>
</main>

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
  .page { padding: 28px; }
  .page-intro {
    background: var(--panel); border: 1px solid var(--line); border-radius: var(--rad);
    padding: 28px 32px; margin-bottom: 28px;
  }
  .page-intro h1 { font-size: 20px; font-weight: 700; color: var(--bone); margin-bottom: 10px; }
  .page-intro p { font-size: 14px; color: var(--ash); line-height: 1.6; margin-bottom: 16px; }
  .search-input {
    width: 100%; max-width: 400px;
    background: var(--panel2); border: 1px solid var(--line2);
    color: var(--bone); padding: 9px 14px; border-radius: var(--rad);
    font-family: var(--font); font-size: 13px; outline: none;
  }
  .search-input:focus { border-color: var(--volt); }

  .attack-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
  .att-card {
    background: var(--panel); border: 1px solid var(--line); border-radius: var(--rad);
    padding: 16px; text-align: left; cursor: pointer;
    transition: border-color .15s, background .15s;
    width: 100%;
  }
  .att-card:hover { border-color: var(--line2); background: var(--panel2); }
  .att-card.active { border-color: var(--volt); background: color-mix(in srgb, var(--volt) 5%, var(--panel)); }
  .att-id { font-family: var(--mono); font-size: 11px; color: var(--volt); margin-bottom: 4px; }
  .att-tactic { font-size: 10px; color: var(--ash); letter-spacing: .06em; text-transform: uppercase; margin-bottom: 6px; }
  .att-name { font-size: 13px; font-weight: 600; color: var(--bone); }
  .att-detail { font-size: 12px; color: var(--ash); line-height: 1.5; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--line); }

  @media (max-width: 800px) { .attack-grid { grid-template-columns: 1fr 1fr; } }
</style>
