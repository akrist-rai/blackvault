<script>
  import { progress, setObj, toast } from '../stores/progress.js';

  const DYN = [
    'CreateFileW("C:\\Users\\v\\AppData\\Local\\Temp\\svc.exe", GENERIC_WRITE)',
    'WriteFile(svc.exe, 86016 bytes)',
    'RegSetValueExW(HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\Updater = svc.exe)',
    'OpenProcess(PROCESS_ALL_ACCESS, pid=812 explorer.exe)',
    'VirtualAllocEx(pid=812, 0x4000, RWX)',
    'WriteProcessMemory(pid=812, shellcode)',
    'CreateRemoteThread(pid=812, start=0x...)',
    'DnsQuery_A("cdn-telemetry.xyz")',
    'connect(185.220.101.47:443)',
    'CryptEncrypt(loop over C:\\Users\\v\\Documents\\*.docx)',
    'CreateFileW("READ_ME.vault.txt", GENERIC_WRITE)',
  ].map((t, i) => ({ t: ['08:00:01', '08:00:01', '08:00:02', '08:00:03', '08:00:03', '08:00:03', '08:00:03', '08:00:05', '08:00:05', '08:00:12', '08:00:40'][i] + '  ' + t }));

  let filter = '';
  $: rows = DYN.filter(l => !filter || l.t.toLowerCase().includes(filter.toLowerCase()));
  function isBad(l) { return /Run\\|RegSetValue|VirtualAllocEx|WriteProcessMemory|CreateRemoteThread|connect|CryptEncrypt/.test(l); }

  let dy_p = '', dy_i = '', dy_c = '', dy_x = '';
  function checkFindings() {
    if (/run|registry|reg key/i.test(dy_p)) setObj('dynamic', 'persist', progress); else if (dy_p) toast('which API writes an autostart entry?');
    if (/inject|remote thread|createremotethread|process inject/i.test(dy_i)) setObj('dynamic', 'inject', progress); else if (dy_i) toast('VirtualAllocEx+WriteProcessMemory+CreateRemoteThread = ?');
    if (/185\.220\.101\.47|cdn-telemetry/i.test(dy_c)) setObj('dynamic', 'c2', progress); else if (dy_c) toast('the connect()/DnsQuery target');
    if (/encrypt|ransom|cryptencrypt/i.test(dy_x)) setObj('dynamic', 'impact', progress); else if (dy_x) toast('CryptEncrypt over *.docx + .vault note = ?');
  }
</script>

<p class="lede" style="margin-top:0">The sandbox ran it. Read the API trace and name each behaviour.</p>
<div class="filterbar"><input autocomplete="off" placeholder="filter the trace:  Reg   ·   Process   ·   connect   ·   Crypt" bind:value={filter}></div>
<div class="logview">
  {#each rows as l}<div class={isBad(l.t) ? 'hit' : ''}>{l.t}</div>{/each}
</div>
<div class="objbox" style="margin-top:16px">
  <h4>Submit findings</h4>
  <div class="findform">
    <div><label>Persistence</label><input placeholder="mechanism" bind:value={dy_p}></div>
    <div><label>Injection technique</label><input placeholder="technique" bind:value={dy_i}></div>
    <div><label>C2 endpoint</label><input placeholder="ip / domain" bind:value={dy_c}></div>
    <div><label>Impact / payload</label><input placeholder="what it does" bind:value={dy_x}></div>
  </div>
  <div style="margin-top:10px"><button class="btn" on:click={checkFindings}>Check findings</button></div>
</div>
<div class="hintbox"><b>Pattern recognition:</b> Run-key write = persistence; VirtualAllocEx→WriteProcessMemory→CreateRemoteThread into another PID = classic process injection; connect() to a hardcoded IP = C2; CryptEncrypt over user docs + a ransom note = impact (ransomware).</div>
