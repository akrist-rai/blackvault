<script>
  import { progress, setObj, toast } from '../stores/progress.js';

  const KEY = 0x5a;

  // ── Raw byte stream ───────────────────────────────────────────────────────
  const MSGS = [
    { op: 0x01, payload: 'ID=BV01' },
    { op: 0x02, payload: 'whoami' },
    { op: 0x03, payload: 'BV{pr0t0_r3}' },
  ];

  const OP_NAMES = { 1: 'BEACON', 2: 'EXEC', 3: 'EXFIL' };
  const OPCODES_INFO = {
    1: 'Heartbeat / registration. Payload contains the implant ID.',
    2: 'Command execution request. Payload is the shell command.',
    3: 'Data exfiltration. Payload contains a flag or stolen data.',
  };

  const bytes = [];
  const frames = [];
  MSGS.forEach(m => {
    const offset = bytes.length;
    const pl = m.payload.split('').map(c => c.charCodeAt(0) ^ KEY);
    bytes.push(0xBE, 0xEF, pl.length & 0xff, (pl.length >> 8) & 0xff, m.op);
    pl.forEach(b => bytes.push(b));
    frames.push({ offset, op: m.op, payloadLen: pl.length, payloadStart: offset + 5 });
  });

  // Annotated bytes: each byte has field info
  const annotated = bytes.map((b, i) => {
    for (const f of frames) {
      if (i === f.offset)     return { b, field: 'magic1', label: 'magic[0]' };
      if (i === f.offset + 1) return { b, field: 'magic2', label: 'magic[1]' };
      if (i === f.offset + 2) return { b, field: 'len1',   label: 'len[0]' };
      if (i === f.offset + 3) return { b, field: 'len2',   label: 'len[1]' };
      if (i === f.offset + 4) return { b, field: 'opcode', label: 'opcode' };
      if (i >= f.payloadStart && i < f.payloadStart + f.payloadLen)
                               return { b, field: 'payload', label: 'payload[' + (i - f.payloadStart) + ']' };
    }
    return { b, field: 'unknown', label: '?' };
  });

  const FIELD_COLORS = {
    magic1:  'var(--blood)',
    magic2:  'var(--blood)',
    len1:    'var(--amber)',
    len2:    'var(--amber)',
    opcode:  'var(--volt)',
    payload: 'var(--ash)',
    unknown: 'var(--rim)',
  };

  // Chunked for hex viewer (16 bytes per row)
  const hexRows = [];
  for (let i = 0; i < annotated.length; i += 16) {
    hexRows.push({ offset: i, bytes: annotated.slice(i, i + 16) });
  }

  // ── State ─────────────────────────────────────────────────────────────────
  let framed = false;
  let key = '';
  let decodeLines = null;
  let bruteLog = [];
  let bruteRunning = false;
  let hoveredByte = null;
  let pr_magic = '', pr_frames_str = '';

  $: {
    const k = key ? parseInt(key.replace(/0x/i, ''), 16) : NaN;
    if (!isNaN(k) && k >= 0 && k <= 255) {
      const lines = [];
      let i = 0;
      while (i < bytes.length) {
        if (bytes[i] === 0xBE && bytes[i+1] === 0xEF) {
          const len = bytes[i+2] | (bytes[i+3] << 8), op = bytes[i+4];
          let pl = '';
          for (let j = 0; j < len; j++) pl += String.fromCharCode(bytes[i+5+j] ^ k);
          lines.push({ ok: k === KEY && OP_NAMES[op], op, name: OP_NAMES[op] || ('op' + op), pl });
          i += 5 + len;
        } else i++;
      }
      decodeLines = lines;
      if (k === KEY) {
        setObj('protocol', 'key', progress);
        if (lines.some(l => /whoami|BV\{/.test(l.pl))) setObj('protocol', 'cmd', progress);
      }
    } else decodeLines = null;
  }

  async function brute() {
    bruteLog = [];
    bruteRunning = true;
    for (let k = 0; k < 256; k++) {
      const decoded = [];
      let i = 0, ok = true;
      while (i < bytes.length) {
        if (bytes[i] === 0xBE && bytes[i+1] === 0xEF) {
          const len = bytes[i+2] | (bytes[i+3] << 8), op = bytes[i+4];
          let pl = '';
          for (let j = 0; j < len; j++) {
            const ch = bytes[i+5+j] ^ k;
            if (ch < 32 || ch > 126) { ok = false; break; }
            pl += String.fromCharCode(ch);
          }
          if (!ok) break;
          decoded.push({ op, pl });
          i += 5 + len;
        } else { i++; }
      }
      const label = '0x' + k.toString(16).padStart(2, '0');
      if (ok && decoded.length === 3) {
        bruteLog = [...bruteLog, { kind: 'hl', text: label + ' → PRINTABLE: ' + decoded.map(d => '[' + d.pl + ']').join(' ') }];
        if (k === KEY) { key = '0x' + KEY.toString(16); break; }
      } else if (k % 32 === 0) {
        bruteLog = [...bruteLog, { kind: 'dim', text: label + ' → garbage' }];
      }
      if (k % 8 === 0) await new Promise(r => setTimeout(r, 0)); // yield
    }
    bruteRunning = false;
    toast('brute force complete — readable key found');
  }

  function checkFindings() {
    if (/be\s*ef/i.test(pr_magic.replace(/0x/ig, ''))) { setObj('protocol', 'magic', progress); } else if (pr_magic) toast('check again — the 2 repeating bytes that open every frame');
    if (pr_frames_str.trim() === String(MSGS.length)) { setObj('protocol', 'frames', progress); } else if (pr_frames_str) toast('count the BE EF markers in the stream');
    toast('findings checked');
  }
</script>

<p class="lede" style="margin-top:0">Raw capture of an undocumented C2 protocol. Reverse the frame grammar from the bytes — no RFC exists. Find the magic, the framing, the key, and decode the operator commands.</p>

<!-- Annotated Hex Viewer -->
<div class="repane">
  <h5>raw byte stream — {bytes.length} bytes · hover a byte to inspect · color key below</h5>
  <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:10px;font-size:11px;font-family:var(--mono)">
    {#each Object.entries(FIELD_COLORS) as [f, c]}
      <span style="color:{c}">■ {f}</span>
    {/each}
  </div>
  <div class="asm" style="max-height:200px">
    {#each hexRows as row}
      <div class="row">
        <span class="a">{row.offset.toString(16).padStart(4, '0')}</span>
        <span style="font-family:var(--mono);font-size:12px">
          {#each row.bytes as ab, i}
            <span
              style="color:{FIELD_COLORS[ab.field]};cursor:default;margin-right:2px"
              title="{ab.label} = 0x{ab.b.toString(16).padStart(2,'0')}"
              on:mouseenter={() => hoveredByte = ab}
              on:mouseleave={() => hoveredByte = null}
            >{ab.b.toString(16).padStart(2,'0')}</span>{i === 7 ? ' ' : ''}
          {/each}
        </span>
        <span class="cm">{row.bytes.map(ab => ab.b >= 32 && ab.b < 127 ? String.fromCharCode(ab.b) : '.').join('')}</span>
      </div>
    {/each}
  </div>
  {#if hoveredByte}
    <div class="hexinspect" style="margin-top:8px">
      <span class="hl">byte 0x{hoveredByte.b.toString(16).padStart(2,'0')} ({hoveredByte.b})</span>
      — field: <span style="color:{FIELD_COLORS[hoveredByte.field]}">{hoveredByte.label}</span>
      {#if hoveredByte.field === 'payload'}
        — XOR with key 0x5a → '{String.fromCharCode(hoveredByte.b ^ KEY)}' (if key correct)
      {/if}
    </div>
  {:else}
    <div class="hexinspect" style="margin-top:8px;color:var(--rim)">hover a byte to inspect it</div>
  {/if}
</div>

<!-- Frame Structure Diagram -->
<div class="repane" style="margin-top:14px">
  <h5>frame structure</h5>
  <pre class="pcode" style="font-size:12px">Frame grammar (reverse-engineered):

  ┌────────┬────────┬─────────────────┬────────┬───────────────────────┐
  │ magic  │ magic  │   length (2 B   │ opcode │     payload           │
  │  0xBE  │  0xEF  │   little-endian)│  1 B   │   (XOR-encrypted)     │
  └────────┴────────┴─────────────────┴────────┴───────────────────────┘
    byte 0    byte 1    bytes 2–3         byte 4    bytes 5 … 5+len-1

  Opcodes: 0x01 = BEACON  ·  0x02 = EXEC  ·  0x03 = EXFIL
  Encryption: single-byte XOR (key unknown → find it)</pre>
</div>

<!-- Tools -->
<div class="qchips" style="margin-top:12px">
  <button on:click={() => framed = true}>Auto-frame stream</button>
  <button on:click={brute} disabled={bruteRunning}>{bruteRunning ? 'brute-forcing…' : 'Brute-force XOR key (0x00–0xFF)'}</button>
</div>

{#if framed}
  <div class="pktdetail" style="margin-top:10px">
    {#each MSGS as m, i}
      <div>Frame {i+1}: magic=BE EF  len={m.payload.length}  opcode=0x0{m.op} ({OP_NAMES[m.op] || '?'})  payload[{m.payload.length}]={bytes.slice(frames[i].payloadStart, frames[i].payloadStart + m.payload.length).map(b => b.toString(16).padStart(2,'0')).join(' ')}</div>
    {/each}
  </div>
{/if}

{#if bruteLog.length}
  <div class="logview" style="margin-top:10px;max-height:160px">
    {#each bruteLog as l}<div class={l.kind}>{l.text}</div>{/each}
  </div>
{/if}

<!-- XOR Key Input -->
<div style="display:flex;align-items:center;gap:10px;margin-top:14px">
  <span style="font-family:var(--mono);font-size:12px;color:var(--ash)">decode key (hex):</span>
  <input class="lab-sel" style="width:90px" placeholder="try 5a" bind:value={key}>
</div>

<!-- Decoded Output -->
{#if decodeLines}
  <div class="pktdetail" style="margin-top:10px">
    <div class="dim">decoded with key 0x{parseInt(key.replace(/0x/i,''), 16).toString(16)}:</div>
    {#each decodeLines as l}
      <div class={l.ok ? 'hl' : 'dim'}>
        [{l.name}] {l.pl}
        {#if l.ok && OPCODES_INFO[l.op]}<span style="color:var(--ash)"> — {OPCODES_INFO[l.op]}</span>{/if}
      </div>
    {/each}
    {#if parseInt(key.replace(/0x/i,''), 16) === KEY}
      <div class="hl" style="margin-top:6px">✓ key correct — all frames decoded</div>
    {/if}
  </div>
{/if}

<!-- Findings -->
<div class="objbox" style="margin-top:16px">
  <h4>Submit findings</h4>
  <div class="findform">
    <div><label>Frame magic (hex)</label><input placeholder="2 bytes" bind:value={pr_magic} autocomplete="off"></div>
    <div><label># of frames</label><input placeholder="count" bind:value={pr_frames_str} autocomplete="off"></div>
  </div>
  <div style="margin-top:10px"><button class="btn" on:click={checkFindings}>Check</button></div>
</div>

<div class="hintbox"><b>RE the grammar:</b> look for a constant 2-byte sequence that repeats to find frame boundaries. A 2-byte little-endian length field bounds each payload. The opcode is one byte. XOR encryption is symmetric — if XOR(b, k) = ciphertext, then XOR(ciphertext, k) = plaintext. Brute 0x00–0xFF and look for the key that makes all payloads printable ASCII.</div>
