<script>
  import { progress, setObj, toast } from '../stores/progress.js';

  const TABS = [['reg', 'registry'], ['mft', 'MFT'], ['evt', 'event log'], ['hook', 'SSDT']];
  let tab = 'reg';

  let rk_p = '', rk_t = '', rk_s = '', rk_h = '';
  function checkFindings() {
    if (/run|svc\.exe|windowsupdate/i.test(rk_p)) setObj('rootkit', 'persist', progress); else if (rk_p) toast('the autostart Run value');
    if (/^y/i.test(rk_t)) setObj('rootkit', 'timestomp', progress); else if (rk_t) toast('compare $SI vs $FN created times');
    if (/winsvc/i.test(rk_s)) setObj('rootkit', 'service', progress); else if (rk_s) toast('the 7045 Service Name');
    if (/ntquerydirectoryfile/i.test(rk_h)) setObj('rootkit', 'hook', progress); else if (rk_h) toast('the redirected SSDT entry');
  }
</script>

<div class="logtabs">
  {#each TABS as [id, label]}<button aria-current={tab === id} on:click={() => tab = id}>{label}</button>{/each}
</div>
{#if tab === 'reg'}
  <pre class="pcode">HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\<span class="st">Run</span>
   <span class="hl">WindowsUpdate = C:\Temp\svc.exe</span>   <span class="cm">// not a real Windows entry</span></pre>
{:else if tab === 'mft'}
  <pre class="pcode">svc.exe  (MFT record 41233)
   $STANDARD_INFORMATION  Created: <span class="hl">2026-06-01 08:00</span>
   $FILE_NAME            Created: <span class="hl">2019-03-12 11:04</span>
   <span class="cm">// $SI newer than $FN, round timestamp → timestomping (SetFileTime)</span></pre>
{:else if tab === 'evt'}
  <pre class="pcode">System.evtx — Event ID <span class="hl">7045</span> (A service was installed)
   Service Name : <span class="hl">WinSvc</span>
   Image Path   : C:\Temp\svc.exe
   Start Type   : auto</pre>
{:else}
  <pre class="pcode">SSDT entry NtQueryDirectoryFile →
   <span class="hl">0xFFFFF80012AB1000  (outside ntoskrnl.exe range)</span>
   <span class="cm">// pointer redirected to rootkit code → hides files/processes from directory listings</span></pre>
{/if}
<div class="objbox" style="margin-top:16px">
  <h4>Submit findings</h4>
  <div class="findform">
    <div><label>Persistence (key value / path)</label><input placeholder="autostart" bind:value={rk_p}></div>
    <div><label>Timestomped? (yes/no)</label><input placeholder="yes/no" bind:value={rk_t}></div>
    <div><label>Malicious service name</label><input placeholder="from 7045" bind:value={rk_s}></div>
    <div><label>Hooked API</label><input placeholder="SSDT function" bind:value={rk_h}></div>
  </div>
  <div style="margin-top:10px"><button class="btn" on:click={checkFindings}>Check findings</button></div>
</div>
<div class="hintbox"><b>Artifacts beat the rootkit:</b> a process hidden in live memory still leaves a Run key, an MFT record (with tell-tale $SI/$FN time mismatch), a 7045 service-install event, and — if it hooks the SSDT — a kernel pointer aimed outside ntoskrnl. Cross-view: the rootkit can't lie in every place at once.</div>
