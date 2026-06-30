<script>
  import { mastery, phases, labs, cases, badges, flagsCaptured, TOTAL_FLAGS } from '$lib/stores';
  import { FEED, PHASES, LABS } from '$lib/data';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';

  $: pct        = $mastery;
  $: badgeCount = $badges.length;
  $: caseCount  = Object.values($cases).filter(Boolean).length;
  $: flagPct    = Math.round(($flagsCaptured / TOTAL_FLAGS) * 100);

  const LAB_OBJ_COUNTS = {
    disk:5, asm:4, peelf:4, static:5, ghidra:4, dynamic:4, unpack:4,
    memory:4, network:4, protocol:4, rootkit:4, capstone:4,
    yara:6, timeline:5, threat_hunt:4, crypt_re:4,
  };

  function labProgress(id) {
    const done  = $labs[id]?.done?.length ?? 0;
    const total = LAB_OBJ_COUNTS[id] ?? 1;
    return { done, total, pct: Math.round((done / total) * 100) };
  }

  $: labCount = LABS.filter(l => labProgress(l.id).pct === 100).length;

  // In-progress labs (started but not cleared)
  $: inProgress = LABS.filter(l => {
    const p = labProgress(l.id);
    return p.done > 0 && p.pct < 100;
  }).slice(0, 4);

  // Next recommended lab (first not started)
  $: nextLab = LABS.find(l => labProgress(l.id).done === 0);

  const QUICK = [
    { label: 'Flag Challenges', href: '/console/study', color: 'volt'  },
    { label: 'Run a Case',   href: '/console/case',  color: 'amber' },
    { label: 'Range Labs',   href: '/console/range', color: 'blue'  },
    { label: 'IR Playbooks', href: '/playbook',      color: 'blood' },
  ];

  const FEED_COLOR = { blood:'var(--blood)', volt:'var(--volt)', amber:'var(--amber)', blue:'var(--blue)' };

  $: focusPhases = PHASES
    .map(p => ({ ...p, score: $phases[p.id]?.score ?? 0 }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  function trackClass(t) {
    return t === 'DF' ? 'df' : t === 'RE' ? 're' : 'ma';
  }
</script>

<svelte:head><title>Dashboard — BLACKVAULT</title></svelte:head>

<div class="topstrip">
  <span>DASHBOARD</span>
  <span class="ts-right">{pct}% MASTERY</span>
</div>

<main class="dash">
  <!-- Stats -->
  <div class="stat-row">
    {#each [
      { label:'MASTERY',      val: pct+'%',    color:'volt'  },
      { label:'LABS CLEARED', val: labCount,   color:'blue'  },
      { label:'CASES SOLVED', val: caseCount,  color:'amber' },
      { label:'BADGES',       val: badgeCount, color:'blood' },
    ] as s}
      <div class="stat-card stat-{s.color}">
        <div class="sc-val">{s.val}</div>
        <div class="sc-label">{s.label}</div>
      </div>
    {/each}
  </div>

  <div class="dash-cols">
    <div class="dash-main">
      <!-- Flags captured -->
      <div class="card card-flags">
        <div class="cf-top">
          <div class="cf-label">Flags Captured Platform-Wide</div>
          <div class="cf-count">{$flagsCaptured} <span class="cf-total">/ {TOTAL_FLAGS}</span></div>
        </div>
        <div class="cf-bar"><div class="cf-fill" style="width:{flagPct}%"></div></div>
        <p class="cf-desc">Every phase, lab, case, playbook, and intel report ends in a real BV{'{'}...{'}'} challenge. {flagPct}% of the platform cleared.</p>
      </div>

      <!-- Quick actions -->
      <div class="card">
        <div class="card-hd">Quick Actions</div>
        <div class="quick-grid">
          {#each QUICK as q}
            <a href={base + q.href} class="quick-btn quick-{q.color}">{q.label}</a>
          {/each}
        </div>
      </div>

      <!-- In-progress labs -->
      {#if inProgress.length > 0}
        <div class="card">
          <div class="card-hd">Resume Labs</div>
          <div class="resume-list">
            {#each inProgress as lab}
              {@const p = labProgress(lab.id)}
              <button class="resume-item" on:click={() => goto(base + '/console/range/'+lab.id)}>
                <span class="chip chip-{trackClass(lab.track)}" style="font-size:9px;padding:1px 5px">{lab.track}</span>
                <div class="ri-info">
                  <span class="ri-name">{lab.name}</span>
                  <div class="ri-bar"><div class="ri-fill" style="width:{p.pct}%"></div></div>
                </div>
                <span class="ri-pct">{p.pct}%</span>
                <span class="ri-arrow">→</span>
              </button>
            {/each}
          </div>
        </div>
      {:else if nextLab}
        <div class="card">
          <div class="card-hd">Start Here</div>
          <button class="next-lab-card" on:click={() => goto(base + '/console/range/'+nextLab.id)}>
            <div class="nl-left">
              <span class="chip chip-{trackClass(nextLab.track)}" style="font-size:9px;padding:1px 5px">{nextLab.track}</span>
              <div class="nl-info">
                <span class="nl-name">{nextLab.name}</span>
                <span class="nl-tool">{nextLab.tool}</span>
              </div>
            </div>
            <span class="nl-cta">Start Lab →</span>
          </button>
        </div>
      {/if}

      <!-- Phase progress -->
      <div class="card">
        <div class="card-hd">Phase Progress</div>
        <div class="phase-grid">
          {#each PHASES as p}
            {@const ps = $phases[p.id]}
            {@const score = ps?.score ?? 0}
            {@const pass  = ps?.pass  ?? false}
            <button class="ph-item" class:pass on:click={() => goto(base + '/console/study?phase='+p.id)}>
              <div class="ph-item-top">
                <span class="ph-n">Ph.{p.n}</span>
                <span class="chip chip-{trackClass(p.track)}" style="font-size:9px;padding:1px 5px">{p.track}</span>
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
          <a href="{base}/console/study?phase={p.id}" class="focus-item">
            <span class="chip chip-{trackClass(p.track)}" style="font-size:9px;padding:1px 5px">{p.track}</span>
            <div class="focus-name">Phase {p.n} — {p.name}</div>
            <div class="focus-score">{p.score}%</div>
          </a>
        {/each}
        <a href="{base}/console/study" class="card-more">Study all phases →</a>
      </div>

      <!-- Drill shortcut -->
      <div class="card card-drill">
        <div class="card-hd">Flag Challenges</div>
        <p class="drill-desc">Scenario-based capture-the-flag challenges for the current focus phase. Submit BV{'{'}...{'}'} flags, no flashcards.</p>
        <a href="{base}/console/study?phase={focusPhases[0]?.id ?? 'p01'}" class="drill-btn">Open Challenges →</a>
      </div>

      <!-- Threat feed -->
      <div class="card">
        <div class="card-hd">Threat Intel Feed</div>
        {#each FEED.slice(0,6) as f}
          <div class="feed-item">
            <div class="feed-tag" style="color:{FEED_COLOR[f.color]}">{f.tag}</div>
            <div class="feed-title">{f.title}</div>
            <div class="feed-detail">{f.detail}</div>
          </div>
        {/each}
        <a href="{base}/intel" class="card-more">Full intel dashboard →</a>
      </div>
    </div>
  </div>
</main>

<style>
  .topstrip {
    position: sticky; top: 0;
    background: color-mix(in srgb, var(--panel) 80%, transparent);
    backdrop-filter: blur(6px);
    border-bottom: 1px solid var(--line);
    padding: 10px 24px;
    font-size: 11px; font-weight: 700; letter-spacing: .1em; color: var(--ash);
    display: flex; justify-content: space-between; align-items: center; z-index: 10;
  }
  .ts-right { color: var(--volt); }

  .dash { padding: 20px; flex: 1; }

  .stat-row {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 10px; margin-bottom: 20px;
  }
  .stat-card {
    background: var(--panel); border: 1px solid var(--line);
    border-radius: var(--rad); padding: 18px 16px; border-top-width: 2px;
  }
  .stat-volt  { border-top-color: var(--volt);  }
  .stat-amber { border-top-color: var(--amber); }
  .stat-blue  { border-top-color: var(--blue);  }
  .stat-blood { border-top-color: var(--blood); }
  .sc-val   { font-size: 26px; font-weight: 700; color: var(--bone); letter-spacing: -.01em; }
  .sc-label { font-size: 10px; color: var(--ash); letter-spacing: .1em; text-transform: uppercase; margin-top: 4px; }

  .dash-cols { display: grid; grid-template-columns: 1fr 320px; gap: 16px; }
  .dash-main { display: flex; flex-direction: column; gap: 16px; }
  .dash-side { display: flex; flex-direction: column; gap: 16px; }

  .card {
    background: var(--panel); border: 1px solid var(--line);
    border-radius: var(--rad); overflow: hidden;
  }
  .card-hd {
    padding: 12px 16px 10px;
    font-size: 11px; font-weight: 700; letter-spacing: .1em; color: var(--ash);
    text-transform: uppercase; border-bottom: 1px solid var(--line);
  }
  .card-more {
    display: block; padding: 10px 16px;
    font-size: 11px; color: var(--ash);
    border-top: 1px solid var(--line); text-decoration: none;
    transition: color .15s;
  }
  .card-more:hover { color: var(--volt); text-decoration: none; }

  /* flags captured banner */
  .card-flags {
    padding: 18px 20px;
    border-top: 2px solid var(--volt);
    background: linear-gradient(180deg, color-mix(in srgb, var(--volt) 5%, var(--panel)), var(--panel));
  }
  .cf-top { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 10px; }
  .cf-label { font-size: 11px; font-weight: 700; letter-spacing: .1em; color: var(--ash); text-transform: uppercase; }
  .cf-count { font-size: 22px; font-weight: 800; color: var(--volt); font-family: var(--mono); }
  .cf-total { font-size: 13px; font-weight: 600; color: var(--dim); }
  .cf-bar { height: 5px; background: var(--line2); border-radius: 3px; overflow: hidden; margin-bottom: 10px; }
  .cf-fill { height: 100%; background: var(--volt); border-radius: 3px; box-shadow: var(--glow-volt); transition: width .5s ease; }
  .cf-desc { font-size: 12px; color: var(--ash); line-height: 1.5; }

  /* quick actions */
  .quick-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 14px; }
  .quick-btn {
    display: block; padding: 11px 14px;
    border-radius: var(--rad); font-size: 13px; font-weight: 600;
    text-decoration: none; text-align: center; transition: opacity .15s;
    border: 1px solid transparent;
  }
  .quick-btn:hover { opacity: .8; text-decoration: none; }
  .quick-volt  { background: color-mix(in srgb, var(--volt) 11%, transparent); color: var(--volt);  border-color: color-mix(in srgb, var(--volt) 28%, transparent); }
  .quick-amber { background: color-mix(in srgb, var(--amber) 11%, transparent); color: var(--amber); border-color: color-mix(in srgb, var(--amber) 28%, transparent); }
  .quick-blue  { background: color-mix(in srgb, var(--blue) 11%, transparent); color: var(--blue);  border-color: color-mix(in srgb, var(--blue) 28%, transparent); }
  .quick-blood { background: color-mix(in srgb, var(--blood) 11%, transparent); color: var(--blood); border-color: color-mix(in srgb, var(--blood) 28%, transparent); }

  /* resume labs */
  .resume-list { display: flex; flex-direction: column; }
  .resume-item {
    display: flex; align-items: center; gap: 10px;
    padding: 11px 16px; border-bottom: 1px solid var(--line);
    background: none; border: none; cursor: pointer; text-align: left; width: 100%;
    border-bottom: 1px solid var(--line); transition: background .12s;
  }
  .resume-item:last-child { border-bottom: none; }
  .resume-item:hover { background: var(--panel2); }
  .ri-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
  .ri-name { font-size: 13px; color: var(--bone); font-weight: 500; }
  .ri-bar  { height: 2px; background: var(--line2); border-radius: 1px; overflow: hidden; }
  .ri-fill { height: 100%; background: var(--amber); border-radius: 1px; }
  .ri-pct  { font-size: 11px; color: var(--ash); font-family: var(--mono); flex-shrink: 0; }
  .ri-arrow { color: var(--volt); font-size: 13px; flex-shrink: 0; }

  /* next lab */
  .next-lab-card {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 16px; background: none; border: none; cursor: pointer;
    width: 100%; text-align: left;
    transition: background .12s;
  }
  .next-lab-card:hover { background: var(--panel2); }
  .nl-left { display: flex; align-items: center; gap: 10px; flex: 1; }
  .nl-info { display: flex; flex-direction: column; gap: 3px; }
  .nl-name { font-size: 13px; color: var(--bone); font-weight: 600; }
  .nl-tool { font-family: var(--mono); font-size: 11px; color: var(--volt); }
  .nl-cta  { font-size: 12px; color: var(--volt); font-weight: 700; white-space: nowrap; }

  /* phase grid */
  .phase-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: var(--line); }
  .ph-item {
    background: var(--panel); padding: 11px 12px;
    text-align: left; cursor: pointer; border: none;
    transition: background .12s; width: 100%;
  }
  .ph-item:hover { background: var(--panel2); }
  .ph-item.pass  { background: color-mix(in srgb, var(--volt) 4%, var(--panel)); }
  .ph-item-top { display: flex; align-items: center; gap: 5px; margin-bottom: 4px; flex-wrap: wrap; }
  .ph-n    { font-family: var(--mono); font-size: 11px; color: var(--volt); }
  .ph-pass { color: var(--volt); font-size: 11px; margin-left: auto; }
  .ph-name-sm { font-size: 11px; color: var(--ash); margin-bottom: 5px; line-height: 1.3; }
  .ph-bar { height: 2px; background: var(--line2); border-radius: 1px; overflow: hidden; }
  .ph-bar-fill { height: 100%; border-radius: 1px; transition: width .4s ease; }

  /* focus */
  .focus-item {
    display: flex; align-items: center; gap: 10px;
    padding: 11px 16px; border-bottom: 1px solid var(--line);
    text-decoration: none; transition: background .12s;
  }
  .focus-item:last-of-type { border-bottom: none; }
  .focus-item:hover { background: var(--panel2); text-decoration: none; }
  .focus-name  { flex: 1; font-size: 12px; color: var(--bone); }
  .focus-score { font-size: 11px; color: var(--dim); font-family: var(--mono); }

  /* drill card */
  .card-drill { padding-bottom: 4px; }
  .drill-desc { padding: 12px 16px 8px; font-size: 12px; color: var(--ash); line-height: 1.5; }
  .drill-btn {
    display: block; margin: 0 16px 14px;
    padding: 8px 14px; text-align: center;
    background: color-mix(in srgb, var(--volt) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--volt) 28%, transparent);
    color: var(--volt); border-radius: var(--rad);
    font-size: 12px; font-weight: 700; text-decoration: none;
    transition: background .15s;
  }
  .drill-btn:hover { background: color-mix(in srgb, var(--volt) 18%, transparent); text-decoration: none; }

  /* feed */
  .feed-item { padding: 12px 16px; border-bottom: 1px solid var(--line); }
  .feed-item:last-of-type { border-bottom: none; }
  .feed-tag    { font-size: 10px; font-weight: 700; letter-spacing: .08em; margin-bottom: 3px; }
  .feed-title  { font-size: 12px; font-weight: 600; color: var(--bone); margin-bottom: 3px; }
  .feed-detail { font-size: 11px; color: var(--ash); line-height: 1.5; }

  @media (max-width: 900px) {
    .stat-row   { grid-template-columns: repeat(2, 1fr); }
    .dash-cols  { grid-template-columns: 1fr; }
    .phase-grid { grid-template-columns: repeat(2, 1fr); }
    .dash { padding: 14px; }
  }
  @media (max-width: 480px) {
    .stat-row   { grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .quick-grid { grid-template-columns: 1fr 1fr; gap: 6px; }
    .sc-val     { font-size: 22px; }
  }
</style>
