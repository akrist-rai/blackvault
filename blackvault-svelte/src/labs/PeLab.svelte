<script>
  import { progress, setObj, toast } from '../stores/progress.js';

  const PE = {
    name: 'invoice_2026.pdf.exe',
    sections: [['.text', '0x1000', '0x1200', 6.4], ['.rdata', '0x400', '0x400', 5.1], ['.data', '0x200', '0x200', 3.2], ['UPX0', '0x6000', '0x0', 0.0], ['UPX1', '0x5e00', '0x5e00', 7.93]],
    impPacked: ['kernel32.dll!LoadLibraryA', 'kernel32.dll!GetProcAddress', 'kernel32.dll!VirtualProtect', 'kernel32.dll!ExitProcess'],
    impReal: ['kernel32.dll!VirtualAlloc', 'kernel32.dll!WriteProcessMemory', 'kernel32.dll!CreateRemoteThread', 'wininet.dll!InternetOpenUrlA', 'advapi32.dll!RegSetValueExA'],
    strPacked: ['!This program cannot be run in DOS mode', 'UPX!', 'UPX0', 'UPX1', '1.26 Copyright (C) 1996-2024'],
    strReal: ['http://updates-cdn.xyz/gate.php', 'Software\\Microsoft\\Windows\\CurrentVersion\\Run', 'InjectAndRun', 'BV{p4ck3d_n0_m0r3}', '%TEMP%\\svc.exe'],
  };
  const TABS = [['overview', 'overview'], ['sections', 'sections'], ['imports', 'imports'], ['strings', 'strings'], ['yara', 'YARA rule']];

  let tab = 'overview';
  let unpacked = false;
  let yaraSel = {};
  let yaraResult = null;

  const allStrings = [...PE.strPacked, ...PE.strReal];

  function testYara() {
    const sel = allStrings.filter(s => yaraSel[s]);
    if (!sel.length) { yaraResult = { kind: '', text: 'select at least one string.' }; return; }
    const unique = sel.some(s => /updates-cdn\.xyz|InjectAndRun|BV\{/.test(s));
    const generic = sel.some(s => /DOS mode|UPX!|UPX0|UPX1|Copyright/.test(s));
    if (generic) yaraResult = { kind: 'err', text: 'rule matches thousands of unrelated files — "DOS mode", "UPX!" etc. are everywhere. Pick strings unique to this sample.' };
    else if (unique) { yaraResult = { kind: 'hl', text: 'rule matches the sample · 0 false positives. Solid — you keyed on unique artifacts (the C2 URL / custom strings).' }; setObj('pe', 'yara', progress); }
    else yaraResult = { kind: '', text: 'valid rule but it would not reliably match — prefer the unique strings.' };
  }

  let pe_packed = '', pe_c2 = '', pe_api = '';
  function checkFindings() {
    if (/^y/i.test(pe_packed)) setObj('pe', 'packed', progress); else if (pe_packed) toast('look at UPX1 entropy + the tiny import table');
    if (pe_c2.toLowerCase().includes('updates-cdn')) setObj('pe', 'c2', progress); else if (pe_c2) toast('unpack, then read strings for an http URL');
    if (/virtualalloc|writeprocessmemory|createremotethread/i.test(pe_api)) setObj('pe', 'imports', progress); else if (pe_api) toast('which API writes code into another process?');
  }
</script>

<div class="logtabs">
  {#each TABS as [id, label]}<button aria-current={tab === id} on:click={() => tab = id}>{label}</button>{/each}
</div>

{#if tab === 'overview'}
  <table class="kv">
    <tbody>
    <tr><th>field</th><th>value</th></tr>
    <tr><td>file</td><td>{PE.name} <span class="tag-bad">(double extension!)</span></td></tr>
    <tr><td>type</td><td>PE32 executable (GUI) Intel 80386</td></tr>
    <tr><td>imphash</td><td>a3f1...c0 <span class="dim">(few imports)</span></td></tr>
    <tr><td>state</td><td>{#if unpacked}<span class="tag-ok">unpacked (dumped from memory)</span>{:else}<span class="tag-bad">packed — only 4 imports, UPX1 entropy 7.93</span>{/if}</td></tr>
    </tbody>
  </table>
  <div style="margin-top:12px"><button class="btn" on:click={() => unpacked = !unpacked}>{unpacked ? 'Re-pack view' : 'Unpack (emulate to OEP) ▸'}</button></div>
{:else if tab === 'sections'}
  <table class="kv">
    <tbody>
    <tr><th>name</th><th>virt</th><th>raw</th><th>entropy</th><th></th></tr>
    {#each PE.sections as s}
      <tr><td>{s[0]}</td><td>{s[1]}</td><td>{s[2]}</td><td>{s[3].toFixed(2)}</td>
        <td>{#if s[3] > 7.2}<span class="tag-bad">near-8.0 → compressed/encrypted</span>{:else if s[0].indexOf('UPX') === 0}<span class="tag-bad">packer section name</span>{/if}</td>
      </tr>
    {/each}
    </tbody>
  </table>
{:else if tab === 'imports'}
  <div class="pktdetail">
    {#each (unpacked ? PE.impReal : PE.impPacked) as i}
      {@const bad = /VirtualAlloc|WriteProcessMemory|CreateRemoteThread|InternetOpenUrl/.test(i)}
      <div class={bad ? 'hl' : 'dim'}>{i}{bad ? '  ← injection / network' : ''}</div>
    {/each}
  </div>
  {#if !unpacked}<div class="hintbox" style="margin-top:10px">Only loader stubs visible (LoadLibrary/GetProcAddress/VirtualProtect). Real imports are hidden until you unpack — go to <b>overview → Unpack</b>.</div>{/if}
{:else if tab === 'strings'}
  <div class="pktdetail">
    {#each (unpacked ? PE.strReal : PE.strPacked) as s}
      {@const bad = /http|Run|Inject|TEMP|BV\{/.test(s)}
      <div class={bad ? 'hl' : 'dim'}>{s}</div>
    {/each}
  </div>
{:else}
  <p class="lede" style="margin-top:0;font-size:14px">Pick the strings your rule will match on, then test it. A good rule fires on THIS sample and (almost) nothing else.</p>
  <div class="pktdetail">
    {#each allStrings as s}
      <label style="display:block;cursor:pointer"><input type="checkbox" bind:checked={yaraSel[s]}> {s}</label>
    {/each}
  </div>
  <div style="margin-top:10px"><button class="btn" on:click={testYara}>Test rule</button></div>
  <div class="pktdetail" style="margin-top:10px">{#if yaraResult}<span class={yaraResult.kind}>{yaraResult.text}</span>{:else}no rule tested yet.{/if}</div>
{/if}

<div class="objbox" style="margin-top:18px">
  <h4>Submit findings</h4>
  <div class="findform">
    <div><label>Is it packed? (yes/no)</label><input placeholder="yes/no" bind:value={pe_packed}></div>
    <div><label>C2 domain</label><input placeholder="found in strings" bind:value={pe_c2}></div>
    <div class="full"><label>An injection import</label><input placeholder="kernel32 function" bind:value={pe_api}></div>
  </div>
  <div style="margin-top:10px"><button class="btn" on:click={checkFindings}>Check findings</button></div>
</div>
