<script>
  import { progress, setObj, toast } from '../stores/progress.js';

  let tab = 'reg';

  // ── Registry viewer data ──────────────────────────────────────────────────
  const REG_TREE = {
    'HKCU': {
      'Software': {
        'Microsoft': {
          'Windows': {
            'CurrentVersion': {
              'Run': {
                entries: [
                  { name: 'OneDrive',       val: '"C:\\Program Files\\Microsoft OneDrive\\OneDrive.exe"',       suspicious: false },
                  { name: 'SecurityHealth', val: '"C:\\Windows\\System32\\SecurityHealthSystray.exe"',          suspicious: false },
                  { name: 'WindowsUpdate',  val: '"C:\\Temp\\svc.exe"',                                         suspicious: true,
                    why: '"WindowsUpdate" is not a real Microsoft Run-key name, and C:\\Temp is never a system path — this is malware persistence.' },
                  { name: 'RtkAudUService', val: '"C:\\Windows\\System32\\RtkAudUService64.exe"',               suspicious: false },
                  { name: 'Dropbox',        val: '"C:\\Program Files (x86)\\Dropbox\\Client\\Dropbox.exe"',     suspicious: false },
                ],
              },
            },
          },
        },
      },
    },
  };

  let regExpanded = { HKCU: true, 'HKCU/Software': true, 'HKCU/Software/Microsoft': true, 'HKCU/Software/Microsoft/Windows': true, 'HKCU/Software/Microsoft/Windows/CurrentVersion': true, 'HKCU/Software/Microsoft/Windows/CurrentVersion/Run': true };
  let regPick = null;
  let regWhy = '';

  function toggleReg(path) { regExpanded[path] = !regExpanded[path]; }
  function pickReg(entry) {
    regPick = entry.name;
    if (entry.suspicious) {
      regWhy = entry.why;
      setObj('rootkit', 'persist', progress);
      toast('✓ persistence mechanism found');
    } else {
      regWhy = '';
      toast('that looks like a legitimate entry — look for an unusual path or name');
    }
  }

  // ── MFT data ──────────────────────────────────────────────────────────────
  const MFT = [
    { file: 'explorer.exe', inode: 40219, si_cr: '2015-07-29 08:00:00', si_mod: '2024-11-10 12:01:44', fn_cr: '2015-07-29 08:00:00', fn_mod: '2024-11-10 12:01:44', mismatch: false },
    { file: 'chrome.exe',   inode: 87423, si_cr: '2024-01-10 09:12:33', si_mod: '2025-03-08 14:22:17', fn_cr: '2024-01-10 09:12:33', fn_mod: '2025-03-08 14:22:17', mismatch: false },
    { file: 'svc.exe',      inode: 91042, si_cr: '2026-06-01 08:00:00', si_mod: '2026-06-01 08:00:00', fn_cr: '2019-03-12 11:04:37', fn_mod: '2019-03-12 11:04:37', mismatch: true,
      why: '$SI was changed to a round, older-looking date (2026-06-01 08:00:00). $FN is kernel-maintained and cannot be edited from userspace — it still shows the real timestamp (2019-03-12). This divergence is timestomping.' },
    { file: 'notepad.exe',  inode: 40891, si_cr: '2015-07-29 08:00:00', si_mod: '2024-09-01 11:30:02', fn_cr: '2015-07-29 08:00:00', fn_mod: '2024-09-01 11:30:02', mismatch: false },
  ];
  let mftPick = null;
  let mftWhy = '';
  function pickMft(row) {
    mftPick = row.file;
    if (row.mismatch) { mftWhy = row.why; setObj('rootkit', 'timestomp', progress); toast('✓ timestomped file detected'); }
    else { mftWhy = ''; toast('$SI and $FN agree — no tampering here'); }
  }

  // ── Event log data ─────────────────────────────────────────────────────────
  const EVENTS = [
    { id: 4624, time: '2026-06-28T03:12:09', level: 'Information', source: 'Microsoft-Windows-Security-Auditing',
      xml: `<EventData>\n  <Data Name="SubjectUserSid">S-1-5-18</Data>\n  <Data Name="TargetUserName">admin</Data>\n  <Data Name="LogonType">10</Data>\n  <Data Name="IpAddress">45.133.1.88</Data>\n</EventData>`,
      suspicious: false },
    { id: 4688, time: '2026-06-28T03:12:11', level: 'Information', source: 'Microsoft-Windows-Security-Auditing',
      xml: `<EventData>\n  <Data Name="NewProcessName">C:\\Windows\\System32\\cmd.exe</Data>\n  <Data Name="ParentProcessName">C:\\Windows\\explorer.exe</Data>\n  <Data Name="CommandLine">cmd.exe /c whoami</Data>\n</EventData>`,
      suspicious: false },
    { id: 7045, time: '2026-06-28T03:13:55', level: 'Information', source: 'Service Control Manager',
      xml: `<EventData>\n  <Data Name="ServiceName">WinSvc</Data>\n  <Data Name="ImagePath">C:\\Temp\\svc.exe</Data>\n  <Data Name="ServiceType">User Mode Service</Data>\n  <Data Name="StartType">Auto Start</Data>\n  <Data Name="AccountName">LocalSystem</Data>\n</EventData>`,
      suspicious: true,
      why: 'Event 7045 fires on every service installation. An unknown service named "WinSvc" pointing at C:\\Temp\\svc.exe, running as LocalSystem with Auto Start, is a classic persistence mechanism.' },
    { id: 1102, time: '2026-06-28T03:41:00', level: 'Information', source: 'Microsoft-Windows-Eventlog',
      xml: `<EventData>\n  <Data Name="SubjectUserName">admin</Data>\n  <Data Name="SubjectDomainName">web01</Data>\n  <Data Name="SubjectLogonId">0x4e1a2</Data>\n</EventData>`,
      suspicious: false },
  ];
  let evtPick = null;
  let evtExpanded = null;
  let evtWhy = '';
  function pickEvt(ev) {
    evtExpanded = evtExpanded === ev.id ? null : ev.id;
    evtPick = ev.id;
    if (ev.suspicious) { evtWhy = ev.why; setObj('rootkit', 'service', progress); toast('✓ malicious service install (7045) found'); }
    else { evtWhy = ''; if (ev.id === 1102) toast('1102 = log clear — noteworthy, but the question is the service install'); else toast('check event IDs — 7045 is the service installation event'); }
  }

  // ── SSDT data ─────────────────────────────────────────────────────────────
  const NTOSKRNL_RANGE = { lo: 0xFFFFF80002A00000n, hi: 0xFFFFF80003000000n };
  const SSDT = [
    { fn: 'NtCreateFile',          ptr: '0xFFFFF80002A11000', inRange: true,  suspicious: false },
    { fn: 'NtReadFile',            ptr: '0xFFFFF80002A15200', inRange: true,  suspicious: false },
    { fn: 'NtQueryDirectoryFile',  ptr: '0xFFFFF80012AB1000', inRange: false, suspicious: true,
      why: 'ntoskrnl.exe occupies ~0xFFFFF80002A00000–0xFFFFF80003000000. This pointer (0xFFFFF80012AB1000) is far outside that range — it points into rootkit code loaded at a different base address, hiding files from directory listings.' },
    { fn: 'NtWriteFile',           ptr: '0xFFFFF80002A19400', inRange: true,  suspicious: false },
  ];
  let ssdtPick = null;
  let ssdtWhy = '';
  function pickSsdt(row) {
    ssdtPick = row.fn;
    if (row.suspicious) { ssdtWhy = row.why; setObj('rootkit', 'hook', progress); toast('✓ SSDT hook detected'); }
    else { ssdtWhy = ''; toast('that pointer is within ntoskrnl range — not hooked'); }
  }
