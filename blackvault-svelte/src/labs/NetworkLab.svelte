<script>
  import { progress, setObj, toast } from '../stores/progress.js';

  // ── Beacon timing data (simulated connections) ────────────────────────────
  const CONNS = [
    { t: 0,   src: '10.0.2.15', dst: '185.220.101.47:443', proto: 'TLS', bytes: 512,  info: 'ClientHello → C2 beacon #1' },
    { t: 61,  src: '10.0.2.15', dst: '185.220.101.47:443', proto: 'TLS', bytes: 488,  info: 'C2 beacon #2' },
    { t: 119, src: '10.0.2.15', dst: '185.220.101.47:443', proto: 'TLS', bytes: 501,  info: 'C2 beacon #3' },
    { t: 182, src: '10.0.2.15', dst: '185.220.101.47:443', proto: 'TLS', bytes: 494,  info: 'C2 beacon #4' },
    { t: 240, src: '10.0.2.15', dst: '185.220.101.47:443', proto: 'TLS', bytes: 511,  info: 'C2 beacon #5' },
  ];

  const FLOWS = [
    { id: 0, src: '10.0.2.15', dst: '142.250.72.196:443',  proto: 'TLS',  bytes: 18421, duration: '11m', info: 'Google — browsing traffic',       beacon: false },
    { id: 1, src: '10.0.2.15', dst: '185.220.101.47:443',  proto: 'TLS',  bytes: 2506,  duration: '4m',  info: 'Repeated ~60s connections',         beacon: true  },
    { id: 2, src: '10.0.2.15', dst: '93.184.216.34:80',    proto: 'HTTP', bytes: 86232, duration: '8s',  info: 'GET /update.bin → dropper DL',      beacon: false },
    { id: 3, src: '10.0.2.15', dst: '8.8.8.8:53',          proto: 'DNS',  bytes: 320,   duration: '—',   info: 'Standard DNS resolution',           beacon: false },
    { id: 4, src: '10.0.2.15', dst: '104.21.44.91:443',    proto: 'TLS',  bytes: 4410,  duration: '2m',  info: 'Cloudflare CDN — normal',           beacon: false },
  ];

  // JA3 data
  const JA3_RAW = {
    version: 'TLS 1.2 (0x0303)',
    ciphers: [0x0035, 0x002f, 0xc013, 0xc014, 0x009c, 0x009d],
    extensions: [0x0000, 0x000a, 0x000b, 0x0023, 0xff01],
    curves: [0x0017, 0x0018],
    formats: [0x00],
    hash: 'a0e9f5d64349fb13191bc781f81f42e1',
  };

  const JA3_DB = [
    { hash: 'e7d705a3286e19ea42f587b344ee6865', name: 'Chrome 120',              verdict: 'benign',    detail: 'Standard browser fingerprint — widely seen.' },
    { hash: 'a0e9f5d64349fb13191bc781f81f42e1', name: 'Cobalt Strike default',   verdict: 'malicious', detail: 'Default malleable C2 profile — matches capture.' },
    { hash: '72a589da586844d7f0818ce684948eea', name: 'Metasploit Meterpreter',  verdict: 'malicious', detail: 'Meterpreter reverse_https handler fingerprint.' },
    { hash: '6734f37431670b3ab4292b8f60f29984', name: 'curl / wget (default)',   verdict: 'benign',    detail: 'Command-line HTTP clients — often in automation.' },
  ];

  // HTTP carving
  const HTTP_HEX = '4d 5a 90 00 03 00 00 00  04 00 00 00 ff ff 00 00\nb8 00 00 00 00 00 00 00  40 00 00 00 00 00 00 00\n00 00 00 00 00 00 00 00  00 00 00 00 00 00 00 00\n00 00 00 00 00 00 00 00  00 00 00 00 e8 00 00 00\n0e 1f ba 0e 00 b4 09 cd  21 b8 01 4c cd 21 54 68\n69 73 20 70 72 6f 67 72  61 6d 20 63 61 6e 6e 6f\n74 20 62 65 20 72 75 6e  20 69 6e 20 44 4f 53 20';

  // ── State ─────────────────────────────────────────────────────────────────
  let selectedFlow = null;
  let beaconRevealed = false;
  let ja3Revealed = false;
  let ja3Pick = null;
  let carveRevealed = false;
  let carvePick = null;
  let intervalPick = null;

  const SVG_W = 560, SVG_H = 80, PAD = 40;
  const maxT = 260;
  function tx(t) { return PAD + (t / maxT) * (SVG_W - PAD * 2); }
  const DOT_Y = SVG_H / 2;

  function pickFlow(f) {
    selectedFlow = f.id;
    if (f.beacon) {
      setObj('network', 'beacon', progress);
      toast('✓ C2 beacon identified — now measure the interval');
      beaconRevealed = true;
    } else {
      toast('look at the timing column — which host has near-constant intervals?');
    }
  }

  function pickInterval(v) {
    intervalPick = v;
    if (v === 60) { setObj('network', 'interval', progress); toast('✓ ~60s interval — evasion-aware jitter keeps it under radar'); }
    else toast('average the gaps: 61, 58, 63, 58 → ~60s');
  }

  function pickJa3(entry) {
    ja3Pick = entry.hash;
    if (entry.hash === JA3_RAW.hash) {
      setObj('network', 'ja3', progress);
      toast('✓ JA3 matched to Cobalt Strike default profile');
    } else {
      toast('wrong profile — check the hash against the capture');
    }
  }

  function revealCarve() { carveRevealed = true; }
  function pickCarve(t) {
    carvePick = t;
    if (t === 'PE') { setObj('network', 'file', progress); toast('✓ 4D 5A = MZ header → Windows PE executable'); }
    else toast('4D 5A is the PE/MZ magic — look it up');
  }

  const INTERVALS_OPTS = [30, 45, 60, 90, 120];
  const FILETYPES = ['ELF', 'PE', 'PNG', 'ZIP', 'PDF'];
