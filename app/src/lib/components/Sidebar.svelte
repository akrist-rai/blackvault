<script>
  import { page } from '$app/stores';
  import { base } from '$app/paths';
  import { mastery, flagsCaptured, TOTAL_FLAGS, commandPaletteOpen } from '$lib/stores';
  import { createEventDispatcher } from 'svelte';

  export let open = false;

  const dispatch = createEventDispatcher();

  const NAV = [
    { group: 'HOME', items: [
      { href: '/',                label: 'Landing',    icon: '◈' },
      { href: '/console',         label: 'Dashboard',  icon: '⬡' },
      { href: '/console/profile', label: 'Profile',    icon: '◎' },
    ]},
    { group: 'LEARN', items: [
      { href: '/console/study', label: 'Challenges',  icon: '▣' },
      { href: '/console/range', label: 'Range Labs',   icon: '◉' },
    ]},
    { group: 'INTEL', items: [
      { href: '/intel',          label: 'Intel Feed',  icon: '◧' },
      { href: '/tools',          label: 'Arsenal',     icon: '◈' },
      { href: '/playbook',       label: 'Playbooks',   icon: '▣' },
    ]},
  ];

  $: pct = $mastery;
  $: meterColor = pct >= 75 ? 'var(--volt)' : pct >= 40 ? 'var(--amber)' : 'var(--blood)';
  $: meterGlow  = pct >= 75 ? 'var(--glow-volt)' : pct >= 40 ? 'var(--glow-amber)' : 'var(--glow-blood)';
  $: flagPct = Math.round(($flagsCaptured / TOTAL_FLAGS) * 100);

  function active(href) {
    const path = $page.url.pathname.slice(base.length) || '/';
    if (href === '/') return path === '/';
    if (href === '/console') return path === '/console';
    return path.startsWith(href);
  }

  function close() { dispatch('close'); }
  function handleNavClick() { dispatch('close'); }
</script>

