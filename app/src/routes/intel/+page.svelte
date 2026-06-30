<script>
  import { ATTACK } from '$lib/data';
  import { ctf, showToast } from '$lib/stores';

  const INTEL_CHALS = [
    { q: 'A Rust-based ransomware group that triple-extorts (encrypt + exfil + DDoS) and exit-scammed its affiliates in March 2024. Submit the actor\'s short name.', flag: 'alphv' },
    { q: 'Which kill-chain phase covers beaconing over HTTPS/DNS with jittered sleep specifically to evade periodicity detection?', flag: 'c2' },
    { q: 'A JA3 hash fingerprints which part of the TLS handshake?', flag: 'clienthello' },
    { q: 'Per the Suricata DNS-tunnelling rule, queries are flagged when a label exceeds how many bytes?', flag: '40' },
    { q: 'Which threat actor pre-positions in US critical infrastructure using zero custom malware — entirely living off the land?', flag: 'volt_typhoon' },
    { q: 'Submit the ATT&CK technique ID for LSASS credential dumping via comsvcs.dll MiniDump.', flag: 't1003.001' },
  ];

  const ACTORS = [
    { name:'APT28 / Fancy Bear',    origin:'Russia (GRU)', targets:'Government, Military, Energy, NATO',   ttps:'T1566.001 · T1059.001 · T1003.001 · T1071.001', notes:'Active since 2004. Responsible for DNC hack (2016), Bundestag breach (2015). Uses X-Agent implant, Sofacy, and LAPSUS-style credential theft. Often exploits 0-days in Outlook (CVE-2023-23397).' },
    { name:'APT29 / Cozy Bear',     origin:'Russia (SVR)', targets:'Tech, Government, NGOs, Pharma',       ttps:'T1195.002 · T1027.002 · T1071.001 · T1070.004', notes:'SolarWinds SUNBURST (2020). MagicWeb, GraphicalNeutrino (2023) — uses Microsoft Graph API for C2 traffic blending. 14-day dormancy before activation. Certificate theft for long-term access.' },
    { name:'APT41 / Double Dragon', origin:'China (MSS)',  targets:'Healthcare, Tech, Defense, Gaming',    ttps:'T1190 · T1059 · T1055 · T1574.002', notes:'Unique: conducts both state espionage AND financially motivated crime. Operation CuckooBees (Cybereason 2022) — 9 months undetected across defense orgs. Uses KEYPLUG, DUSTPAN, DUSTTRAP.' },
    { name:'Lazarus Group',         origin:'DPRK (RGB)',   targets:'Finance, Crypto, Defense, Tech',       ttps:'T1566 · T1105 · T1486 · T1550.002', notes:'$625M Ronin Bridge crypto theft (2022), Bangladesh Bank SWIFT heist ($81M, 2016). TraderTraitor campaign targets crypto devs via fake job offers on LinkedIn. Uses custom tools: BLINDINGCAN, MATA.' },
    { name:'TA542 / Emotet (QBot)', origin:'UNK (Eastern Europe)', targets:'All sectors — commodity loader', ttps:'T1566.001 · T1547.001 · T1055 · T1021.002', notes:'Returned in 2021 after FBI takedown. Pivoted from XLS macros → OneNote .one files (2023). QakBot successor. Delivers IcedID, BlackBasta ransomware. ~$2.7B damage estimate globally.' },
    { name:'ALPHV / BlackCat',      origin:'RU-affiliated', targets:'Healthcare, Finance, Legal',          ttps:'T1486 · T1490 · T1021.002 · T1048.003', notes:'Rust-based ransomware (first major one). Triple extortion: encrypt + exfil + DDoS victim site. $22M ransom from Change Healthcare (2024, unpaid). ALPHV exit-scammed affiliates and shut down March 2024.' },
    { name:'Volt Typhoon',          origin:'China (PLA)',  targets:'Critical Infra — energy, water, comms', ttps:'T1078 · T1218 · T1053.005 · T1021.001', notes:'Pre-positioned in US critical infrastructure for potential conflict-time disruption. Entirely LotL — no custom malware. Uses stolen credentials, netsh portproxy, living-off-the-land binaries (LOLBins).' },
    { name:'Scattered Spider',      origin:'UNK (English-speaking)', targets:'Tech, Gaming, Telecom, Finance', ttps:'T1566.004 · T1621 · T1078 · T1213.003', notes:'Social engineering specialists: impersonate IT helpdesk, SIM-swap, MFA fatigue bombing. MGM Resorts ($100M loss, 2023), Caesars ($15M ransom paid). Native English speakers, often US/UK teenagers.' },
    { name:'Cl0p',                  origin:'UNK (RU links)', targets:'All sectors — MOVEit/GoAnywhere victims', ttps:'T1190 · T1560.001 · T1567.002 · T1486', notes:'Mass exploitation of managed file transfer tools: MOVEit (CVE-2023-34362), GoAnywhere (CVE-2023-0669). 2,000+ victim orgs in 2023. Pure exfiltration-only (no encryption in recent campaigns), then extortion.' },
    { name:'FIN7 / Carbanak',       origin:'UNK (RU links)', targets:'Retail, Hospitality, Finance',       ttps:'T1566.001 · T1059.001 · T1574.002 · T1565.001', notes:'$1B+ theft from banks via ATM jackpotting and SWIFT manipulation. Runs a fake cybersecurity company (Bastion Secure) to recruit unwitting pentesters. Uses Carbanak, BIRDWATCH, Robinhood.' },
  ];

  const KILL_CHAIN = [
    { phase:'Reconnaissance',   icon:'🔭', desc:'OSINT, Shodan/Censys scans, LinkedIn enumeration, DNS recon (amass, subfinder). Building target profile before any contact.', ttps:['T1592','T1589','T1593'] },
    { phase:'Weaponization',    icon:'⚙️', desc:'Macro-laced Office document, CVE weaponization, payload building. Operator configures C2 profile, generates signed dropper.', ttps:['T1587.001','T1588.006'] },
    { phase:'Delivery',         icon:'📨', desc:'Spearphishing attachment/link, drive-by download, supply chain insertion, USB drop. Initial contact with victim environment.', ttps:['T1566','T1195','T1091'] },
    { phase:'Exploitation',     icon:'💥', desc:'User opens doc (macro), browser visits page (CVE), admin clicks link (credential theft), or server receives malformed request (RCE).', ttps:['T1190','T1204','T1059'] },
    { phase:'Installation',     icon:'🏠', desc:'Persistence: Run key, scheduled task, WMI subscription, DLL side-load, web shell. Goal is surviving reboots and user logoff.', ttps:['T1547','T1053','T1546','T1505'] },
    { phase:'C2',               icon:'📡', desc:'Beacon over HTTPS/DNS. Cobalt Strike, Sliver, Havoc. Traffic blended via CDN/cloud. Jittered sleep to evade periodicity detection.', ttps:['T1071','T1573','T1090'] },
    { phase:'Actions on Obj.',  icon:'🎯', desc:'Credential theft, lateral movement, data staging, exfiltration, ransomware deployment, or destructive wipe. The attacker\'s actual goal.', ttps:['T1003','T1021','T1041','T1486'] },
  ];

  const IOCS = [
    { type:'IP',       desc:'C2 server or scanner source address',   format:'185.220.101.47',       source:'SIEM, firewall, EDR',       hunt:'Correlate with outbound HTTPS and DNS queries. Check against threat intel blocklists. Context: ASN, port, timing.' },
    { type:'Domain',   desc:'Malicious C2 or DGA domain',            format:'cdn-telemetry.xyz',     source:'DNS logs, proxy logs',      hunt:'Look for NX response → success pattern (DGA). Long query labels (tunnelling). Newly registered domains (<30 days) in logs.' },
    { type:'SHA-256',  desc:'Cryptographic hash of malware binary',  format:'64 hex chars',          source:'EDR, AV, sandbox',          hunt:'Compare against VirusTotal, MalwareBazaar. ImpHash for clustering. SSDeep for fuzzy matching across variants.' },
    { type:'JA3',      desc:'TLS client fingerprint from ClientHello', format:'32 hex chars (MD5)',  source:'Network sensor, Zeek',      hunt:'Cobalt Strike default: 72a7c4d8... Stable across IP rotations. Zeek ssl.log or tshark tls.handshake.ja3 field.' },
    { type:'URL',      desc:'Phishing page or C2 endpoint URL',      format:'https://cdn-x.io/up',   source:'Proxy, email gateway',      hunt:'Full URL including path — C2 URLs often have patterns (/updates, /check, /beacon). Proxy logs are the primary source.' },
    { type:'Email',    desc:'Phishing sender address or domain',      format:'support@microsof-t.com', source:'Mail logs, message header', hunt:'Inspect SPF/DKIM/DMARC result. Lookalike domains, typosquats. Sender display name ≠ email address is a red flag.' },
    { type:'Mutex',    desc:'Named mutex created at runtime',         format:'Global\\\\{GUID}',      source:'Memory (Volatility handles), EDR', hunt:'Stable across sandbox runs — same family always creates same mutex. Enumerate with Volatility windows.handles or ProcMon filter.' },
    { type:'Registry', desc:'Persistence key or value name',         format:'HKCU\\\\Run\\\\...', source:'Registry, EDR, Autoruns',   hunt:'Monitor HKCU/HKLM Run keys, Services, and scheduled tasks. Event 4657 (Sysmon) for registry value modifications.' },
    { type:'YARA',     desc:'Binary pattern rule matching sample',    format:'rule APT28_X-Agent {...}', source:'EDR, sandbox, manual',  hunt:'Author rules from unique strings, byte sequences, or PE characteristics. Test against benign corpus before deployment.' },
    { type:'Sigma',    desc:'SIEM-agnostic detection rule',           format:'YAML detection rule',   source:'SIEM (Splunk, Elastic)',    hunt:'Convert Sigma to platform-specific query. Covers event log patterns for ATT&CK techniques. github.com/SigmaHQ/sigma' },
  ];

  const RULES = {
    sigma: `title: Cobalt Strike Named Pipe — Default Pattern
id: d5f2d2c0-5b23-4d2c-90b6-2e4c16e80f69
status: stable
description: Detects Cobalt Strike beacon default named pipe pattern
logsource:
  category: pipe_created
  product: windows
detection:
  selection:
    PipeName|re: '\\\\MSSE-[0-9a-f]+-server'
  condition: selection
falsepositives:
  - Unknown legitimate software using similar naming
level: high
tags:
  - attack.execution
  - attack.t1071
  - attack.lateral_movement
  - attack.t1021`,

    sigma2: `title: Suspicious LSASS Access via MiniDump
id: a7c21fc3-8481-4e5e-9b30-1fe782d5c3a2
status: stable
logsource:
  product: windows
  category: process_access
detection:
  selection:
    TargetImage|endswith: '\\\\lsass.exe'
    GrantedAccess|contains:
      - '0x1fffff'
      - '0x1410'
      - '0x143a'
  filter_legitimate:
    SourceImage|contains:
      - '\\\\Program Files\\\\Windows Defender\\\\'
      - '\\\\System32\\\\werfault.exe'
  condition: selection and not filter_legitimate
level: critical
tags:
  - attack.credential_access
  - attack.t1003.001`,

    yara: `rule Cobalt_Strike_Beacon_Config {
  meta:
    description = "Detects Cobalt Strike beacon config block in memory or on disk"
    author      = "BLACKVAULT"
    reference   = "T1071.001"
    tlp         = "WHITE"
  strings:
    $cfg1 = { 00 01 00 01 00 02 ?? ?? 00 02 00 01 00 02 }
    $cfg2 = ".cobaltstrike.beacon_keys" ascii
    $pipe = "\\\\pipe\\\\MSSE-" ascii wide
    $sleep = { 00 00 00 00 00 00 00 00 ?? ?? ?? ?? 00 00 EA 60 }
  condition:
    uint16(0) == 0x5A4D and
    ($cfg1 at 0x400 or $pipe or ($cfg2 and $sleep))
}`,

    yara2: `rule Emotet_DLL_Dropper_2024 {
  meta:
    description = "Detects Emotet DLL dropper (2024 wave)"
    author      = "BLACKVAULT"
    reference   = "T1566.001"
    hash        = "f8e3a9b1c5d2e8f4a2b7c9d0e1f3a4b5"
  strings:
    $s1 = "RunDLL32.EXE" wide nocase
    $s2 = { 48 8B 05 ?? ?? ?? ?? 48 8B 08 FF 51 ?? }  // indirect call
    $s3 = "SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run" wide
    $onion = ".onion" ascii
    $mz    = { 4D 5A }
  condition:
    $mz at 0 and
    filesize < 600KB and
    2 of ($s1, $s2, $s3) and not $onion
}`,

    suricata: `# Cobalt Strike default HTTPS beacon (malleable default profile)
alert tls $HOME_NET any -> $EXTERNAL_NET 443 (
  msg:"ET MALWARE Cobalt Strike Beacon Default TLS Cert CN";
  tls.cert_subject; content:"CN=Major Cobalt Strike";
  reference:url,attack.mitre.org/techniques/T1071/001/;
  sid:2036369; rev:1; classtype:trojan-activity;
)

# DNS tunnelling — long subdomain labels
alert dns $HOME_NET any -> any 53 (
  msg:"ET HUNTING Possible DNS Tunneling Long Query";
  byte_test:1,>,40,0,relative,string;
  dns.query; pcre:"/[a-f0-9]{32,}\\./"i;
  reference:url,attack.mitre.org/techniques/T1048/003/;
  sid:2030201; rev:2;
)

# LSASS dump via comsvcs.dll MiniDump
alert process_creation $HOME_NET any (
  msg:"ET ATTACK_RESPONSE LSASS Dump via comsvcs MiniDump";
  content:"comsvcs.dll"; nocase;
  content:"MiniDump"; nocase; within:40;
  reference:url,attack.mitre.org/techniques/T1003/001/;
  sid:2040101; rev:1;
)`,
  };

  let activeRule = 'sigma';
  let activeSigma = 'sigma';
  let activeYara = 'yara';
  let ruleView = 'sigma';

  $: solvedFlags = $ctf;
  let inputs = {};
  let wrong = {};

  function normalizeFlag(s) {
    return (s ?? '').trim().toLowerCase().replace(/^bv\{/, '').replace(/\}$/, '');
  }

  function submitChal(i, flag) {
    const key = `intel_${i}`;
    const val = normalizeFlag(inputs[key]);
    if (val === flag.toLowerCase()) {
      wrong = { ...wrong, [key]: false };
      ctf.update(s => ({ ...s, [key]: true }));
      showToast('Flag captured', 'success');
    } else {
      wrong = { ...wrong, [key]: true };
    }
  }
