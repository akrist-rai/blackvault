<script>
  import { progress, setObj, toast } from '../stores/progress.js';

  const FLOWS = [
    { src: '10.0.2.15', dst: '142.250.72.196:443', proto: 'TLS', info: 'browsing', notes: '' },
    { src: '10.0.2.15', dst: '185.220.101.47:443', proto: 'TLS', info: 'repeated connections', notes: 't = 0, 61, 119, 182, 240 s' },
    { src: '10.0.2.15', dst: '93.184.216.34:80', proto: 'HTTP', info: 'GET /update.bin', notes: 'response starts 4D 5A 90 00 03 00 ...' },
    { src: '10.0.2.15', dst: '10.0.2.3:53', proto: 'DNS', info: 'queries', notes: 'normal' },
  ];
  const KNOWN_JA3 = [
    { name: 'Chrome 120 (benign)', hash: 'e7d705a3286e19ea42f587b344ee6865' },
    { name: 'Cobalt Strike default beacon', hash: 'a0e9f5d64349fb13191bc781f81f42e1' },
    { name: 'Metasploit Meterpreter', hash: '72a589da586844d7f0818ce684948eea' },
  ];
  const TARGET_JA3 = 'a0e9f5d64349fb13191bc781f81f42e1';
  const INTERVALS = [30, 45, 60, 90, 120];
  const FILETYPES = ['ELF', 'PE', 'PNG', 'ZIP'];

  let beaconPick = null, beaconDone = false;
  let intervalPick = null;
  let ja3Revealed = false, ja3Pick = null;
  let carveRevealed = false, carvePick = null;

  function pickBeacon(i) {
    beaconPick = i;
    if (i === 1) { beaconDone = true; setObj('network', 'beacon', progress); }
    else toast('look at the timing column, not the protocol');
  }
  function pickInterval(v) {
    intervalPick = v;
    if (v === 60) setObj('network', 'interval', progress);
    else toast('average the gaps between t=0,61,119,182,240 — try again');
  }
  function pickJa3(hash) {
    ja3Pick = hash;
    if (hash === TARGET_JA3) setObj('network', 'ja3', progress);
    else toast('that JA3 doesn\'t match the capture — check again');
  }
  function pickFiletype(t) {
    carvePick = t;
    if (t === 'PE') setObj('network', 'file', progress);
    else toast('4D 5A is a specific, well-known magic number — look it up');
  }
</script>

<p class="lede" style="margin-top:0">Four flows. Click the one that's a C2 beacon — by its rhythm, not its content.</p>
<div class="repane">
  <h5>flow table — click the beacon</h5>
  <table class="kv">
    <thead><tr><th></th><th>src</th><th>dst</th><th>proto</th><th>info</th><th>timing/notes</th></tr></thead>
    <tbody>
    {#each FLOWS as f, i}
      <tr class="hexbyte" data-hit={beaconPick === i && beaconDone ? 1 : 0} on:click={() => pickBeacon(i)}>
        <td>{beaconPick === i ? (beaconDone ? '✓' : '✗') : ''}</td><td>{f.src}</td><td>{f.dst}</td><td>{f.proto}</td><td>{f.info}</td><td>{f.notes}</td>
      </tr>
    {/each}
    </tbody>
  </table>
</div>

{#if beaconDone}
  <div class="objbox" style="margin-top:14px">
    <h4>Beacon interval</h4>
    <p style="color:var(--ash);font-size:13.5px;margin:0 0 8px">Connections at t = 0, 61, 119, 182, 240 s. Click the closest average interval.</p>
    <div class="qchips">{#each INTERVALS as v}<button class:mn={intervalPick === v} on:click={() => pickInterval(v)}>{v}s</button>{/each}</div>
  </div>
{/if}

<div class="objbox" style="margin-top:14px">
  <h4>JA3 fingerprint</h4>
  {#if !ja3Revealed}
    <button class="btn" on:click={() => ja3Revealed = true}>Extract JA3 from the beacon's TLS ClientHello</button>
  {:else}
    <p class="lede" style="font-size:13.5px;margin:0 0 8px">Captured: <code>{TARGET_JA3}</code> — click the known profile that matches.</p>
    {#each KNOWN_JA3 as j}
      <button class="pickrow" data-state={ja3Pick === j.hash ? (j.hash === TARGET_JA3 ? 'correct' : 'wrong') : null} on:click={() => pickJa3(j.hash)}>{j.name} — {j.hash}</button>
    {/each}
  {/if}
</div>

<div class="objbox" style="margin-top:14px">
  <h4>Carve the transferred file</h4>
  {#if !carveRevealed}
    <button class="btn" on:click={() => carveRevealed = true}>Reassemble HTTP body of GET /update.bin</button>
  {:else}
    <p class="lede" style="font-size:13.5px;margin:0 0 8px">Bytes: <code>4D 5A 90 00 03 00 ...</code> — click the file type this magic number means.</p>
    <div class="qchips">{#each FILETYPES as t}<button class:mn={carvePick === t} on:click={() => pickFiletype(t)}>{t}</button>{/each}</div>
  {/if}
</div>

<div class="hintbox"><b>Beaconing:</b> malware that phones home on a timer shows near-constant inter-arrival gaps (low jitter) — invisible to payload inspection but obvious in timing. JA3 fingerprints the TLS client; carving reassembles transferred files by magic bytes.</div>
