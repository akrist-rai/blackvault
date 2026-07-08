<script>
  import { progress, setObj, toast } from '../stores/progress.js';

  const INTEL = {
    narrative: 'A finance user opened "invoice.xlsm" from an email. A macro spawned powershell.exe, which beaconed over HTTP to updates-cdn.xyz/gate.php every 60 seconds. Operators then encrypted file shares (.vault extension) and dropped a ransom note pointing to attacker@protonmail.com. Outbound traffic went to 45.133.1.88. The dropper md5 was 5f4dcc3b5aa765d61d8327deb882cf99.',
    iocs: [['updates-cdn.xyz', 'domain'], ['45.133.1.88', 'ipv4'], ['5f4dcc3b5aa765d61d8327deb882cf99', 'md5'], ['attacker@protonmail.com', 'email']],
    ioctypes: ['domain', 'ipv4', 'md5', 'email', 'mutex'],
    ttps: [['User opened a malicious xlsm attachment', 'T1566 Phishing'], ['Macro launched powershell.exe', 'T1059 Command & Scripting Interpreter'], ['HTTP beacon to C2 every 60s', 'T1071 Application Layer Protocol'], ['File shares encrypted + ransom note', 'T1486 Data Encrypted for Impact']],
    ttpopts: ['T1566 Phishing', 'T1059 Command & Scripting Interpreter', 'T1071 Application Layer Protocol', 'T1486 Data Encrypted for Impact', 'T1110 Brute Force'],
  };

  let iocSel = {};
  let ttpSel = {};

  function checkIocs() {
    let ok = true;
    INTEL.iocs.forEach((x, i) => { if (iocSel[i] !== x[1]) ok = false; });
    if (ok) setObj('intel', 'iocs', progress); else toast('check each IOC type — domain vs ipv4 vs md5 vs email');
  }
  function checkTtps() {
    let ok = true;
    INTEL.ttps.forEach((x, i) => { if (ttpSel[i] !== x[1]) ok = false; });
    if (ok) setObj('intel', 'attack', progress); else toast('re-map the ATT&CK techniques to the behaviours');
  }
</script>

<div class="pktdetail">{INTEL.narrative}</div>
<h4 style="font-family:var(--mono);color:var(--volt);font-size:11px;letter-spacing:.2em;margin-top:18px">1 · CLASSIFY IOCs</h4>
<table class="kv">
  <tbody>
  {#each INTEL.iocs as x, i}
    <tr><td style="word-break:break-all">{x[0]}</td>
      <td><select class="lab-sel" bind:value={iocSel[i]}><option value="">—</option>{#each INTEL.ioctypes as t}<option value={t}>{t}</option>{/each}</select></td>
    </tr>
  {/each}
  </tbody>
</table>
<div style="margin-top:10px"><button class="btn" on:click={checkIocs}>Check IOCs</button></div>

<h4 style="font-family:var(--mono);color:var(--volt);font-size:11px;letter-spacing:.2em;margin-top:22px">2 · MAP TO ATT&CK</h4>
<table class="kv">
  <tbody>
  {#each INTEL.ttps as x, i}
    <tr><td>{x[0]}</td>
      <td><select class="lab-sel" bind:value={ttpSel[i]}><option value="">—</option>{#each INTEL.ttpopts as t}<option value={t}>{t}</option>{/each}</select></td>
    </tr>
  {/each}
  </tbody>
</table>
<div style="margin-top:10px"><button class="btn" on:click={checkTtps}>Check mapping</button></div>
<div class="hintbox"><b>Why this is the daily job:</b> turning a messy report into structured IOCs (for blocking/hunting) and ATT&CK techniques (for detection coverage) is most of what a CTI/SOC analyst actually produces.</div>
