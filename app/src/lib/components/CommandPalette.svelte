<script>
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { tick } from 'svelte';
  import { PHASES, LABS, CASES } from '$lib/data';
  import { commandPaletteOpen } from '$lib/stores';

  let query = '';
  let selected = 0;
  let inputEl;

  const PAGES = [
    { label: 'Landing',          sub: 'Home page',                href: '/',                  group: 'Pages', icon: '◈' },
    { label: 'Dashboard',        sub: 'Mastery & progress',        href: '/console',           group: 'Pages', icon: '⬡' },
    { label: 'Flag Challenges',  sub: '12-phase curriculum',       href: '/console/study',     group: 'Pages', icon: '▣' },
    { label: 'Range Labs',       sub: '16 browser-based labs',     href: '/console/range',     group: 'Pages', icon: '◉' },
    { label: 'Field Exercise: VENOMQUILL', sub: 'Static malware analysis, live artifact', href: '/console/range/field/venomquill', group: 'Pages', icon: '🦠' },
    { label: 'Field Exercise: NIGHTGLASS', sub: 'Live downloadable artifact', href: '/console/range/field/nightglass', group: 'Pages', icon: '🧪' },
    { label: 'Case Files',       sub: 'Investigation scenarios',   href: '/console/case',      group: 'Pages', icon: '🗂' },
    { label: 'Intel Feed',       sub: 'Threat intelligence',       href: '/intel',             group: 'Pages', icon: '◧' },
    { label: 'Arsenal',          sub: 'Tool & command reference',  href: '/tools',             group: 'Pages', icon: '◈' },
    { label: 'IR Playbooks',     sub: 'Incident response runbooks',href: '/playbook',          group: 'Pages', icon: '▣' },
    { label: 'ATT&CK Matrix',    sub: 'MITRE technique reference', href: '/console/attack',    group: 'Pages', icon: '⛶' },
    { label: 'Badges',           sub: 'Achievements earned',       href: '/console/badges',    group: 'Pages', icon: '🏅' },
    { label: 'Operator Profile', sub: 'Full progress breakdown',   href: '/console/profile',   group: 'Pages', icon: '◎' },
  ];

  const PHASE_ITEMS = PHASES.map(p => ({
    label: `Phase ${p.n} — ${p.name}`, sub: p.tools, href: `/console/study?phase=${p.id}`,
    group: 'Phases', icon: '▣',
  }));

  const LAB_ITEMS = LABS.map(l => ({
    label: l.name, sub: l.tool, href: `/console/range/${l.id}`,
    group: 'Labs', icon: '◉',
  }));

  const CASE_ITEMS = CASES.map(c => ({
    label: `${c.codename} — ${c.title}`, sub: c.actor, href: '/console/case',
    group: 'Cases', icon: '🗂',
  }));

  const INDEX = [...PAGES, ...PHASE_ITEMS, ...LAB_ITEMS, ...CASE_ITEMS];

  $: q = query.trim().toLowerCase();
  $: results = !q ? PAGES : INDEX.filter(i =>
    i.label.toLowerCase().includes(q) || i.sub.toLowerCase().includes(q) || i.group.toLowerCase().includes(q)
  ).slice(0, 40);

  $: if (query !== undefined) selected = 0;

  let wasOpen = false;
  $: if ($commandPaletteOpen && !wasOpen) {
    query = '';
    selected = 0;
    tick().then(() => inputEl?.focus());
  }
  $: wasOpen = $commandPaletteOpen;

  function openPalette()  { commandPaletteOpen.set(true); }
  function closePalette() { commandPaletteOpen.set(false); }

  function choose(item) {
    closePalette();
    goto(base + item.href);
  }

  function handleGlobalKey(e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      $commandPaletteOpen ? closePalette() : openPalette();
    } else if (e.key === 'Escape' && $commandPaletteOpen) {
      closePalette();
    }
  }

  function handleInputKey(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selected = Math.min(selected + 1, results.length - 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selected = Math.max(selected - 1, 0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selected]) choose(results[selected]);
    }
  }
</script>

<svelte:window on:keydown={handleGlobalKey} />

