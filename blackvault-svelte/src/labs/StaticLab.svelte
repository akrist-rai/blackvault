<script>
  import { progress, setObj, toast } from '../stores/progress.js';

  const CANDS = ['!This program cannot be run in DOS mode', 'UPX1', 'http://cdn-telemetry.xyz/p.bin', 'Global\\BV-MTX', 'schtasks /create /tn Updater'];

  let out = null;
  function run(w) {
    if (w === 'strings') out = [
      { kind: '', text: '$ strings sample.bin | head' },
      { kind: '', text: '  !This program cannot be run in DOS mode' },
      { kind: '', text: '  UPX0' },
      { kind: '', text: '  UPX1' },
      { kind: 'dim', text: '  ...mostly non-printable. Almost no readable strings → suspect packing; escalate to FLOSS.' },
    ];
    else if (w === 'floss') out = [
      { kind: '', text: '$ floss sample.bin   (decodes stack/obfuscated strings)' },
      { kind: 'hl', text: '  http://cdn-telemetry.xyz/p.bin' },
      { kind: '', text: '  Global\\BV-MTX' },
      { kind: '', text: '  schtasks /create /tn Updater /sc minute' },
      { kind: 'dim', text: '  FLOSS recovered the strings the packer hid.' },
    ];
    else if (w === 'sha256') { out = [
      { kind: '', text: '$ sha256sum sample.bin' },
      { kind: '', text: '  9f2c...e41a  sample.bin' },
      { kind: '', text: '  VirusTotal: ' }, { kind: 'hl', text: '  51 / 72 engines detect (Trojan.Win32.Injector)' },
    ]; setObj('static', 'hash', progress); }
    else if (w === 'entropy') { out = [
      { kind: '', text: '$ section entropy' },
      { kind: '', text: '  .text  6.40' },
      { kind: '', text: '  .rdata 5.10' },
      { kind: 'hl', text: '  UPX1  7.92  ← near-8.0 = compressed/encrypted → PACKED' },
    ]; setObj('static', 'packed', progress); }
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

  let st_c2 = '';
  function checkC2() { if (st_c2.toLowerCase().includes('cdn-telemetry')) setObj('static', 'c2', progress); else if (st_c2) toast('FLOSS revealed an http URL'); }
</script>

<p class="lede" style="margin-top:0">The static triage loop — never run the sample. Each tool answers (or redirects) a question.</p>
<div class="qchips">
  <button on:click={() => run('strings')}>strings</button>
  <button on:click={() => run('floss')}>floss</button>
  <button on:click={() => run('sha256')}>sha256 + VT</button>
  <button on:click={() => run('entropy')}>entropy</button>
</div>
<div class="pktdetail" style="margin-top:12px">{#if out}{#each out as l}<div class={l.kind}>{l.text}</div>{/each}{:else}run a tool…{/if}</div>
<div class="objbox" style="margin-top:16px">
  <h4>YARA rule — pick the match strings</h4>
  <div class="pktdetail">
    {#each CANDS as s}<label style="display:block;cursor:pointer"><input type="checkbox" bind:checked={yaraSel[s]}> {s}</label>{/each}
  </div>
  <div style="margin-top:10px"><button class="btn" on:click={testYara}>Test rule</button></div>
  <div class="pktdetail" style="margin-top:8px">{#if yaraResult}<span class={yaraResult.kind}>{yaraResult.text}</span>{:else}—{/if}</div>
</div>
<div class="objbox" style="margin-top:14px">
  <h4>Submit findings</h4>
  <div class="findform"><div class="full"><label>C2 URL / host</label><input placeholder="from FLOSS" bind:value={st_c2}></div></div>
  <div style="margin-top:10px"><button class="btn" on:click={checkC2}>Check</button></div>
</div>
<div class="hintbox"><b>The loop:</b> empty <code>strings</code> → escalate to <code>floss</code>; high section entropy → packed; hash → reputation (VT); then turn the unique artifacts into a YARA rule for hunting.</div>