</script>

<div class="logtabs">
  <button aria-current={tab === 'reg'}  on:click={() => tab = 'reg'}>Registry (Run key)</button>
  <button aria-current={tab === 'mft'}  on:click={() => tab = 'mft'}>MFT ($SI vs $FN)</button>
  <button aria-current={tab === 'evt'}  on:click={() => tab = 'evt'}>Event Log (7045)</button>
  <button aria-current={tab === 'ssdt'} on:click={() => tab = 'ssdt'}>SSDT (kernel hooks)</button>
</div>

{#if tab === 'reg'}
  <p class="lede" style="margin-top:0;font-size:14px">Registry Editor — <code>HKCU\Software\Microsoft\Windows\CurrentVersion\Run</code>. Click the entry that is NOT a real Windows/vendor process.</p>
  <div class="repane">
    <h5>Registry Editor</h5>
    <div style="font-family:var(--mono);font-size:12px;line-height:1.8">
      <div>📁 HKEY_CURRENT_USER</div>
      <div style="padding-left:16px">📁 Software</div>
      <div style="padding-left:32px">📁 Microsoft</div>
      <div style="padding-left:48px">📁 Windows</div>
      <div style="padding-left:64px">📁 CurrentVersion</div>
      <div style="padding-left:80px;color:var(--volt)">📂 <b>Run</b></div>
      <div style="padding-left:96px;margin-top:4px">
        {#each REG_TREE['HKCU']['Software']['Microsoft']['Windows']['CurrentVersion']['Run'].entries as entry}
          <button class="pickrow" style="text-align:left;width:100%"
            data-state={regPick === entry.name ? (entry.suspicious ? 'correct' : 'wrong') : null}
            on:click={() => pickReg(entry)}>
            <span style="color:var(--ash);margin-right:8px">REG_SZ</span>
            <span style="color:{entry.suspicious ? 'var(--blood)' : 'var(--bone)'}">"{entry.name}"</span>
            <span style="color:var(--ash)"> = </span>
            <span style="color:{entry.suspicious ? 'var(--blood)' : 'var(--rim)'}">{entry.val}</span>
          </button>
        {/each}
      </div>
    </div>
  </div>
  {#if regWhy}<div class="hexinspect" style="margin-top:10px"><span class="hl">{regWhy}</span></div>{/if}
  <div class="hintbox"><b>What to look for:</b> real Microsoft services live in <code>C:\Windows\System32</code>. A Run key pointing at <code>C:\Temp</code> or <code>C:\Users\…\AppData\</code> is an attacker's persistence. Also verify the name — "WindowsUpdate" is not a real Microsoft key.</div>

{:else if tab === 'mft'}
  <p class="lede" style="margin-top:0;font-size:14px">Four MFT records. Click the file whose <code>$STANDARD_INFORMATION</code> and <code>$FILE_NAME</code> creation times disagree — that's timestomping.</p>
  <div class="repane">
    <h5>MFT records — $SI vs $FN timestamp comparison</h5>
    <table class="pkts">
      <thead>
        <tr>
          <th>File</th><th>Inode</th>
          <th style="color:var(--amber)">$SI Creation</th>
          <th style="color:var(--amber)">$SI Modified</th>
          <th style="color:var(--volt)">$FN Creation</th>
          <th style="color:var(--volt)">$FN Modified</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {#each MFT as row}
          <tr data-sel={mftPick === row.file ? 1 : 0}
              style={(row.mismatch && mftPick === row.file ? 'background:rgba(185,50,50,0.12);' : '') + 'cursor:pointer'}
              on:click={() => pickMft(row)}>
            <td style="font-family:var(--mono)">{row.file}</td>
            <td>{row.inode}</td>
            <td style="color:var(--amber)">{row.si_cr}</td>
            <td style="color:var(--amber)">{row.si_mod}</td>
            <td style="color:var(--volt);{row.mismatch ? 'font-weight:700' : ''}">{row.fn_cr}</td>
            <td style="color:var(--volt);{row.mismatch ? 'font-weight:700' : ''}">{row.fn_mod}</td>
            <td>{row.mismatch && mftPick === row.file ? '⚠ MISMATCH' : ''}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  {#if mftWhy}<div class="hexinspect" style="margin-top:10px"><span class="hl">{mftWhy}</span></div>{/if}
  <div class="hintbox"><b>Why it works:</b> <code>$STANDARD_INFORMATION</code> (amber) is editable by userspace tools like <code>timestomp</code>. <code>$FILE_NAME</code> (green) is updated only by the NTFS kernel driver and cannot be changed without kernel access. Attackers can backddate $SI but rarely touch $FN — the mismatch is the tell.</div>

{:else if tab === 'evt'}
  <p class="lede" style="margin-top:0;font-size:14px">System event log (System.evtx). Click the event that shows a malicious service installation. Expand to read the full XML.</p>
  <div class="repane">
    <h5>Windows Event Log — System.evtx</h5>
    {#each EVENTS as ev}
      <div class="pickrow" style="flex-direction:column;align-items:flex-start"
           data-state={evtPick === ev.id ? (ev.suspicious ? 'correct' : null) : null}
           on:click={() => pickEvt(ev)}>
        <div style="display:flex;gap:12px;width:100%">
          <span style="font-family:var(--mono);font-size:12px;color:{ev.suspicious ? 'var(--blood)' : 'var(--volt)'};min-width:40px">{ev.id}</span>
          <span style="color:var(--ash);font-size:12px">{ev.time}</span>
          <span style="font-size:12px">{ev.source}</span>
        </div>
        {#if evtExpanded === ev.id}
          <pre class="pcode" style="margin-top:8px;font-size:11px;white-space:pre-wrap">{ev.xml}</pre>
          {#if ev.suspicious && evtWhy}<div style="color:var(--volt);margin-top:6px;font-size:12px">{evtWhy}</div>{/if}
        {/if}
      </div>
    {/each}
  </div>
  <div class="hintbox"><b>Key event IDs:</b> 7045 = new service installed (attacker persistence), 4688 = process creation, 4624 = logon, 1102 = audit log cleared. A 7045 from an unknown service name pointing at <code>C:\Temp</code> running as <code>LocalSystem</code> is almost always malicious.</div>

{:else if tab === 'ssdt'}
  <p class="lede" style="margin-top:0;font-size:14px">System Service Descriptor Table (SSDT) — each entry maps a syscall number to a kernel function pointer. Click the entry whose pointer lands outside <code>ntoskrnl.exe</code>.</p>
  <div class="repane">
    <h5>SSDT entries — ntoskrnl.exe range: 0xFFFFF800'02A00000 – 0xFFFFF800'03000000</h5>
    {#each SSDT as row}
      <button class="pickrow" style="text-align:left;width:100%;font-family:var(--mono);font-size:12px"
        data-state={ssdtPick === row.fn ? (row.suspicious ? 'correct' : 'wrong') : null}
        on:click={() => pickSsdt(row)}>
        <span style="display:inline-block;min-width:240px;color:var(--bone)">{row.fn}</span>
        <span style="color:{row.inRange ? 'var(--ash)' : 'var(--blood)'};font-weight:{row.suspicious ? 700 : 400}">{row.ptr}</span>
        {#if !row.inRange}<span style="color:var(--blood);margin-left:8px">← OUTSIDE ntoskrnl</span>{/if}
      </button>
    {/each}
    {#if ssdtWhy}<div class="hexinspect" style="margin-top:10px"><span class="hl">{ssdtWhy}</span></div>{/if}
  </div>
  <div class="hintbox"><b>SSDT hooks:</b> a rootkit replaces a syscall's pointer with its own address to intercept every call — letting it hide files, processes, or network connections. The tell is a pointer that resolves outside <code>ntoskrnl.exe</code>'s loaded address range. <code>NtQueryDirectoryFile</code> is the classic target for hiding files.</div>
{/if}
