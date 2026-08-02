<script>
  import { progress, setObj, toast } from '../stores/progress.js';

  // ── Cipher helpers ─────────────────────────────────────────────────────────
  function caesar(s, k) { k = ((k % 26) + 26) % 26; return s.replace(/[a-z]/g, c => String.fromCharCode((c.charCodeAt(0) - 97 + k) % 26 + 97)).replace(/[A-Z]/g, c => String.fromCharCode((c.charCodeAt(0) - 65 + k) % 26 + 65)); }
  function xorStr(s, k) { let o = ''; for (let i = 0; i < s.length; i++) o += String.fromCharCode(s.charCodeAt(i) ^ k); return o; }
  function toHex(s) { let o = ''; for (let i = 0; i < s.length; i++) o += s.charCodeAt(i).toString(16).padStart(2, '0'); return o; }
  function fromHex(s) { s = s.replace(/[^0-9a-fA-F]/g, ''); let o = ''; for (let i = 0; i + 2 <= s.length; i += 2) o += String.fromCharCode(parseInt(s.substr(i, 2), 16)); return o; }
  function railFence(s, r) {
    const rails = Array.from({ length: r }, () => []);
    let rail = 0, dir = 1;
    for (const c of s) { rails[rail].push(c); if (rail === 0) dir = 1; if (rail === r - 1) dir = -1; rail += dir; }
    return rails.map(r => r.join('')).join('');
  }
  function fromRailFence(s, r) {
    const len = s.length, rails = Array.from({ length: r }, () => []);
    let rail = 0, dir = 1;
    const pattern = [];
    for (let i = 0; i < len; i++) { pattern.push(rail); if (rail === 0) dir = 1; if (rail === r - 1) dir = -1; rail += dir; }
    const counts = Array.from({ length: r }, (_, i) => pattern.filter(x => x === i).length);
    let pos = 0; const railStrs = counts.map(c => { const slice = s.slice(pos, pos + c); pos += c; return slice.split(''); });
    const ptrs = Array(r).fill(0);
    let out = '';
    for (let i = 0; i < len; i++) { const ri = pattern[i]; out += railStrs[ri][ptrs[ri]++]; }
    return out;
  }
  function vigenere(s, k, dec = false) {
    k = k.toUpperCase().replace(/[^A-Z]/g, '') || 'KEY';
    let ki = 0, out = '';
    for (const c of s) {
      if (/[A-Za-z]/.test(c)) {
        const base = c >= 'a' ? 97 : 65;
        const shift = k[ki % k.length].charCodeAt(0) - 65;
        out += String.fromCharCode((c.charCodeAt(0) - base + (dec ? 26 - shift : shift)) % 26 + base);
        ki++;
      } else out += c;
    }
    return out;
  }
  function guessEncoding(s) {
    if (!s) return '—';
    if (/^[0-9a-fA-F\s]+$/.test(s) && s.replace(/\s/g, '').length % 2 === 0) return 'Hex';
    if (/^[A-Za-z0-9+/]+=*$/.test(s) && s.length % 4 === 0) return 'Base64?';
    if (/^BV\{.+\}$/.test(s)) return 'FLAG!';
    if (/[^\x20-\x7e]/.test(s)) return 'Binary/non-printable';
    return 'ASCII';
  }

  // ── Challenges ────────────────────────────────────────────────────────────
  const CY = {
    rot:   { label: 'ROT / Caesar',    flag: 'BV{r0t_and_r0ll}',  enc: s => caesar(s, 7),  hint: 'Caesar cipher with a shift of 7. Decode with shift 19 or -7.' },
    b64:   { label: 'Base64 ×2',       flag: 'BV{b4se_st4ck}',    enc: s => btoa(btoa(s)),  hint: 'Double-encoded Base64. Apply "from Base64" twice.' },
    xor:   { label: 'Hex-XOR',         flag: 'BV{x0r_me_42}',     enc: s => toHex(xorStr(s, 0x42)), hint: 'Hex-encoded XOR (key 0x42). Do "from Hex" then "XOR key 0x42".' },
    rev:   { label: 'Reversed',        flag: 'BV{m1rror_m1rror}', enc: s => s.split('').reverse().join(''), hint: 'The string is reversed. Apply "Reverse".' },
    rail:  { label: 'Rail Fence (r=3)',flag: 'BV{r41l_f3nc3}',    enc: s => railFence(s, 3), hint: 'Rail fence cipher with 3 rails. Apply "Rail Fence decode r=3".' },
    vig:   { label: 'Vigenère',        flag: 'BV{v1g_n3r3_k3y}', enc: s => vigenere(s, 'BVKEY'), hint: 'Vigenère cipher with key BVKEY. Apply "Vigenère decode, key=BVKEY".' },
  };

  // ── State ─────────────────────────────────────────────────────────────────
  let buf = '';
  let history = []; // { op, before, after }
  let shift = '13';
  let xorKey = '';
  let vigKey = 'BVKEY';
  let railRails = '3';
  let activeChallenge = null;

  // detect flags whenever buf changes
  $: {
    Object.entries(CY).forEach(([k, c]) => {
      if (buf === c.flag) setObj('crypto', k, progress);
    });
  }

  $: encoding = guessEncoding(buf);
  $: entropy = (() => {
    if (!buf) return 0;
    const freq = {};
    for (const c of buf) freq[c] = (freq[c] || 0) + 1;
    return -Object.values(freq).reduce((a, f) => { const p = f / buf.length; return a + p * Math.log2(p); }, 0);
  })();

  function load(k) {
    const c = CY[k];
    const enc = c.enc(c.flag);
    buf = enc;
    history = [{ op: 'load ' + k, before: '', after: enc }];
    activeChallenge = k;
    toast('loaded: ' + c.label);
  }

  function op(name, fn) {
    try {
      const before = buf;
      const after = fn(buf);
      if (after === before) { toast('no change — check params or current buffer state'); return; }
      buf = after;
      history = [...history, { op: name, before: before.slice(0, 40) + (before.length > 40 ? '…' : ''), after: after.slice(0, 40) + (after.length > 40 ? '…' : '') }];
    } catch (e) { toast('operation failed on current buffer: ' + e.message); }
  }

  function undo() {
    if (history.length <= 1) { toast('nothing to undo'); return; }
    const prev = history[history.length - 2];
    buf = history.length === 2 ? prev.after : prev.after;
    // Find actual previous buf state from the step before
    if (history.length > 1) {
      const step = history[history.length - 1];
      // We stored before in step
      buf = history[history.length - 1].before.replace(/…$/, ''); // approximate — restore full before
      // Actually let's keep full history with full strings
    }
    history = history.slice(0, -1);
    toast('undone');
  }

  function clear() { buf = ''; history = []; activeChallenge = null; }

  // Better undo using full before values
  let fullHistory = [];
  function opFull(name, fn) {
    try {
      const before = buf;
      const after = fn(buf);
      if (after === before && !['rot13'].includes(name)) { toast('no change'); return; }
      buf = after;
      fullHistory = [...fullHistory, { op: name, buf: before }];
      history = [...history, { op: name, before: before.slice(0, 44) + (before.length > 44 ? '…' : ''), after: after.slice(0, 44) + (after.length > 44 ? '…' : '') }];
    } catch (e) { toast('failed: ' + e.message); }
  }

  function undoFull() {
    if (!fullHistory.length) { toast('nothing to undo'); return; }
    const last = fullHistory[fullHistory.length - 1];
    buf = last.buf;
    fullHistory = fullHistory.slice(0, -1);
    history = history.slice(0, -1);
    toast('↩ undone: ' + last.op);
  }

  function loadFull(k) {
    const c = CY[k];
    const enc = c.enc(c.flag);
    buf = enc; fullHistory = []; history = [{ op: 'load ' + k, before: '', after: enc.slice(0, 44) + (enc.length > 44 ? '…' : '') }];
    activeChallenge = k;
    toast('loaded: ' + c.label);
  }
  function clearFull() { buf = ''; fullHistory = []; history = []; activeChallenge = null; }
