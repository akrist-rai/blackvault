<script>
  import { mastery, phases, badges, ctf, caseFlags, playbookFlags, flagsCaptured, TOTAL_FLAGS, operatorName, certifiedAt } from '$lib/stores';
  import { PHASES, LABS, BADGES } from '$lib/data';

  $: pct = $mastery;

  const TRACKS = [
    { id: 'DF', label: 'Digital Forensics',  color: 'var(--amber)', ids: PHASES.filter(p => p.track === 'DF').map(p => p.id) },
    { id: 'RE', label: 'Reverse Engineering', color: 'var(--volt)',  ids: PHASES.filter(p => p.track === 'RE').map(p => p.id) },
    { id: 'MA', label: 'Malware Analysis',    color: 'var(--blood)', ids: PHASES.filter(p => p.track === 'MA').map(p => p.id) },
  ];
  function trackPct(ids) {
    const sum = ids.reduce((s, id) => s + ($phases[id]?.score ?? 0), 0);
    return Math.round(sum / (ids.length * 100) * 100);
  }
  $: trackStats = TRACKS.map(t => ({ ...t, pct: trackPct(t.ids) }));

  $: ctfKeys = Object.keys($ctf).filter(k => $ctf[k]);
  $: labIdSet = new Set(LABS.map(l => l.id));
  $: studyCount  = ctfKeys.filter(k => /^p\d\d_\d$/.test(k)).length;
  $: rangeCount  = ctfKeys.filter(k => labIdSet.has(k)).length;
  $: intelCount  = ctfKeys.filter(k => k.startsWith('intel_')).length;
  $: attackCount = ctfKeys.filter(k => k.startsWith('attack_')).length;
  $: toolsCount  = ctfKeys.filter(k => k.startsWith('tools_')).length;
  $: fieldCount  = ctfKeys.filter(k => k.startsWith('field_nightglass_')).length;
  $: caseCount   = Object.values($caseFlags).reduce((s, v) => s + Object.values(v).filter(Boolean).length, 0);
  $: pbCount     = Object.values($playbookFlags).reduce((s, v) => s + Object.values(v).filter(Boolean).length, 0);

  $: CATEGORIES = [
    { label: 'Study Phases',   sub: '/console/study',  got: studyCount,  total: 60, color: 'volt'   },
    { label: 'Range Labs',     sub: '/console/range',  got: rangeCount,  total: 16, color: 'blue'   },
    { label: 'Field Exercise', sub: '/console/range/field/nightglass', got: fieldCount, total: 3, color: 'amber' },
    { label: 'Case Files',     sub: '/console/case',   got: caseCount,   total: 12, color: 'blood'  },
    { label: 'IR Playbooks',   sub: '/playbook',       got: pbCount,     total: 8,  color: 'blue'   },
    { label: 'Intel Reports',  sub: '/intel',          got: intelCount,  total: 12, color: 'purple' },
    { label: 'ATT&CK IDs',     sub: '/console/attack', got: attackCount, total: 12, color: 'volt'   },
    { label: 'Arsenal Recall', sub: '/tools',          got: toolsCount,  total: 10, color: 'amber'  },
  ];

  $: if ($flagsCaptured >= TOTAL_FLAGS && !$certifiedAt) {
    certifiedAt.set(new Date().toISOString());
  }
  $: certified = !!$certifiedAt;
  $: certDate = $certifiedAt ? new Date($certifiedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : '';

  function handleNameInput(e) {
    operatorName.set(e.target.value.slice(0, 24));
  }
</script>

<svelte:head><title>Operator Profile — BLACKVAULT</title></svelte:head>

<div class="topstrip">
  <span>OPERATOR PROFILE</span>
  <span class="ts-right">{pct}% MASTERY</span>
</div>

<main class="page">

  <div class="hero">
    <div class="hero-ring" style="--p:{pct}">
      <div class="hero-ring-inner">
        <div class="ring-pct">{pct}%</div>
        <div class="ring-lbl">MASTERY</div>
      </div>
    </div>
    <div class="hero-info">
      <label class="hero-name-lbl" for="codename">CODENAME</label>
      <input
        id="codename"
        class="hero-name-input"
        type="text"
        placeholder="Enter your operator codename…"
        value={$operatorName}
        on:input={handleNameInput}
        maxlength="24"
        spellcheck="false"
        autocomplete="off"
      />
      <div class="hero-flags">
        <span class="hero-flags-n">⚑ {$flagsCaptured}<span class="hero-flags-of">/{TOTAL_FLAGS}</span></span>
        <span class="hero-flags-lbl">flags captured platform-wide</span>
      </div>
      <div class="hero-bar"><div class="hero-fill" style="width:{Math.round($flagsCaptured / TOTAL_FLAGS * 100)}%"></div></div>
    </div>
  </div>

  <div class="card">
    <div class="card-hd">Track Certification</div>
    <div class="track-list">
      {#each trackStats as t}
        <div class="track-row">
          <div class="track-row-top">
            <span class="track-row-label" style="color:{t.color}">{t.label}</span>
            <span class="track-row-pct">{t.pct}%</span>
          </div>
          <div class="track-row-bar"><div class="track-row-fill" style="width:{t.pct}%; background:{t.color}"></div></div>
        </div>
      {/each}
    </div>
  </div>

  <div class="card">
    <div class="card-hd">Flags By Category</div>
    <div class="cat-grid">
      {#each CATEGORIES as c}
        <a href={c.sub} class="cat-card cat-{c.color}">
          <div class="cat-top">
            <span class="cat-label">{c.label}</span>
            <span class="cat-count">{c.got}/{c.total}</span>
          </div>
          <div class="cat-bar"><div class="cat-fill cat-fill-{c.color}" style="width:{Math.round(c.got / c.total * 100)}%"></div></div>
        </a>
      {/each}
    </div>
  </div>

  <div class="card">
    <div class="card-hd">
      Badges
      <span class="card-hd-sub">{$badges.length}/{BADGES.length} earned</span>
    </div>
    <div class="badge-mini-grid">
      {#each BADGES as b}
        {@const have = $badges.includes(b.id)}
        <div class="badge-mini" class:earned={have} title="{b.name} — {b.desc}">
          <span class="badge-mini-icon">{b.icon}</span>
        </div>
      {/each}
    </div>
    <a href="/console/badges" class="card-more">View all achievements →</a>
  </div>

  {#if certified}
    <div class="cert">
      <div class="cert-glow"></div>
      <div class="cert-seal">⛨</div>
      <div class="cert-eyebrow">BLACKVAULT · CERTIFICATE OF COMPLETION</div>
      <h2 class="cert-title">{$operatorName || 'ANONYMOUS OPERATOR'}</h2>
      <p class="cert-body">
        has captured all <strong>{TOTAL_FLAGS}</strong> flags across the Digital Forensics, Reverse Engineering,
        and Malware Analysis curriculum — every phase, lab, case, playbook, intel report, and reference challenge
        on the BLACKVAULT range.
      </p>
      <div class="cert-meta">
        <span>Certified {certDate}</span>
        <span class="cert-id">SERIAL: BV-{TOTAL_FLAGS}-{($certifiedAt ?? '').slice(2,10).replace(/-/g,'')}</span>
      </div>
    </div>
  {:else}
    <div class="cert-locked">
      <div class="cert-locked-icon">⛨</div>
      <div class="cert-locked-text">
        <div class="cert-locked-h">Operator Certificate — Locked</div>
        <p>Capture the remaining <strong>{TOTAL_FLAGS - $flagsCaptured}</strong> flags across every section of the platform to unlock your BLACKVAULT operator certificate.</p>
      </div>
    </div>
  {/if}

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
  .page { padding: 28px; display: flex; flex-direction: column; gap: 18px; max-width: 880px; }

  /* hero */
  .hero {
    background: var(--panel); border: 1px solid var(--line); border-radius: var(--rad-lg);
    padding: 28px 32px; display: flex; align-items: center; gap: 32px;
  }
  .hero-ring {
    width: 140px; height: 140px; border-radius: 50%; flex-shrink: 0;
    background: conic-gradient(var(--volt) calc(var(--p) * 1%), var(--line2) 0);
    display: flex; align-items: center; justify-content: center;
    box-shadow: var(--glow-volt);
  }
  .hero-ring-inner {
    width: 112px; height: 112px; border-radius: 50%; background: var(--panel);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
  }
  .ring-pct { font-size: 26px; font-weight: 800; color: var(--bone); letter-spacing: -.02em; }
  .ring-lbl { font-size: 9px; color: var(--ash); letter-spacing: .12em; margin-top: 2px; }

  .hero-info { flex: 1; min-width: 0; }
  .hero-name-lbl { display: block; font-size: 9px; font-weight: 700; letter-spacing: .12em; color: var(--dim); margin-bottom: 6px; }
  .hero-name-input {
    width: 100%; background: var(--panel2); border: 1px solid var(--line2);
    color: var(--bone); font-family: var(--font); font-size: 16px; font-weight: 700;
    padding: 8px 12px; border-radius: var(--rad); margin-bottom: 14px; outline: none;
    transition: border-color .15s;
  }
  .hero-name-input:focus { border-color: var(--volt); }
  .hero-flags { display: flex; align-items: baseline; gap: 10px; margin-bottom: 8px; }
  .hero-flags-n { font-family: var(--mono); font-size: 18px; font-weight: 800; color: var(--volt); }
  .hero-flags-of { color: var(--dim); font-weight: 600; }
  .hero-flags-lbl { font-size: 12px; color: var(--ash); }
  .hero-bar { height: 5px; background: var(--line2); border-radius: 3px; overflow: hidden; }
  .hero-fill { height: 100%; background: var(--volt); box-shadow: var(--glow-volt); border-radius: 3px; transition: width .5s ease; }

  /* shared card */
  .card {
    background: var(--panel); border: 1px solid var(--line); border-radius: var(--rad-lg);
    padding: 20px 24px;
  }
  .card-hd {
    font-size: 12px; font-weight: 700; letter-spacing: .1em; color: var(--ash);
    text-transform: uppercase; margin-bottom: 16px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .card-hd-sub { font-size: 11px; letter-spacing: normal; text-transform: none; color: var(--volt); font-weight: 600; }
  .card-more {
    display: block; margin-top: 14px; font-size: 12px; color: var(--ash);
    transition: color .15s;
  }
  .card-more:hover { color: var(--volt); text-decoration: none; }

  /* track breakdown */
  .track-list { display: flex; flex-direction: column; gap: 14px; }
  .track-row-top { display: flex; justify-content: space-between; margin-bottom: 6px; }
  .track-row-label { font-size: 13px; font-weight: 700; }
  .track-row-pct { font-size: 12px; font-family: var(--mono); color: var(--ash); }
  .track-row-bar { height: 5px; background: var(--line2); border-radius: 3px; overflow: hidden; }
  .track-row-fill { height: 100%; border-radius: 3px; transition: width .5s ease; }

  /* categories */
  .cat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .cat-card {
    display: block; background: var(--panel2); border: 1px solid var(--line2);
    border-radius: var(--rad); padding: 13px 15px; text-decoration: none;
    transition: border-color .15s;
  }
  .cat-card:hover { border-color: var(--ash); text-decoration: none; }
  .cat-top { display: flex; justify-content: space-between; margin-bottom: 7px; }
  .cat-label { font-size: 12px; font-weight: 600; color: var(--bone); }
  .cat-count { font-size: 11px; font-family: var(--mono); color: var(--ash); }
  .cat-bar { height: 4px; background: var(--line2); border-radius: 2px; overflow: hidden; }
  .cat-fill { height: 100%; border-radius: 2px; transition: width .5s ease; }
  .cat-fill-volt   { background: var(--volt);   box-shadow: var(--glow-volt); }
  .cat-fill-blue   { background: var(--blue);   box-shadow: var(--glow-blue); }
  .cat-fill-blood  { background: var(--blood);  box-shadow: var(--glow-blood); }
  .cat-fill-purple { background: var(--purple); }
  .cat-fill-amber  { background: var(--amber);  box-shadow: var(--glow-amber); }

  /* badges mini grid */
  .badge-mini-grid { display: flex; flex-wrap: wrap; gap: 8px; }
  .badge-mini {
    width: 38px; height: 38px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    background: var(--panel2); border: 1px solid var(--line); opacity: .35;
    transition: opacity .15s, border-color .15s;
  }
  .badge-mini.earned {
    opacity: 1; border-color: color-mix(in srgb, var(--amber) 40%, transparent);
    background: color-mix(in srgb, var(--amber) 10%, transparent);
    box-shadow: var(--glow-amber);
  }
  .badge-mini-icon { font-size: 16px; }

  /* certificate */
  .cert {
    position: relative;
    background: linear-gradient(160deg, color-mix(in srgb, var(--volt) 8%, var(--panel)), var(--panel));
    border: 1px solid color-mix(in srgb, var(--volt) 40%, transparent);
    border-radius: var(--rad-lg);
    padding: 40px 36px; text-align: center; overflow: hidden;
  }
  .cert-glow {
    position: absolute; inset: -40% -10% auto -10%; height: 200px;
    background: radial-gradient(ellipse at center, color-mix(in srgb, var(--volt) 18%, transparent), transparent 70%);
    pointer-events: none;
  }
  .cert-seal { font-size: 38px; color: var(--volt); margin-bottom: 10px; filter: drop-shadow(var(--glow-volt)); }
  .cert-eyebrow { font-size: 10px; font-weight: 700; letter-spacing: .16em; color: var(--volt); margin-bottom: 14px; }
  .cert-title { font-size: 28px; font-weight: 800; color: var(--bone); letter-spacing: .03em; margin-bottom: 16px; text-transform: uppercase; }
  .cert-body { font-size: 14px; color: var(--ash); line-height: 1.7; max-width: 540px; margin: 0 auto 20px; }
  .cert-meta {
    display: flex; justify-content: center; gap: 24px;
    font-size: 11px; color: var(--dim); font-family: var(--mono);
    padding-top: 16px; border-top: 1px solid var(--line);
  }
  .cert-id { color: var(--volt); }

  .cert-locked {
    display: flex; align-items: center; gap: 20px;
    background: var(--panel); border: 1px dashed var(--line2); border-radius: var(--rad-lg);
    padding: 24px 28px;
  }
  .cert-locked-icon { font-size: 30px; color: var(--dim); flex-shrink: 0; }
  .cert-locked-h { font-size: 14px; font-weight: 700; color: var(--ash); margin-bottom: 6px; }
  .cert-locked-text p { font-size: 13px; color: var(--dim); line-height: 1.5; }
  .cert-locked-text strong { color: var(--ash); }

  @media (max-width: 700px) {
    .hero { flex-direction: column; text-align: center; }
    .cat-grid { grid-template-columns: 1fr; }
    .cert-locked { flex-direction: column; text-align: center; }
  }
</style>
