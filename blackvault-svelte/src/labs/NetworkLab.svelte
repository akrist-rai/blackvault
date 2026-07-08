<script>
  import { progress, setObj, toast } from '../stores/progress.js';

  const FLOWS = [
    ['10.0.2.15', '142.250.72.196:443', 'TLS', 'browsing', ''],
    ['10.0.2.15', '185.220.101.47:443', 'TLS', 'beacon', 't=0,61,119,182,240 (Δ≈60s, low jitter)'],
    ['10.0.2.15', '93.184.216.34:80', 'HTTP', 'GET /update.bin', 'response starts 4D 5A (MZ)'],
    ['10.0.2.15', '10.0.2.3:53', 'DNS', 'queries', 'normal'],
  ];

  let out = null;
  function beacon() { out = [
    { kind: '', text: 'Inter-arrival analysis per destination:' },
    { kind: '', text: '  142.250.72.196  irregular (human browsing)' },
    { kind: 'hl', text: '  185.220.101.47  Δ = 61,58,63,58 s  → periodic beacon (~60s), <10% jitter → C2' },
  ]; }
  function ja3() { out = [
    { kind: '', text: 'JA3 of TLS client → 185.220.101.47:' },
    { kind: '', text: '  a0e9f5d64349fb13191bc781f81f42e1' },
    { kind: 'hl', text: '  match: known Cobalt-Strike default profile.' },
  ]; setObj('network', 'ja3', progress); }
  function carve() { out = [
    { kind: '', text: 'Reassembling HTTP body of GET /update.bin:' },
    { kind: 'hl', text: '  4D 5A 90 00 03 00 ...  → "MZ" → a Windows PE executable was downloaded.' },
  ]; setObj('network', 'file', progress); }

  let n_host = '', n_int = '';
  function checkFindings() {
    if (/185\.220\.101\.47/.test(n_host)) setObj('network', 'beacon', progress); else if (n_host) toast('which dst has periodic timing?');
    if (/^\s*60\s*s?\s*$/i.test(n_int) || n_int.trim() === '60') setObj('network', 'interval', progress); else if (n_int) toast('average the deltas (~?)');
  }
</script>

<p class="lede" style="margin-top:0">Four flows. One is a C2 — find it by its rhythm, not its content.</p>
<div class="repane">
  <h5>flow table</h5>
  <table class="kv">
    <thead><tr><th>src</th><th>dst</th><th>proto</th><th>info</th><th>timing/notes</th></tr></thead>
    <tbody>
    {#each FLOWS as f}
      <tr><td>{f[0]}</td><td>{f[1]}</td><td>{f[2]}</td><td>{f[3]}</td><td class={f[4].includes('beacon') || f[4].includes('MZ') ? 'tag-bad' : ''}>{f[4]}</td></tr>
    {/each}
    </tbody>
  </table>
</div>
<div class="qchips" style="margin-top:12px">
  <button on:click={beacon}>analyze beaconing</button>
  <button on:click={ja3}>lookup JA3</button>
  <button on:click={carve}>carve transferred file</button>
</div>
<div class="pktdetail" style="margin-top:12px">{#if out}{#each out as l}<div class={l.kind}>{l.text}</div>{/each}{:else}run an analysis…{/if}</div>
<div class="objbox" style="margin-top:16px">
  <h4>Submit findings</h4>
  <div class="findform">
    <div><label>Beaconing C2 host</label><input placeholder="ip" bind:value={n_host}></div>
    <div><label>Beacon interval (s)</label><input placeholder="seconds" bind:value={n_int}></div>
  </div>
  <div style="margin-top:10px"><button class="btn" on:click={checkFindings}>Check</button></div>
</div>
<div class="hintbox"><b>Beaconing:</b> malware that phones home on a timer shows near-constant inter-arrival gaps (low jitter) — invisible to payload inspection but obvious in timing. JA3 fingerprints the TLS client; carving reassembles transferred files (here an MZ/PE).</div>
