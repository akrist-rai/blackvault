<script>
  import { progress, setObj, toast } from '../stores/progress.js';

  let tab = 'elf';
  let b_magic = '', b_entry = '';
  let mcq = {};

  function check() {
    const mg = b_magic.toLowerCase(), en = b_entry.toLowerCase().replace(/\s/g, '');
    if ((tab === 'elf' && /elf|7f45/.test(mg)) || (tab === 'pe' && /(mz|pe|4d5a)/.test(mg))) setObj('binfmt', 'magic', progress); else if (mg) toast('read the first bytes of this tab');
    if ((tab === 'elf' && /0x?1060/.test(en)) || (tab === 'pe' && /0x?1500/.test(en))) setObj('binfmt', 'entry', progress); else if (en) toast('e_entry (ELF) / AddressOfEntryPoint (PE)');
  }
  function answer(key, correct) {
    mcq[key] = correct ? 'correct' : 'wrong';
    if (correct) setObj('binfmt', key, progress); else toast('not quite — re-read it');
  }
</script>

<div class="logtabs">
  <button aria-current={tab === 'elf'} on:click={() => tab = 'elf'}>ELF header</button>
  <button aria-current={tab === 'pe'} on:click={() => tab = 'pe'}>PE header</button>
</div>
<div class="repane">
  <h5>{tab === 'elf' ? 'ELF64 header bytes' : 'PE / MZ header bytes'}</h5>
  {#if tab === 'elf'}
    <div class="asm">
      <div class="row"><span class="a">0x00</span><span class="mn">7F 45 4C 46</span><span class="cm">  e_ident: magic = \x7fELF</span></div>
      <div class="row"><span class="a">0x04</span><span class="mn">02</span><span class="cm">  EI_CLASS = 2 → 64-bit</span></div>
      <div class="row"><span class="a">0x05</span><span class="mn">01</span><span class="cm">  EI_DATA = 1 → little-endian</span></div>
      <div class="row"><span class="a">0x10</span><span class="mn">03 00</span><span class="cm">  e_type = ET_DYN (PIE / shared obj)</span></div>
      <div class="row"><span class="a">0x12</span><span class="mn">3E 00</span><span class="cm">  e_machine = 0x3E → x86-64</span></div>
      <div class="row"><span class="a">0x18</span><span class="mn">60 10 00 00 ...</span><span class="cm">  e_entry = 0x1060</span></div>
    </div>
  {:else}
    <div class="asm">
      <div class="row"><span class="a">0x00</span><span class="mn">4D 5A</span><span class="cm">  DOS magic = "MZ"</span></div>
      <div class="row"><span class="a">0x3C</span><span class="mn">80 00 00 00</span><span class="cm">  e_lfanew → PE header @ 0x80</span></div>
      <div class="row"><span class="a">0x80</span><span class="mn">50 45 00 00</span><span class="cm">  "PE\0\0" signature</span></div>
      <div class="row"><span class="a">0x84</span><span class="mn">64 86</span><span class="cm">  Machine = 0x8664 → x86-64</span></div>
      <div class="row"><span class="a">0xA8</span><span class="mn">00 15 00 00</span><span class="cm">  AddressOfEntryPoint = 0x1500 (RVA)</span></div>
    </div>
  {/if}
</div>
<div class="objbox" style="margin-top:14px">
  <h4>Submit findings</h4>
  <div class="findform">
    <div><label>Format magic (this tab)</label><input placeholder="ELF or MZ/PE" bind:value={b_magic}></div>
    <div><label>Entry point (this tab)</label><input placeholder="0x...." bind:value={b_entry}></div>
  </div>
  <div style="margin-top:10px"><button class="btn" on:click={check}>Check</button></div>
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
