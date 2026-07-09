<script>
  import { progress, setObj } from '../stores/progress.js';

  const WIN = '0x401162';
  let fill = 0;
  let tgt = '';
  let canaryOn = false;

  $: canaryHit = canaryOn && fill > 16;
  $: needed = canaryOn ? 32 : 24; // buf(16) [+ canary(8) if on] + saved rbp(8) = ret offset
  $: overRbp = fill > 16 && !canaryHit;
  $: atRet = !canaryHit && fill === needed && !!tgt;
  $: overshoot = !canaryHit && fill > needed;

  $: msg = (() => {
    if (canaryHit) return { kind: 'err', text: '[!] *** stack smashing detected *** — the canary between buf and saved RBP was corrupted. The epilogue check aborts before ret ever runs, no matter what you put in the address field.' };
    if (atRet && tgt === WIN) { setObj('pwn', 'redirect', progress); return { kind: 'hl', text: "[+] payload = 'A'×24 + " + WIN + ' → saved RIP = win() → system("/bin/sh") → # got a shell!' }; }
    if (atRet) return { kind: 'err', text: '[!] you overwrote the return address with ' + tgt + ' → SIGSEGV. Aim those 8 bytes at win() (0x401162).' };
    if (overshoot) return { kind: 'err', text: '[!] overshot: ' + fill + ' filler bytes ran past the return slot. Use exactly ' + needed + ', then the address.' };
    if (fill > 16) return { kind: 'dim', text: 'into the saved RBP (' + fill + '/' + needed + '). A few more filler bytes reach the return address.' };
    return { kind: 'dim', text: 'buffer is ' + fill + '/16 full. Fill 16 (buf)' + (canaryOn ? ' + 8 (canary)' : '') + ' + 8 (saved RBP) = ' + needed + ', then pick an address.' };
  })();
  $: if (fill === needed && !canaryHit) setObj('pwn', 'offset', progress);
  $: if (canaryHit) setObj('pwn', 'canary', progress);
</script>

<pre class="pcode">void win() {'{'} system("/bin/sh"); {'}'}      <span class="cm">// lives at 0x401162, never called</span>
void vuln() {'{'} char buf[16]; gets(buf); {'}'}   <span class="cm">// gets() = no bounds check</span></pre>
<div class="qchips" style="margin:10px 0">
  <button class:mn={canaryOn} on:click={() => canaryOn = !canaryOn}>{canaryOn ? '🛡 stack canary: ON' : 'stack canary: OFF'} (click to toggle)</button>
</div>
<div class="rebench">
  <div class="repane">
    <h5>payload builder</h5>
    <div style="padding:14px;line-height:2">
      <span class="prog" style="color:var(--ash)">filler bytes ('A' × n)</span><br>
      <input type="number" class="lab-sel" style="width:90px" bind:value={fill}> <span class="prog" style="color:var(--ash)">→ buf 16{canaryOn ? ' + canary 8' : ''} + saved rbp 8 = {needed}</span><br>
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
      {#if canaryOn}<div class="srow {canaryHit ? 'ow' : ''}"><span>stack canary (8)</span><b>{canaryHit ? 'CORRUPTED' : 'intact'}</b></div>{/if}
      <div class="srow rbp {overRbp ? 'ow' : ''}"><span>saved RBP (8)</span><b>{overRbp ? 'clobbered' : 'intact'}</b></div>
      <div class="srow ret {(atRet || overshoot) ? 'ow' : ''}"><span>saved RIP / ret (8)</span><b>{canaryHit ? 'never reached' : (atRet ? tgt : (overshoot ? "'A'×8 (overshot)" : 'intact'))}</b></div>
      <div class="srow"><span>outcome →</span><b>{canaryHit ? 'aborted before ret' : (atRet && tgt === WIN ? 'win() → /bin/sh' : ((atRet || overshoot) ? 'crash (SIGSEGV)' : 'normal return'))}</b></div>
    </div>
  </div>
</div>
<div class="hintbox"><b>Offset:</b> saved return address = 16 (buffer) + 8 (saved RBP) = <code>24</code> filler bytes, then the 8-byte address, when there's no canary. Toggle the canary on and try the same overflow — watch it get caught before ret.</div>
