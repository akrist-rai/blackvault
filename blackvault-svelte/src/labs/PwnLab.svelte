<script>
  import { progress, setObj, toast } from '../stores/progress.js';

  const WIN = '0x401162';
  let fill = 0;
  let tgt = '';
  let canaryPicked = null;

  $: overRbp = fill > 16;
  $: atRet = fill === 24 && !!tgt;
  $: overshoot = fill > 24;
  $: retVal = atRet ? tgt : (overshoot ? "'A'×8 (overshot)" : 'intact');

  $: msg = (() => {
    if (atRet && tgt === WIN) { setObj('pwn', 'redirect', progress); return { kind: 'hl', text: "[+] payload = 'A'×24 + " + WIN + ' → saved RIP = win() → system("/bin/sh") → # got a shell!' }; }
    if (atRet) return { kind: 'err', text: '[!] you overwrote the return address with ' + tgt + ' → SIGSEGV. Aim those 8 bytes at win() (0x401162).' };
    if (fill > 24) return { kind: 'err', text: '[!] overshot: ' + fill + ' filler bytes ran past the return slot. Use exactly 24, then the address.' };
    if (fill > 16) return { kind: 'dim', text: 'into the saved RBP (' + fill + '/24). A few more filler bytes reach the return address.' };
    return { kind: 'dim', text: 'buffer is ' + fill + '/16 full. Fill 16 (buf) + 8 (saved RBP) = 24, then pick an address.' };
  })();
  $: if (fill === 24) setObj('pwn', 'offset', progress);

  function pickCanary(correct) {
    canaryPicked = correct;
    if (correct) { setObj('pwn', 'canary', progress); toast('correct — the canary check aborts before ret'); }
    else toast('not quite — re-read the options');
  }
</script>

<pre class="pcode">void win() {'{'} system("/bin/sh"); {'}'}      <span class="cm">// lives at 0x401162, never called</span>
void vuln() {'{'} char buf[16]; gets(buf); {'}'}   <span class="cm">// gets() = no bounds check</span></pre>
<div class="rebench" style="margin-top:12px">
  <div class="repane">
    <h5>payload builder</h5>
    <div style="padding:14px;line-height:2">
      <span class="prog" style="color:var(--ash)">filler bytes ('A' × n)</span><br>
      <input type="number" class="lab-sel" style="width:90px" bind:value={fill}> <span class="prog" style="color:var(--ash)">→ buf 16 + saved rbp 8 = 24</span><br>
      <span class="prog" style="color:var(--ash)">then overwrite saved RIP with</span><br>
      <select class="lab-sel" bind:value={tgt}>
        <option value="">— pick an address —</option>
        <option value="0x401162">0x401162  &lt;win&gt;</option>
        <option value="0x401050">0x401050  &lt;printf&gt;</option>
        <option value="0x41414141">0x41414141  (AAAA)</option>
      </select><br>
      <div class="verdict {msg.kind === 'hl' ? 'ok' : (msg.kind === 'err' ? 'no' : '')}" style="margin-top:10px">{msg.text}</div>
    </div>
  </div>
  <div class="repane">
    <h5>the stack (high → low)</h5>
    <div class="stack">
      <div class="srow buf {fill > 0 ? 'ow' : ''}"><span>char buf[16]</span><b>{fill >= 16 ? "'A'×16 (full)" : "'A'×" + fill}</b></div>
      <div class="srow rbp {overRbp ? 'ow' : ''}"><span>saved RBP (8)</span><b>{overRbp ? 'clobbered' : 'intact'}</b></div>
      <div class="srow ret {(atRet || overshoot) ? 'ow' : ''}"><span>saved RIP / ret (8)</span><b>{retVal}</b></div>
      <div class="srow"><span>ret jumps to →</span><b>{atRet && tgt === WIN ? 'win() → /bin/sh' : ((atRet || overshoot) ? 'crash (SIGSEGV)' : 'normal return')}</b></div>
    </div>
  </div>
</div>
<div class="objbox" style="margin-top:18px">
  <h4>Concept check</h4>
  <p style="color:var(--ash);font-size:14px;margin:0 0 8px">A stack canary is now compiled in. Why does this exploit break?</p>
  <button class="opt" on:click={() => pickCanary(false)}><b>A</b>Nothing changes, it still works</button>
  <button class="opt" on:click={() => pickCanary(true)}><b>B</b>A random value sits between buf and saved RIP; overflowing corrupts it, and it's checked before ret → abort</button>
  <button class="opt" on:click={() => pickCanary(false)}><b>C</b>gets() becomes bounds-checked</button>
</div>
<div class="hintbox"><b>Offset:</b> saved return address = 16 (buffer) + 8 (saved RBP) = <code>24</code> filler bytes, then the 8-byte address. Point it at <code>win()</code> = <code>0x401162</code>.</div>