</script>

<p class="lede" style="margin-top:0">Five flows from a capture file. Work through each section to identify the C2, its interval, its TLS fingerprint, and what it downloaded.</p>

<!-- Flow Table -->
<div class="repane">
  <h5>flow table — click the C2 beacon (hint: timing, not payload)</h5>
  <table class="pkts">
    <thead><tr><th></th><th>Source</th><th>Destination</th><th>Proto</th><th>Bytes</th><th>Duration</th><th>Info</th></tr></thead>
    <tbody>
      {#each FLOWS as f}
        <tr data-sel={selectedFlow === f.id ? 1 : 0}
            class:beacon-row={f.beacon && selectedFlow === f.id}
            on:click={() => pickFlow(f)}>
          <td>{selectedFlow === f.id ? (f.beacon ? '✓' : '✗') : ''}</td>
          <td>{f.src}</td><td>{f.dst}</td>
          <td class="pr-{f.proto}">{f.proto}</td>
          <td>{f.bytes.toLocaleString()}</td>
          <td>{f.duration}</td>
          <td>{f.info}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<!-- Beacon Timeline Chart -->
{#if beaconRevealed}
<div class="repane" style="margin-top:14px">
  <h5>beacon timeline — connection timestamps (seconds from first seen)</h5>
  <svg width={SVG_W} height={SVG_H} style="display:block;overflow:visible">
    <!-- axis -->
    <line x1={PAD} y1={DOT_Y} x2={SVG_W - PAD} y2={DOT_Y} stroke="var(--rim)" stroke-width="1"/>
    {#each CONNS as c, i}
      <!-- tick mark -->
      <line x1={tx(c.t)} y1={DOT_Y - 6} x2={tx(c.t)} y2={DOT_Y + 6} stroke="var(--volt)" stroke-width="2"/>
      <!-- dot -->
      <circle cx={tx(c.t)} cy={DOT_Y} r="5" fill="var(--volt)" opacity="0.9"/>
      <!-- label -->
      <text x={tx(c.t)} y={DOT_Y - 14} text-anchor="middle" font-size="10" fill="var(--ash)" font-family="var(--mono)">t={c.t}s</text>
      <!-- interval arrow between dots -->
      {#if i > 0}
        {@const prev = CONNS[i - 1]}
        {@const mid = (tx(c.t) + tx(prev.t)) / 2}
        {@const dt = c.t - prev.t}
        <text x={mid} y={DOT_Y + 20} text-anchor="middle" font-size="9" fill="var(--rim)" font-family="var(--mono)">+{dt}s</text>
      {/if}
    {/each}
    <!-- axis labels -->
    <text x={PAD} y={SVG_H - 4} font-size="10" fill="var(--ash)" font-family="var(--mono)">0s</text>
    <text x={SVG_W - PAD} y={SVG_H - 4} text-anchor="end" font-size="10" fill="var(--ash)" font-family="var(--mono)">{maxT}s</text>
  </svg>
  <p style="color:var(--ash);font-size:13px;margin:8px 0 0">Gaps: +61, +58, +63, +58 seconds. Click the closest average interval:</p>
  <div class="qchips">
    {#each INTERVALS_OPTS as v}
      <button class:mn={intervalPick === v} on:click={() => pickInterval(v)}>{v}s</button>
    {/each}
  </div>
</div>
{/if}

<!-- JA3 Fingerprint -->
<div class="objbox" style="margin-top:14px">
  <h4>JA3 / TLS fingerprint</h4>
  {#if !ja3Revealed}
    <button class="btn" on:click={() => ja3Revealed = true}>Extract JA3 from beacon ClientHello</button>
  {:else}
    <div class="repane" style="margin-bottom:12px">
      <h5>ClientHello fields used for JA3</h5>
      <table class="kv">
        <tbody>
          <tr><td>SSL Version</td><td><code>{JA3_RAW.version}</code></td></tr>
          <tr><td>Cipher Suites</td><td><code>{JA3_RAW.ciphers.map(x => '0x' + x.toString(16).padStart(4,'0')).join(', ')}</code></td></tr>
          <tr><td>Extensions</td><td><code>{JA3_RAW.extensions.map(x => '0x' + x.toString(16).padStart(4,'0')).join(', ')}</code></td></tr>
          <tr><td>Elliptic Curves</td><td><code>{JA3_RAW.curves.map(x => '0x' + x.toString(16).padStart(4,'0')).join(', ')}</code></td></tr>
          <tr><td>EC Point Formats</td><td><code>{JA3_RAW.formats.map(x => '0x' + x.toString(16).padStart(2,'0')).join(', ')}</code></td></tr>
          <tr><td style="color:var(--volt)"><b>JA3 MD5</b></td><td><code style="color:var(--volt)">{JA3_RAW.hash}</code></td></tr>
        </tbody>
      </table>
    </div>
    <p style="color:var(--ash);font-size:13.5px;margin:0 0 8px">Click the profile that matches this hash:</p>
    {#each JA3_DB as entry}
      <button class="pickrow"
              data-state={ja3Pick === entry.hash ? (entry.verdict === 'malicious' && entry.hash === JA3_RAW.hash ? 'correct' : (entry.hash === JA3_RAW.hash ? 'correct' : 'wrong')) : null}
              on:click={() => pickJa3(entry)}>
        <span style="font-family:var(--mono);font-size:12px;color:var(--ash)">{entry.hash}</span>
        <span style="margin-left:12px;color:{entry.verdict === 'malicious' ? 'var(--blood)' : 'var(--ash)'}">{entry.name}</span>
        {#if ja3Pick === entry.hash}<span style="margin-left:8px;color:var(--volt)">→ {entry.detail}</span>{/if}
      </button>
    {/each}
  {/if}
</div>

<!-- HTTP Carving -->
<div class="objbox" style="margin-top:14px">
  <h4>Carve the transferred file</h4>
  {#if !carveRevealed}
    <button class="btn" on:click={revealCarve}>Reassemble HTTP body of GET /update.bin</button>
  {:else}
    <div class="pktdetail" style="margin:8px 0;font-size:12px;line-height:1.7">{HTTP_HEX}</div>
    <p style="color:var(--ash);font-size:13.5px;margin:4px 0 8px">First two bytes are <code>4D 5A</code>. What file type?</p>
    <div class="qchips">
      {#each FILETYPES as t}
        <button class:mn={carvePick === t} on:click={() => pickCarve(t)}>{t}</button>
      {/each}
    </div>
    {#if carvePick === 'PE'}<div class="hintbox" style="margin-top:10px"><b>4D 5A = MZ</b> — the DOS stub prefix of every Windows PE. The string "This program cannot be run in DOS mode" follows at 0x0e–0x3d.</div>{/if}
  {/if}
</div>

<div class="hintbox"><b>Reading the chart:</b> malware beacons show low-jitter periodic intervals — consistent timing is the tell, not payload content. JA3 fingerprints the TLS client from fields in the ClientHello that an attacker rarely bothers to randomise. The dropped PE is only visible if you carve HTTP objects from the capture.</div>

<style>
  .beacon-row td { color: var(--volt); }
</style>
