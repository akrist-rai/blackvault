<script>
  import { progress, setObj, toast } from '../stores/progress.js';

  function caesar(s, k) { k = ((k % 26) + 26) % 26; return s.replace(/[a-z]/g, c => String.fromCharCode((c.charCodeAt(0) - 97 + k) % 26 + 97)).replace(/[A-Z]/g, c => String.fromCharCode((c.charCodeAt(0) - 65 + k) % 26 + 65)); }
  function xorStr(s, k) { let o = ''; for (let i = 0; i < s.length; i++) o += String.fromCharCode(s.charCodeAt(i) ^ k); return o; }
  function toHex(s) { let o = ''; for (let i = 0; i < s.length; i++) o += s.charCodeAt(i).toString(16).padStart(2, '0'); return o; }
  function fromHex(s) { s = s.replace(/[^0-9a-fA-F]/g, ''); let o = ''; for (let i = 0; i + 2 <= s.length; i += 2) o += String.fromCharCode(parseInt(s.substr(i, 2), 16)); return o; }

  const CY = {
    rot: { flag: 'BV{r0t_and_r0ll}', enc: () => caesar('BV{r0t_and_r0ll}', 7) },
    b64: { flag: 'BV{b4se_st4ck}', enc: () => btoa(btoa('BV{b4se_st4ck}')) },
    xor: { flag: 'BV{x0r_me_42}', enc: () => toHex(xorStr('BV{x0r_me_42}', 0x42)) },
    rev: { flag: 'BV{m1rror_m1rror}', enc: () => 'BV{m1rror_m1rror}'.split('').reverse().join('') },
  };

  let buf = '';
  let shift = '13';
  let xorKey = '';

  $: {
    Object.keys(CY).forEach(k => { if (buf === CY[k].flag) setObj('crypto', k, progress); });
  }

  function load(w) { buf = CY[w].enc(); toast('loaded ' + w + ' challenge'); }
  function op(o) {
    try {
      if (o === 'clear') buf = '';
      else if (o === 'rot13') buf = caesar(buf, 13);
      else if (o === 'caesar') buf = caesar(buf, parseInt(shift || '0', 10) || 0);
      else if (o === 'b64') buf = atob(buf);
      else if (o === 'hex') buf = fromHex(buf);
      else if (o === 'xor') { const n = parseInt(xorKey.replace(/0x/i, ''), 16); if (!isNaN(n)) buf = xorStr(buf, n & 0xff); }
      else if (o === 'rev') buf = buf.split('').reverse().join('');
    } catch (e) { toast('that op failed on the current buffer'); }
  }
</script>

<p class="lede" style="margin-top:0">A decode workbench (think CyberChef). Load a ciphertext, then stack operations on the buffer until a <code>BV{'{'}...{'}'}</code> flag falls out.</p>
<div class="qchips">
  {#each Object.keys(CY) as k}<button on:click={() => load(k)}>load {k} challenge</button>{/each}
</div>
<div class="pktdetail" style="margin-top:12px">{buf || '(empty — load a challenge above)'}</div>
<div class="qchips" style="margin-top:12px">
  <button on:click={() => op('rot13')}>ROT13</button>
  <button on:click={() => op('caesar')}>Caesar shift</button><input class="lab-sel" style="width:54px" bind:value={shift}>
  <button on:click={() => op('b64')}>from Base64</button>
  <button on:click={() => op('hex')}>from Hex</button>
  <button on:click={() => op('xor')}>XOR key</button><input class="lab-sel" style="width:64px" placeholder="hex 42" bind:value={xorKey}>
  <button on:click={() => op('rev')}>Reverse</button>
  <button on:click={() => op('clear')}>Clear</button>
</div>
<div class="hintbox"><b>Tips:</b> the XOR challenge loads as hex → do <code>from Hex</code>, then <code>XOR</code> key <code>42</code>. The Base64 challenge is wrapped twice. The ROT cipher is a Caesar +7 (decode with shift <code>19</code> or <code>-7</code>).</div>