{#if open}
  <div class="sb-backdrop" on:click={close} aria-hidden="true"></div>
{/if}

<aside class="sidebar" class:sidebar-open={open} aria-label="Navigation">

  <div class="sb-top">
    <a class="brand" href="{base}/" on:click={handleNavClick}>
      <div class="brand-logo">BLACK<em>VAULT</em></div>
      <div class="brand-sub">Security Training Range</div>
    </a>
    <button class="sb-close" on:click={close} aria-label="Close menu">✕</button>
  </div>

  <div class="meter-wrap">
    <div class="meter-header">
      <span class="meter-lbl">MASTERY</span>
      <span class="meter-pct" style="color:{meterColor}">{pct}%</span>
    </div>
    <div class="meter-bar">
      <div class="meter-fill" style="width:{pct}%; background:{meterColor}; box-shadow:{meterGlow}"></div>
    </div>
    <div class="meter-header flags-header">
      <span class="meter-lbl">⚑ FLAGS</span>
      <span class="meter-pct flags-pct">{$flagsCaptured}<span class="flags-of">/{TOTAL_FLAGS}</span></span>
    </div>
    <div class="meter-bar">
      <div class="meter-fill flags-fill" style="width:{flagPct}%"></div>
    </div>
  </div>

  <button class="sb-search" on:click={() => { commandPaletteOpen.set(true); close(); }}>
    <span class="sb-search-icon">⌕</span>
    <span class="sb-search-label">Jump to…</span>
    <kbd class="sb-search-kbd">⌘K</kbd>
  </button>

  <nav>
    {#each NAV as section}
      <div class="nav-group-lbl">{section.group}</div>
      {#each section.items as item}
        <a
          href={base + item.href}
          class="nav-item"
          class:active={active(item.href)}
          aria-current={active(item.href) ? 'page' : undefined}
          on:click={handleNavClick}
        >
          <span class="nav-icon">{item.icon}</span>
          <span class="nav-label">{item.label}</span>
        </a>
      {/each}
    {/each}
  </nav>

  <div class="sb-foot">
    <div class="sb-version">
      <span class="ver-dot"></span>
      BLACKVAULT v0.2
    </div>
  </div>

</aside>

<style>
  .sidebar {
    width: var(--sb);
    min-width: var(--sb);
    background: var(--panel);
    border-right: 1px solid var(--line);
    display: flex;
    flex-direction: column;
    height: 100dvh;
    position: sticky;
    top: 0;
    overflow-y: auto;
    flex-shrink: 0;
    z-index: 200;
    transition: transform .25s cubic-bezier(.25,.46,.45,.94);
  }

  /* ── Brand ── */
  .sb-top {
    display: flex;
    align-items: stretch;
    border-bottom: 1px solid var(--line);
    flex-shrink: 0;
  }
  .brand {
    flex: 1;
    display: block;
    padding: 18px 18px 15px;
    text-decoration: none;
  }
  .brand:hover { text-decoration: none; }
  .brand-logo {
    font-size: 15px;
    font-weight: 800;
    letter-spacing: .14em;
    color: var(--bone);
    line-height: 1;
  }
  .brand-logo em { font-style: normal; color: var(--volt); }
  .brand-sub {
    font-size: 9px;
    color: var(--dim);
    letter-spacing: .08em;
    text-transform: uppercase;
    margin-top: 4px;
  }

  .sb-close {
    display: none;
    align-items: center;
    justify-content: center;
    width: 44px;
    font-size: 13px;
    color: var(--ash);
    background: none;
    border: none;
    cursor: pointer;
    border-left: 1px solid var(--line);
    flex-shrink: 0;
    transition: color var(--tx), background var(--tx);
  }
  .sb-close:hover { color: var(--bone); background: var(--panel2); }

  /* ── Mastery meter ── */
  .meter-wrap {
    padding: 14px 18px;
    border-bottom: 1px solid var(--line);
    flex-shrink: 0;
  }
  .meter-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 7px;
  }
  .meter-lbl {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .1em;
    color: var(--dim);
    text-transform: uppercase;
  }
  .meter-pct {
    font-size: 12px;
    font-weight: 700;
    font-family: var(--mono);
    letter-spacing: .04em;
    transition: color .4s ease;
  }
  .meter-bar {
    height: 3px;
    background: var(--line2);
    border-radius: 2px;
    overflow: hidden;
  }
  .meter-fill {
    height: 100%;
    border-radius: 2px;
    transition: width .6s ease, background .4s ease, box-shadow .4s ease;
  }
  .flags-header { margin-top: 10px; }
  .flags-pct { color: var(--volt); }
  .flags-of { color: var(--dim); font-weight: 600; }
  .flags-fill { background: var(--volt); box-shadow: var(--glow-volt); }

  /* ── Search trigger ── */
  .sb-search {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 12px 18px 4px;
    padding: 8px 10px;
    background: var(--panel2);
    border: 1px solid var(--line2);
    border-radius: var(--rad);
    color: var(--ash);
    font-size: 12px;
    cursor: pointer;
    transition: border-color var(--tx), color var(--tx);
    flex-shrink: 0;
  }
  .sb-search:hover { border-color: var(--volt-brd); color: var(--bone); }
  .sb-search-icon { font-size: 12px; opacity: .7; }
  .sb-search-label { flex: 1; text-align: left; }
  .sb-search-kbd {
    font-family: var(--mono); font-size: 9px; color: var(--dim);
    border: 1px solid var(--line2); border-radius: 3px; padding: 1px 5px;
  }

  /* ── Nav ── */
  nav {
    flex: 1;
    padding: 6px 0;
    overflow-y: auto;
  }
  .nav-group-lbl {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .16em;
    color: var(--dim);
    padding: 12px 18px 4px;
    text-transform: uppercase;
  }
  .nav-item {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 0 18px;
    height: 38px;
    font-size: 13px;
    font-weight: 500;
    color: var(--ash);
    text-decoration: none;
    border-left: 2px solid transparent;
    transition: color var(--tx), background var(--tx), border-color var(--tx);
    letter-spacing: .01em;
  }
  .nav-item:hover {
    color: var(--bone);
    background: var(--panel2);
    text-decoration: none;
  }
  .nav-item.active {
    color: var(--volt);
    border-left-color: var(--volt);
    background: var(--volt-dim);
  }
  .nav-icon {
    font-size: 10px;
    opacity: .4;
    flex-shrink: 0;
    width: 14px;
    text-align: center;
    transition: opacity var(--tx);
  }
  .nav-item.active .nav-icon { opacity: 1; }
  .nav-item:hover .nav-icon { opacity: .7; }
  .nav-label { flex: 1; }

  /* ── Footer ── */
  .sb-foot {
    padding: 12px 18px;
    border-top: 1px solid var(--line);
    flex-shrink: 0;
  }
  .sb-version {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    color: var(--dim);
    letter-spacing: .08em;
    font-family: var(--mono);
  }
  .ver-dot {
    width: 5px; height: 5px;
    border-radius: 50%;
    background: var(--volt);
    box-shadow: 0 0 6px var(--volt);
    flex-shrink: 0;
  }

  /* ── Backdrop (mobile) ── */
  .sb-backdrop {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,.6);
    z-index: 190;
    backdrop-filter: blur(3px);
  }

  /* ── Mobile ── */
  @media (max-width: 860px) {
    .sidebar {
      position: fixed;
      top: 0; left: 0;
      height: 100dvh;
      transform: translateX(-100%);
    }
    .sidebar.sidebar-open {
      transform: translateX(0);
      box-shadow: 4px 0 40px rgba(0,0,0,.6);
    }
    .sb-close  { display: flex; }
    .sb-backdrop { display: block; }
  }
</style>
