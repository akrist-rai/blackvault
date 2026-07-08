<script>
  import { progress, setObj, toast } from '../stores/progress.js';
  const funCode = `int FUN_00401500(char *param_1) {
  int local_c = 0;
  while (param_1[local_c] != 0) {
    param_1[local_c] = param_1[local_c] ^ 0x2a;
    local_c = local_c + 1;
  }
  return local_c;
}`;
  let mcq = {};
  function answer(key, correct) {
    mcq[key] = correct ? 'correct' : 'wrong';
    if (correct) setObj('ghidra', key, progress); else toast('not quite — re-read it');
  }
</script>

<p class="lede" style="margin-top:0">Decompiler output rarely has names. Read past the noise.</p>
<div class="repane">
  <h5>decompiler — FUN_00401500</h5>
  <pre class="pcode">{funCode}</pre>
</div>
<div class="objbox" style="margin-top:14px">
  <h4>What does FUN_00401500 do?</h4>
  <button class="opt" data-state={mcq.logic} on:click={() => answer('logic', false)}><b>A</b>Computes a CRC32</button>
  <button class="opt" data-state={mcq.logic} on:click={() => answer('logic', true)}><b>B</b>XOR-decrypts a string in place with key 0x2a and returns its length</button>
  <button class="opt" data-state={mcq.logic} on:click={() => answer('logic', false)}><b>C</b>Compares two strings</button>
</div>
<div class="objbox" style="margin-top:14px">
  <h4>Recover the struct from these accesses</h4>
  <pre class="pcode" style="margin-bottom:8px"><span class="cm">// *(int *)(p + 0x0)   *(char **)(p + 0x8)   *(int *)(p + 0x10)</span></pre>
  <button class="opt" data-state={mcq.struct} on:click={() => answer('struct', false)}><b>A</b>{'{'} int a; int b; int c; {'}'}  // 12 bytes</button>
  <button class="opt" data-state={mcq.struct} on:click={() => answer('struct', true)}><b>B</b>{'{'} int id; char *name; int flags; {'}'}  // 0x18 bytes (8-byte aligned pointer)</button>
  <button class="opt" data-state={mcq.struct} on:click={() => answer('struct', false)}><b>C</b>{'{'} char buf[16]; {'}'}</button>
</div>
<div class="objbox" style="margin-top:14px">
  <h4>Xrefs to FUN_00401500</h4>
  <pre class="pcode" style="margin-bottom:8px">main → calls decode_config → calls FUN_00401500 ; (only path)</pre>
  <button class="opt" data-state={mcq.xref} on:click={() => answer('xref', true)}><b>A</b>decode_config</button>
  <button class="opt" data-state={mcq.xref} on:click={() => answer('xref', false)}><b>B</b>WinMain</button>
  <button class="opt" data-state={mcq.xref} on:click={() => answer('xref', false)}><b>C</b>nothing references it</button>
</div>
<div class="hintbox"><b>Reading decompiler output:</b> name functions by what they do (this one → <code>xor_decrypt</code>), recover structs from the <i>offsets and access widths</i> (a pointer forces 8-byte alignment), and use xrefs to learn who relies on a routine before you change it.</div>

<style>
  .opt[data-state="correct"] { border-color: var(--jade); color: var(--jade); }
  .opt[data-state="wrong"] { border-color: var(--blood); color: var(--blood); }
</style>
