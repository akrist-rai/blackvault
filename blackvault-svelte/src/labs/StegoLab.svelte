<script>
  import { progress, setObj, toast } from '../stores/progress.js';

  const STG = { appendFlag: 'BV{4pp3nd3d_z1p}', metaFlag: 'BV{m3ta_h1des}', lsbFlag: 'BV{lsb_b1ts}' };
  let tab = 'append';

  // ── APPEND ────────────────────────────────────────────────────────────────
  const appendBytes = [];
  for (let i = 0; i < 16; i++) appendBytes.push({ hex: (i % 2 ? 0x00 : 0xFF).toString(16).padStart(2, '0'), kind: '' });
  appendBytes.push({ hex: 'ff', kind: 'eof' }, { hex: 'd9', kind: 'eof' });
  const zipHeader = [0x50, 0x4B, 0x03, 0x04];
  zipHeader.forEach(v => appendBytes.push({ hex: v.toString(16).padStart(2, '0'), kind: 'zip' }));
  for (const ch of 'secret.txt' + STG.appendFlag) appendBytes.push({ hex: ch.charCodeAt(0).toString(16).padStart(2, '0'), kind: 'zip', ch });
  let appendRevealed = false;
  function clickAppendByte(b) {
    if (b.kind === 'eof') { toast('found the EOF marker — but the interesting bytes are AFTER it'); return; }
    if (b.kind === 'zip') { appendRevealed = true; setObj('stego', 'append', progress); }
  }

  // ── METADATA ──────────────────────────────────────────────────────────────
  const EXIF = [
    { field: 'Make', value: 'Canon' },
    { field: 'Model', value: 'EOS R6' },
    { field: 'Software', value: 'GIMP 2.10' },
    { field: 'DateTime', value: '2026:05:12 14:03:11' },
    { field: 'User Comment', value: STG.metaFlag, isFlag: true },
    { field: 'GPS Position', value: '(stripped)' },
  ];
  let exifOpen = {};
  function openExif(i) {
    exifOpen[i] = true;
    if (EXIF[i].isFlag) setObj('stego', 'meta', progress);
  }

  // ── LSB ───────────────────────────────────────────────────────────────────
  let lsbChars = [...STG.lsbFlag].map((ch, i) => ({ ch, i, revealed: false }));
  let lsbRevealedCount = 0;
  function clickPixel(idx) {
    if (lsbChars[idx].revealed) return;
    lsbChars = lsbChars.map((c, i) => i === idx ? { ...c, revealed: true } : c);
    lsbRevealedCount++;
    if (lsbRevealedCount === lsbChars.length) setObj('stego', 'lsb', progress);
  }
  $: lsbSoFar = lsbChars.map(c => c.revealed ? c.ch : '·').join('');
</script>

<p class="lede" style="margin-top:0">One file, three hiding spots. Inspect each one for real — nothing is revealed until you find it.</p>
<div class="logtabs">
  <button aria-current={tab === 'append'} on:click={() => tab = 'append'}>appended data</button>
  <button aria-current={tab === 'meta'} on:click={() => tab = 'meta'}>metadata</button>
  <button aria-current={tab === 'lsb'} on:click={() => tab = 'lsb'}>pixel LSBs</button>
</div>

{#if tab === 'append'}
  <p class="lede" style="font-size:14px">Click past the JPEG's end-of-image marker (<code>FF D9</code>) to see what's appended after it.</p>
  <div class="repane">
    <h5>photo.jpg — tail bytes</h5>
    <div class="asm">
      <div class="row"><span class="a">…</span><span class="by">{#each appendBytes as b}<span class="hexbyte" class:mn={b.kind === 'eof'} data-hit={b.kind === 'zip' && appendRevealed ? 1 : 0} on:click={() => clickAppendByte(b)}>{b.hex}</span>{' '}{/each}</span></div>
    </div>
  </div>
  <div class="hexinspect">
    {#if appendRevealed}<div class="hl">carved past FF D9 → a ZIP local file header (50 4B 03 04) → secret.txt → {STG.appendFlag}</div>{:else}click bytes to explore — the amber pair is the EOF marker, but EOF isn't the finding.{/if}
  </div>
{:else if tab === 'meta'}
  <p class="lede" style="font-size:14px">Click through the EXIF fields — one of them isn't like the others.</p>
  <table class="kv">
    <tbody>
      {#each EXIF as f, i}
        <tr><td style="width:160px">{f.field}</td><td class="hexbyte" on:click={() => openExif(i)}>{exifOpen[i] ? f.value : '••••••••'}</td></tr>
      {/each}
    </tbody>
  </table>
{:else}
  <p class="lede" style="font-size:14px">Each swatch is one pixel's carried character — click them in order to decode the LSB-hidden message.</p>
  <div class="pixgrid">
    {#each lsbChars as cell}
      <div class="pixel" data-read={cell.revealed ? 1 : 0} style="background:hsl({(cell.i * 47) % 360},55%,{cell.revealed ? 45 : 30}%)" on:click={() => clickPixel(cell.i)} title="pixel {cell.i}"></div>
    {/each}
  </div>
  <div class="pktdetail">decoded so far: <span class="hl">{lsbSoFar}</span></div>
{/if}

<div class="hintbox"><b>Real reflexes:</b> always check for data after the format's EOF marker (<code>binwalk</code>, <code>foremost</code>), read metadata (<code>exiftool</code>), and for images suspect the least-significant bits when file size looks off vs. content.</div>