</script>

<!-- Challenge selector -->
<p class="lede" style="margin-top:0">A CyberChef-style decode workbench. Load a challenge, stack operations until a <code>BV{'{'}…{'}'}</code> flag emerges. Each operation is reversible — use ↩ Undo.</p>

<div class="repane">
  <h5>challenges — click to load</h5>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px">
    {#each Object.entries(CY) as [k, c]}
      <button class="pickrow" style="flex-direction:column;align-items:flex-start;gap:4px;padding:10px 12px"
              data-state={activeChallenge === k ? 'correct' : null}
              on:click={() => loadFull(k)}>
        <span style="font-size:12px;color:var(--volt);font-family:var(--mono)">{k}</span>
        <span style="font-size:13px">{c.label}</span>
      </button>
    {/each}
  </div>
</div>

<!-- Buffer display + status bar -->
<div class="repane" style="margin-top:14px">
  <h5>buffer — current value</h5>
  <div class="pktdetail" style="min-height:52px;word-break:break-all;font-size:13px;color:{buf.startsWith('BV{') ? 'var(--volt)' : 'inherit'};font-weight:{buf.startsWith('BV{') ? 700 : 400}">
    {buf || '(empty — load a challenge above)'}
    {#if buf.startsWith('BV{')}&ensp;🏁{/if}
  </div>
  <div style="display:flex;gap:20px;margin-top:6px;font-family:var(--mono);font-size:11px;color:var(--ash)">
    <span>len: {buf.length}</span>
    <span>encoding: <b style="color:var(--volt)">{encoding}</b></span>
    <span>entropy: {entropy.toFixed(2)} bits</span>
  </div>
</div>

<!-- Operations -->
<div class="repane" style="margin-top:14px">
  <h5>operations</h5>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px">
    <button class="pickrow" on:click={() => opFull('ROT13', b => caesar(b, 13))}>ROT13 (shift 13)</button>
    <div class="pickrow" style="gap:8px;padding:8px 12px">
      <button on:click={() => opFull('Caesar +' + shift, b => caesar(b, parseInt(shift || '0')))}>Caesar shift</button>
      <input class="lab-sel" style="width:52px" placeholder="±N" bind:value={shift}>
    </div>
    <button class="pickrow" on:click={() => opFull('from Base64', b => atob(b))}>from Base64</button>
    <button class="pickrow" on:click={() => opFull('to Base64', b => btoa(b))}>to Base64</button>
    <button class="pickrow" on:click={() => opFull('from Hex', b => fromHex(b))}>from Hex</button>
    <button class="pickrow" on:click={() => opFull('to Hex', b => toHex(b))}>to Hex</button>
    <div class="pickrow" style="gap:8px;padding:8px 12px">
      <button on:click={() => { const n = parseInt(xorKey.replace(/0x/i,''),16); if (!isNaN(n)) opFull('XOR 0x' + n.toString(16), b => xorStr(b, n & 0xff)); else toast('enter a hex key e.g. 42'); }}>XOR key</button>
      <input class="lab-sel" style="width:64px" placeholder="hex 42" bind:value={xorKey}>
    </div>
    <button class="pickrow" on:click={() => opFull('Reverse', b => b.split('').reverse().join(''))}>Reverse</button>
    <div class="pickrow" style="gap:8px;padding:8px 12px">
      <button on:click={() => opFull('Rail Fence decode r=' + railRails, b => fromRailFence(b, parseInt(railRails || '3')))}>Rail Fence decode</button>
      <input class="lab-sel" style="width:40px" placeholder="r" bind:value={railRails}>
    </div>
    <div class="pickrow" style="gap:8px;padding:8px 12px">
      <button on:click={() => opFull('Vigenère decode key=' + vigKey, b => vigenere(b, vigKey, true))}>Vigenère decode</button>
      <input class="lab-sel" style="width:70px" placeholder="key" bind:value={vigKey}>
    </div>
  </div>
  <div style="display:flex;gap:10px;margin-top:10px">
    <button class="btn" on:click={undoFull} disabled={!fullHistory.length}>↩ Undo</button>
    <button class="btn" on:click={clearFull}>Clear</button>
  </div>
</div>

<!-- Recipe history (operation stack) -->
{#if history.length}
  <div class="repane" style="margin-top:14px">
    <h5>operation history (recipe)</h5>
    <div class="logview" style="max-height:180px">
      {#each history as step, i}
        <div class={i === history.length - 1 ? 'hl' : 'dim'}>
          <span style="font-family:var(--mono);color:var(--volt);min-width:22px;display:inline-block">{i}</span>
          {step.op}
          {#if i > 0}→ <span style="color:var(--ash)">{step.after}</span>{/if}
        </div>
      {/each}
    </div>
  </div>
{/if}

<!-- Hint -->
{#if activeChallenge}
  <div class="hintbox">
    <b>{CY[activeChallenge]?.label} hint:</b> {CY[activeChallenge]?.hint}
  </div>
{:else}
  <div class="hintbox"><b>Tip:</b> XOR challenge → load hex ciphertext → "from Hex" → "XOR key" 0x42. Base64 challenge is double-encoded — apply "from Base64" twice. Rail Fence uses r=3 rails. Vigenère key is BVKEY.</div>
{/if}
