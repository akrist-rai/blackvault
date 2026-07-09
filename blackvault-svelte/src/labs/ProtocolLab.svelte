<script>
  import { progress, setObj, toast } from '../stores/progress.js';

  const KEY = 0x5a;
  const MSGS = [[0x01, 'ID=BV01'], [0x02, 'whoami'], [0x03, 'BV{pr0t0_r3}']];
  const bytes = [];
  MSGS.forEach(m => {
    const pl = m[1].split('').map(c => c.charCodeAt(0) ^ KEY);
    bytes.push(0xBE, 0xEF, pl.length & 0xff, (pl.length >> 8) & 0xff, m[0]);
    pl.forEach(b => bytes.push(b));
  });
  const hexStr = bytes.map(b => b.toString(16).padStart(2, '0')).join(' ');

  let out = null;
  let key = '';

  function parse() {
    const lines = [];
    const b = bytes; let i = 0, n = 0;
    while (i < b.length) {
      if (b[i] === 0xBE && b[i + 1] === 0xEF) {
        const len = b[i + 2] | (b[i + 3] << 8), op = b[i + 4];
        lines.push({ kind: '', text: 'frame ' + (++n) + ': magic BE EF  len=' + len + '  opcode=0x0' + op + '  payload[' + len + ']' });
        i += 5 + len;
      } else i++;
    }
    lines.push({ kind: '', text: '' });
    lines.push({ kind: '', text: '→ framing = [BE EF][len:2 LE][opcode:1][payload:len]' });
    out = lines;
  }
  function computeDecode(k) {
    const b = bytes; let i = 0;
    const names = { 1: 'BEACON', 2: 'EXEC', 3: 'EXFIL' };
    const lines = [{ kind: '', text: 'decoded with key 0x' + k.toString(16) + ':' }];
    while (i < b.length) {
      if (b[i] === 0xBE && b[i + 1] === 0xEF) {
        const len = b[i + 2] | (b[i + 3] << 8), op = b[i + 4];
        let pl = ''; for (let j = 0; j < len; j++) pl += String.fromCharCode(b[i + 5 + j] ^ k);
        lines.push({ kind: 'hl', text: '[' + (names[op] || ('op' + op)) + '] ' + pl });
        i += 5 + len;
      } else i++;
    }
    return lines;
  }
  // Live-decode as the key changes — no submit button, immediate feedback like a real brute-force loop.
  $: {
    const k = key ? parseInt(key.replace(/0x/i, ''), 16) : NaN;
    if (!isNaN(k)) {
      const lines = computeDecode(k);
      out = lines;
      if (k === KEY) {
        setObj('protocol', 'key', progress);
        if (lines.some(l => /whoami|BV\{/.test(l.text))) setObj('protocol', 'cmd', progress);
      }
    }
  }

  let pr_magic = '', pr_frames = '';
  function checkFindings() {
    if (/be\s*ef/i.test(pr_magic.replace(/0x/ig, ''))) setObj('protocol', 'magic', progress); else if (pr_magic) toast('the 2 bytes that start every frame');
    if (pr_frames.trim() === String(MSGS.length)) setObj('protocol', 'frames', progress); else if (pr_frames) toast('count the BE EF markers');
  }
</script>

<p class="lede" style="margin-top:0">A raw capture of a custom C2 protocol. No RFC — reverse the structure from the bytes.</p>
<div class="pktdetail" style="margin-top:0">{hexStr}</div>
<div class="qchips" style="margin-top:12px">
  <button on:click={parse}>auto-frame</button>
  <span class="dim">decode key (live):</span>
  <input class="lab-sel" style="width:80px" placeholder="try 5a" bind:value={key}>
</div>
<div class="pktdetail" style="margin-top:12px">{#if out}{#each out as l}<div class={l.kind}>{l.text}</div>{/each}{:else}find the magic, the framing, then the key…{/if}</div>
<div class="objbox" style="margin-top:16px">
  <h4>Submit findings</h4>
  <div class="findform">
    <div><label>Frame magic (hex)</label><input placeholder="2 bytes" bind:value={pr_magic}></div>
    <div><label># of frames</label><input placeholder="count" bind:value={pr_frames}></div>
  </div>
  <div style="margin-top:10px"><button class="btn" on:click={checkFindings}>Check</button></div>
</div>
<div class="hintbox"><b>Reverse the grammar:</b> look for a repeating magic to find frame boundaries, a length field (here 2 bytes LE) to bound each message, an opcode (the command vocabulary), then break the payload obfuscation — XOR 0x5A here. Hooking the encrypt function with Frida would hand you the key directly.</div>
