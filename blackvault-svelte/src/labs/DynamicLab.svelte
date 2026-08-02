<script>
  import { tick } from 'svelte';
  import { progress, setObj, toast } from '../stores/progress.js';

  // ── Rich API trace data ───────────────────────────────────────────────────
  const TRACE = [
    { t: '08:00:01.003', pid: 2740, proc: 'dropper.exe',  cat: 'FILE', api: 'NtCreateFile',           args: 'DesiredAccess=GENERIC_WRITE  Path="C:\\Users\\v\\AppData\\Local\\Temp\\svc.exe"',      ret: 'STATUS_SUCCESS',  key: null },
    { t: '08:00:01.009', pid: 2740, proc: 'dropper.exe',  cat: 'FILE', api: 'NtWriteFile',             args: 'Handle=0x2c  Length=86016  (PE image)',                                               ret: 'STATUS_SUCCESS',  key: null },
    { t: '08:00:01.041', pid: 2740, proc: 'dropper.exe',  cat: 'FILE', api: 'NtSetInformationFile',    args: 'FileBasicInformation  CreationTime=2019-03-12T00:00:00 (timestomping)',                ret: 'STATUS_SUCCESS',  key: null },
    { t: '08:00:02.110', pid: 2740, proc: 'dropper.exe',  cat: 'REG',  api: 'NtSetValueKey',           args: 'Key=HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run  Value="Updater"="C:\\Users\\v\\AppData\\Local\\Temp\\svc.exe"', ret: 'STATUS_SUCCESS',  key: 'persist',
      mitre: 'T1547.001 · Boot/Logon AutoStart — Registry Run Key' },
    { t: '08:00:03.002', pid: 2740, proc: 'dropper.exe',  cat: 'PROC', api: 'NtOpenProcess',           args: 'DesiredAccess=PROCESS_ALL_ACCESS  PID=812  (explorer.exe)',                           ret: 'STATUS_SUCCESS',  key: null },
    { t: '08:00:03.018', pid: 2740, proc: 'dropper.exe',  cat: 'PROC', api: 'NtAllocateVirtualMemory', args: 'TargetPID=812  Size=0x4000  Protect=PAGE_EXECUTE_READWRITE',                          ret: 'BaseAddress=0x009a0000',  key: 'inject',
      mitre: 'T1055.001 · Process Injection — Dynamic-link Library' },
    { t: '08:00:03.021', pid: 2740, proc: 'dropper.exe',  cat: 'PROC', api: 'NtWriteVirtualMemory',    args: 'TargetPID=812  BaseAddress=0x009a0000  Buffer=[shellcode 0x4000 bytes]',              ret: 'STATUS_SUCCESS',  key: 'inject' },
    { t: '08:00:03.025', pid: 2740, proc: 'dropper.exe',  cat: 'PROC', api: 'NtCreateThreadEx',        args: 'TargetPID=812  StartRoutine=0x009a0000  (RWX region)',                               ret: 'ThreadId=0x12f4',  key: 'inject' },
    { t: '08:00:03.400', pid: 812,  proc: 'explorer.exe', cat: 'FILE', api: 'NtCreateFile',            args: 'Path="C:\\Windows\\System32\\ws2_32.dll"  (loading network libs)',                    ret: 'STATUS_SUCCESS',  key: null },
    { t: '08:00:05.201', pid: 812,  proc: 'explorer.exe', cat: 'NET',  api: 'DnsQuery_A',              args: 'Name="cdn-telemetry.xyz"  Type=A',                                                   ret: '185.220.101.47',   key: 'c2',
      mitre: 'T1071.004 · Application Layer Protocol — DNS' },
    { t: '08:00:05.330', pid: 812,  proc: 'explorer.exe', cat: 'NET',  api: 'WSAConnect',              args: 'RemoteAddr=185.220.101.47:443  (TLS beacon)',                                         ret: 'SOCKET_ERROR=0',  key: 'c2',
      mitre: 'T1071.001 · Application Layer Protocol — Web' },
    { t: '08:00:06.110', pid: 812,  proc: 'explorer.exe', cat: 'NET',  api: 'send',                    args: 'Socket=0x7c  Buf=[HTTP POST /beacon  host: cdn-telemetry.xyz]  Len=512',              ret: '512',              key: null },
    { t: '08:00:06.480', pid: 812,  proc: 'explorer.exe', cat: 'NET',  api: 'recv',                    args: 'Socket=0x7c  Buf=[C2 taskings]  Len=128',                                             ret: '128',              key: null },
    { t: '08:00:12.001', pid: 812,  proc: 'explorer.exe', cat: 'CRYPTO','api': 'CryptAcquireContext',  args: 'Provider=MS_ENH_RSA_AES_PROV  AlgId=CALG_AES_256',                                   ret: 'TRUE',             key: 'impact',
      mitre: 'T1486 · Data Encrypted for Impact' },
    { t: '08:00:12.440', pid: 812,  proc: 'explorer.exe', cat: 'FILE', api: 'NtQueryDirectoryFile',    args: 'Path="C:\\Users\\v\\Documents\\*.docx"  (enumerating target files)',                  ret: '27 files',         key: null },
    { t: '08:00:13.002', pid: 812,  proc: 'explorer.exe', cat: 'CRYPTO','api': 'CryptEncrypt',         args: 'hKey=0x88  hHash=0  Final=TRUE  File="C:\\Users\\v\\Documents\\Q1_2026.docx"',        ret: 'TRUE',             key: 'impact' },
    { t: '08:00:40.190', pid: 812,  proc: 'explorer.exe', cat: 'FILE', api: 'NtCreateFile',            args: 'Path="C:\\Users\\v\\Desktop\\READ_ME.vault.txt"  Access=GENERIC_WRITE',              ret: 'STATUS_SUCCESS',  key: 'impact' },
    { t: '08:00:40.210', pid: 812,  proc: 'explorer.exe', cat: 'FILE', api: 'NtWriteFile',             args: 'Content="YOUR FILES HAVE BEEN ENCRYPTED. Send 0.3 BTC to..."',                       ret: 'STATUS_SUCCESS',  key: null },
    { t: '08:00:41.008', pid: 812,  proc: 'explorer.exe', cat: 'REG',  api: 'NtDeleteKey',             args: 'Key=HKLM\\SYSTEM\\CurrentControlSet\\Services\\EventLog  (log wipe attempt)',         ret: 'STATUS_ACCESS_DENIED', key: null },
    { t: '08:00:42.000', pid: 812,  proc: 'explorer.exe', cat: 'PROC', api: 'NtTerminateProcess',      args: 'PID=2740  (dropper self-destructs)',                                                  ret: 'STATUS_SUCCESS',  key: null },
  ];

  const CAT_COLOR = { FILE: 'dim', REG: 'mn', NET: 'hl', PROC: 'pmt', CRYPTO: 'err' };
  const CAT_LABEL = { FILE: 'FILE ', REG: 'REG  ', NET: 'NET  ', PROC: 'PROC ', CRYPTO: 'CRYPT' };
  const LABEL_MAP = { persist: 'persistence', inject: 'injection technique', c2: 'C2 endpoint', impact: 'impact / payload' };

  function pad(s, n) { s = String(s); return s.length >= n ? s : s + ' '.repeat(n - s.length); }

  const bannner = () => [
    { kind: 'dim', text: 'SandKit v2.1 — isolated VM detonation. Sample: dropper.exe (sha256: 3f4a…)' },
    { kind: 'dim', text: 'Image: Windows 10 x64 22H2 · 8 GB RAM · No network (simulated)' },
    { kind: 'dim', text: 'Type help for commands. Click any MITRE-tagged line for technique detail.' },
    { kind: '', text: '' },
  ];

  let lines = bannner();
  let cmdVal = '';
  let outEl;
  let selectedMitre = null;

  async function scrollDown() { await tick(); if (outEl) outEl.scrollTop = outEl.scrollHeight; }

  function pushTrace(push, rows) {
    push('dim', pad('TIME       ', 12) + pad('PID  PROC', 22) + pad('CAT  ', 7) + 'API + ARGS');
    push('dim', '─'.repeat(110));
    rows.forEach(r => {
      const prefix = pad(r.t, 12) + pad(r.pid + ' ' + r.proc, 22) + pad(CAT_LABEL[r.cat], 7);
      push(CAT_COLOR[r.cat], prefix + r.api + '(' + r.args.slice(0, 60) + (r.args.length > 60 ? '…' : '') + ')  → ' + r.ret);
      if (r.mitre) push('dim', ' '.repeat(41) + '↳ ' + r.mitre);
    });
  }

  function run(raw) {
    const c = raw.trim();
    if (!c) return;
    const out = [{ kind: 'cmd', text: c }];
    const push = (kind, text) => out.push({ kind, text });
    const parts = c.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ').toLowerCase();

    if (cmd === 'help') {
      ['commands',
       '  trace                  full API call log (20 calls)',
       '  ps                     process list at time of detonation',
       '  filter <term>          filter trace: reg | net | proc | crypto | inject | beacon',
       '  detail <api_name>      show full arguments for an API call',
       '  report                 generate behavioral summary + ATT&CK mapping',
       '  clear                  clear screen',
      ].forEach((t, i) => push(i === 0 ? 'dim' : '', t));
    } else if (cmd === 'ps') {
      push('dim', pad('PID', 7) + pad('PPID', 7) + pad('Process', 20) + pad('Start', 12) + 'Image');
      [
        [4,    0,    'System',       '—',         'ntoskrnl.exe'],
        [812,  4,    'explorer.exe', '07:59:10',  'C:\\Windows\\explorer.exe'],
        [2740, 3208, 'dropper.exe',  '08:00:01',  'C:\\Users\\v\\Downloads\\invoice.xlsm.exe'],
      ].forEach(p => push('', pad(p[0], 7) + pad(p[1], 7) + pad(p[2], 20) + pad(p[3], 12) + p[4]));
      push('dim', 'Note: dropper.exe (PID 2740) spawned from an Office macro process — spearphish initial access.');
    } else if (cmd === 'trace') {
      pushTrace(push, TRACE);
    } else if (cmd === 'filter') {
      const cat = arg.toUpperCase();
      const kw  = arg.toLowerCase();
      let rows;
      if (cat === 'REG')    rows = TRACE.filter(r => r.cat === 'REG');
      else if (cat === 'NET')    rows = TRACE.filter(r => r.cat === 'NET');
      else if (cat === 'PROC')   rows = TRACE.filter(r => r.cat === 'PROC');
      else if (cat === 'CRYPTO') rows = TRACE.filter(r => r.cat === 'CRYPTO');
      else if (kw === 'inject')  rows = TRACE.filter(r => r.key === 'inject');
      else if (kw === 'beacon')  rows = TRACE.filter(r => r.key === 'c2');
      else rows = TRACE.filter(r => (r.api + r.args + r.mitre).toLowerCase().includes(kw));
      if (rows.length) pushTrace(push, rows);
      else push('err', 'no matching calls for "' + arg + '"');
      // auto-unlock objectives based on what they filtered
      if (kw === 'reg' || kw === 'inject') setObj('dynamic', 'persist', progress);
      if (kw === 'inject') setObj('dynamic', 'inject', progress);
      if (kw === 'net' || kw === 'beacon') setObj('dynamic', 'c2', progress);
      if (kw === 'crypto') setObj('dynamic', 'impact', progress);
    } else if (cmd === 'detail') {
      const hit = TRACE.find(r => r.api.toLowerCase().includes(arg));
      if (hit) {
        push('hl', hit.api);
        push('', '  Process : ' + hit.pid + ' (' + hit.proc + ')');
        push('', '  Category: ' + hit.cat);
        push('', '  Time    : ' + hit.t);
        push('', '  Args    : ' + hit.args);
        push('', '  Return  : ' + hit.ret);
        if (hit.mitre) { push('mn', '  MITRE   : ' + hit.mitre); }
        if (hit.key) { push('dim', '  → behavioural tag: ' + LABEL_MAP[hit.key]); setObj('dynamic', hit.key, progress); }
      } else push('err', 'API "' + arg + '" not in trace — try: NtSetValueKey, DnsQuery_A, CryptEncrypt, NtAllocateVirtualMemory');
    } else if (cmd === 'report') {
      setObj('dynamic', 'persist', progress);
      setObj('dynamic', 'inject', progress);
      setObj('dynamic', 'c2', progress);
      setObj('dynamic', 'impact', progress);
      push('hl', '══ BEHAVIORAL SUMMARY ══════════════════════════════════════');
      push('', 'Sample     : dropper.exe');
      push('', 'Family     : Ransomware (likely VAULT variant)');
      push('', '');
      push('mn',  'PERSISTENCE     T1547.001 — Run key  HKCU\\…\\Run\\Updater = svc.exe');
      push('pmt', 'INJECTION       T1055.001 — VirtualAllocEx(explorer.exe, RWX) + CreateRemoteThread');
      push('hl',  'C2              T1071.001 — HTTPS beacon to 185.220.101.47 via cdn-telemetry.xyz');
      push('err', 'IMPACT          T1486   — AES-256 encryption of *.docx, ransom note dropped');
      push('dim', 'EVASION         Timestomping (NtSetInformationFile) · Dropper self-delete');
      push('', '');
      push('dim', 'ATT&CK navigator export: T1547.001, T1055.001, T1071.001, T1071.004, T1486');
    } else if (cmd === 'clear') {
      lines = bannner(); cmdVal = ''; scrollDown(); return;
    } else {
      push('err', cmd + ': unknown command — type help');
    }

    out.push({ kind: '', text: '' });
    lines = [...lines, ...out];
    cmdVal = '';
    scrollDown();
  }

  function onKeydown(e) { if (e.key === 'Enter') run(cmdVal); }

  const chips = ['ps', 'trace', 'filter reg', 'filter proc', 'filter net', 'filter crypto', 'detail DnsQuery_A', 'detail CryptEncrypt', 'report'];
</script>

<div class="term">
  <div class="term__out" bind:this={outEl}>
    {#each lines as l}
      {#if l.kind === 'cmd'}
        <div><span class="pmt">sandkit&gt;</span> {l.text}</div>
      {:else if l.kind}
        <div class={l.kind}>{l.text}</div>
      {:else}
        <div>{l.text}</div>
      {/if}
    {/each}
  </div>
  <div class="term__in">
    <span class="pmt">sandkit&gt;</span>
    <div class="term-input-wrapper">
      <input autocomplete="off" spellcheck="false" placeholder="trace · filter net · report · detail <api> …" bind:value={cmdVal} on:keydown={onKeydown}>
    </div>
  </div>
</div>
<div class="qchips">
  {#each chips as c}<button on:click={() => { cmdVal = c; }}>{c}</button>{/each}
</div>
<div class="hintbox"><b>Workflow:</b> start with <code>ps</code> to see what ran, then <code>trace</code> for the full call log, then <code>filter</code> by category to isolate each behaviour. <code>detail &lt;API&gt;</code> shows full parameters and the ATT&amp;CK technique. <code>report</code> generates a behavioral summary. Four behaviors to find: persistence (REG), injection (PROC), C2 (NET), impact (CRYPTO).</div>
