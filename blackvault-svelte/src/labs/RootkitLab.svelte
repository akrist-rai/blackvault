<script>
  import { progress, setObj, toast } from '../stores/progress.js';

  const TABS = [
    { id: 'reg', label: 'registry', key: 'persist',
      lede: 'Five Run-key entries. Click the one that is not a real Windows/vendor entry.',
      entries: [
        { label: 'OneDrive = "C:\\Program Files\\Microsoft OneDrive\\OneDrive.exe"', correct: false },
        { label: 'SecurityHealth = "C:\\Windows\\System32\\SecurityHealthSystray.exe"', correct: false },
        { label: 'WindowsUpdate = "C:\\Temp\\svc.exe"', correct: true, why: 'Real Windows Update never runs from C:\\Temp — and "WindowsUpdate" isn\'t a real Run-key name.' },
        { label: 'RtkAudUService = "C:\\Windows\\System32\\RtkAudUService64.exe"', correct: false },
        { label: 'Dropbox = "C:\\Program Files (x86)\\Dropbox\\Client\\Dropbox.exe"', correct: false },
      ] },
    { id: 'mft', label: 'MFT', key: 'timestomp',
      lede: 'Four file records. Click the one whose $STANDARD_INFORMATION and $FILE_NAME creation times disagree.',
      entries: [
        { label: 'explorer.exe — $SI 2015-07-29 08:00, $FN 2015-07-29 08:00', correct: false },
        { label: 'chrome.exe — $SI 2024-01-10 09:12, $FN 2024-01-10 09:12', correct: false },
        { label: 'svc.exe — $SI 2026-06-01 08:00, $FN 2019-03-12 11:04', correct: true, why: '$FN is kernel-maintained and hard to forge; $SI was edited to an older, rounder date — timestomping.' },
        { label: 'notepad.exe — $SI 2015-07-29 08:00, $FN 2015-07-29 08:00', correct: false },
      ] },
    { id: 'evt', label: 'event log', key: 'service',
      lede: 'Four events from System.evtx. Click the one showing a malicious service install.',
      entries: [
        { label: '4624 — An account was successfully logged on', correct: false },
        { label: '4688 — A new process has been created (explorer.exe)', correct: false },
        { label: '7045 — A service was installed. Service Name: WinSvc, Image Path: C:\\Temp\\svc.exe', correct: true, why: 'Event 7045 fires on every new service install — an unfamiliar name pointing at C:\\Temp is the tell.' },
        { label: '4634 — An account was logged off', correct: false },
      ] },
    { id: 'hook', label: 'SSDT', key: 'hook',
      lede: 'Four SSDT entries. Click the one whose pointer resolves outside ntoskrnl.exe.',
      entries: [
        { label: 'NtCreateFile      → 0xFFFFF80002A11000', correct: false },
        { label: 'NtReadFile        → 0xFFFFF80002A15200', correct: false },
        { label: 'NtQueryDirectoryFile → 0xFFFFF80012AB1000', correct: true, why: 'ntoskrnl.exe lives around 0xFFFFF80002A00000-0xFFFFF80003000000 — this pointer is far outside it, redirected to rootkit code.' },
        { label: 'NtWriteFile       → 0xFFFFF80002A19400', correct: false },
      ] },
  ];

  let tab = 'reg';
  $: current = TABS.find(t => t.id === tab);
  let state = {}; // per-tab: { pick: {}, why }

  function pick(t, entry, i) {
    state[t.id] = state[t.id] || { pick: {} };
    if (entry.correct) {
      state[t.id].pick[i] = 'correct';
      state[t.id].why = entry.why;
      setObj('rootkit', t.key, progress);
    } else {
      state[t.id].pick[i] = 'wrong';
      toast('not that one — keep looking');
    }
    state = state;
  }
</script>

<div class="logtabs">
  {#each TABS as t}<button aria-current={tab === t.id} on:click={() => tab = t.id}>{t.label}</button>{/each}
</div>
<p class="lede" style="font-size:14px;margin-top:0">{current.lede}</p>
{#each current.entries as entry, i}
  <button class="pickrow" data-state={state[current.id]?.pick[i]} disabled={state[current.id]?.pick[i] === 'correct'} on:click={() => pick(current, entry, i)}>{entry.label}</button>
{/each}
{#if state[current.id]?.why}<div class="hexinspect"><span class="hl">{state[current.id].why}</span></div>{/if}
<div class="hintbox"><b>Artifacts beat the rootkit:</b> a process hidden in live memory still leaves a Run key, an MFT record (with tell-tale $SI/$FN time mismatch), a 7045 service-install event, and — if it hooks the SSDT — a kernel pointer aimed outside ntoskrnl. Cross-view: the rootkit can't lie in every place at once.</div>
