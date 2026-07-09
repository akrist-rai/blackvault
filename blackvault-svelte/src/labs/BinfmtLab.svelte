<script>
  import { progress, setObj, toast } from '../stores/progress.js';

  function buildHeader(len, fields) {
    const b = new Array(len).fill(0);
    const zone = new Array(len).fill(null);
    fields.forEach((f, fi) => {
      f.bytes.forEach((v, i) => { b[f.off + i] = v; zone[f.off + i] = fi; });
    });
    const rows = [];
    for (let o = 0; o < len; o += 16) {
      const bytes = [];
      let asc = '';
      for (let i = 0; i < 16 && o + i < len; i++) {
        const off = o + i, v = b[off];
        bytes.push({ off, hex: v.toString(16).padStart(2, '0'), fi: zone[off] });
        asc += (v >= 32 && v < 127) ? String.fromCharCode(v) : '.';
      }
      rows.push({ addr: o.toString(16).padStart(4, '0'), bytes, asc });
    }
    return { rows, fields };
  }

  const ELF = buildHeader(0x20, [
    { off: 0x00, bytes: [0x7F, 0x45, 0x4C, 0x46], key: 'magic', text: 'e_ident: magic = \\x7fELF' },
    { off: 0x04, bytes: [0x02], text: 'EI_CLASS = 2 → 64-bit' },
    { off: 0x05, bytes: [0x01], text: 'EI_DATA = 1 → little-endian' },
    { off: 0x10, bytes: [0x03, 0x00], text: 'e_type = ET_DYN (PIE / shared obj)' },
    { off: 0x12, bytes: [0x3E, 0x00], text: 'e_machine = 0x3E → x86-64' },
    { off: 0x18, bytes: [0x60, 0x10, 0x00, 0x00], key: 'entry', text: 'e_entry = 0x1060' },
  ]);
  const PE = buildHeader(0xAC, [
    { off: 0x00, bytes: [0x4D, 0x5A], key: 'magic', text: 'DOS magic = "MZ"' },
    { off: 0x3C, bytes: [0x80, 0x00, 0x00, 0x00], text: 'e_lfanew → PE header @ 0x80' },
    { off: 0x80, bytes: [0x50, 0x45, 0x00, 0x00], key: 'magic', text: '"PE\\0\\0" signature' },
    { off: 0x84, bytes: [0x64, 0x86], text: 'Machine = 0x8664 → x86-64' },
    { off: 0xA8, bytes: [0x00, 0x15, 0x00, 0x00], key: 'entry', text: 'AddressOfEntryPoint = 0x1500 (RVA)' },
  ]);

  let tab = 'elf';
  $: header = tab === 'elf' ? ELF : PE;
  $: done = $progress.labs?.binfmt || {};

  let inspectText = null;
  function inspect(fi) {
    if (fi == null) { inspectText = { kind: 'dim', text: 'just a zero-filled gap byte — not part of a labeled field.' }; return; }
    const f = header.fields[fi];
    inspectText = { kind: 'hl', text: f.text };
    if (f.key) setObj('binfmt', f.key, progress);
  }

  let mcq = {};
  function answer(key, correct) {
    mcq[key] = correct ? 'correct' : 'wrong';
    if (correct) setObj('binfmt', key, progress); else toast('not quite — re-read it');
  }
</script>

<div class="logtabs">
  <button aria-current={tab === 'elf'} on:click={() => { tab = 'elf'; inspectText = null; }}>ELF header</button>
  <button aria-current={tab === 'pe'} on:click={() => { tab = 'pe'; inspectText = null; }}>PE header</button>
</div>
<div class="repane">
  <h5>{tab === 'elf' ? 'ELF64 header bytes' : 'PE / MZ header bytes'} — click a byte</h5>
  <div class="asm" style="max-height:260px">
    {#each header.rows as r}
      <div class="row">
        <span class="a">{r.addr}</span>
        <span class="by">{#each r.bytes as byte}<span class="hexbyte" class:mn={byte.fi != null} data-hit={byte.fi != null && header.fields[byte.fi].key && done[header.fields[byte.fi].key] ? 1 : 0} on:click={() => inspect(byte.fi)}>{byte.hex}</span>{' '}{/each}</span>
        <span class="cm">{r.asc}</span>
      </div>
    {/each}
  </div>
</div>
<div class="hexinspect">
  {#if inspectText}<div class={inspectText.kind}>{inspectText.text}</div>{:else}click a byte above — highlighted fields (colored) are worth inspecting…{/if}
</div>
<div class="objbox" style="margin-top:14px">
  <h4>Concepts</h4>
  <p style="color:var(--ash);font-size:14px;margin:0 0 8px">To map a binary into memory, the OS loader reads…</p>
  <button class="opt" data-state={mcq.loader} on:click={() => answer('loader', false)}><b>A</b>section headers</button>
  <button class="opt" data-state={mcq.loader} on:click={() => answer('loader', true)}><b>B</b>program headers / segments</button>
  <button class="opt" data-state={mcq.loader} on:click={() => answer('loader', false)}><b>C</b>the symbol table</button>
  <p style="color:var(--ash);font-size:14px;margin:12px 0 8px">A section with entropy ≈ 7.9 and an odd name like UPX1 signals…</p>
  <button class="opt" data-state={mcq.packed} on:click={() => answer('packed', true)}><b>A</b>compression/encryption → packed</button>
  <button class="opt" data-state={mcq.packed} on:click={() => answer('packed', false)}><b>B</b>a debug build</button>
  <button class="opt" data-state={mcq.packed} on:click={() => answer('packed', false)}><b>C</b>a driver</button>
</div>
<div class="hintbox"><b>Key split:</b> the linker/analysis tools use <i>sections</i> (.text/.data); the OS loader maps <i>segments</i> (program headers, PT_LOAD). GOT/PLT: the PLT is a per-import stub, the GOT is the table the loader fills with resolved addresses.</div>

<style>
  .opt[data-state="correct"] { border-color: var(--jade); color: var(--jade); }
  .opt[data-state="wrong"] { border-color: var(--blood); color: var(--blood); }
</style>
