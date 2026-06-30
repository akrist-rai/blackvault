<script>
  import { PHASES, LABS } from '$lib/data';

  const STATS = [
    { n: '130', label: 'Flags to Capture' },
    { n: '12',  label: 'Phases' },
    { n: '16',  label: 'Labs' },
    { n: '70+', label: 'ATT&CK TTPs' },
    { n: '130+', label: 'Arsenal Commands' },
    { n: '4',   label: 'IR Playbooks' },
    { n: '9',   label: 'Badges' },
  ];

  const HOW = [
    { n: '01', t: 'Study the brief', d: 'Real-tool walkthroughs, case files, threat intel, and command references — taught before anything is tested.' },
    { n: '02', t: 'Capture the flag', d: 'Every section ends in a real BV{...} challenge derived from what you just learned. No self-checked boxes, no self-reported completion.' },
    { n: '03', t: 'Track mastery', d: 'Flags, cleared labs, closed cases, and badges roll up into a single mastery score across all three tracks.' },
  ];

  const TRACKS = [
    {
      id: 'df', chip: 'chip-df', label: 'DIGITAL FORENSICS',
      color: 'var(--amber)',
      desc: 'Disk imaging, file carving, memory acquisition, network capture analysis, super-timeline construction, incident scoping.',
      phases: [1,8,9,11,12],
    },
    {
      id: 're', chip: 'chip-re', label: 'REVERSE ENGINEERING',
      color: 'var(--volt)',
      desc: 'x86-64 assembly, PE/ELF internals, Ghidra decompilation, unpacking, protocol RE, cryptographic algorithm identification.',
      phases: [2,3,5,7,10],
    },
    {
      id: 'ma', chip: 'chip-ma', label: 'MALWARE ANALYSIS',
      color: 'var(--blood)',
      desc: 'Static triage, dynamic sandboxing, rootkit hunting, YARA rule authoring, C2 beacon detection, LotL technique identification.',
      phases: [4,6,7,11],
    },
  ];

  const TERM_LINES = [
    { t: 'cmd', text: 'vol3 -f hermes07.raw windows.malfind' },
    { t: 'info', text: 'Process        PID    Base          Protection' },
    { t: 'hit',  text: 'svchost.exe    3824   0x1e800000    PAGE_EXECUTE_READWRITE' },
    { t: 'dim',  text: '  Dump: MZ header @ 0x1e800000 — injected PE module' },
    { t: 'cmd',  text: 'vol3 -f hermes07.raw windows.netscan | grep ESTABLISHED' },
    { t: 'hit',  text: '3824  svchost  185.220.101.47:443  ESTABLISHED' },
    { t: 'dim',  text: '  Tor exit node · Cobalt Strike beacon fingerprint' },
    { t: 'cmd',  text: 'tshark -r cap.pcap -Y dns -T fields -e dns.qry.name' },
    { t: 'hit',  text: 's0-deadbeef.cdn-telemetry.xyz' },
    { t: 'dim',  text: '  DNS exfil: 32 bytes/query · base32 encoded payload' },
  ];

  const PB = [
    { title: 'Ransomware Response',     sev: 'CRITICAL', time: '72h',  color: 'blood' },
    { title: 'Data Breach',             sev: 'HIGH',     time: '96h',  color: 'amber' },
    { title: 'Supply Chain Compromise', sev: 'CRITICAL', time: '120h', color: 'blood' },
    { title: 'BEC / Email Fraud',       sev: 'HIGH',     time: '48h',  color: 'amber' },
  ];
</script>

<svelte:head>
  <title>BLACKVAULT — Security Training Range</title>
</svelte:head>

