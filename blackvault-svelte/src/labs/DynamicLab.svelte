<script>
  import { progress, setObj, toast } from '../stores/progress.js';

  const RAW = [
    ['08:00:01', 'CreateFileW("C:\\Users\\v\\AppData\\Local\\Temp\\svc.exe", GENERIC_WRITE)', null],
    ['08:00:01', 'WriteFile(svc.exe, 86016 bytes)', null],
    ['08:00:02', 'RegSetValueExW(HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\Updater = svc.exe)', 'persist'],
    ['08:00:03', 'OpenProcess(PROCESS_ALL_ACCESS, pid=812 explorer.exe)', null],
    ['08:00:03', 'VirtualAllocEx(pid=812, 0x4000, RWX)', 'inject'],
    ['08:00:03', 'WriteProcessMemory(pid=812, shellcode)', 'inject'],
    ['08:00:03', 'CreateRemoteThread(pid=812, start=0x...)', 'inject'],
    ['08:00:05', 'DnsQuery_A("cdn-telemetry.xyz")', 'c2'],
    ['08:00:05', 'connect(185.220.101.47:443)', 'c2'],
    ['08:00:12', 'CryptEncrypt(loop over C:\\Users\\v\\Documents\\*.docx)', 'impact'],
    ['08:00:40', 'CreateFileW("READ_ME.vault.txt", GENERIC_WRITE)', 'impact'],
  ].map(([t, text, key]) => ({ t, text, key }));

  let filter = '';
  $: rows = RAW.filter(l => !filter || l.text.toLowerCase().includes(filter.toLowerCase()));

  $: done = $progress.labs?.dynamic || {};
  const LABELS = { persist: 'persistence', inject: 'injection technique', c2: 'C2 endpoint', impact: 'impact' };

  function clickLine(l) {
    if (l.key) {
      setObj('dynamic', l.key, progress);
      toast('✓ flagged as ' + LABELS[l.key]);
    } else {
      toast('not one of the four behaviours we\'re tracking');
    }
  }
</script>

<p class="lede" style="margin-top:0">The sandbox ran it. Click each call that demonstrates persistence, injection, C2, or impact.</p>
<div class="filterbar"><input autocomplete="off" placeholder="filter the trace:  Reg   ·   Process   ·   connect   ·   Crypt" bind:value={filter}></div>
<div class="logview">
  {#each rows as l}
    <div class="hexbyte" data-hit={l.key && done[l.key] ? 1 : 0} on:click={() => clickLine(l)}>{l.t}  {l.text}</div>
  {/each}
</div>
<div class="objbox" style="margin-top:16px">
  <h4>Objectives found</h4>
  <div class="findform">
    {#each Object.entries(LABELS) as [key, label]}
      <div><label>{label}</label><span class={done[key] ? 'tag-ok' : 'dim'}>{done[key] ? '✓ flagged' : 'click the matching call above'}</span></div>
    {/each}
  </div>
</div>
<div class="hintbox"><b>Pattern recognition:</b> Run-key write = persistence; VirtualAllocEx→WriteProcessMemory→CreateRemoteThread into another PID = classic process injection; connect() to a hardcoded IP = C2; CryptEncrypt over user docs + a ransom note = impact (ransomware).</div>