</script>

<svelte:head><title>Intel — BLACKVAULT</title></svelte:head>

<div class="topstrip">
  <span>THREAT INTELLIGENCE</span>
  <span class="ts-right">{INTEL_CHALS.filter((_, i) => solvedFlags[`intel_${i}`]).length}/{INTEL_CHALS.length} flags captured</span>
</div>

<main class="page">

  <div class="page-intro">
    <h1>Threat Intelligence Feed</h1>
    <p>Kill-chain phases, threat-actor profiles, and detection-rule templates drawn from real campaigns. Study the brief, then prove it with BV{'{'}...{'}'} flags in the challenge section below.</p>
    <div class="intro-pbar"><div class="intro-pfill" style="width:{Math.round(INTEL_CHALS.filter((_, i) => solvedFlags[`intel_${i}`]).length / INTEL_CHALS.length * 100)}%"></div></div>
    <div class="intro-plabel">{INTEL_CHALS.filter((_, i) => solvedFlags[`intel_${i}`]).length}/{INTEL_CHALS.length} flags captured</div>
  </div>

  <!-- Kill Chain -->
  <section class="intel-section">
    <h2 class="is-hd">Unified Kill Chain</h2>
    <div class="kc-grid">
      {#each KILL_CHAIN as kc, i}
        <div class="kc-item">
          <div class="kc-n">{i+1}</div>
          <div class="kc-icon">{kc.icon}</div>
          <div class="kc-phase">{kc.phase}</div>
          <div class="kc-desc">{kc.desc}</div>
          <div class="kc-ttps">{kc.ttps.join(' · ')}</div>
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
          <div class="ac-notes">{a.notes}</div>
        </div>
      {/each}
    </div>
  </section>

  <!-- ATT&CK quick ref -->
  <section class="intel-section">
    <h2 class="is-hd">ATT&amp;CK Techniques ({ATTACK.length})</h2>
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

  <!-- IOC taxonomy -->
  <section class="intel-section">
    <h2 class="is-hd">IOC Taxonomy &amp; Hunting Notes</h2>
    <div class="ioc-table">
      <div class="ioc-head"><span>Type</span><span>Description</span><span>Example</span><span>Source</span></div>
      {#each IOCS as ioc}
        <div class="ioc-row">
          <span class="ioc-type">{ioc.type}</span>
          <span class="ioc-desc">
            {ioc.desc}
            <div class="ioc-hunt">{ioc.hunt}</div>
          </span>
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
      {#each [['sigma','Sigma (LSASS)'],['sigma2','Sigma (CS Pipe)'],['yara','YARA (CS)'],['yara2','YARA (Emotet)'],['suricata','Suricata']] as [k,label]}
        <button class="rtab" class:active={ruleView === k} on:click={() => ruleView = k}>
          {label}
        </button>
      {/each}
    </div>
    <pre class="rule-block"><code>{RULES[ruleView]}</code></pre>
    <div class="rule-note">
      {#if ruleView === 'sigma' || ruleView === 'sigma2'}
        Convert to your platform: <code>sigma convert -t splunk {ruleView}.yml</code> or <code>sigma convert -t elastic {ruleView}.yml</code>
      {:else if ruleView === 'yara' || ruleView === 'yara2'}
        Test rule: <code>yara -r {ruleView}.yar /path/to/samples/</code> — always validate FP rate against clean corpus
      {:else}
        Load into Suricata: <code>suricata -c suricata.yaml --rule-files=custom.rules -r cap.pcap -l /logs/</code>
      {/if}
    </div>
  </section>

  <!-- Flag challenges -->
  <section class="intel-section">
    <h2 class="is-hd">Flag Challenges — prove you read the brief</h2>
    <div class="intel-challenges">
      {#each INTEL_CHALS as chal, i}
        {@const key = `intel_${i}`}
        {@const got = !!solvedFlags[key]}
        <div class="chal" class:chal-solved={got}>
          <div class="chal-q"><span class="chal-num">{i + 1}.</span> {chal.q}</div>
          {#if got}
            <div class="chal-solved-row">
              <span class="chal-icon">✓</span>
              <code class="chal-flag">BV{'{'}{chal.flag}{'}'}</code>
            </div>
          {:else}
            <form class="chal-form" on:submit|preventDefault={() => submitChal(i, chal.flag)}>
              <input
                class="chal-input"
                type="text"
                placeholder={'BV{...}'}
                autocomplete="off"
                spellcheck="false"
                bind:value={inputs[key]}
              />
              <button class="chal-submit" type="submit">Submit</button>
            </form>
            {#if wrong[key]}<div class="chal-wrong">Incorrect — re-check the sections above.</div>{/if}
          {/if}
        </div>
      {/each}
    </div>
  </section>

</main>

<style>
  .topstrip {
    position: sticky; top: 0;
    background: color-mix(in srgb, var(--panel) 85%, transparent);
    backdrop-filter: blur(6px);
    border-bottom: 1px solid var(--line);
    padding: 10px 28px; font-size: 11px; font-weight: 700; letter-spacing: .1em; color: var(--ash);
    display: flex; justify-content: space-between;
    z-index: 10;
  }
  .ts-right { color: var(--purple); }
  .page { padding: 28px; flex: 1; }

  .page-intro {
    background: var(--panel); border: 1px solid var(--line); border-radius: var(--rad);
    padding: 28px 32px; margin-bottom: 28px;
  }
  .page-intro h1 { font-size: 20px; font-weight: 700; color: var(--bone); margin-bottom: 10px; }
  .page-intro p { font-size: 14px; color: var(--ash); line-height: 1.6; margin-bottom: 16px; }
  .intro-pbar { height: 4px; background: var(--line2); border-radius: 2px; overflow: hidden; margin-bottom: 6px; }
  .intro-pfill { height: 100%; background: var(--purple); border-radius: 2px; transition: width .5s ease; box-shadow: 0 0 14px color-mix(in srgb, var(--purple) 30%, transparent); }
  .intro-plabel { font-size: 11px; color: var(--ash); letter-spacing: .04em; }

  .intel-section { margin-bottom: 44px; }
  .is-hd { font-size: 16px; font-weight: 700; color: var(--bone); margin-bottom: 16px; letter-spacing: -.01em; }

  /* Kill Chain */
  .kc-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
  .kc-item {
    background: var(--panel); border: 1px solid var(--line);
    border-radius: var(--rad); padding: 14px 10px; text-align: center;
  }
  .kc-n { font-family: var(--mono); font-size: 10px; color: var(--volt); margin-bottom: 4px; }
  .kc-icon { font-size: 18px; margin-bottom: 5px; }
  .kc-phase { font-size: 10px; font-weight: 700; color: var(--bone); margin-bottom: 5px; }
  .kc-desc { font-size: 9px; color: var(--ash); line-height: 1.4; margin-bottom: 6px; }
  .kc-ttps { font-family: var(--mono); font-size: 8px; color: var(--dim); line-height: 1.4; }

  /* ATT&CK table */
  .attack-table { background: var(--panel); border: 1px solid var(--line); border-radius: var(--rad); overflow: hidden; max-height: 420px; overflow-y: auto; }
  .at-head, .at-row {
    display: grid; grid-template-columns: 110px 1fr 160px;
    padding: 9px 16px; gap: 16px;
    border-bottom: 1px solid var(--line);
  }
  .at-row:last-child { border-bottom: none; }
  .at-head { background: var(--panel2); font-size: 10px; font-weight: 700; color: var(--ash); letter-spacing: .08em; text-transform: uppercase; position: sticky; top: 0; }
  .at-row:hover { background: var(--panel2); }
  .at-id { font-family: var(--mono); font-size: 11px; color: var(--volt); }
  .at-name { font-size: 12px; color: var(--bone); }
  .at-tactic { font-size: 11px; color: var(--ash); }

  /* Actors */
  .actor-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .actor-card {
    background: var(--panel); border: 1px solid var(--line);
    border-radius: var(--rad); padding: 18px;
  }
  .ac-name { font-size: 13px; font-weight: 700; color: var(--bone); margin-bottom: 8px; }
  .ac-meta { font-size: 12px; color: var(--ash); margin-bottom: 3px; }
  .ac-lbl { color: var(--dim); font-size: 10px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; margin-right: 4px; }
  .ac-ttps { margin-top: 8px; font-family: var(--mono); font-size: 10px; color: var(--volt); line-height: 1.5; }
  .ac-notes { margin-top: 8px; font-size: 11px; color: var(--ash); line-height: 1.55; border-top: 1px solid var(--line); padding-top: 8px; }

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
  .ioc-desc { color: var(--ash); }
  .ioc-hunt { font-size: 10px; color: var(--dim); margin-top: 4px; line-height: 1.4; }
  .ioc-fmt { font-family: var(--mono); color: var(--bone); font-size: 11px; }
  .ioc-src { font-size: 11px; color: var(--ash); }

  /* Detection rules */
  .rule-tabs { display: flex; gap: 1px; margin-bottom: 0; background: var(--line); border-radius: var(--rad) var(--rad) 0 0; overflow: hidden; width: fit-content; flex-wrap: wrap; }
  .rtab {
    padding: 8px 14px; background: var(--panel2);
    border: none; cursor: pointer;
    font-size: 11px; font-weight: 700; color: var(--ash);
    letter-spacing: .05em; transition: background .15s, color .15s;
  }
  .rtab:hover { color: var(--bone); }
  .rtab.active { background: var(--panel3); color: var(--volt); }
  .rule-block {
    background: var(--panel3); border: 1px solid var(--line);
    border-top: none; border-radius: 0 var(--rad) var(--rad) var(--rad);
    padding: 20px 24px; overflow-x: auto; margin-bottom: 0;
  }
  .rule-block code { font-family: var(--mono); font-size: 12px; color: var(--volt); line-height: 1.6; }
  .rule-note {
    background: color-mix(in srgb, var(--volt) 5%, transparent);
    border: 1px solid color-mix(in srgb, var(--volt) 15%, transparent);
    border-top: none; border-radius: 0 0 var(--rad) var(--rad);
    padding: 10px 20px; font-size: 12px; color: var(--ash);
  }
  .rule-note code { font-family: var(--mono); color: var(--volt); font-size: 11px; }

  /* Flag challenges */
  .intel-challenges {
    background: color-mix(in srgb, var(--amber) 5%, transparent);
    border: 1px solid color-mix(in srgb, var(--amber) 20%, transparent);
    border-radius: var(--rad); padding: 16px 18px;
    display: flex; flex-direction: column; gap: 14px;
  }
  .chal {
    border-top: 1px solid color-mix(in srgb, var(--amber) 14%, transparent);
    padding-top: 12px;
  }
  .chal:first-of-type { border-top: none; padding-top: 0; }
  .chal-q { font-size: 13px; color: var(--ash); line-height: 1.6; margin-bottom: 8px; }
  .chal-num { color: var(--amber); font-weight: 700; margin-right: 2px; }

  .chal-form { display: flex; gap: 8px; }
  .chal-input {
    flex: 1; min-width: 0;
    background: var(--void); border: 1px solid var(--line);
    color: var(--bone); font-family: var(--mono); font-size: 12px;
    padding: 8px 10px; border-radius: var(--rad);
    transition: border-color .15s;
  }
  .chal-input:focus { outline: none; border-color: var(--volt); }
  .chal-submit {
    padding: 8px 18px;
    background: color-mix(in srgb, var(--volt) 10%, transparent);
    border: 1px solid color-mix(in srgb, var(--volt) 30%, transparent);
    color: var(--volt); border-radius: var(--rad);
    font-size: 13px; font-weight: 600; cursor: pointer;
    transition: background .15s; flex-shrink: 0;
  }
  .chal-submit:hover { background: color-mix(in srgb, var(--volt) 18%, transparent); }
  .chal-wrong { font-size: 12px; color: var(--blood); margin-top: 6px; }

  .chal-solved-row { display: flex; align-items: center; gap: 8px; }
  .chal-icon { color: var(--volt); font-weight: 700; }
  .chal-flag {
    font-family: var(--mono); font-size: 12px; color: var(--volt);
    background: color-mix(in srgb, var(--volt) 8%, transparent);
    border: 1px solid color-mix(in srgb, var(--volt) 20%, transparent);
    padding: 4px 10px; border-radius: 3px;
  }

  @media (max-width: 1100px) {
    .kc-grid { grid-template-columns: repeat(4, 1fr); }
    .actor-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 700px) {
    .at-head, .at-row { grid-template-columns: 90px 1fr; }
    .at-tactic { display: none; }
    .ioc-head, .ioc-row { grid-template-columns: 60px 1fr; }
    .ioc-fmt, .ioc-src { display: none; }
  }
</style>
