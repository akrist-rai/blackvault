<script>
  import { PHASES, LABS } from '$lib/data';

  const STATS = [
    { n: '12',  label: 'Phases' },
    { n: '16+', label: 'Labs' },
    { n: '30',  label: 'CTF Challenges' },
    { n: '70+', label: 'ATT&CK Techniques' },
    { n: '4',   label: 'IR Playbooks' },
    { n: '22',  label: 'Badges' },
  ];

  const TRACKS = [
    {
      id: 'df', accent: 'amber', label: 'DIGITAL FORENSICS',
      desc: 'Disk imaging, memory analysis, network capture, timeline reconstruction.',
      phases: [1,8,9,11,12],
    },
    {
      id: 're', accent: 'volt', label: 'REVERSE ENGINEERING',
      desc: 'Binary analysis, decompilation, unpacking, protocol RE, C2 internals.',
      phases: [2,3,5,7,10],
    },
    {
      id: 'ma', accent: 'blood', label: 'MALWARE ANALYSIS',
      desc: 'Static triage, dynamic sandboxing, rootkit hunting, YARA authoring.',
      phases: [4,6,7,11],
    },
  ];

  const TERM_LINES = [
    { type: 'cmd',  text: 'vol3 -f hermes07.raw windows.malfind' },
    { type: 'out',  text: 'Process  PID    Base         End          Protection' },
    { type: 'hit',  text: 'svchost  3824   0x1e80000   0x1ebffff    PAGE_EXECUTE_READWRITE' },
    { type: 'dim',  text: '  MZ header detected at 0x1e80000 — injected PE' },
    { type: 'cmd',  text: 'vol3 -f hermes07.raw windows.netscan' },
    { type: 'hit',  text: '3824  svchost  185.220.101.47:443  ESTABLISHED' },
    { type: 'dim',  text: '  → Tor exit node, Cobalt Strike beacon' },
    { type: 'cmd',  text: 'tshark -r capture.pcap -Y "dns" -T fields -e dns.qry.name | head' },
    { type: 'hit',  text: 's0-deadbeef.exfil.cdn-telemetry.xyz' },
    { type: 'dim',  text: '  → DNS exfiltration channel detected' },
  ];

  function copy(e) {
    const text = e.target.closest('code')?.textContent?.trim();
    if (!text) return;
    navigator.clipboard.writeText(text);
    const el = e.target.closest('code');
    el.classList.add('copied');
    setTimeout(() => el.classList.remove('copied'), 1200);
  }
</script>

<svelte:head>
  <title>BLACKVAULT — Security Training Range</title>
</svelte:head>

