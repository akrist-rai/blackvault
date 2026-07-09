<script>
  import { progress, setObj } from '../stores/progress.js';

  const b = new Array(512).fill(0);
  for (let i = 0; i < 0x20; i++) b[i] = [0xEB, 0x63, 0x90][i % 3];
  [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A].forEach((v, i) => b[0x20 + i] = v);
  const e1 = 0x1BE; b[e1] = 0x80; b[e1 + 4] = 0x07; b[e1 + 8] = 0x00; b[e1 + 9] = 0x08; b[e1 + 12] = 0x00; b[e1 + 13] = 0x20; b[e1 + 14] = 0x03;
  const e2 = 0x1CE; b[e2 + 4] = 0x83; b[e2 + 8] = 0x00; b[e2 + 9] = 0x28; b[e2 + 10] = 0x03;
  b[0x1FE] = 0x55; b[0x1FF] = 0xAA;

  function le32(o) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0; }
  const PTYPE = { 0x07: 'NTFS / exFAT', 0x83: 'Linux', 0x0b: 'FAT32', 0xee: 'GPT protective', 0x82: 'Linux swap' };

  function zoneOf(o) {
    if (o === 0x1FE || o === 0x1FF) return 'sig';
    if (o === e1 + 4) return 'fstype';
    if (o >= e1 + 8 && o <= e1 + 11) return 'lba';
    if (o >= 0x20 && o <= 0x27) return 'carve';
    return null;
  }

  const rows = [];
  for (let o = 0; o < 512; o += 16) {
    const bytes = [];
    let asc = '';
    for (let i = 0; i < 16; i++) {
      const off = o + i, v = b[off];
      bytes.push({ off, hex: v.toString(16).padStart(2, '0'), zone: zoneOf(off) });
      asc += (v >= 32 && v < 127) ? String.fromCharCode(v) : '.';
    }
    const hot = (o >= 0x1B0 && o < 0x200) || (o >= 0x20 && o < 0x30);
    rows.push({ addr: o.toString(16).padStart(4, '0'), bytes, asc, hot });
  }

  $: done = $progress.labs?.disk || {};

  let inspectLines = null;
  function inspect(o) {
    const z = zoneOf(o);
    if (z === 'sig') {
      inspectLines = [{ kind: 'hl', text: 'Boot signature @ 0x1FE-0x1FF: ' + b[0x1FE].toString(16).toUpperCase().padStart(2, '0') + ' ' + b[0x1FF].toString(16).toUpperCase().padStart(2, '0') + ' — must read 55 AA or the BIOS won\'t treat this sector as bootable.' }];
      setObj('disk', 'sig', progress);
    } else if (z === 'fstype') {
      const type = b[e1 + 4];
      inspectLines = [{ kind: 'hl', text: 'Partition #1 type byte @ 0x' + (e1 + 4).toString(16) + ': 0x' + type.toString(16).padStart(2, '0') + ' → ' + (PTYPE[type] || 'unknown') }];
      setObj('disk', 'fstype', progress);
    } else if (z === 'lba') {
      inspectLines = [{ kind: 'hl', text: 'Partition #1 start LBA @ 0x' + (e1 + 8).toString(16) + ' (4 bytes, little-endian): ' + le32(e1 + 8) }];
      setObj('disk', 'lba', progress);
    } else if (z === 'carve') {
      const sig = b.slice(0x20, 0x28).map(x => x.toString(16).padStart(2, '0')).join(' ');
      inspectLines = [{ kind: '', text: 'bytes @ 0x20: ' + sig }, { kind: 'hl', text: '→ 89 50 4E 47 0D 0A 1A 0A  =  \\x89PNG  →  PNG image' }];
      setObj('disk', 'carve', progress);
    } else {
      inspectLines = [{ kind: 'dim', text: 'byte @ 0x' + o.toString(16).padStart(4, '0') + ': 0x' + b[o].toString(16).padStart(2, '0') + ' — not part of a structure tracked here. Try the highlighted rows.' }];
    }
  }
</script>

<p class="lede" style="margin-top:0">Raw hex of a 512-byte MBR. Click bytes in the highlighted rows to inspect them — each correct find unlocks an objective.</p>
<div class="repane">
  <h5>sector hexdump (512 bytes) — click a byte</h5>
  <div class="asm" style="max-height:340px">
    {#each rows as r}
      <div class="row">
        <span class="a">{r.addr}</span>
        <span class={r.hot ? 'mn' : 'by'}>{#each r.bytes as byte}<span class="hexbyte" data-hit={byte.zone && done[byte.zone] ? 1 : 0} on:click={() => inspect(byte.off)}>{byte.hex}</span>{' '}{/each}</span>
        <span class="cm">{r.asc}</span>
      </div>
    {/each}
  </div>
</div>
<div class="hexinspect">
  {#if inspectLines}{#each inspectLines as l}<div class={l.kind}>{l.text}</div>{/each}{:else}click any byte above to inspect it…{/if}
</div>
<div class="hintbox"><b>Reading the table:</b> each 16-byte partition entry is [bootflag][CHS×3][type][CHS×3][LBA start ×4 LE][sectors ×4 LE]. The two bytes at 0x1FE must be <code>55 AA</code> or the BIOS won't boot it. The carved file's magic sits right after the boot code, at 0x20.</div>
