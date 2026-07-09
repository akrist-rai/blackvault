<script>
  import { progress, setObj, toast } from '../stores/progress.js';

  const IOCTYPES = ['domain', 'ipv4', 'md5', 'email', 'mutex'];
  const TTPOPTS = ['T1566 Phishing', 'T1059 Command & Scripting Interpreter', 'T1071 Application Layer Protocol', 'T1486 Data Encrypted for Impact', 'T1110 Brute Force'];

  // Each panel: raw text with embedded IOC tokens (clickable) + one behavior line to map to ATT&CK.
  const PANELS = [
    { id: 'email', label: 'Email evidence',
      pre: 'Subject: Overdue invoice\nFrom: billing@inv0ice-corp.com\nAttachment: invoice.xlsm (macro-enabled)\n\nRansom note left later points victims to: ',
      ioc: 'attacker@protonmail.com', type: 'email', post: '',
      behavior: 'User opened a malicious xlsm attachment', technique: 'T1566 Phishing' },
    { id: 'process', label: 'Process evidence',
      pre: 'excel.exe → powershell.exe -nop -w hidden -enc ...\n\nDropped payload, hash: ',
      ioc: '5f4dcc3b5aa765d61d8327deb882cf99', type: 'md5', post: '',
      behavior: 'Macro launched powershell.exe', technique: 'T1059 Command & Scripting Interpreter' },
    { id: 'network', label: 'Network evidence',
      pre: 'GET /gate.php HTTP/1.1\nHost: ',
      ioc: 'updates-cdn.xyz', type: 'domain',
      post: '\nresolved to ',
      ioc2: '45.133.1.88', type2: 'ipv4',
      post2: ' — beacon repeats every 60s',
      behavior: 'HTTP beacon to C2 every 60s', technique: 'T1071 Application Layer Protocol' },
    { id: 'host', label: 'Host evidence',
      pre: 'File shares: *.docx → *.vault (encrypted)\nREAD_ME.vault.txt dropped in every folder', post: '',
      behavior: 'File shares encrypted + ransom note', technique: 'T1486 Data Encrypted for Impact' },
  ];

  let open = {};
  let iocSel = {};   // ioc value -> chosen type
  let ttpSel = {};   // panel id -> chosen technique
  let iocsDone = false, attackDone = false;

  function toggle(id) { open[id] = !open[id]; }

  function classify(ioc, expected, chosen) {
    iocSel[ioc] = chosen;
    const need = [];
    PANELS.forEach(p => { if (p.ioc) need.push([p.ioc, p.type]); if (p.ioc2) need.push([p.ioc2, p.type2]); });
    const ok = need.every(([v, t]) => iocSel[v] === t);
    if (ok && !iocsDone) { iocsDone = true; setObj('intel', 'iocs', progress); }
    else if (!ok && chosen && chosen !== expected) toast('not quite — look at the value\'s shape again');
  }
  function mapTtp(panel, chosen) {
    ttpSel[panel.id] = chosen;
    const ok = PANELS.every(p => ttpSel[p.id] === p.technique);
    if (ok && !attackDone) { attackDone = true; setObj('intel', 'attack', progress); }
    else if (chosen && chosen !== panel.technique) toast('re-read the behaviour — which ATT&CK technique actually matches?');
  }
</script>

<p class="lede" style="margin-top:0">Open each piece of evidence, click the IOC inside it to classify it, and map its behaviour to ATT&CK.</p>

{#each PANELS as p}
  <div class="evidence" data-open={open[p.id] ? 1 : 0} on:click={() => !open[p.id] && toggle(p.id)}>
    <div class="evidence__label">{p.label} {open[p.id] ? '▾' : '▸ click to open'}</div>
    {#if open[p.id]}
      <div class="evidence__body">{p.pre}{#if p.ioc}<span class="xreflink" on:click|stopPropagation={() => {}}>{p.ioc}</span> <select class="lab-sel" bind:value={iocSel[p.ioc]} on:change={() => classify(p.ioc, p.type, iocSel[p.ioc])} on:click|stopPropagation><option value="">—</option>{#each IOCTYPES as t}<option value={t}>{t}</option>{/each}</select>{/if}{p.post}{#if p.ioc2}<span class="xreflink" on:click|stopPropagation={() => {}}>{p.ioc2}</span> <select class="lab-sel" bind:value={iocSel[p.ioc2]} on:change={() => classify(p.ioc2, p.type2, iocSel[p.ioc2])} on:click|stopPropagation><option value="">—</option>{#each IOCTYPES as t}<option value={t}>{t}</option>{/each}</select>{/if}{p.post2 || ''}</div>
      <div class="evidence__extract">
        <span class="dim">behaviour:</span> {p.behavior}
        <select class="lab-sel" bind:value={ttpSel[p.id]} on:change={() => mapTtp(p, ttpSel[p.id])} on:click|stopPropagation>
          <option value="">— map to ATT&CK —</option>
          {#each TTPOPTS as t}<option value={t}>{t}</option>{/each}
        </select>
      </div>
    {/if}
  </div>
{/each}

<div class="hintbox"><b>Why this is the daily job:</b> turning a messy report into structured IOCs (for blocking/hunting) and ATT&CK techniques (for detection coverage) is most of what a CTI/SOC analyst actually produces.</div>