<div class="landing">
  <!-- ── Topbar ── -->
  <header class="topbar">
    <div class="tb-logo">BLACK<em>VAULT</em></div>
    <nav class="tb-nav">
      <a href="#curriculum">Curriculum</a>
      <a href="#labs">Labs</a>
      <a href="#playbooks">Playbooks</a>
      <a href="/tools">Tools</a>
    </nav>
    <a href="/console" class="tb-cta">Open Console →</a>
  </header>

  <!-- ── Hero ── -->
  <section class="hero">
    <div class="hero-left">
      <div class="hero-eyebrow">Real-tool security training</div>
      <h1 class="hero-h1">
        Learn forensics, RE,<br />
        and malware analysis<br />
        <span class="h1-accent">the hard way.</span>
      </h1>
      <p class="hero-sub">
        12-phase curriculum. Browser-based labs backed by real artifact exercises.
        No VMs to configure. No accounts. Open a file and start.
      </p>
      <div class="hero-ctas">
        <a href="/console" class="btn-primary">Enter the Range →</a>
        <a href="#curriculum" class="btn-ghost">View Curriculum</a>
      </div>
    </div>
    <div class="hero-right">
      <div class="term">
        <div class="term-bar">
          <span class="td"></span><span class="td"></span><span class="td"></span>
          <span class="term-title">blackvault — analyst@range:~</span>
        </div>
        <div class="term-body">
          {#each TERM_LINES as line}
            {#if line.type === 'cmd'}
              <div class="tl-cmd"><span class="tpmt">$</span> {line.text}</div>
            {:else if line.type === 'hit'}
              <div class="tl-hit">{line.text}</div>
            {:else}
              <div class="tl-dim">{line.text}</div>
            {/if}
          {/each}
          <div class="tl-cmd"><span class="tpmt">$</span> <span class="cursor">▋</span></div>
        </div>
      </div>
    </div>
  </section>

  <!-- ── Stats strip ── -->
  <div class="stats-strip">
    {#each STATS as s}
      <div class="stat">
        <div class="stat-n">{s.n}</div>
        <div class="stat-l">{s.label}</div>
      </div>
    {/each}
  </div>

  <!-- ── Tracks ── -->
  <section class="section tracks-section" id="tracks">
    <h2 class="section-h">Three Skill Tracks</h2>
    <div class="tracks">
      {#each TRACKS as t}
        <div class="track-card track-{t.id}">
          <div class="track-lbl chip chip-{t.id === 'df' ? 'df' : t.id === 're' ? 're' : 'ma'}">{t.label}</div>
          <p class="track-desc">{t.desc}</p>
          <div class="track-phases">
            {#each t.phases as n}
              <span class="ph-chip">Phase {n}</span>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </section>

  <!-- ── Curriculum ── -->
  <section class="section" id="curriculum">
    <h2 class="section-h">12-Phase Curriculum</h2>
    <div class="curriculum-grid">
      {#each PHASES as p}
        <div class="phase-row">
          <span class="ph-n">{String(p.n).padStart(2,'0')}</span>
          <div class="ph-info">
            <div class="ph-name">{p.name}</div>
            <div class="ph-tools">{p.tools}</div>
          </div>
          <span class="chip chip-{p.track === 'DF' ? 'df' : p.track === 'RE' ? 're' : 'ma'}">{p.track}</span>
        </div>
      {/each}
    </div>
  </section>

  <!-- ── Labs ── -->
  <section class="section" id="labs">
    <h2 class="section-h">Range Labs</h2>
    <div class="labs-grid">
      {#each LABS as lab}
        <div class="lab-card">
          <div class="lab-top">
            <span class="chip chip-{lab.track === 'DF' ? 'df' : lab.track === 'RE' ? 're' : 'ma'}">{lab.track}</span>
            <span class="lab-phase">Ph.{lab.phase}</span>
          </div>
          <div class="lab-name">{lab.name}</div>
          <div class="lab-tool">{lab.tool}</div>
          <p class="lab-blurb">{lab.blurb}</p>
        </div>
      {/each}
    </div>
    <div class="labs-cta">
      <a href="/console/range" class="btn-primary">Open Range Hub →</a>
    </div>
  </section>

  <!-- ── Playbooks ── -->
  <section class="section" id="playbooks">
    <h2 class="section-h">IR Playbooks</h2>
    <div class="pb-grid">
      {#each [
        { title:'Ransomware Response',      sev:'CRITICAL', time:'72h',  color:'blood' },
        { title:'Data Breach',              sev:'HIGH',     time:'96h',  color:'amber' },
        { title:'Supply Chain Compromise',  sev:'CRITICAL', time:'120h', color:'blood' },
        { title:'BEC / Email Fraud',        sev:'HIGH',     time:'48h',  color:'amber' },
      ] as pb}
        <div class="pb-card">
          <div class="pb-top">
            <span class="sev sev-{pb.color}">{pb.sev}</span>
            <span class="pb-time">Target: {pb.time}</span>
          </div>
          <div class="pb-title">{pb.title}</div>
        </div>
      {/each}
    </div>
    <div class="labs-cta">
      <a href="/playbook" class="btn-ghost">Open Playbooks →</a>
    </div>
  </section>

  <!-- ── Quick start ── -->
  <section class="section" id="start">
    <h2 class="section-h">Quick Start</h2>
    <div class="qs-card">
      <code on:click={copy}>python3 -m http.server 8000</code>
      <p>Then open <strong>http://localhost:8000</strong> — or just open <code on:click={copy}>console.html</code> directly in your browser. Zero install.</p>
      <div class="qs-links">
        <a href="/console" class="btn-primary">Open Console →</a>
        <a href="/tools">Tool Arsenal</a>
        <a href="/intel">Intel Reference</a>
      </div>
    </div>
  </section>

  <!-- ── Footer ── -->
  <footer class="footer">
    <div class="footer-logo">BLACK<em>VAULT</em></div>
    <div class="footer-links">
      <a href="/console">Console</a>
      <a href="/playbook">Playbooks</a>
      <a href="/tools">Tools</a>
      <a href="/intel">Intel</a>
    </div>
    <div class="footer-note">
      Synthetic artifacts only. All samples are fabricated for training purposes.
    </div>
  </footer>
</div>

<style>
  /* ── Layout ── */
  .landing { min-height: 100dvh; }

  /* ── Topbar ── */
  .topbar {
    display: flex;
    align-items: center;
    gap: 24px;
    padding: 0 48px;
    height: 56px;
    border-bottom: 1px solid var(--line);
    background: var(--void);
    position: sticky;
    top: 0;
    z-index: 50;
    backdrop-filter: blur(6px);
  }
  .tb-logo {
    font-size: 15px;
    font-weight: 700;
    letter-spacing: .1em;
    color: var(--bone);
    flex-shrink: 0;
  }
  .tb-logo em { font-style: normal; color: var(--volt); }
  .tb-nav {
    display: flex;
    gap: 20px;
    flex: 1;
    margin-left: 16px;
  }
  .tb-nav a {
    font-size: 13px;
    color: var(--ash);
    font-weight: 500;
    transition: color .15s;
  }
  .tb-nav a:hover { color: var(--bone); text-decoration: none; }
  .tb-cta {
    font-size: 13px;
    font-weight: 600;
    color: var(--volt);
    background: color-mix(in srgb, var(--volt) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--volt) 40%, transparent);
    padding: 6px 14px;
    border-radius: var(--rad);
    transition: background .15s;
    text-decoration: none;
  }
  .tb-cta:hover { background: color-mix(in srgb, var(--volt) 20%, transparent); text-decoration: none; }

  /* ── Hero ── */
  .hero {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 48px;
    align-items: center;
    padding: 80px 48px 60px;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }
  .hero-eyebrow {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .14em;
    text-transform: uppercase;
    color: var(--volt);
    margin-bottom: 16px;
  }
  .hero-h1 {
    font-size: clamp(28px, 4vw, 44px);
    font-weight: 700;
    line-height: 1.15;
    letter-spacing: -.01em;
    color: var(--bone);
    margin-bottom: 20px;
  }
  .h1-accent { color: var(--volt); }
  .hero-sub {
    font-size: 15px;
    color: var(--ash);
    line-height: 1.7;
    margin-bottom: 28px;
    max-width: 480px;
  }
  .hero-ctas { display: flex; gap: 12px; flex-wrap: wrap; }

  /* ── Buttons ── */
  .btn-primary {
    display: inline-block;
    background: var(--volt);
    color: var(--void);
    font-weight: 700;
    font-size: 13px;
    padding: 10px 20px;
    border-radius: var(--rad);
    letter-spacing: .04em;
    transition: opacity .15s;
    text-decoration: none;
  }
  .btn-primary:hover { opacity: .85; text-decoration: none; }
  .btn-ghost {
    display: inline-block;
    color: var(--bone);
    font-weight: 600;
    font-size: 13px;
    padding: 10px 20px;
    border-radius: var(--rad);
    border: 1px solid var(--line2);
    transition: border-color .15s, color .15s;
    text-decoration: none;
  }
  .btn-ghost:hover { border-color: var(--ash); color: var(--bone); text-decoration: none; }

  /* ── Terminal ── */
  .term {
    background: var(--panel);
    border: 1px solid var(--line2);
    border-radius: 10px;
    overflow: hidden;
    font-family: var(--mono);
    font-size: 12.5px;
    box-shadow: 0 16px 48px rgba(0,0,0,.5);
  }
  .term-bar {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 14px;
    background: var(--panel2);
    border-bottom: 1px solid var(--line);
  }
  .td {
    width: 10px; height: 10px;
    border-radius: 50%;
    background: var(--line2);
  }
  .term-title {
    font-size: 11px;
    color: var(--ash);
    margin-left: 6px;
    letter-spacing: .04em;
  }
  .term-body { padding: 16px; display: flex; flex-direction: column; gap: 3px; }
  .tl-cmd { color: var(--bone); }
  .tl-hit { color: var(--volt); }
  .tl-dim { color: var(--ash); padding-left: 12px; }
  .tpmt   { color: var(--volt); margin-right: 6px; }
  .cursor {
    display: inline-block;
    animation: blink 1s step-end infinite;
    color: var(--volt);
  }
  @keyframes blink { 50% { opacity: 0; } }

  /* ── Stats strip ── */
  .stats-strip {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 0;
    border-top: 1px solid var(--line);
    border-bottom: 1px solid var(--line);
    background: var(--panel);
  }
  .stat {
    padding: 20px 32px;
    text-align: center;
    border-right: 1px solid var(--line);
  }
  .stat:last-child { border-right: none; }
  .stat-n { font-size: 24px; font-weight: 700; color: var(--volt); letter-spacing: -.01em; }
  .stat-l { font-size: 11px; color: var(--ash); text-transform: uppercase; letter-spacing: .08em; margin-top: 2px; }

  /* ── Sections ── */
  .section {
    padding: 80px 48px;
    max-width: 1200px;
    margin: 0 auto;
    width: 100%;
  }
  .section-h {
    font-size: 22px;
    font-weight: 700;
    color: var(--bone);
    letter-spacing: -.01em;
    margin-bottom: 32px;
  }

  /* ── Tracks ── */
  .tracks { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .track-card {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: var(--rad);
    padding: 24px;
    transition: border-color .2s, transform .2s;
  }
  .track-card:hover { transform: translateY(-2px); }
  .track-df:hover { border-color: var(--amber); }
  .track-re:hover { border-color: var(--volt); }
  .track-ma:hover { border-color: var(--blood); }
  .track-lbl { display: inline-block; margin-bottom: 12px; font-size: 11px !important; }
  .track-desc { font-size: 14px; color: var(--ash); line-height: 1.6; margin-bottom: 16px; }
  .track-phases { display: flex; flex-wrap: wrap; gap: 6px; }
  .ph-chip {
    font-size: 11px;
    color: var(--dim);
    border: 1px solid var(--line2);
    padding: 2px 7px;
    border-radius: 3px;
  }

  /* ── Curriculum ── */
  .curriculum-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1px;
    background: var(--line);
    border: 1px solid var(--line);
    border-radius: var(--rad);
    overflow: hidden;
  }
  .phase-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 14px 20px;
    background: var(--panel);
    transition: background .15s;
  }
  .phase-row:hover { background: var(--panel2); }
  .ph-n { font-family: var(--mono); font-size: 13px; color: var(--volt); flex-shrink: 0; width: 24px; }
  .ph-info { flex: 1; min-width: 0; }
  .ph-name { font-size: 13px; font-weight: 600; color: var(--bone); }
  .ph-tools { font-size: 11px; color: var(--ash); margin-top: 2px; font-family: var(--mono); }

  /* ── Labs ── */
  .labs-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 28px;
  }
  .lab-card {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: var(--rad);
    padding: 16px;
    transition: border-color .15s;
  }
  .lab-card:hover { border-color: var(--line2); }
  .lab-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .lab-phase { font-size: 10px; color: var(--dim); font-family: var(--mono); }
  .lab-name { font-size: 13px; font-weight: 600; color: var(--bone); margin-bottom: 4px; }
  .lab-tool { font-size: 11px; color: var(--volt); font-family: var(--mono); margin-bottom: 8px; }
  .lab-blurb { font-size: 12px; color: var(--ash); line-height: 1.5; }
  .labs-cta { text-align: center; margin-top: 8px; }

  /* ── Playbooks ── */
  .pb-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
  .pb-card {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: var(--rad);
    padding: 20px;
    transition: border-color .15s;
  }
  .pb-card:hover { border-color: var(--line2); }
  .pb-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
  .sev { font-size: 10px; font-weight: 700; letter-spacing: .08em; }
  .sev-blood { color: var(--blood); }
  .sev-amber { color: var(--amber); }
  .pb-time { font-size: 10px; color: var(--ash); font-family: var(--mono); }
  .pb-title { font-size: 14px; font-weight: 600; color: var(--bone); }

  /* ── Quick start ── */
  .qs-card {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: var(--rad);
    padding: 32px 36px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .qs-card code {
    display: block;
    font-family: var(--mono);
    font-size: 14px;
    color: var(--volt);
    background: var(--panel2);
    padding: 12px 16px;
    border-radius: var(--rad);
    border: 1px solid var(--line2);
    cursor: copy;
    width: fit-content;
  }
  .qs-card code:hover { border-color: var(--volt); }
  .qs-card p { font-size: 14px; color: var(--ash); }
  .qs-card p strong { color: var(--bone); }
  .qs-links { display: flex; gap: 12px; align-items: center; }
  .qs-links a:not(.btn-primary) { color: var(--ash); font-size: 13px; }
  .qs-links a:not(.btn-primary):hover { color: var(--volt); }

  /* ── Footer ── */
  .footer {
    border-top: 1px solid var(--line);
    padding: 32px 48px;
    display: flex;
    align-items: center;
    gap: 24px;
    flex-wrap: wrap;
  }
  .footer-logo { font-size: 13px; font-weight: 700; letter-spacing: .1em; color: var(--ash); }
  .footer-logo em { font-style: normal; color: var(--volt); }
  .footer-links { display: flex; gap: 16px; flex: 1; }
  .footer-links a { font-size: 12px; color: var(--dim); }
  .footer-links a:hover { color: var(--ash); text-decoration: none; }
  .footer-note { font-size: 11px; color: var(--dim); width: 100%; margin-top: 4px; }

  @media (max-width: 900px) {
    .hero { grid-template-columns: 1fr; padding: 40px 24px; }
    .tracks { grid-template-columns: 1fr; }
    .curriculum-grid { grid-template-columns: 1fr; }
    .labs-grid { grid-template-columns: repeat(2, 1fr); }
    .pb-grid { grid-template-columns: repeat(2, 1fr); }
    .section { padding: 48px 24px; }
    .topbar { padding: 0 24px; }
  }
</style>
