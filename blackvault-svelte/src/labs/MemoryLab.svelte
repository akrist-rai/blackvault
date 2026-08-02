<script>
  import { tick } from 'svelte';
  import { progress, setObj, toast } from '../stores/progress.js';

  // ── Memory image data ─────────────────────────────────────────────────────
  const PS = [
    { pid:  4,    ppid: 0,    name: 'System',       thr: 138, cpu: '0.0', start: '08:21:01', path: '[System]' },
    { pid: 372,   ppid: 4,    name: 'smss.exe',      thr: 2,   cpu: '0.0', start: '08:21:04', path: 'C:\\Windows\\System32\\smss.exe' },
    { pid: 604,   ppid: 0,    name: 'wininit.exe',   thr: 1,   cpu: '0.0', start: '08:21:06', path: 'C:\\Windows\\System32\\wininit.exe' },
    { pid: 680,   ppid: 604,  name: 'services.exe',  thr: 6,   cpu: '0.0', start: '08:21:07', path: 'C:\\Windows\\System32\\services.exe' },
    { pid: 772,   ppid: 680,  name: 'svchost.exe',   thr: 18,  cpu: '0.1', start: '08:21:07', path: 'C:\\Windows\\System32\\svchost.exe' },
    { pid: 1188,  ppid: 680,  name: 'svchost.exe',   thr: 24,  cpu: '0.2', start: '08:21:08', path: 'C:\\Windows\\System32\\svchost.exe' },
    { pid: 1620,  ppid: 604,  name: 'lsass.exe',     thr: 9,   cpu: '0.1', start: '08:21:08', path: 'C:\\Windows\\System32\\lsass.exe' },
    { pid: 2904,  ppid: 2880, name: 'explorer.exe',  thr: 58,  cpu: '1.2', start: '08:24:11', path: 'C:\\Windows\\explorer.exe' },
    { pid: 3460,  ppid: 2904, name: 'chrome.exe',    thr: 31,  cpu: '4.1', start: '08:25:02', path: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' },
  ];

  // pid 3133 is the DKOM-hidden process — only in psscan
  const PSSCAN_EXTRA = { pid: 3133, ppid: 2904, name: 'svchost.exe', thr: 7, cpu: '—', start: '09:47:55', path: 'C:\\Users\\victim\\AppData\\Local\\Temp\\svch0st.exe' };

  const VADS = {
    3133: [
      { base: '0x009a0000', end: '0x009a3fff', prot: 'PAGE_EXECUTE_READWRITE', type: 'Private',      mapped: '—',               suspicious: true },
      { base: '0x00100000', end: '0x0017ffff', prot: 'PAGE_READONLY',          type: 'Image-backed', mapped: 'ntdll.dll',        suspicious: false },
      { base: '0x77a00000', end: '0x77b5ffff', prot: 'PAGE_READONLY',          type: 'Image-backed', mapped: 'kernel32.dll',     suspicious: false },
    ],
    default: [
      { base: '0x00100000', end: '0x0017ffff', prot: 'PAGE_READONLY',          type: 'Image-backed', mapped: 'ntdll.dll',        suspicious: false },
      { base: '0x77a00000', end: '0x77b5ffff', prot: 'PAGE_READONLY',          type: 'Image-backed', mapped: 'kernel32.dll',     suspicious: false },
    ],
  };

  const NET = [
    { proto: 'TCPv4', local: '10.0.2.15:49677', remote: '13.107.42.14:443',     state: 'ESTABLISHED', pid: 3460 },
    { proto: 'TCPv4', local: '10.0.2.15:445',   remote: '0.0.0.0:0',            state: 'LISTENING',   pid: 4    },
    { proto: 'TCPv4', local: '10.0.2.15:50331', remote: '185.220.101.47:443',   state: 'ESTABLISHED', pid: 3133 },
    { proto: 'UDPv4', local: '10.0.2.15:138',   remote: '*:*',                  state: '—',           pid: 772  },
  ];

  const CMDLINES = {
    3460: '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --type=renderer',
    3133: '"C:\\Users\\victim\\AppData\\Local\\Temp\\svch0st.exe" -silent -k netsvcs',
    2904: 'C:\\Windows\\explorer.exe',
  };

  const STRINGS_3133 = [
    'svch0st.exe', 'Global\\BV-7f3a-MTX (mutex)',
    'cdn-telemetry.xyz', '185.220.101.47',
    'User-Agent: Mozilla/5.0 (compatible; bvbot/1.0)',
    'GET /x.ps1 HTTP/1.1', 'staging dir: C:\\Windows\\Temp\\~bv.tmp',
    'exfil>>QlZ{bTNtMHJ5X2QwbnRfbDEzfQ== (base64)',
    'done.',
  ];

  const SHELLCODE = [
    '0x9a0000  fc              cld',
    '0x9a0001  e8 82 00 00 00  call   0x9a0088',
    '0x9a0006  60              pushad',
    '0x9a0007  31 d2           xor    edx, edx',
    '0x9a0009  64 8b 52 30     mov    edx, fs:[edx+0x30]  ; PEB',
    '0x9a000d  8b 52 0c        mov    edx, [edx+0xc]       ; PEB_LDR_DATA',
    '0x9a0010  8b 52 14        mov    edx, [edx+0x14]      ; InMemOrder list',
    '0x9a0013  8b 72 28        mov    esi, [edx+0x28]      ; module name ptr',
    '0x9a0016  0f b7 4a 26     movzx  ecx, word [edx+0x26]',
    '→ API-hashing shellcode prologue (Metasploit-style x86 PEB walk)',
  ];

  function pad(s, n) { s = String(s); return s.length >= n ? s : s + ' '.repeat(n - s.length); }

  const bannner = () => [
    { kind: 'dim', text: 'vol3 v2.8.0 — image: Win10x64_19041 (4096 MiB) · KDBG 0xf80761a02b20 · 42 processes' },
    { kind: 'dim', text: 'Mission: a process is hidden by DKOM. Diff pslist vs psscan, then find its RWX VAD and network socket.' },
    { kind: 'dim', text: 'Type help for plugins.' },
    { kind: '', text: '' },
  ];

  let lines = bannner();
  let cmdVal = '';
  let outEl;
  async function scrollDown() { await tick(); if (outEl) outEl.scrollTop = outEl.scrollHeight; }

  function run(raw) {
    const c = raw.trim();
    if (!c) return;
    const out = [{ kind: 'cmd', text: c }];
    const push = (kind, text) => out.push({ kind, text });
    const parts = c.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    if (cmd === 'help') {
      ['plugins',
       '  imageinfo              profile + dump metadata',
       '  pslist                 processes via active EPROCESS linked list',
       '  psscan                 processes via pool tag scan (catches DKOM-hidden)',
       '  netscan                recover network connections',
       '  vadinfo <pid>          VAD tree for a process (find RWX private regions)',
       '  cmdline <pid>          full command line of a process',
       '  strings <pid>          ASCII strings carved from process memory',
       '  malfind                scan for injected RWX private regions',
       '  disasm <addr>          disassemble bytes at virtual address',
       '  clear                  wipe screen',
      ].forEach((t, i) => push(i === 0 ? 'dim' : '', t));

    } else if (cmd === 'imageinfo') {
      push('hl', 'OS           : Windows 10 x64 19041 (20H1)');
      push('',  'Kernel       : ntoskrnl.exe 10.0.19041.1415');
      push('',  'KDBG         : 0xf80761a02b20');
      push('',  'DTB          : 0x1ad002');
      push('',  'Processes    : 42   Modules: 158   Handles: 14022');

    } else if (cmd === 'pslist') {
      push('dim', pad('PID', 7) + pad('PPID', 7) + pad('Name', 18) + pad('Thr', 5) + pad('CPU', 6) + 'Start');
      PS.forEach(p => push('', pad(p.pid, 7) + pad(p.ppid, 7) + pad(p.name, 18) + pad(p.thr, 5) + pad(p.cpu + '%', 6) + p.start));
      push('dim', '(9 processes shown — pid 3133 is NOT in this list)');

    } else if (cmd === 'psscan') {
      push('dim', pad('PID', 7) + pad('PPID', 7) + pad('Name', 18) + pad('Thr', 5) + pad('CPU', 6) + 'Start');
      PS.forEach(p => push('', pad(p.pid, 7) + pad(p.ppid, 7) + pad(p.name, 18) + pad(p.thr, 5) + pad(p.cpu + '%', 6) + p.start));
      push('hl',  pad(PSSCAN_EXTRA.pid, 7) + pad(PSSCAN_EXTRA.ppid, 7) + pad(PSSCAN_EXTRA.name, 18) + pad(PSSCAN_EXTRA.thr, 5) + pad('—', 6) + PSSCAN_EXTRA.start + '  ← POOL SCAN ONLY — DKOM-hidden');
      push('dim', 'psscan found 10 processes vs pslist 9 — pid 3133 was unlinked from the active list.');
      setObj('memory', 'hidden', progress);

    } else if (cmd === 'netscan') {
      push('dim', pad('Proto', 7) + pad('Local', 22) + pad('Remote', 22) + pad('State', 14) + 'PID');
      NET.forEach(n => {
        const hi = n.pid === 3133;
        push(hi ? 'hl' : '', pad(n.proto, 7) + pad(n.local, 22) + pad(n.remote, 22) + pad(n.state, 14) + n.pid + (hi ? '  ← hidden process C2 socket' : ''));
      });
      push('dim', 'Note: pid 3133 (DKOM-hidden) has an ESTABLISHED connection to 185.220.101.47:443.');

    } else if (cmd === 'malfind') {
      push('hl', 'Process: svch0st.exe  Pid: 3133  PPID: 2904 (explorer.exe)');
      push('',  '  Vad Tag     : VadS');
      push('hl', '  Protection : PAGE_EXECUTE_READWRITE  ← RWX private — injected code');
      push('',  '  Type       : Private  CommitCharge: 4');
      push('',  '  Address    : 0x009a0000');
      push('',  '  0x9a0000  fc e8 82 00 00 00 60 31  ......`1');
      push('',  '  0x9a0008  d2 64 8b 52 30 8b 52 0c  .d.R0.R.');
      push('dim', 'An MZ-free RWX private region in a 0-day injected thread — not a legitimate allocation.');
      setObj('memory', 'rwx', progress);

    } else if (cmd === 'vadinfo') {
      const pid = parseInt(arg);
      const vads = VADS[pid] || VADS.default;
      push('', 'VAD tree for pid ' + (pid || '?') + ':');
      vads.forEach(v => {
        push(v.suspicious ? 'hl' : '', '  ' + pad(v.base, 14) + ' - ' + pad(v.end, 14) + '  ' + pad(v.prot, 30) + '  ' + pad(v.type, 14) + '  ' + v.mapped + (v.suspicious ? '  ← SUSPICIOUS' : ''));
      });
      if (pid === 3133) { push('dim', 'RWX Private region is shellcode injected via NtAllocateVirtualMemory.'); setObj('memory', 'rwx', progress); }

    } else if (cmd === 'cmdline') {
      const pid = parseInt(arg);
      if (CMDLINES[pid]) push('hl', 'pid ' + pid + ':  ' + CMDLINES[pid]);
      else push('err', 'no cmdline cached for "' + arg + '" — try: 3133, 3460, 2904');

    } else if (cmd === 'strings') {
      const pid = parseInt(arg);
      if (pid === 3133) {
        STRINGS_3133.forEach(s => push('', '  ' + s));
        setObj('memory', 'shellcode', progress);
      } else push('err', 'no carved strings for pid ' + (arg || '?') + ' — the implant is pid 3133');

    } else if (cmd === 'disasm') {
      SHELLCODE.forEach((l, i) => push(i === SHELLCODE.length - 1 ? 'dim' : '', '  ' + l));
      setObj('memory', 'shellcode', progress);

    } else if (cmd === 'clear') {
      lines = bannner(); cmdVal = ''; scrollDown(); return;
    } else {
      push('err', 'unknown plugin: ' + cmd + ' — type help');
    }

    out.push({ kind: '', text: '' });
    lines = [...lines, ...out];
    cmdVal = '';
    scrollDown();
  }

  function onKeydown(e) { if (e.key === 'Enter') run(cmdVal); }
  const chips = ['imageinfo', 'pslist', 'psscan', 'netscan', 'malfind', 'vadinfo 3133', 'cmdline 3133', 'strings 3133', 'disasm 0x9a0000'];

  // Findings form
  let f_pid = '', f_addr = '', f_sc = '';
  function checkFindings() {
    let any = false;
    if (f_pid.trim() === '3133') { setObj('memory', 'hidden', progress); any = true; } else if (f_pid) toast('not that PID — diff pslist vs psscan');
    if (/9a0000/i.test(f_addr.replace(/0x/i, ''))) { setObj('memory', 'rwx', progress); any = true; } else if (f_addr) toast('not the RWX region — run vadinfo 3133');
    if (/metasploit|api.hash|peb|shellcode/i.test(f_sc)) { setObj('memory', 'shellcode', progress); any = true; } else if (f_sc) toast('describe the technique — PEB walk is the key pattern');
    if (any) toast('findings logged');
  }
</script>

<div class="term">
  <div class="term__out" bind:this={outEl}>
    {#each lines as l}
      {#if l.kind === 'cmd'}
        <div><span class="pmt">vol&gt;</span> {l.text}</div>
      {:else if l.kind}
        <div class={l.kind}>{l.text}</div>
      {:else}
        <div>{l.text}</div>
      {/if}
    {/each}
  </div>
  <div class="term__in">
    <span class="pmt">vol&gt;</span>
    <div class="term-input-wrapper">
      <input autocomplete="off" spellcheck="false" placeholder="pslist · psscan · malfind · vadinfo <pid> …" bind:value={cmdVal} on:keydown={onKeydown}>
    </div>
  </div>
</div>
<div class="qchips">
  {#each chips as c}<button on:click={() => cmdVal = c}>{c}</button>{/each}
</div>
<div class="objbox" style="margin-top:18px">
  <h4>Submit findings</h4>
  <div class="findform">
    <div><label>Hidden process PID</label><input autocomplete="off" placeholder="e.g. 1234" bind:value={f_pid}></div>
    <div><label>RWX VAD base address</label><input autocomplete="off" placeholder="e.g. 0x009a0000" bind:value={f_addr}></div>
    <div class="full"><label>Shellcode technique (describe)</label><input autocomplete="off" placeholder="e.g. API hashing PEB walk" bind:value={f_sc}></div>
  </div>
  <div style="margin-top:12px"><button class="btn" on:click={checkFindings}>Check findings</button></div>
</div>
<div class="hintbox"><b>DKOM:</b> a rootkit edits the doubly-linked EPROCESS list to unlink its own process — <code>pslist</code> walks that list and misses it, but <code>psscan</code> finds the EPROCESS block by pool tag scan. RWX private VADs reveal injected code; the API-hashing shellcode prologue (<code>fc e8 … 64 8b 52 30</code>) is the Metasploit x86 PEB walk signature.</div>
