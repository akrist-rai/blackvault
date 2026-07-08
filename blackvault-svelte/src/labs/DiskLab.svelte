<script>
  import { progress, setObj, toast } from '../stores/progress.js';

  const b = new Array(512).fill(0);
  for (let i = 0; i < 0x20; i++) b[i] = [0xEB, 0x63, 0x90][i % 3];
  [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A].forEach((v, i) => b[0x20 + i] = v);
  const e1 = 0x1BE; b[e1] = 0x80; b[e1 + 4] = 0x07; b[e1 + 8] = 0x00; b[e1 + 9] = 0x08; b[e1 + 12] = 0x00; b[e1 + 13] = 0x20; b[e1 + 14] = 0x03;
  const e2 = 0x1CE; b[e2 + 4] = 0x83; b[e2 + 8] = 0x00; b[e2 + 9] = 0x28; b[e2 + 10] = 0x03;
  b[0x1FE] = 0x55; b[0x1FF] = 0xAA;

  function le32(o) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0; }
  const PTYPE = { 0x07: 'NTFS / exFAT', 0x83: 'Linux', 0x0b: 'FAT32', 0xee: 'GPT protective', 0x82: 'Linux swap' };

  const rows = [];
  for (let o = 0; o < 512; o += 16) {
    let hex = '', asc = '';
    for (let i = 0; i < 16; i++) { const v = b[o + i]; hex += v.toString(16).padStart(2, '0') + ' '; asc += (v >= 32 && v < 127) ? String.fromCharCode(v) : '.'; }
    const hot = (o >= 0x1B0 && o < 0x200) || (o >= 0x20 && o < 0x30);
    rows.push({ addr: o.toString(16).padStart(4, '0'), hex, asc, hot });
  }

  let out = null;
  function parseTable() {
    let lines = [{ kind: '', text: 'Partition table @ 0x1BE (4 × 16 bytes):' }];
    [0x1BE, 0x1CE, 0x1DE, 0x1EE].forEach((o, i) => {
      const boot = b[o], type = b[o + 4], lba = le32(o + 8), sec = le32(o + 12);
      if (type === 0) { lines.push({ kind: '', text: '  #' + (i + 1) + ': (empty)' }); return; }
      lines.push({ kind: '', text: '  #' + (i + 1) + ': ' + (boot === 0x80 ? '[bootable] ' : '           ') + 'type=0x' + type.toString(16).padStart(2, '0') + ' (' + (PTYPE[type] || '?') + ')  startLBA=' + lba + '  sectors=' + sec });
    });
    lines.push({ kind: '', text: '' });
    lines.push({ kind: '', text: 'Boot signature @ 0x1FE: ' + b[0x1FE].toString(16).toUpperCase() + b[0x1FF].toString(16).toUpperCase() });
    out = lines;
  }
  function carve() {
    const sig = b.slice(0x20, 0x28).map(x => x.toString(16).padStart(2, '0')).join(' ');
    out = [{ kind: '', text: 'magic bytes @ 0x20:  ' + sig }, { kind: 'hl', text: '→ 89 50 4E 47 0D 0A 1A 0A  =  \\x89PNG  →  PNG image' }];
  }

  let d_sig = '', d_fs = '', d_lba = '', d_carve = '';
  function checkFindings() {
    if (/55\s*aa/i.test(d_sig.replace(/0x/ig, ''))) setObj('disk', 'sig', progress); else if (d_sig) toast('the last 2 bytes of the 512-byte sector');
    if (/ntfs/i.test(d_fs)) setObj('disk', 'fstype', progress); else if (d_fs) toast('type byte 0x07 maps to which FS?');
    if (d_lba.trim() === '2048') setObj('disk', 'lba', progress); else if (d_lba) toast("partition #1 startLBA from the table");
    if (/png/i.test(d_carve)) setObj('disk', 'carve', progress); else if (d_carve) toast('decode the magic 89 50 4E 47');
  }
</script>

<p class="lede" style="margin-top:0">Raw hex of a 512-byte MBR. The highlighted regions are the partition table (0x1BE) and a carved file header (0x20).</p>
<div class="repane">
  <h5>sector hexdump (512 bytes)</h5>
  <div class="asm" style="max-height:300px">
    {#each rows as r}
      <div class="row"><span class="a">{r.addr}</span><span class={r.hot ? 'mn' : 'by'}>{r.hex}</span><span class="cm">{r.asc}</span></div>
    {/each}
  </div>
</div>
<div class="qchips" style="margin-top:12px">
  <button on:click={parseTable}>parse partition table</button>
  <button on:click={carve}>carve file @ 0x20</button>
</div>
<div class="pktdetail" style="margin-top:12px">
  {#if out}{#each out as l}<div class={l.kind}>{l.text}</div>{/each}{:else}parse the table or carve the file…{/if}
</div>
<div class="objbox" style="margin-top:18px">
  <h4>Submit findings</h4>
  <div class="findform">
    <div><label>Boot signature (hex)</label><input placeholder="last 2 bytes" bind:value={d_sig}></div>
    <div><label>Partition 1 file system</label><input placeholder="type 0x07 → ?" bind:value={d_fs}></div>
    <div><label>Partition 1 start LBA</label><input placeholder="number" bind:value={d_lba}></div>
    <div><label>Carved file type</label><input placeholder="from the magic" bind:value={d_carve}></div>
  </div>
  <div style="margin-top:10px"><button class="btn" on:click={checkFindings}>Check findings</button></div>
</div>
<div class="hintbox"><b>Reading the table:</b> each 16-byte entry is [bootflag][CHS×3][type][CHS×3][LBA start ×4 LE][sectors ×4 LE]. The two bytes at 0x1FE must be <code>55 AA</code> or the BIOS won't boot it.</div>
