<script>
  import { ATTACK } from '$lib/data';

  const ACTORS = [
    { name:'APT28 / Fancy Bear',  origin:'Russia', targets:'Government, Military, Energy', ttps:'T1566.001 · T1059.001 · T1003.001' },
    { name:'APT29 / Cozy Bear',   origin:'Russia', targets:'Tech, Government, NGOs',       ttps:'T1195.002 · T1027.002 · T1071.001' },
    { name:'APT41',               origin:'China',  targets:'Healthcare, Tech, Defense',    ttps:'T1190 · T1059 · T1055' },
    { name:'Lazarus Group',       origin:'DPRK',   targets:'Finance, Crypto, Defense',     ttps:'T1566 · T1105 · T1486' },
    { name:'TA542 (Emotet)',      origin:'UNK',    targets:'All sectors',                  ttps:'T1566.001 · T1547.001 · T1055' },
    { name:'ALPHV / BlackCat',    origin:'RU affl',targets:'Healthcare, Finance',          ttps:'T1486 · T1490 · T1021.002' },
  ];

  const KILL_CHAIN = [
    { phase:'Reconnaissance',   icon:'🔍', desc:'Target research, OSINT, scanning (Shodan, LinkedIn, DNS enum)' },
    { phase:'Weaponization',    icon:'⚙️', desc:'Payload creation, CVE exploitation, macro-laced document' },
    { phase:'Delivery',         icon:'📨', desc:'Spearphishing, drive-by download, supply chain, USB' },
    { phase:'Exploitation',     icon:'💥', desc:'Code execution via CVE, macro, or credential abuse' },
    { phase:'Installation',     icon:'🏠', desc:'Persistence: Run key, scheduled task, WMI, DLL side-load' },
    { phase:'C2',               icon:'📡', desc:'Beacon over HTTPS/DNS, Cobalt Strike, custom C2 protocols' },
    { phase:'Actions on Obj.',  icon:'🎯', desc:'Exfil, ransomware, credential theft, destructive wiper' },
  ];

  const IOCS = [
    { type:'IP',      desc:'IP address of C2 or scanner', format:'185.220.101.47', source:'SIEM, firewall, EDR' },
    { type:'Domain',  desc:'Malicious or DGA domain',     format:'cdn-telemetry.xyz', source:'DNS logs, proxy' },
    { type:'Hash',    desc:'SHA-256 of malware sample',   format:'64-char hex',    source:'EDR, AV, sandbox' },
    { type:'URL',     desc:'Phishing or C2 URL',          format:'https://…',      source:'Proxy, email gateway' },
    { type:'Email',   desc:'Sender address / domain',     format:'attacker@domain', source:'Mail logs, header' },
    { type:'File',    desc:'Malicious filename/path',     format:'svchost32.exe',  source:'EDR, AV' },
    { type:'Mutex',   desc:'Named mutex created by malware', format:'Global\\{GUID}', source:'Memory, EDR' },
    { type:'Registry',desc:'Persistence key or value',    format:'HKCU\\Run\\…',   source:'Registry, EDR' },
  ];

  const RULES = {
    sigma: `title: Suspicious vssadmin Shadow Copy Deletion
id: e0b06658-a8e8-4ee3-b04c-e2e4e8e39b5c
status: stable
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    Image|endswith: '\\vssadmin.exe'
    CommandLine|contains|all:
      - 'delete'
      - 'shadows'
  condition: selection
level: high
tags:
  - attack.impact
  - attack.t1490`,
    yara: `rule LockBit3_Ransom_Note {
  meta:
    description = "Detects LockBit 3.0 ransom note"
    author = "BLACKVAULT"
    reference = "T1486"
  strings:
    $note  = "LockBit 3.0" ascii nocase
    $tor   = ".onion" ascii
    $ext   = { 6C 6F 63 6B 62 69 74 }  // "lockbit"
  condition:
    any of them
}`,
    suricata: `alert http $HOME_NET any -> $EXTERNAL_NET any (
  msg:"ET MALWARE Cobalt Strike Beacon Checkin";
  flow:established,to_server;
  content:"GET"; http_method;
  content:"/updates"; http_uri;
  content:"User-Agent|3a 20|"; http_header;
  content:"Mozilla/5.0 (compatible|3b|"; within:80;
  reference:url,attack.mitre.org/techniques/T1071/001/;
  sid:2023560; rev:1;
)`,
  };

  let activeRule = 'sigma';
