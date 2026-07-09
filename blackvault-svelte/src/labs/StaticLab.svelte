<script>
  import { progress, setObj, toast } from '../stores/progress.js';

  const CANDS = ['!This program cannot be run in DOS mode', 'UPX1', 'http://cdn-telemetry.xyz/p.bin', 'Global\\BV-MTX', 'schtasks /create /tn Updater'];
  const SAMPLE_HASH = '9f2c7e41ab3d5c88f0a1b6e9d4c2f7a3';
  const VT_DB = [
    { hash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90', verdict: '0/72 — unrelated clean file' },
    { hash: SAMPLE_HASH, verdict: '51/72 engines detect (Trojan.Win32.Injector)' },
    { hash: '77aa22bb33cc44dd55ee66ff77aa88bb', verdict: '3/72 — low-confidence PUA' },
  ];
  const SECTIONS = [
    { name: '.text', entropy: 6.40 },
    { name: '.rdata', entropy: 5.10 },
    { name: 'UPX0', entropy: 0.02 },
    { name: 'UPX1', entropy: 7.92 },
  ];

  let stringsShown = false, flossShown = false;
  let c2Flagged = false;
  let hashRevealed = false, hashPick = null;
  let entropyRevealed = false, sectionPick = null;

  function flagC2() { c2Flagged = true; setObj('static', 'c2', progress); }
  function pickHash(h) {
    hashPick = h;
    if (h === SAMPLE_HASH) setObj('static', 'hash', progress);
    else toast('that VT entry is for a different hash — match it exactly');
  }
  function pickSection(name) {
    sectionPick = name;
    if (name === 'UPX1') setObj('static', 'packed', progress);
    else toast('which section is closest to 8.0 bits/byte?');
  }

  let yaraSel = {};
  let yaraResult = null;
  function testYara() {
    const sel = CANDS.filter(s => yaraSel[s]);
    if (!sel.length) { yaraResult = { kind: '', text: 'select at least one string.' }; return; }
    const uniq = sel.some(s => /cdn-telemetry|BV-MTX|Updater/.test(s));
    const gen = sel.some(s => /DOS mode|UPX/.test(s));
    if (gen) yaraResult = { kind: 'err', text: 'matches countless files — "DOS mode"/"UPX" are everywhere. Pick unique strings.' };
    else if (uniq) { yaraResult = { kind: 'hl', text: 'matches this sample, ~0 false positives. Good — keyed on the C2 / mutex.' }; setObj('static', 'yara', progress); }
    else yaraResult = { kind: '', text: 'valid but weak — prefer the unique artifacts.' };
  }
</script>

<p class="lede" style="margin-top:0">The static triage loop — never run the sample. Each tool answers (or redirects) a question.</p>
<div class="qchips">
  <button on:click={() => stringsShown = true}>strings</button>
  <button on:click={() => flossShown = true}>floss</button>
  <button on:click={() => hashRevealed = true}>sha256</button>
  <button on:click={() => entropyRevealed = true}>entropy</button>
</div>

{#if stringsShown}
  <div class="pktdetail" style="margin-top:12px">
    <div>$ strings sample.bin | head</div>
    <div>  !This program cannot be run in DOS mode</div>
    <div>  UPX0</div>
    <div>  UPX1</div>
    <div class="dim">  ...mostly non-printable. Almost no readable strings → suspect packing; escalate to FLOSS.</div>
  </div>
{/if}
{#if flossShown}
  <div class="pktdetail" style="margin-top:12px">
    <div>$ floss sample.bin   (decodes stack/obfuscated strings)</div>
    <div>  <span class="xreflink" on:click={flagC2}>{c2Flagged ? '🚩 ' : ''}http://cdn-telemetry.xyz/p.bin</span> <span class="dim">← click to flag as the C2</span></div>
    <div>  Global\BV-MTX</div>
    <div>  schtasks /create /tn Updater /sc minute</div>
    <div class="dim">  FLOSS recovered the strings the packer hid.</div>
  </div>
{/if}

{#if hashRevealed}
  <div class="objbox" style="margin-top:14px">
    <h4>Hash → reputation lookup</h4>
    <p class="lede" style="font-size:13.5px;margin:0 0 8px">sha256: <code>{SAMPLE_HASH}</code> — click the matching VT record.</p>
    {#each VT_DB as v}
      <button class="pickrow" data-state={hashPick === v.hash ? (v.hash === SAMPLE_HASH ? 'correct' : 'wrong') : null} on:click={() => pickHash(v.hash)}>{v.hash} — {v.verdict}</button>
    {/each}
  </div>
{/if}
{#if entropyRevealed}
  <div class="objbox" style="margin-top:14px">
    <h4>Section entropy</h4>
    <p class="lede" style="font-size:13.5px;margin:0 0 8px">Click the section that signals packing (closest to 8.0 bits/byte).</p>
    {#each SECTIONS as s}
      <button class="pickrow" data-state={sectionPick === s.name ? (s.name === 'UPX1' ? 'correct' : 'wrong') : null} on:click={() => pickSection(s.name)}>{s.name.padEnd(8)} entropy {s.entropy.toFixed(2)}</button>
    {/each}
  </div>
{/if}

<div class="objbox" style="margin-top:16px">
  <h4>YARA rule — pick the match strings</h4>
  <div class="pktdetail">
    {#each CANDS as s}<label style="display:block;cursor:pointer"><input type="checkbox" bind:checked={yaraSel[s]}> {s}</label>{/each}
  </div>
  <div style="margin-top:10px"><button class="btn" on:click={testYara}>Test rule</button></div>
  <div class="pktdetail" style="margin-top:8px">{#if yaraResult}<span class={yaraResult.kind}>{yaraResult.text}</span>{:else}—{/if}</div>
</div>
<div class="hintbox"><b>The loop:</b> empty <code>strings</code> → escalate to <code>floss</code>; high section entropy → packed; hash → reputation (VT); then turn the unique artifacts into a YARA rule for hunting.</div>