{#if $commandPaletteOpen}
  <div class="cp-backdrop" on:click={closePalette} aria-hidden="true"></div>
  <div class="cp-panel" role="dialog" aria-modal="true" aria-label="Command palette">
    <div class="cp-input-row">
      <span class="cp-icon">⌕</span>
      <input
        bind:this={inputEl}
        bind:value={query}
        on:keydown={handleInputKey}
        class="cp-input"
        type="text"
        placeholder="Jump to a page, phase, lab, or case…"
        autocomplete="off"
        spellcheck="false"
      />
      <kbd class="cp-esc">ESC</kbd>
    </div>
    <div class="cp-results">
      {#if results.length === 0}
        <div class="cp-empty">No matches for "{query}"</div>
      {:else}
        {#each results as item, i}
          <button
            class="cp-item"
            class:cp-active={i === selected}
            on:click={() => choose(item)}
            on:mouseenter={() => selected = i}
          >
            <span class="cp-item-icon">{item.icon}</span>
            <span class="cp-item-text">
              <span class="cp-item-label">{item.label}</span>
              <span class="cp-item-sub">{item.sub}</span>
            </span>
            <span class="cp-item-group">{item.group}</span>
          </button>
        {/each}
      {/if}
    </div>
    <div class="cp-foot">
      <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
      <span><kbd>↵</kbd> open</span>
      <span><kbd>esc</kbd> close</span>
    </div>
  </div>
{/if}

<style>
  .cp-backdrop {
    position: fixed; inset: 0;
    background: rgba(2,6,12,.7);
    backdrop-filter: blur(4px);
    z-index: 1000;
  }
  .cp-panel {
    position: fixed;
    top: 14vh; left: 50%;
    transform: translateX(-50%);
    width: min(560px, 92vw);
    max-height: 64vh;
    background: var(--panel2);
    border: 1px solid var(--line2);
    border-radius: var(--rad-lg);
    box-shadow: var(--shadow-lg), 0 0 60px color-mix(in srgb, var(--volt) 8%, transparent);
    z-index: 1001;
    display: flex; flex-direction: column;
    overflow: hidden;
  }
  .cp-input-row {
    display: flex; align-items: center; gap: 10px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--line);
    flex-shrink: 0;
  }
  .cp-icon { color: var(--volt); font-size: 15px; flex-shrink: 0; }
  .cp-input {
    flex: 1; background: none; border: none; outline: none;
    color: var(--bone); font-family: var(--font); font-size: 14px;
  }
  .cp-input::placeholder { color: var(--dim); }
  .cp-esc {
    font-family: var(--mono); font-size: 9px; color: var(--dim);
    border: 1px solid var(--line2); border-radius: 3px; padding: 2px 6px;
    flex-shrink: 0;
  }
  .cp-results { overflow-y: auto; padding: 6px; }
  .cp-empty { padding: 24px 16px; text-align: center; font-size: 13px; color: var(--ash); }
  .cp-item {
    display: flex; align-items: center; gap: 12px;
    width: 100%; padding: 9px 10px;
    background: none; border: none; border-radius: var(--rad);
    text-align: left; cursor: pointer;
    transition: background .1s;
  }
  .cp-item.cp-active { background: var(--volt-dim); }
  .cp-item-icon { font-size: 13px; width: 18px; text-align: center; flex-shrink: 0; opacity: .7; }
  .cp-item-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
  .cp-item-label { font-size: 13px; font-weight: 600; color: var(--bone); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cp-item-sub { font-size: 11px; color: var(--ash); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cp-item-group {
    font-size: 9px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
    color: var(--dim); flex-shrink: 0;
  }
  .cp-item.cp-active .cp-item-group { color: var(--volt); }
  .cp-foot {
    display: flex; gap: 16px;
    padding: 9px 16px;
    border-top: 1px solid var(--line);
    font-size: 10px; color: var(--dim);
    flex-shrink: 0;
  }
  .cp-foot kbd {
    font-family: var(--mono); font-size: 9px;
    background: var(--panel3); border: 1px solid var(--line2);
    border-radius: 3px; padding: 1px 4px; margin-right: 2px;
  }

  @media (max-width: 600px) {
    .cp-panel { top: 8vh; max-height: 78vh; }
  }
</style>