</script>

<svelte:head><title>Intel — BLACKVAULT</title></svelte:head>

<div class="topstrip">
  <span>THREAT INTELLIGENCE</span>
</div>

<main class="page">

  <!-- Kill Chain -->
  <section class="intel-section">
    <h2 class="is-hd">Cyber Kill Chain</h2>
    <div class="kc-grid">
      {#each KILL_CHAIN as kc, i}
        <div class="kc-item">
          <div class="kc-n">{i+1}</div>
          <div class="kc-icon">{kc.icon}</div>
          <div class="kc-phase">{kc.phase}</div>
          <div class="kc-desc">{kc.desc}</div>
        </div>
      {/each}
    </div>
  </section>

  <!-- ATT&CK quick ref -->
  <section class="intel-section">
    <h2 class="is-hd">ATT&amp;CK Techniques</h2>
    <div class="attack-table">
      <div class="at-head">
        <span>ID</span><span>Name</span><span>Tactic</span>
      </div>
      {#each ATTACK as t}
        <div class="at-row">
          <span class="at-id">{t.id}</span>
          <span class="at-name">{t.name}</span>
          <span class="at-tactic">{t.tactic}</span>
        </div>
      {/each}
    </div>
  </section>

  <!-- Threat actors -->
  <section class="intel-section">
    <h2 class="is-hd">Threat Actor Profiles</h2>
    <div class="actor-grid">
      {#each ACTORS as a}
        <div class="actor-card">
          <div class="ac-name">{a.name}</div>
          <div class="ac-meta"><span class="ac-lbl">Origin</span> {a.origin}</div>
          <div class="ac-meta"><span class="ac-lbl">Targets</span> {a.targets}</div>
          <div class="ac-ttps">{a.ttps}</div>
        </div>
      {/each}
    </div>
  </section>

  <!-- IOC taxonomy -->
  <section class="intel-section">
    <h2 class="is-hd">IOC Taxonomy</h2>
    <div class="ioc-table">
      <div class="ioc-head"><span>Type</span><span>Description</span><span>Example Format</span><span>Source</span></div>
      {#each IOCS as ioc}
        <div class="ioc-row">
          <span class="ioc-type">{ioc.type}</span>
          <span class="ioc-desc">{ioc.desc}</span>
          <span class="ioc-fmt">{ioc.format}</span>
          <span class="ioc-src">{ioc.source}</span>
        </div>
      {/each}
    </div>
  </section>

  <!-- Detection rules -->
  <section class="intel-section">
    <h2 class="is-hd">Detection Rule Templates</h2>
    <div class="rule-tabs">
      {#each ['sigma','yara','suricata'] as r}
        <button class="rtab" class:active={activeRule === r} on:click={() => activeRule = r}>
          {r.toUpperCase()}
        </button>
      {/each}
    </div>
    <pre class="rule-block"><code>{RULES[activeRule]}</code></pre>
  </section>

</main>

<style>
  .topstrip {
    position: sticky; top: 0;
    background: color-mix(in srgb, var(--panel) 85%, transparent);
    backdrop-filter: blur(6px);
    border-bottom: 1px solid var(--line);
    padding: 10px 28px; font-size: 11px; font-weight: 700; letter-spacing: .1em; color: var(--ash);
    z-index: 10;
  }
  .page { padding: 28px; flex: 1; }

  .intel-section { margin-bottom: 40px; }
  .is-hd { font-size: 16px; font-weight: 700; color: var(--bone); margin-bottom: 16px; letter-spacing: -.01em; }

  /* Kill Chain */
  .kc-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
  .kc-item {
    background: var(--panel); border: 1px solid var(--line);
    border-radius: var(--rad); padding: 14px 12px; text-align: center;
  }
  .kc-n { font-family: var(--mono); font-size: 10px; color: var(--volt); margin-bottom: 6px; }
  .kc-icon { font-size: 20px; margin-bottom: 6px; }
  .kc-phase { font-size: 11px; font-weight: 700; color: var(--bone); margin-bottom: 6px; }
  .kc-desc { font-size: 10px; color: var(--ash); line-height: 1.4; }

  /* ATT&CK table */
  .attack-table { background: var(--panel); border: 1px solid var(--line); border-radius: var(--rad); overflow: hidden; }
  .at-head, .at-row {
    display: grid; grid-template-columns: 110px 1fr 160px;
    padding: 10px 16px; gap: 16px;
    border-bottom: 1px solid var(--line);
  }
  .at-row:last-child { border-bottom: none; }
  .at-head { background: var(--panel2); font-size: 10px; font-weight: 700; color: var(--ash); letter-spacing: .08em; text-transform: uppercase; }
  .at-row:hover { background: var(--panel2); }
  .at-id { font-family: var(--mono); font-size: 12px; color: var(--volt); }
  .at-name { font-size: 13px; color: var(--bone); }
  .at-tactic { font-size: 11px; color: var(--ash); }

  /* Actors */
  .actor-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .actor-card {
    background: var(--panel); border: 1px solid var(--line);
    border-radius: var(--rad); padding: 18px;
  }
  .ac-name { font-size: 14px; font-weight: 700; color: var(--bone); margin-bottom: 10px; }
  .ac-meta { font-size: 12px; color: var(--ash); margin-bottom: 4px; }
  .ac-lbl { color: var(--dim); font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; margin-right: 4px; }
  .ac-ttps { margin-top: 10px; font-family: var(--mono); font-size: 11px; color: var(--volt); }

  /* IOC table */
  .ioc-table { background: var(--panel); border: 1px solid var(--line); border-radius: var(--rad); overflow: hidden; }
  .ioc-head, .ioc-row {
    display: grid; grid-template-columns: 80px 1fr 140px 140px;
    padding: 10px 16px; gap: 16px;
    border-bottom: 1px solid var(--line); font-size: 12px;
  }
  .ioc-row:last-child { border-bottom: none; }
  .ioc-head { background: var(--panel2); font-size: 10px; font-weight: 700; color: var(--ash); letter-spacing: .08em; text-transform: uppercase; }
  .ioc-row:hover { background: var(--panel2); }
  .ioc-type { font-weight: 700; color: var(--volt); font-family: var(--mono); font-size: 11px; }
  .ioc-desc, .ioc-src { color: var(--ash); }
  .ioc-fmt { font-family: var(--mono); color: var(--bone); font-size: 11px; }

  /* Detection rules */
  .rule-tabs { display: flex; gap: 1px; margin-bottom: 0; background: var(--line); border-radius: var(--rad) var(--rad) 0 0; overflow: hidden; width: fit-content; }
  .rtab {
    padding: 9px 18px; background: var(--panel2);
    border: none; cursor: pointer;
    font-size: 12px; font-weight: 700; color: var(--ash);
    letter-spacing: .06em; transition: background .15s, color .15s;
  }
  .rtab:hover { color: var(--bone); }
  .rtab.active { background: var(--panel3); color: var(--volt); }
  .rule-block {
    background: var(--panel3); border: 1px solid var(--line);
    border-top: none; border-radius: 0 var(--rad) var(--rad) var(--rad);
    padding: 20px 24px; overflow-x: auto;
  }
  .rule-block code { font-family: var(--mono); font-size: 12px; color: var(--volt); line-height: 1.6; }

  @media (max-width: 900px) {
    .kc-grid { grid-template-columns: repeat(4, 1fr); }
    .actor-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 600px) {
    .at-head, .at-row { grid-template-columns: 90px 1fr; }
    .at-tactic { display: none; }
    .ioc-head, .ioc-row { grid-template-columns: 70px 1fr; }
    .ioc-fmt, .ioc-src { display: none; }
  }
</style>
