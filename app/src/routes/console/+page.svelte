<script>
  import { mastery, phases, labs, cases, badges, ctf } from '$lib/stores';
  import { FEED, PHASES } from '$lib/data';
  import { goto } from '$app/navigation';

  $: pct       = $mastery;
  $: badgeCount = $badges.length;
  $: labCount   = Object.keys($labs).length;
  $: caseCount  = Object.values($cases).filter(Boolean).length;

  const QUICK = [
    { label: 'Continue Study', href: '/console/study', color: 'volt' },
    { label: 'Run a Case',     href: '/console/case',  color: 'amber' },
    { label: 'Open Range',     href: '/console/range', color: 'blue' },
    { label: 'IR Playbooks',   href: '/playbook',      color: 'blood' },
  ];

  const FEED_COLOR = { blood: 'var(--blood)', volt: 'var(--volt)', amber: 'var(--amber)', blue: 'var(--blue)' };

  // Weakest phases — phases with no score or lowest score
  $: focusPhases = PHASES
    .map(p => ({ ...p, score: $phases[p.id]?.score ?? 0 }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);
</script>

<svelte:head><title>Dashboard — BLACKVAULT</title></svelte:head>

<div class="topstrip">
  <span>DASHBOARD</span>
  <span class="ts-right">{pct}% MASTERY</span>
</div>

<main class="dash">
  <!-- ── Stats ── -->
  <div class="stat-row">
    {#each [
      { label:'MASTERY',      val: pct+'%',       color:'volt'  },
      { label:'BADGES',       val: badgeCount,    color:'amber' },
      { label:'LABS CLEARED', val: labCount,      color:'blue'  },
      { label:'CASES SOLVED', val: caseCount,     color:'blood' },
    ] as s}
      <div class="stat-card stat-{s.color}">
        <div class="sc-val">{s.val}</div>
        <div class="sc-label">{s.label}</div>
      </div>
    {/each}
  </div>

  <div class="dash-cols">
    <div class="dash-main">
      <!-- Quick actions -->
      <div class="card">
        <div class="card-hd">Quick Actions</div>
        <div class="quick-grid">
          {#each QUICK as q}
            <a href={q.href} class="quick-btn quick-{q.color}">{q.label}</a>
          {/each}
        </div>
      </div>

      <!-- Phase progress -->
      <div class="card">
        <div class="card-hd">Phase Progress</div>
        <div class="phase-grid">
          {#each PHASES as p}
            {@const ps = $phases[p.id]}
            {@const score = ps?.score ?? 0}
            {@const pass  = ps?.pass ?? false}
            <button class="ph-item" class:pass on:click={() => goto('/console/study?phase='+p.id)}>
              <div class="ph-item-top">
                <span class="ph-n">Ph.{p.n}</span>
                <span class="ph-track chip chip-{p.track === 'DF' ? 'df' : p.track === 'RE' ? 're' : 'ma'}">{p.track}</span>
                {#if pass}<span class="ph-pass">✓</span>{/if}
              </div>
              <div class="ph-name-sm">{p.name}</div>
              <div class="ph-bar">
                <div class="ph-bar-fill" style="width:{score}%; background:{pass ? 'var(--volt)' : 'var(--amber)'}"></div>
              </div>
            </button>
          {/each}
        </div>
      </div>
    </div>

    <div class="dash-side">
      <!-- Focus picks -->
      <div class="card">
        <div class="card-hd">Focus Next</div>
        {#each focusPhases as p}
          <a href="/console/study?phase={p.id}" class="focus-item">
            <span class="chip chip-{p.track === 'DF' ? 'df' : p.track === 'RE' ? 're' : 'ma'}">{p.track}</span>
            <div class="focus-name">Phase {p.n} — {p.name}</div>
            <div class="focus-score">{p.score}%</div>
          </a>
        {/each}
      </div>

      <!-- Threat feed -->
      <div class="card">
        <div class="card-hd">Threat Intel Feed</div>
        {#each FEED as f}
          <div class="feed-item">
            <div class="feed-tag" style="color:{FEED_COLOR[f.color]}">{f.tag}</div>
            <div class="feed-title">{f.title}</div>
            <div class="feed-detail">{f.detail}</div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</main>

<style>
  .topstrip {
    position: sticky;
    top: 0;
    background: color-mix(in srgb, var(--panel) 80%, transparent);
    backdrop-filter: blur(6px);
    border-bottom: 1px solid var(--line);
    padding: 10px 28px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .1em;
    color: var(--ash);
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 10;
  }
  .ts-right { color: var(--volt); }

  .dash { padding: 28px; flex: 1; }

  .stat-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 24px;
  }
  .stat-card {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: var(--rad);
    padding: 20px 16px;
    border-top-width: 2px;
  }
  .stat-volt  { border-top-color: var(--volt); }
  .stat-amber { border-top-color: var(--amber); }
  .stat-blue  { border-top-color: var(--blue); }
  .stat-blood { border-top-color: var(--blood); }
  .sc-val   { font-size: 28px; font-weight: 700; color: var(--bone); letter-spacing: -.01em; }
  .sc-label { font-size: 10px; color: var(--ash); letter-spacing: .1em; text-transform: uppercase; margin-top: 4px; }

  .dash-cols { display: grid; grid-template-columns: 1fr 340px; gap: 20px; }
  .dash-main { display: flex; flex-direction: column; gap: 20px; }
  .dash-side { display: flex; flex-direction: column; gap: 20px; }

  .card {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: var(--rad);
    overflow: hidden;
  }
  .card-hd {
    padding: 14px 18px 10px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .1em;
    color: var(--ash);
    text-transform: uppercase;
    border-bottom: 1px solid var(--line);
  }

  .quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 16px; }
  .quick-btn {
    display: block;
    padding: 12px 16px;
    border-radius: var(--rad);
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    text-align: center;
    transition: opacity .15s;
    border: 1px solid transparent;
  }
  .quick-btn:hover { opacity: .8; text-decoration: none; }
  .quick-volt  { background: color-mix(in srgb, var(--volt) 12%, transparent); color: var(--volt); border-color: color-mix(in srgb, var(--volt) 30%, transparent); }
  .quick-amber { background: color-mix(in srgb, var(--amber) 12%, transparent); color: var(--amber); border-color: color-mix(in srgb, var(--amber) 30%, transparent); }
  .quick-blue  { background: color-mix(in srgb, var(--blue) 12%, transparent); color: var(--blue); border-color: color-mix(in srgb, var(--blue) 30%, transparent); }
  .quick-blood { background: color-mix(in srgb, var(--blood) 12%, transparent); color: var(--blood); border-color: color-mix(in srgb, var(--blood) 30%, transparent); }

  .phase-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: var(--line); }
  .ph-item {
    background: var(--panel);
    padding: 12px 14px;
    text-align: left;
    cursor: pointer;
    border: none;
    transition: background .15s;
    width: 100%;
  }
  .ph-item:hover { background: var(--panel2); }
  .ph-item.pass { background: color-mix(in srgb, var(--volt) 4%, var(--panel)); }
  .ph-item-top { display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
  .ph-n { font-family: var(--mono); font-size: 11px; color: var(--volt); }
  .ph-track { font-size: 9px !important; padding: 1px 5px !important; }
  .ph-pass { color: var(--volt); font-size: 11px; margin-left: auto; }
  .ph-name-sm { font-size: 11px; color: var(--ash); margin-bottom: 6px; line-height: 1.3; }
  .ph-bar { height: 2px; background: var(--line2); border-radius: 1px; overflow: hidden; }
  .ph-bar-fill { height: 100%; border-radius: 1px; transition: width .4s ease; }

  .focus-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 18px;
    border-bottom: 1px solid var(--line);
    text-decoration: none;
    transition: background .15s;
  }
  .focus-item:last-child { border-bottom: none; }
  .focus-item:hover { background: var(--panel2); text-decoration: none; }
  .focus-name { flex: 1; font-size: 12px; color: var(--bone); }
  .focus-score { font-size: 11px; color: var(--dim); font-family: var(--mono); }

  .feed-item { padding: 14px 18px; border-bottom: 1px solid var(--line); }
  .feed-item:last-child { border-bottom: none; }
  .feed-tag { font-size: 10px; font-weight: 700; letter-spacing: .08em; margin-bottom: 4px; }
  .feed-title { font-size: 13px; font-weight: 600; color: var(--bone); margin-bottom: 4px; }
  .feed-detail { font-size: 11px; color: var(--ash); line-height: 1.5; }

  @media (max-width: 900px) {
    .stat-row { grid-template-columns: repeat(2, 1fr); }
    .dash-cols { grid-template-columns: 1fr; }
    .phase-grid { grid-template-columns: repeat(2, 1fr); }
  }
</style>
