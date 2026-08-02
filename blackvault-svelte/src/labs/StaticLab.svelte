<script>
  import { progress, setObj, toast } from '../stores/progress.js';

  // ── Sample data ────────────────────────────────────────────────────────────
  const SAMPLE_HASH = '9f2c7e41ab3d5c88f0a1b6e9d4c2f7a3';

  const STRINGS_PLAIN = [
    { t: '!This program cannot be run in DOS mode', kind: '' },
    { t: 'UPX0', kind: 'dim' },
    { t: 'UPX1', kind: 'dim' },
    { t: '.............%.%.%.%.%.%', kind: 'dim' },
    { t: '4xk8#!jF92mZ', kind: 'dim' },
    { t: 'KS@@!@#T~VCW', kind: 'dim' },
    { t: '(only 3 meaningful strings in 86 KB — suspect heavy packing/encoding)', kind: 'err' },
  ];

  const STRINGS_FLOSS = [
    { t: 'FLOSS v2.1.0 — decoding stack strings + obfuscated XOR blobs…', kind: 'dim' },
    { t: '', kind: '' },
    { t: 'DECODED STRINGS:', kind: 'dim' },
    { t: '  http://cdn-telemetry.xyz/p.bin', kind: 'hl', c2: true },
    { t: '  Global\\BV-MTX', kind: '' },
    { t: '  schtasks /create /tn Updater /sc minute /tr "svc.exe"', kind: '' },
    { t: '  VirtualAllocEx', kind: '' },
    { t: '  WriteProcessMemory', kind: '' },
    { t: '  CreateRemoteThread', kind: '' },
    { t: '  WS2_32.dll', kind: '' },
    { t: '', kind: '' },
    { t: 'STACK STRINGS (built at runtime, invisible to plain strings):', kind: 'dim' },
    { t: '  C:\\Users\\victim\\AppData\\Local\\Temp\\svc.exe', kind: '' },
    { t: '  Software\\Microsoft\\Windows\\CurrentVersion\\Run', kind: '' },
  ];

  const VT_DB = [
    { hash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90', verdict: '0/72', name: 'putty.exe', detail: 'Well-known benign utility — VT clean.' },
    { hash: SAMPLE_HASH,                        verdict: '51/72', name: 'sample.bin', detail: 'Trojan.Win32.Injector · family: VAULT · first seen: 2026-05-14' },
    { hash: '77aa22bb33cc44dd55ee66ff77aa88bb', verdict: '3/72',  name: 'setup.exe', detail: '3 low-confidence PUA hits — likely a grey-area installer.' },
  ];

  const SECTIONS = [
    { name: '.text',  size: 4096, entropy: 6.40, desc: 'Normal compiled code (6–7 typical)' },
    { name: '.rdata', size: 2048, entropy: 5.10, desc: 'Read-only data (strings, constants)' },
    { name: 'UPX0',  size: 75776, entropy: 0.02, desc: 'Zeroed space — decompressed here at runtime' },
    { name: 'UPX1',  size: 49152, entropy: 7.92, desc: 'Packed/compressed payload — near-max entropy' },
  ];
  const MAX_ENT = 8.0;

  const CANDS = [
    { s: '!This program cannot be run in DOS mode', unique: false, why: 'Present in every Windows PE — too generic.' },
    { s: 'UPX0 / UPX1',                            unique: false, why: 'Present in every UPX-packed binary — too generic.' },
    { s: 'http://cdn-telemetry.xyz/p.bin',          unique: true,  why: 'Hardcoded C2 URL recovered by FLOSS — unique to this sample.' },
    { s: 'Global\\BV-MTX',                          unique: true,  why: 'Mutex name — specific to this implant, high confidence.' },
    { s: 'schtasks /create /tn Updater',            unique: true,  why: 'Persistence command — specific enough to use as a YARA string.' },
  ];

  // ── State ──────────────────────────────────────────────────────────────────
  let stringsShown = false;
  let flossShown = false;
  let c2Flagged = false;
  let hashRevealed = false;
  let hashPick = null;
  let entropyRevealed = false;
  let sectionPick = null;

  // YARA editor
  let yaraMode = 'checkbox'; // 'checkbox' | 'editor'
  let yaraSel = {};
  let yaraEditorVal = `rule sample_hunt {
    meta:
        author = "analyst"
        date = "2026-07-09"
    strings:
        // add strings here
    condition:
        all of them
}`;
  let yaraResult = null;

  function flagC2(s) {
    if (s.c2) { c2Flagged = true; setObj('static', 'c2', progress); toast('✓ C2 URL flagged'); }
  }

  function pickHash(h) {
    hashPick = h;
    if (h === SAMPLE_HASH) { setObj('static', 'hash', progress); toast('✓ 51/72 — confirmed malicious'); }
    else toast('that hash doesn\'t match our sample — read the sha256 above and click the matching row');
  }

  function pickSection(name) {
    sectionPick = name;
    if (name === 'UPX1') { setObj('static', 'packed', progress); toast('✓ UPX1 at entropy 7.92 — packed payload'); }
    else toast('entropy near 8.0 bits/byte signals max randomness — which section is that?');
  }

  function testYara() {
    if (yaraMode === 'editor') {
      const text = yaraEditorVal;
      const hasUnique = /cdn-telemetry|BV-MTX|Updater.*schtasks/i.test(text);
      const hasGeneric = /DOS mode|UPX0|UPX1|strings here/i.test(text);
      if (hasGeneric) { yaraResult = { kind: 'err', text: '✗ matches too broadly — "DOS mode" / "UPX" are in millions of files. Remove generic strings.' }; return; }
      if (!hasUnique) { yaraResult = { kind: '', text: 'rule compiled — but no unique strings from FLOSS output. Add the C2 URL or mutex to make it specific.' }; return; }
      yaraResult = { kind: 'hl', text: '✓ rule fires on sample.bin, ~0 false positives. Unique strings key it tightly.' };
      setObj('static', 'yara', progress);
    } else {
      const sel = CANDS.filter(c => yaraSel[c.s]);
      if (!sel.length) { yaraResult = { kind: '', text: 'select at least one string candidate.' }; return; }
      const hasGeneric = sel.some(c => !c.unique);
      const hasUnique  = sel.some(c => c.unique);
      if (hasGeneric) {
        const reasons = sel.filter(c => !c.unique).map(c => c.why).join(' ');
        yaraResult = { kind: 'err', text: '✗ too broad — ' + reasons };
      } else if (hasUnique) {
        yaraResult = { kind: 'hl', text: '✓ 0 false positives — keyed on ' + sel.map(c => '"' + c.s.slice(0, 30) + '"').join(' + ') };
        setObj('static', 'yara', progress);
      }
    }
  }
</script>

<p class="lede" style="margin-top:0">The static triage loop — run each tool in order, never detonate the sample. Each tool either answers a question or tells you to escalate.</p>

<!-- Tool buttons -->
<div class="qchips">
  <button class:mn={stringsShown} on:click={() => stringsShown = true}>① strings sample.bin</button>
  <button class:mn={flossShown}   on:click={() => flossShown = true}>② floss sample.bin</button>
  <button class:mn={hashRevealed} on:click={() => hashRevealed = true}>③ sha256sum + VT lookup</button>
  <button class:mn={entropyRevealed} on:click={() => entropyRevealed = true}>④ entropy per section</button>
</div>

<!-- strings output -->
{#if stringsShown}
  <div class="repane" style="margin-top:14px">
    <h5>① strings — plain printable extraction</h5>
    <div class="logview" style="max-height:160px">
      <div class="dim">$ strings -a -el sample.bin</div>
      {#each STRINGS_PLAIN as l}<div class={l.kind}>{l.t}</div>{/each}
    </div>
    <div class="hintbox" style="margin-top:8px">Near-empty <code>strings</code> output from an 86 KB file = strong packing signal. Escalate immediately to FLOSS.</div>
  </div>
{/if}

<!-- floss output -->
{#if flossShown}
  <div class="repane" style="margin-top:14px">
    <h5>② FLOSS — decodes obfuscated / stack-built strings</h5>
    <div class="logview" style="max-height:220px">
      {#each STRINGS_FLOSS as l}
        {#if l.c2}
          <div class="hl" style="cursor:pointer" on:click={() => flagC2(l)}>
            {c2Flagged ? '🚩 ' : '→ click to flag → '}{l.t}
          </div>
        {:else}
          <div class={l.kind}>{l.t}</div>
        {/if}
      {/each}
    </div>
    {#if c2Flagged}<div style="color:var(--volt);margin-top:8px;font-size:13px">✓ C2 URL flagged — this is what plain strings missed (obfuscated on disk, rebuilt on stack at runtime).</div>{/if}
  </div>
{/if}

<!-- Hash + VT -->
{#if hashRevealed}
  <div class="repane" style="margin-top:14px">
    <h5>③ sha256sum → VirusTotal lookup — click the matching row</h5>
    <div class="pktdetail" style="margin-bottom:10px">
      <span class="dim">$ sha256sum sample.bin</span><br>
      <span style="color:var(--volt)">{SAMPLE_HASH}</span>  sample.bin
    </div>
    <table class="pkts">
      <thead><tr><th>sha256 (truncated)</th><th>Filename</th><th>VT Detections</th><th>Detail</th></tr></thead>
      <tbody>
        {#each VT_DB as v}
          <tr data-sel={hashPick === v.hash ? 1 : 0} on:click={() => pickHash(v.hash)}>
            <td style="font-family:var(--mono);font-size:11px">{v.hash.slice(0, 16)}…</td>
            <td>{v.name}</td>
            <td style="color:{v.verdict.startsWith('0') ? 'var(--ash)' : v.verdict.startsWith('3') ? 'var(--amber)' : 'var(--blood)'};font-weight:600">{v.verdict}</td>
            <td style="font-size:12px;color:var(--ash)">{v.detail}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

<!-- Entropy chart -->
{#if entropyRevealed}
  <div class="repane" style="margin-top:14px">
    <h5>④ section entropy — click the section that signals packing (entropy → 8.0 bits/byte = max randomness)</h5>
    {#each SECTIONS as s}
      {@const pct = (s.entropy / MAX_ENT) * 100}
      {@const danger = s.entropy > 7.5 ? 'var(--blood)' : s.entropy > 6.0 ? 'var(--amber)' : 'var(--volt)'}
      <div class="pickrow" style="flex-direction:column;align-items:stretch;gap:6px;padding:10px 14px"
           data-state={sectionPick === s.name ? (s.name === 'UPX1' ? 'correct' : 'wrong') : null}
           on:click={() => pickSection(s.name)}>
        <div style="display:flex;justify-content:space-between;font-family:var(--mono);font-size:12px">
          <span style="color:var(--bone)">{s.name.padEnd(8)}</span>
          <span style="color:var(--ash)">{(s.size / 1024).toFixed(1)} KB</span>
          <span style="color:{danger};font-weight:700">{s.entropy.toFixed(2)} bits/byte</span>
        </div>
        <div style="height:6px;background:var(--surface-3);border-radius:3px;overflow:hidden">
          <div style="height:100%;width:{pct}%;background:{danger};border-radius:3px;transition:width 0.6s"></div>
        </div>
        <div style="font-size:11px;color:var(--ash)">{s.desc}</div>
      </div>
    {/each}
    <div style="font-size:11px;color:var(--rim);margin-top:6px;font-family:var(--mono)">
      ◀ 0.0 (all zeros)   ·   normal code = 6.0–7.0   ·   compressed/encrypted = 7.5–8.0   ▶
    </div>
  </div>
{/if}

<!-- YARA -->
<div class="repane" style="margin-top:14px">
  <h5>YARA rule — build a rule that fires on this sample with zero false positives</h5>
  <div class="qchips" style="margin-bottom:10px">
    <button class:mn={yaraMode === 'checkbox'} on:click={() => yaraMode = 'checkbox'}>guided (pick strings)</button>
    <button class:mn={yaraMode === 'editor'}   on:click={() => yaraMode = 'editor'}>editor (write rule)</button>
  </div>

  {#if yaraMode === 'checkbox'}
    <p style="color:var(--ash);font-size:13px;margin:0 0 8px">Select which strings to include. Avoid generic ones — unique artifacts only.</p>
    {#each CANDS as c}
      <label class="pickrow" style="flex-direction:row;gap:12px;cursor:pointer"
             data-state={yaraSel[c.s] ? (c.unique ? 'correct' : 'wrong') : null}>
        <input type="checkbox" bind:checked={yaraSel[c.s]}>
        <span style="font-family:var(--mono);font-size:12px;flex:1">{c.s}</span>
        {#if yaraSel[c.s]}<span style="font-size:11px;color:{c.unique ? 'var(--volt)' : 'var(--blood)'}">{c.why}</span>{/if}
      </label>
    {/each}
  {:else}
    <p style="color:var(--ash);font-size:13px;margin:0 0 8px">Write the full rule. Use strings from the FLOSS output above — not generic ones like "DOS mode" or "UPX".</p>
    <textarea class="lab-sel" style="width:100%;height:180px;resize:vertical;font-family:var(--mono);font-size:12px;line-height:1.6;padding:10px"
              bind:value={yaraEditorVal} spellcheck="false"></textarea>
  {/if}

  <div style="margin-top:10px"><button class="btn" on:click={testYara}>Test rule against sample set</button></div>
  {#if yaraResult}
    <div class="pktdetail" style="margin-top:8px"><span class={yaraResult.kind}>{yaraResult.text}</span></div>
  {/if}
</div>

<div class="hintbox"><b>The loop:</b> ① <code>strings</code> nearly empty → escalate to ② <code>floss</code> (recovers stack-built/obfuscated strings that packing hides); ③ hash → VT for quick reputation; ④ section entropy near 8.0 = packed payload. Then YARA-rule only the unique artifacts — C2 URL, mutex, specific commands. Avoid "DOS mode" or "UPX" — they're in millions of files.</div>