<div class="landing">

  <!-- ── Topbar ── -->
  <header class="topbar">
    <a href="/" class="tb-logo">BLACK<em>VAULT</em></a>
    <nav class="tb-nav">
      <a href="#tracks">Tracks</a>
      <a href="#curriculum">Curriculum</a>
      <a href="#labs">Labs</a>
      <a href="/intel">Intel</a>
    </nav>
    <a href="/console" class="tb-cta">Open Console →</a>
  </header>

  <!-- ── Hero ── -->
  <section class="hero">
    <div class="hero-glow"></div>
    <div class="hero-inner">
      <div class="hero-text">
        <div class="hero-eyebrow">
          <span class="eyebrow-dot"></span>
          Real-tool security training
        </div>
        <h1 class="hero-h1">
          Learn forensics, RE,<br />
          and malware analysis<br />
          <span class="h1-accent">the hard way.</span>
        </h1>
        <p class="hero-sub">
          12-phase curriculum. 16 browser labs with simulated real-tool output.
          Backed by authentic artifacts. No VMs. No accounts. Open and start.
        </p>
        <div class="hero-ctas">
          <a href="/console" class="btn-primary">Enter the Range →</a>
          <a href="#curriculum" class="btn-ghost">View Curriculum</a>
        </div>
        <div class="hero-meta">
          <span class="hm-item"><span class="hm-dot volt"></span>DF · RE · MA tracks</span>
          <span class="hm-item"><span class="hm-dot amber"></span>MITRE ATT&CK mapped</span>
          <span class="hm-item"><span class="hm-dot blue"></span>GREM / GCFE aligned</span>
        </div>
      </div>

      <div class="hero-term">
        <div class="ht-chrome">
          <span class="htd htd-r"></span>
          <span class="htd htd-y"></span>
          <span class="htd htd-g"></span>
          <span class="ht-label">analyst@blackvault:~/range $</span>
        </div>
        <div class="ht-body">
          {#each TERM_LINES as line}
            {#if line.t === 'cmd'}
              <div class="hl-cmd"><span class="hl-ps">$</span>{line.text}</div>
            {:else if line.t === 'hit'}
              <div class="hl-hit">{line.text}</div>
            {:else if line.t === 'info'}
              <div class="hl-info">{line.text}</div>
            {:else}
              <div class="hl-dim">{line.text}</div>
            {/if}
          {/each}
          <div class="hl-cmd"><span class="hl-ps">$</span><span class="cursor">▋</span></div>
        </div>
        <div class="ht-glow"></div>
      </div>
    </div>
  </section>

  <!-- ── Stats ── -->
  <div class="stats-strip">
    {#each STATS as s, i}
      {#if i > 0}<div class="stats-sep"></div>{/if}
      <div class="stat-item">
        <div class="si-n">{s.n}</div>
        <div class="si-l">{s.label}</div>
      </div>
    {/each}
  </div>

  <!-- ── How it works ── -->
  <section class="section" id="how">
    <div class="section-label">How It Works</div>
    <h2 class="section-h">Learn the material, then prove it</h2>
    <div class="how-grid">
      {#each HOW as h}
        <div class="how-card">
          <div class="how-n">{h.n}</div>
          <div class="how-t">{h.t}</div>
          <div class="how-d">{h.d}</div>
        </div>
      {/each}
    </div>
  </section>

  <!-- ── Tracks ── -->
  <section class="section" id="tracks">
    <div class="section-label">Skill Tracks</div>
    <h2 class="section-h">Three paths to mastery</h2>
    <div class="tracks-grid">
      {#each TRACKS as t}
        <div class="track-card" style="--track-color:{t.color}">
          <div class="tc-accent"></div>
          <div class="tc-body">
            <span class="chip {t.chip}">{t.label}</span>
            <p class="tc-desc">{t.desc}</p>
            <div class="tc-phases">
              {#each t.phases as n}
                <span class="tc-phase">Phase {n}</span>
              {/each}
            </div>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <!-- ── Curriculum ── -->
  <section class="section" id="curriculum">
    <div class="section-label">Curriculum</div>
    <h2 class="section-h">12-Phase learning path</h2>
    <div class="curriculum-table">
      <div class="ct-head">
        <span>Phase</span><span>Module</span><span>Tools</span><span>Track</span>
      </div>
      {#each PHASES as p}
        <a href="/console/study?phase={p.id}" class="ct-row">
          <span class="ct-num">{String(p.n).padStart(2,'0')}</span>
          <span class="ct-name">{p.name}</span>
          <span class="ct-tools">{p.tools}</span>
          <span class="chip chip-{p.track==='DF'?'df':p.track==='RE'?'re':'ma'}">{p.track}</span>
        </a>
      {/each}
    </div>
  </section>

  <!-- ── Labs ── -->
  <section class="section" id="labs">
    <div class="section-label">Range Labs</div>
    <h2 class="section-h">Browser-based lab simulations</h2>
    <div class="labs-grid">
      {#each LABS as lab}
        <a href="/console/range/{lab.id}" class="lab-card">
          <div class="lc-header">
            <span class="chip chip-{lab.track==='DF'?'df':lab.track==='RE'?'re':'ma'}">{lab.track}</span>
            <span class="lc-phase">Ph.{lab.phase}</span>
          </div>
          <div class="lc-name">{lab.name}</div>
          <div class="lc-tool">{lab.tool}</div>
          <p class="lc-blurb">{lab.blurb}</p>
          <div class="lc-arrow">→</div>
        </a>
      {/each}
    </div>
    <div class="section-cta">
      <a href="/console/range" class="btn-primary">Open Range Hub →</a>
    </div>
  </section>

  <!-- ── Playbooks ── -->
  <section class="section" id="playbooks">
    <div class="section-label">IR Playbooks</div>
    <h2 class="section-h">Incident response runbooks</h2>
    <div class="pb-grid">
      {#each PB as pb}
        <div class="pb-card pb-{pb.color}">
          <div class="pb-sev sev-{pb.color}">{pb.sev}</div>
          <div class="pb-title">{pb.title}</div>
          <div class="pb-time">Target containment: <strong>{pb.time}</strong></div>
        </div>
      {/each}
    </div>
    <div class="section-cta">
      <a href="/playbook" class="btn-ghost">Open Playbooks →</a>
    </div>
  </section>

  <!-- ── Footer ── -->
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <div class="footer-logo">BLACK<em>VAULT</em></div>
        <div class="footer-tagline">Security Training Range</div>
      </div>
      <nav class="footer-nav">
        <a href="/console">Console</a>
        <a href="/console/range">Labs</a>
        <a href="/playbook">Playbooks</a>
        <a href="/tools">Arsenal</a>
        <a href="/intel">Intel</a>
      </nav>
      <div class="footer-note">
        Synthetic artifacts only. All samples fabricated for training.
      </div>
    </div>
  </footer>

</div>

<style>
  .landing {
    min-height: 100dvh;
    display: flex;
    flex-direction: column;
    background: var(--void);
  }

  /* ── Topbar ── */
  .topbar {
    position: sticky; top: 0; z-index: 100;
    display: flex; align-items: center; gap: 0;
    padding: 0 40px; height: 56px;
    background: color-mix(in srgb, var(--void) 88%, transparent);
    backdrop-filter: blur(14px) saturate(1.4);
    border-bottom: 1px solid var(--line);
  }
  .tb-logo {
    font-size: 15px; font-weight: 800; letter-spacing: .14em;
    color: var(--bone); text-decoration: none; margin-right: auto;
  }
  .tb-logo em { font-style: normal; color: var(--volt); }
  .tb-nav { display: flex; gap: 32px; margin: 0 32px; }
  .tb-nav a { font-size: 13px; color: var(--ash); font-weight: 500; transition: color var(--tx); }
  .tb-nav a:hover { color: var(--bone); text-decoration: none; }
  .tb-cta {
    font-size: 12px; font-weight: 700; letter-spacing: .04em;
    padding: 7px 18px; border-radius: var(--rad);
    background: var(--volt); color: #030810;
    transition: box-shadow var(--tx), opacity var(--tx);
  }
  .tb-cta:hover { text-decoration: none; box-shadow: var(--glow-volt); opacity: .92; }

  /* ── Hero ── */
  .hero {
    position: relative;
    overflow: hidden;
    padding: 80px 40px 70px;
    border-bottom: 1px solid var(--line);
  }
  .hero-glow {
    position: absolute; top: -40%; right: -5%; width: 70%; height: 200%;
    background: radial-gradient(ellipse 60% 50% at 60% 40%, color-mix(in srgb, var(--volt) 7%, transparent) 0%, transparent 65%);
    pointer-events: none;
  }
  .hero-inner {
    position: relative; z-index: 1;
    max-width: 1200px; margin: 0 auto;
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 60px; align-items: center;
  }
  .hero-eyebrow {
    display: flex; align-items: center; gap: 8px;
    font-size: 11px; font-weight: 700; letter-spacing: .12em;
    color: var(--volt); text-transform: uppercase; margin-bottom: 20px;
  }
  .eyebrow-dot {
    width: 6px; height: 6px; border-radius: 50%; background: var(--volt);
    box-shadow: 0 0 8px var(--volt); flex-shrink: 0;
  }
  .hero-h1 {
    font-size: clamp(32px, 4vw, 52px);
    font-weight: 800; line-height: 1.12;
    color: var(--bone); letter-spacing: -.02em;
    margin-bottom: 22px;
  }
  .h1-accent { color: var(--volt); }
  .hero-sub {
    font-size: 15px; color: var(--ash); line-height: 1.7;
    max-width: 440px; margin-bottom: 32px;
  }
  .hero-ctas { display: flex; gap: 12px; align-items: center; margin-bottom: 28px; flex-wrap: wrap; }
  .hero-meta { display: flex; gap: 20px; flex-wrap: wrap; }
  .hm-item { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--ash); }
  .hm-dot { width: 5px; height: 5px; border-radius: 50%; }
  .hm-dot.volt  { background: var(--volt); }
  .hm-dot.amber { background: var(--amber); }
  .hm-dot.blue  { background: var(--blue); }

  /* Terminal */
  .hero-term {
    position: relative;
    background: #010c0a;
    border: 1px solid color-mix(in srgb, var(--volt) 20%, transparent);
    border-radius: var(--rad-lg);
    overflow: hidden;
    box-shadow: var(--shadow-lg), var(--glow-volt);
  }
  .ht-chrome {
    display: flex; align-items: center; gap: 6px;
    padding: 10px 16px;
    background: #020e0b;
    border-bottom: 1px solid color-mix(in srgb, var(--volt) 12%, transparent);
  }
  .htd { width: 10px; height: 10px; border-radius: 50%; }
  .htd-r { background: #e53040; }
  .htd-y { background: #e0a020; }
  .htd-g { background: #00d4b8; }
  .ht-label { font-size: 10px; color: var(--ash); font-family: var(--mono); margin-left: 6px; letter-spacing: .04em; }
  .ht-body {
    padding: 16px 18px;
    font-family: var(--mono); font-size: 12px;
    display: flex; flex-direction: column; gap: 3px;
    line-height: 1.6;
  }
  .ht-glow {
    position: absolute; bottom: 0; left: 0; right: 0; height: 60px;
    background: linear-gradient(to top, color-mix(in srgb, var(--volt) 4%, transparent), transparent);
    pointer-events: none;
  }
  .hl-cmd { color: var(--bone); }
  .hl-ps  { color: var(--volt); margin-right: 8px; font-weight: 700; }
  .hl-hit { color: var(--volt); padding-left: 2px; }
  .hl-info { color: var(--ash); padding-left: 2px; }
  .hl-dim { color: var(--dim); padding-left: 4px; font-size: 11px; }
  .cursor {
    color: var(--volt);
    animation: blink 1s step-end infinite;
  }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }

  /* ── Buttons ── */
  .btn-primary {
    display: inline-flex; align-items: center;
    padding: 10px 22px; border-radius: var(--rad);
    background: var(--volt); color: #030810;
    font-size: 13px; font-weight: 700; letter-spacing: .03em;
    text-decoration: none; transition: box-shadow var(--tx), opacity var(--tx);
    white-space: nowrap;
  }
  .btn-primary:hover { text-decoration: none; box-shadow: var(--glow-volt); opacity: .9; }
  .btn-ghost {
    display: inline-flex; align-items: center;
    padding: 10px 22px; border-radius: var(--rad);
    border: 1px solid var(--line2); color: var(--ash);
    font-size: 13px; font-weight: 600;
    text-decoration: none; transition: border-color var(--tx), color var(--tx);
  }
  .btn-ghost:hover { border-color: var(--ash); color: var(--bone); text-decoration: none; }

  /* ── Stats strip ── */
  .stats-strip {
    display: flex; align-items: center; justify-content: center;
    gap: 0; padding: 0 40px;
    border-bottom: 1px solid var(--line);
    background: var(--panel);
    overflow-x: auto;
  }
  .stat-item { padding: 24px 36px; text-align: center; flex-shrink: 0; }
  .stats-sep { width: 1px; height: 40px; background: var(--line2); flex-shrink: 0; }
  .si-n { font-size: 28px; font-weight: 800; color: var(--volt); letter-spacing: -.02em; font-family: var(--mono); }
  .si-l { font-size: 10px; color: var(--ash); letter-spacing: .1em; text-transform: uppercase; margin-top: 2px; }

  /* ── Sections ── */
  .section {
    padding: 80px 40px;
    max-width: 1200px; margin: 0 auto;
    width: 100%;
  }
  .section-label {
    font-size: 10px; font-weight: 700; letter-spacing: .14em;
    color: var(--volt); text-transform: uppercase; margin-bottom: 10px;
  }
  .section-h {
    font-size: clamp(22px, 3vw, 34px);
    font-weight: 800; color: var(--bone);
    letter-spacing: -.02em; margin-bottom: 40px;
  }
  .section-cta { margin-top: 36px; display: flex; gap: 12px; }

  /* ── How it works ── */
  .how-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .how-card {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: var(--rad-lg);
    padding: 26px 22px;
    transition: border-color var(--tx), box-shadow var(--tx);
  }
  .how-card:hover {
    border-color: color-mix(in srgb, var(--volt) 35%, transparent);
    box-shadow: var(--glow-volt);
  }
  .how-n {
    font-family: var(--mono); font-size: 13px; font-weight: 700;
    color: var(--volt); letter-spacing: .08em; margin-bottom: 14px;
  }
  .how-t { font-size: 16px; font-weight: 700; color: var(--bone); margin-bottom: 10px; }
  .how-d { font-size: 13px; color: var(--ash); line-height: 1.7; }

  /* ── Tracks ── */
  .tracks-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .track-card {
    background: var(--panel);
    border: 1px solid var(--line);
    border-radius: var(--rad-lg);
    overflow: hidden;
    transition: border-color var(--tx), box-shadow var(--tx);
  }
  .track-card:hover {
    border-color: color-mix(in srgb, var(--track-color) 35%, transparent);
    box-shadow: 0 0 28px color-mix(in srgb, var(--track-color) 10%, transparent);
  }
  .tc-accent {
    height: 3px;
    background: var(--track-color);
    box-shadow: 0 0 12px var(--track-color);
  }
  .tc-body { padding: 24px 22px; display: flex; flex-direction: column; gap: 14px; }
  .tc-desc { font-size: 13px; color: var(--ash); line-height: 1.7; }
  .tc-phases { display: flex; flex-wrap: wrap; gap: 6px; }
  .tc-phase {
    font-size: 10px; font-family: var(--mono);
    padding: 2px 8px; border-radius: 3px;
    background: var(--panel2); color: var(--dim);
    border: 1px solid var(--line2);
  }

  /* ── Curriculum ── */
  .curriculum-table {
    background: var(--panel); border: 1px solid var(--line);
    border-radius: var(--rad-lg); overflow: hidden;
  }
  .ct-head {
    display: grid; grid-template-columns: 44px 1fr 1fr 60px;
    gap: 0; padding: 10px 20px;
    background: var(--panel2);
    border-bottom: 1px solid var(--line);
    font-size: 10px; font-weight: 700; color: var(--dim);
    letter-spacing: .1em; text-transform: uppercase;
    gap: 16px;
  }
  .ct-row {
    display: grid; grid-template-columns: 44px 1fr 1fr 60px;
    gap: 16px; padding: 12px 20px;
    border-bottom: 1px solid var(--line);
    align-items: center; text-decoration: none;
    transition: background var(--tx);
  }
  .ct-row:last-child { border-bottom: none; }
  .ct-row:hover { background: var(--panel2); text-decoration: none; }
  .ct-num { font-family: var(--mono); font-size: 13px; color: var(--volt); font-weight: 700; }
  .ct-name { font-size: 13px; color: var(--bone); font-weight: 500; }
  .ct-tools { font-family: var(--mono); font-size: 11px; color: var(--ash); }

  /* ── Labs ── */
  .labs-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .lab-card {
    display: flex; flex-direction: column;
    background: var(--panel); border: 1px solid var(--line);
    border-radius: var(--rad-lg); padding: 18px; gap: 8px;
    text-decoration: none;
    transition: border-color var(--tx), transform var(--tx), box-shadow var(--tx);
    position: relative; overflow: hidden;
  }
  .lab-card::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse 80% 60% at 50% 0%, color-mix(in srgb,var(--volt) 4%,transparent), transparent);
    opacity: 0; transition: opacity var(--tx);
  }
  .lab-card:hover { border-color: var(--line2); transform: translateY(-2px); box-shadow: var(--shadow-md); text-decoration: none; }
  .lab-card:hover::before { opacity: 1; }
  .lc-header { display: flex; align-items: center; gap: 8px; }
  .lc-phase { font-size: 10px; color: var(--dim); font-family: var(--mono); margin-left: auto; }
  .lc-name { font-size: 13px; font-weight: 700; color: var(--bone); line-height: 1.3; }
  .lc-tool { font-size: 11px; color: var(--volt); font-family: var(--mono); }
  .lc-blurb { font-size: 11px; color: var(--ash); line-height: 1.55; flex: 1; }
  .lc-arrow { font-size: 13px; color: var(--dim); margin-top: auto; transition: color var(--tx); }
  .lab-card:hover .lc-arrow { color: var(--volt); }

  /* ── Playbooks ── */
  .pb-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .pb-card {
    background: var(--panel); border: 1px solid var(--line);
    border-radius: var(--rad-lg); padding: 20px 18px;
    display: flex; flex-direction: column; gap: 10px;
    transition: border-color var(--tx);
  }
  .pb-blood { border-top: 2px solid var(--blood); }
  .pb-amber { border-top: 2px solid var(--amber); }
  .pb-card:hover { border-color: var(--line2); }
  .pb-sev { font-size: 10px; font-weight: 700; letter-spacing: .1em; }
  .sev-blood { color: var(--blood); }
  .sev-amber { color: var(--amber); }
  .pb-title { font-size: 14px; font-weight: 700; color: var(--bone); line-height: 1.3; }
  .pb-time  { font-size: 11px; color: var(--ash); }
  .pb-time strong { color: var(--bone); }

  /* ── Footer ── */
  .footer {
    margin-top: auto;
    border-top: 1px solid var(--line);
    background: var(--panel);
    padding: 36px 40px;
  }
  .footer-inner {
    max-width: 1200px; margin: 0 auto;
    display: flex; align-items: center; gap: 32px; flex-wrap: wrap;
  }
  .footer-brand { display: flex; flex-direction: column; gap: 3px; }
  .footer-logo { font-size: 14px; font-weight: 800; letter-spacing: .12em; color: var(--bone); }
  .footer-logo em { font-style: normal; color: var(--volt); }
  .footer-tagline { font-size: 10px; color: var(--dim); letter-spacing: .08em; text-transform: uppercase; }
  .footer-nav { display: flex; gap: 24px; flex-wrap: wrap; }
  .footer-nav a { font-size: 12px; color: var(--ash); transition: color var(--tx); }
  .footer-nav a:hover { color: var(--bone); text-decoration: none; }
  .footer-note { font-size: 11px; color: var(--dim); margin-left: auto; max-width: 260px; }

  /* ── Responsive ── */
  @media (max-width: 1100px) {
    .labs-grid { grid-template-columns: repeat(3, 1fr); }
    .pb-grid   { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 860px) {
    .hero-inner { grid-template-columns: 1fr; gap: 40px; }
    .hero { padding: 50px 20px 50px; }
    .tracks-grid { grid-template-columns: 1fr; }
    .how-grid { grid-template-columns: 1fr; }
    .labs-grid { grid-template-columns: repeat(2, 1fr); }
    .section { padding: 50px 20px; }
    .ct-head, .ct-row { grid-template-columns: 40px 1fr 70px; }
    .ct-tools { display: none; }
    .topbar { padding: 0 20px; }
    .tb-nav { display: none; }
    .stats-strip { justify-content: flex-start; }
    .stat-item { padding: 18px 20px; }
    .footer-inner { flex-direction: column; align-items: flex-start; gap: 20px; }
    .footer-note { margin-left: 0; }
  }
  @media (max-width: 580px) {
    .labs-grid { grid-template-columns: 1fr; }
    .pb-grid   { grid-template-columns: 1fr; }
    .hero-ctas { flex-direction: column; align-items: flex-start; }
  }
</style>
